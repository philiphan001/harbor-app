"use client";

import { useState } from "react";
import Link from "next/link";

export default function ScenariosDemo() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const scenarios = [
    {
      id: "rehab-home",
      title: "Rehab → Return Home with Aides",
      monthly: "$6,200/mo",
      runway: "~3.5 years",
      color: "#1B6B7D",
      pros: [
        "Familiar environment",
        "Lower cost than facility",
        "Maintains independence",
      ],
      cons: [
        "Home modifications needed ($12K)",
        "Aide reliability/turnover risk",
        "Cognitive decline may outpace this option",
      ],
      details:
        "Margaret does 3-4 weeks of inpatient rehab, then returns to her Brookline home with modifications (grab bars, stair lift, first-floor bathroom). Full-time home aide (7 AM–7 PM) at $28/hr plus part-time overnight coverage. Medicare covers rehab for 20 days fully, then $204/day copay through Medigap.",
      financial:
        "Monthly cost: ~$6,200 (aide $5,040 + overnight $800 + incidentals $360). Against her income of $3,340/mo, the gap is ~$2,860/mo drawn from savings. At current savings of $222K, this arrangement is sustainable for approximately 3.5 years before assets would need to be supplemented.",
    },
    {
      id: "assisted",
      title: "Rehab → Assisted Living Facility",
      monthly: "$7,500/mo",
      runway: "~2.5 years",
      color: "#6B8F71",
      pros: [
        "24/7 professional oversight",
        "Social engagement opportunities",
        "Scalable to memory care if needed",
      ],
      cons: [
        "Higher monthly cost",
        "Emotional difficulty of leaving home",
        "Waitlists at preferred facilities",
      ],
      details:
        "Margaret completes rehab then transitions to an assisted living facility. The Brookline home could be sold (est. $850K) to extend the financial runway significantly. Three facilities within 15 miles have availability and memory-care wings for future needs.",
      financial:
        "Monthly cost: ~$7,500 at mid-tier facility. Against income of $3,340/mo, gap is ~$4,160/mo. Current savings sustain ~2.5 years. However, selling the home adds $800K+ net, extending runway to 15+ years. LTC insurance (if active) could offset $150-200/day.",
    },
    {
      id: "family",
      title: "Rehab → Move in with Family",
      monthly: "$2,800/mo",
      runway: "~6+ years",
      color: "#C4943A",
      pros: [
        "Lowest cost option",
        "Family proximity",
        "Emotional comfort",
      ],
      cons: [
        "Requires home modifications at your home",
        "Caregiver burden on family",
        "May strain family relationships",
      ],
      details:
        "Margaret completes rehab then moves into your home. First-floor bedroom/bathroom required. Part-time aide (4 hrs/day) for medical support and respite. Adult day program 3x/week for social engagement and cognitive stimulation.",
      financial:
        "Monthly cost: ~$2,800 (part-time aide $1,680 + adult day program $900 + incidentals $220). Gap vs income: only ~$460/mo from savings. This is financially sustainable for 6+ years. Hidden cost: estimated $30K-50K in lost wages/career impact for primary family caregiver.",
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
          Care Scenarios
        </div>
        <div className="font-serif text-[13px] text-white/70 mt-1.5 leading-relaxed italic">
          AI-modeled paths based on Margaret's medical, financial, and housing
          situation. These are starting points for your family's discussion — not
          recommendations.
        </div>
      </div>

      <div className="px-5 py-4">
        {scenarios.map((s) => (
          <div
            key={s.id}
            className="bg-white border-[1.5px] rounded-[14px] mb-3 overflow-hidden transition-all"
            style={{
              borderColor: expanded === s.id ? s.color : "#E8E0D0",
            }}
          >
            <button
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              className="w-full px-4 py-4 text-left"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-sans text-[15px] font-semibold text-slate mb-1.5">
                    {s.title}
                  </div>
                  <div className="flex gap-3">
                    <div
                      className="px-2 py-0.5 rounded-md font-sans text-xs font-semibold"
                      style={{
                        backgroundColor: `${s.color}15`,
                        color: s.color,
                      }}
                    >
                      {s.monthly}
                    </div>
                    <div className="px-2 py-0.5 bg-sand rounded-md font-sans text-xs text-slateMid">
                      Runway: {s.runway}
                    </div>
                  </div>
                </div>
                <div
                  className="font-sans text-lg text-slateLight ml-2 transition-transform"
                  style={{
                    transform:
                      expanded === s.id ? "rotate(180deg)" : "rotate(0)",
                  }}
                >
                  ▾
                </div>
              </div>
            </button>

            {expanded === s.id && (
              <div className="px-4 pb-4 border-t border-sand">
                <div className="font-sans text-[13px] text-slateMid leading-relaxed mt-3.5 mb-3.5">
                  {s.details}
                </div>

                <div className="bg-sand rounded-lg px-3.5 py-3 mb-3.5">
                  <div className="font-sans text-[11px] font-bold tracking-wide uppercase text-ocean mb-1.5">
                    Financial Model
                  </div>
                  <div className="font-sans text-[12.5px] text-slate leading-relaxed">
                    {s.financial}
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <div className="flex-1">
                    <div className="font-sans text-[11px] font-semibold text-sage mb-1.5">
                      Advantages
                    </div>
                    {s.pros.map((p, i) => (
                      <div
                        key={i}
                        className="font-sans text-xs text-slateMid mb-1 pl-3 relative"
                      >
                        <span className="absolute left-0 text-sage">+</span>
                        {p}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1">
                    <div className="font-sans text-[11px] font-semibold text-coral mb-1.5">
                      Considerations
                    </div>
                    {s.cons.map((c, i) => (
                      <div
                        key={i}
                        className="font-sans text-xs text-slateMid mb-1 pl-3 relative"
                      >
                        <span className="absolute left-0 text-coral">–</span>
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="bg-sand rounded-xl px-5 py-4 mt-2">
          <div className="font-serif text-sm text-slateMid leading-relaxed italic">
            These scenarios update in real time as we learn more about Margaret's
            situation — insurance coverage, cognitive assessment results, and your
            family's preferences all refine the models.
          </div>
        </div>

        {/* Action CTA */}
        <div className="mt-4 bg-oceanLight rounded-xl px-5 py-4 text-center">
          <div className="font-serif text-sm text-slate mb-2 italic">
            Ready to model scenarios for your family?
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
