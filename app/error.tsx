"use client";

import Link from "next/link";

export default function Error({
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
          <div className="text-4xl mb-4">⚓</div>
          <h1 className="font-serif text-xl font-semibold text-slate mb-2">
            Something went wrong
          </h1>
          <p className="font-sans text-sm text-slateMid mb-6 leading-relaxed">
            This page encountered an error. Your data is safe.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={reset}
              className="bg-ocean text-white rounded-xl px-6 py-3 font-sans text-sm font-semibold hover:bg-oceanMid transition-colors"
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
