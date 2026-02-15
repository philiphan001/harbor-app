// Server-side auth helpers for API routes
// Extracts the authenticated Supabase user from the session cookie

import { NextResponse } from "next/server";
import { createClient } from "./server";
import { createLogger } from "@/lib/utils/logger";

const log = createLogger("supabase/auth");

export interface AuthUser {
  id: string; // Supabase auth user ID (UUID)
  email: string;
  name?: string;
}

/**
 * Get the authenticated user from the Supabase session.
 * Returns the user or null if not authenticated.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name as string | undefined,
    };
  } catch (error) {
    log.errorWithStack("Failed to get auth user", error);
    return null;
  }
}

/**
 * Require authentication for an API route.
 * Returns the user if authenticated, or a 401 NextResponse if not.
 */
export async function requireAuth(): Promise<
  { user: AuthUser; error?: never } | { user?: never; error: NextResponse }
> {
  const user = await getAuthUser();

  if (!user) {
    return {
      error: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  return { user };
}
