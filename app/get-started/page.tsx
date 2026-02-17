import Link from "next/link";

export default function GetStartedPage() {
  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-ocean to-[#164F5C] px-7 pt-12 pb-10 overflow-hidden">
        <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04]" />
        <div className="absolute -bottom-[30px] -left-5 w-[120px] h-[120px] rounded-full bg-white/[0.03]" />

        <div className="relative">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-sans mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>

          <h1 className="font-serif text-[28px] font-semibold text-white tracking-tight mb-3 leading-tight">
            How can Harbor help you today?
          </h1>
          <p className="font-sans text-[14px] text-white/80 leading-relaxed">
            Choose the path that fits your situation. You can always switch later.
          </p>
        </div>
      </div>

      {/* Pathway Cards */}
      <div className="flex-1" style={{ padding: "2rem 1.25rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Readiness Pathway */}
        <Link href="/readiness">
          <div className="w-full bg-ocean text-white cursor-pointer hover:scale-[1.01] transition-transform" style={{ borderRadius: "16px", padding: "1.75rem" }}>
            <div className="flex items-start" style={{ gap: "1.25rem" }}>
              <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center text-2xl shrink-0 mt-0.5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <path d="M9 14l2 2 4-4" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase opacity-80" style={{ marginBottom: "0.5rem" }}>
                  I want to be prepared
                </div>
                <div className="font-serif text-[19px] font-medium leading-snug" style={{ marginBottom: "0.75rem" }}>
                  Check My Care Readiness
                </div>
                <div className="font-sans text-[13px] opacity-80 leading-relaxed">
                  Find out how ready you are to handle a crisis. We&apos;ll assess your preparedness across medical, legal, financial, and housing domains and build your action plan.
                </div>
                <div className="font-sans text-[12px] font-semibold opacity-90" style={{ marginTop: "1rem" }}>
                  Takes 10-15 minutes &rarr;
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Crisis Pathway */}
        <Link href="/crisis">
          <div className="w-full bg-coral text-white cursor-pointer hover:scale-[1.01] transition-transform relative overflow-hidden" style={{ borderRadius: "16px", padding: "1.75rem" }}>
            <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-l from-black/[0.08]" />
            <div className="flex items-start" style={{ gap: "1.25rem" }}>
              <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center text-2xl shrink-0 mt-0.5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                </svg>
              </div>
              <div className="flex-1 relative">
                <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase opacity-85" style={{ marginBottom: "0.5rem" }}>
                  I need help now
                </div>
                <div className="font-serif text-[19px] font-medium leading-snug" style={{ marginBottom: "0.75rem" }}>
                  My Parent Had a Crisis
                </div>
                <div className="font-sans text-[13px] opacity-80 leading-relaxed">
                  Get organized right now. Our AI will guide you through the chaos, help you figure out what to do first, and create a clear action plan.
                </div>
                <div className="font-sans text-[12px] font-semibold opacity-90" style={{ marginTop: "1rem" }}>
                  Available 24/7 &rarr;
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Upload option */}
        <Link href="/upload">
          <div className="w-full bg-white border-2 border-sandDark text-slate rounded-[16px] px-7 py-6 cursor-pointer hover:scale-[1.01] transition-transform">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-sand rounded-xl flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-sans text-sm font-semibold text-slate">
                  Just upload a document
                </div>
                <div className="font-sans text-xs text-slateMid">
                  Insurance card, medication list, legal documents
                </div>
              </div>
              <div className="text-slateLight text-sm">&rarr;</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Bottom note */}
      <div className="px-5 pb-8">
        <div className="bg-sand rounded-xl px-5 py-4">
          <div className="font-sans text-xs text-slateMid leading-relaxed">
            <span className="font-semibold">Not sure?</span> Most people start with the readiness assessment. It helps you see what you have covered and what gaps to fill before an emergency happens.
          </div>
        </div>
      </div>
    </div>
  );
}
