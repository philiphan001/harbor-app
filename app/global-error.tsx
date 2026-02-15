"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#FAFAF7] font-sans antialiased">
        <div className="min-h-screen flex flex-col items-center justify-center px-6 max-w-[420px] mx-auto">
          <div className="text-center">
            <div className="text-4xl mb-4">⚓</div>
            <h1 className="text-xl font-semibold text-[#2C3E50] mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-[#4A6274] mb-6 leading-relaxed">
              Harbor encountered an unexpected error. Your data is safe in local storage.
            </p>
            <button
              onClick={reset}
              className="bg-[#1B6B7D] text-white rounded-xl px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
