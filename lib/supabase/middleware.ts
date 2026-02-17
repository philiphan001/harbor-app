// Supabase middleware helper - refreshes auth tokens on each request
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session - important for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes that don't require auth
  const publicRoutes = ["/", "/login", "/signup", "/auth/callback", "/get-started"];
  const isPublicRoute =
    request.nextUrl.pathname === "/" ||
    publicRoutes.slice(1).some((route) =>
      request.nextUrl.pathname.startsWith(route)
    );

  // API routes handle their own auth (return 401, not redirect)
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");

  // Redirect unauthenticated users to login (except public + API routes)
  // Preserve the original destination as ?returnTo= so we can redirect after login
  if (!user && !isPublicRoute && !isApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("returnTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages (login/signup only, not landing)
  const isAuthPage = ["/login", "/signup"].some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    // Respect returnTo param if present
    const returnTo = request.nextUrl.searchParams.get("returnTo");
    url.pathname = returnTo || "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
