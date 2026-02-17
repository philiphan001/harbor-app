"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Read returnTo param to redirect after login
  const [returnTo, setReturnTo] = useState("/dashboard");

  // Show error from auth callback (e.g., email confirmation failed)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackError = params.get("error");
    if (callbackError === "auth_callback_failed") {
      setError("Email confirmation failed. Please try again.");
    }
    const dest = params.get("returnTo");
    if (dest) setReturnTo(dest);
  }, []);

  const handleGoogleLogin = async () => {
    setError(null);
    // Pass returnTo through the OAuth callback via the `next` param
    const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTo)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
      },
    });
    if (error) setError(error.message);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(returnTo);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-sand flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-ocean rounded-2xl mb-4">
            <span className="text-2xl text-white font-serif font-bold">H</span>
          </div>
          <h1 className="text-3xl font-serif font-semibold text-slate">
            Welcome back
          </h1>
          <p className="text-slateMid mt-2 font-sans">
            Sign in to your Harbor account
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-2xl shadow-sm border border-sandDark p-8 space-y-5"
        >
          {error && (
            <div className="bg-coralLight border border-coral/30 text-coral rounded-lg px-4 py-3 text-sm font-sans">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3 bg-white border border-sandDark text-slate font-sans font-medium rounded-xl hover:bg-sand/50 focus:outline-none focus:ring-2 focus:ring-ocean/30 transition flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-sandDark" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slateMid font-sans">or</span>
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-sans font-medium text-slate mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 border border-sandDark rounded-xl bg-warmWhite font-sans text-slate placeholder:text-slateLight focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean transition"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-sans font-medium text-slate mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              className="w-full px-4 py-3 border border-sandDark rounded-xl bg-warmWhite font-sans text-slate placeholder:text-slateLight focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-ocean text-white font-sans font-medium rounded-xl hover:bg-ocean/90 focus:outline-none focus:ring-2 focus:ring-ocean/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="text-center text-sm text-slateMid font-sans">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-ocean font-medium hover:underline"
            >
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
