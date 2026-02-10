"use client";

import Link from "next/link";

export default function SituationBriefDemo() {
  const domains = [
    {
      name: "Medical",
      icon: "♥",
      color: "coral",
      items: [
        { label: "Diagnosis", value: "Right hip fracture (intertrochanteric)" },
        { label: "Surgery", value: "Partial hip replacement, Feb 4 — successful" },
        { label: "Surgeon", value: "Dr. James Patel, MGH Orthopedics" },
        {
          label: "Key Concern",
          value: "Mild cognitive impairment noted; anesthesia may have accelerated",
        },
        {
          label: "Medications",
          value: "7 active prescriptions — full list in Documents",
        },
      ],
    },
    {
      name: "Financial",
      icon: "◈",
      color: "ocean",
      items: [
        {
          label: "Income",
          value: "Social Security ($2,140/mo) + pension ($1,200/mo)",
        },
        { label: "Savings", value: "~$180,000 in IRA + $42,000 checking/savings" },
        { label: "Insurance", value: "Medicare A/B + Medigap Plan F" },
        {
          label: "LTC Policy",
          value: "Lincoln Financial, ~1998 — terms being located",
        },
        { label: "Home Value", value: "Est. $850,000 (Brookline, owned outright)" },
      ],
    },
    {
      name: "Legal",
      icon: "◉",
      color: "sage",
      items: [
        { label: "Healthcare Proxy", value: "✓ Daughter (you), executed 2019" },
        {
          label: "Power of Attorney",
          value: "✓ Durable POA to daughter, executed 2019",
        },
        { label: "Will", value: "Last updated 2015 — review recommended" },
        { label: "Estate Plan", value: "Basic will only; no trust structure" },
      ],
    },
    {
      name: "Housing & Safety",
      icon: "⌂",
      color: "amber",
      items: [
        {
          label: "Current Home",
          value: "2-story colonial, Brookline — stairs to bedrooms",
        },
        {
          label: "Accessibility",
          value: "⚠ No grab bars, no first-floor bedroom or bath",
        },
        {
          label: "Modification Cost",
          value: "Est. $8,000-15,000 for basic safety modifications",
        },
        {
          label: "Risk Assessment",
          value: "HIGH — stairs + cognitive decline + living alone",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-warmWhite max-w-[420px] mx-auto border-l border-r border-sandDark">
      {/* Header */}
      <div className="bg-ocean px-5 py-4">
        <div className="flex justify-between items-center mb-3">
          <Link
            href="/"
            className="font-sans text-sm text-white/80 hover:text-white"
          >
            ← Home
          </Link>
          <div className="font-serif text-lg font-semibold text-white">
            Harbor
          </div>
          <div className="w-12" />
        </div>
        <div className="font-serif text-[22px] font-medium text-white">
          Situation Brief
        </div>
        <div className="font-sans text-xs text-white/60 mt-1">
          Margaret Sullivan · Generated Feb 6, 2026
        </div>
      </div>

      <div className="px-5 py-5">
        {/* Executive Summary */}
        <div className="bg-sand rounded-xl px-5 py-4 mb-4">
          <div className="font-sans text-[11px] font-bold tracking-[1.2px] uppercase text-ocean mb-2">
            Executive Summary
          </div>
          <div className="font-serif text-sm text-slate leading-relaxed">
            Margaret Sullivan, 82, was admitted to Massachusetts General Hospital
            on Feb 3 following a hip fracture from a fall at home. She lives alone
            in a two-story home in Brookline. Surgery (partial hip replacement) was
            performed Feb 4 and she is recovering. Anticipated discharge in 3-5
            days. Key decisions ahead involve rehab facility selection, post-rehab
            living arrangement, and activation of long-term care insurance.
          </div>
        </div>

        {/* Domain Cards */}
        {domains.map((domain) => (
          <div
            key={domain.name}
            className={`bg-white border border-sandDark rounded-xl px-4 py-4 mb-2.5 border-l-4 border-l-${domain.color}`}
            style={{
              borderLeftColor:
                domain.color === "coral"
                  ? "#D4725C"
                  : domain.color === "ocean"
                  ? "#1B6B7D"
                  : domain.color === "sage"
                  ? "#6B8F71"
                  : "#C4943A",
            }}
          >
            <div
              className="font-sans text-[13px] font-bold mb-2.5 flex items-center gap-1.5"
              style={{
                color:
                  domain.color === "coral"
                    ? "#D4725C"
                    : domain.color === "ocean"
                    ? "#1B6B7D"
                    : domain.color === "sage"
                    ? "#6B8F71"
                    : "#C4943A",
              }}
            >
              <span className="text-base">{domain.icon}</span>
              {domain.name}
            </div>
            {domain.items.map((item, i) => (
              <div
                key={i}
                className={`flex justify-between gap-3 py-1.5 ${
                  i < domain.items.length - 1 ? "border-b border-sand" : ""
                }`}
              >
                <div className="font-sans text-xs text-slateLight shrink-0 min-w-[90px]">
                  {item.label}
                </div>
                <div className="font-sans text-[12.5px] text-slate font-medium text-right">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Action CTA */}
        <div className="mt-6 bg-oceanLight rounded-xl px-5 py-4 text-center">
          <div className="font-serif text-sm text-slate mb-2 italic">
            This is a sample brief. Ready to create one for your family?
          </div>
          <Link href="/crisis">
            <button className="w-full bg-ocean text-white rounded-xl px-6 py-3 font-sans text-sm font-semibold hover:bg-oceanMid transition-colors">
              Start Your Crisis Intake →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
