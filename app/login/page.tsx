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

  // Show error from auth callback (e.g., email confirmation failed)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackError = params.get("error");
    if (callbackError === "auth_callback_failed") {
      setError("Email confirmation failed. Please try again.");
    }
  }, []);

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
      router.push("/dashboard");
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
