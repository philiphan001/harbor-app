"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-sandDark p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-sageLight rounded-full mb-4">
              <svg
                className="w-8 h-8 text-sage"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-serif font-semibold text-slate mb-2">
              Check your email
            </h2>
            <p className="text-slateMid font-sans mb-6">
              We&apos;ve sent a confirmation link to{" "}
              <span className="font-medium text-slate">{email}</span>. Click the
              link to activate your account.
            </p>
            <Link
              href="/login"
              className="text-ocean font-sans font-medium hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-ocean rounded-2xl mb-4">
            <span className="text-2xl text-white font-serif font-bold">H</span>
          </div>
          <h1 className="text-3xl font-serif font-semibold text-slate">
            Create your account
          </h1>
          <p className="text-slateMid mt-2 font-sans">
            Start preparing for what matters most
          </p>
        </div>

        {/* Signup Form */}
        <form
          onSubmit={handleSignup}
          className="bg-white rounded-2xl shadow-sm border border-sandDark p-8 space-y-5"
        >
          {error && (
            <div className="bg-coralLight border border-coral/30 text-coral rounded-lg px-4 py-3 text-sm font-sans">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-sans font-medium text-slate mb-1.5"
            >
              Your name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              required
              className="w-full px-4 py-3 border border-sandDark rounded-xl bg-warmWhite font-sans text-slate placeholder:text-slateLight focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean transition"
            />
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
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="w-full px-4 py-3 border border-sandDark rounded-xl bg-warmWhite font-sans text-slate placeholder:text-slateLight focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-ocean text-white font-sans font-medium rounded-xl hover:bg-ocean/90 focus:outline-none focus:ring-2 focus:ring-ocean/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="text-center text-sm text-slateMid font-sans">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-ocean font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
