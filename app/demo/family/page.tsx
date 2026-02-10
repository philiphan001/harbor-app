"use client";

import Link from "next/link";

export default function FamilyCircleDemo() {
  const familyMembers = [
    {
      name: "You (Lisa)",
      role: "Primary Caregiver",
      permissions: [
        "Healthcare Proxy",
        "Power of Attorney",
        "Full Dashboard Access",
      ],
      location: "Cambridge, MA (12 mi away)",
      color: "#D4725C",
      initial: "L",
    },
    {
      name: "David Sullivan",
      role: "Brother",
      permissions: [
        "View Situation Brief",
        "View Scenarios",
        "Comment on Decisions",
      ],
      location: "Chicago, IL",
      color: "#1B6B7D",
      initial: "D",
    },
    {
      name: "Karen Sullivan-Park",
      role: "Sister",
      permissions: ["View Situation Brief", "Financial View (Limited)"],
      location: "Portland, OR",
      color: "#6B8F71",
      initial: "K",
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
          Family Circle
        </div>
        <div className="font-sans text-xs text-white/60 mt-1">
          Margaret Sullivan's care team
        </div>
      </div>

      <div className="px-5 py-5">
        {/* The Elder */}
        <div className="bg-oceanLight border-2 border-ocean rounded-[14px] px-5 py-5 mb-4 text-center">
          <div className="w-14 h-14 rounded-full bg-ocean text-white flex items-center justify-center font-serif text-[22px] font-semibold mx-auto mb-2.5">
            M
          </div>
          <div className="font-serif text-lg font-medium text-slate">
            Margaret Sullivan
          </div>
          <div className="font-sans text-xs text-slateMid mt-0.5">
            82 years old · Brookline, MA
          </div>
        </div>

        {/* Family Members */}
        <div className="font-sans text-[11px] font-semibold tracking-[1.2px] uppercase text-slateLight mb-2.5">
          Family Members
        </div>

        {familyMembers.map((member, i) => (
          <div
            key={i}
            className="bg-white border border-sandDark rounded-xl px-4 py-3.5 mb-2 border-l-4"
            style={{ borderLeftColor: member.color }}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-sans text-sm font-semibold text-slate">
                  {member.name}
                </div>
                <div className="font-sans text-xs text-slateMid">
                  {member.role} · {member.location}
                </div>
              </div>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-serif text-sm font-semibold"
                style={{
                  backgroundColor: `${member.color}20`,
                  color: member.color,
                }}
              >
                {member.initial}
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {member.permissions.map((p, j) => (
                <div
                  key={j}
                  className="px-2 py-1 bg-sand rounded font-sans text-[10.5px] text-slateMid"
                >
                  {p}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Care Team */}
        <div className="font-sans text-[11px] font-semibold tracking-[1.2px] uppercase text-slateLight mb-2.5 mt-5">
          Harbor Care Team
        </div>

        <div className="bg-white border border-sandDark rounded-xl px-4 py-3.5 mb-2">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-full bg-ocean flex items-center justify-center font-sans text-[13px] font-semibold text-white">
              SC
            </div>
            <div>
              <div className="font-sans text-sm font-semibold text-slate">
                Sarah Chen, LCSW
              </div>
              <div className="font-sans text-xs text-slateMid">
                Your Care Coordinator
              </div>
              <div className="font-sans text-[11px] text-ocean mt-0.5">
                Available 8 AM – 8 PM · 617-555-0142
              </div>
            </div>
          </div>
        </div>

        {/* Authorization Note */}
        <div className="bg-amberLight rounded-xl px-4 py-3.5 mt-4">
          <div className="font-sans text-xs font-semibold text-amber mb-1.5">
            🔒 Authorization Tiers
          </div>
          <div className="font-sans text-xs text-slateMid leading-relaxed">
            Each family member sees only what they're authorized to see.
            Permissions are set by the primary caregiver and can be adjusted
            anytime. Financial details, medical records, and decision authority are
            granularly controlled.
          </div>
        </div>

        {/* Action CTA */}
        <div className="mt-4 bg-oceanLight rounded-xl px-5 py-4 text-center">
          <div className="font-serif text-sm text-slate mb-2 italic">
            Ready to set up your family circle?
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
