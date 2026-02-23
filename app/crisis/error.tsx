"use client";

import Link from "next/link";

export default function CrisisError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <h1 className="font-serif text-xl font-semibold text-slate mb-2">
            We hit a snag
          </h1>
          <p className="font-sans text-sm text-slateMid mb-2 leading-relaxed">
            The crisis intake encountered an error, but your information is
            safe.
          </p>
          <p className="font-sans text-sm text-slateMid mb-6 leading-relaxed">
            If this is an emergency, please call <strong>911</strong>.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={reset}
              className="bg-coral text-white rounded-xl px-6 py-3 font-sans text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
            <Link
              href="/dashboard"
              className="text-ocean font-sans text-sm font-medium hover:text-oceanMid transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
