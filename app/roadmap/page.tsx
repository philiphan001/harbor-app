"use client";

import { useState } from "react";
import Link from "next/link";
import NetworkRoadmap from "@/components/NetworkRoadmap";

export default function CareRoadmapPage() {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"graph" | "list">("graph");

  const domains = [
    {
      id: "medical",
      name: "Medical",
      icon: "♥",
      color: "#D4725C",
      nodeCount: 24,
      complexity: "High",
      decisions: [
        "Which providers and specialists?",
        "Treatment protocols and medications",
        "Cognitive assessment and monitoring",
        "Surgery decisions and recovery plans",
        "Emergency protocols and advance directives",
        "Medication interactions and management",
      ],
      connections: ["financial", "legal", "caregiving"],
    },
    {
      id: "financial",
      name: "Financial",
      icon: "◈",
      color: "#1B6B7D",
      nodeCount: 32,
      complexity: "Very High",
      decisions: [
        "Medicare A/B/C/D coverage gaps",
        "Medigap vs Medicare Advantage",
        "Long-term care insurance activation",
        "Medicaid eligibility and spend-down",
        "Asset protection and home equity",
        "Monthly cost projections (3-10 year horizon)",
        "Insurance coordination and claims",
        "Tax implications of caregiving",
      ],
      connections: ["medical", "housing", "legal"],
    },
    {
      id: "legal",
      name: "Legal",
      icon: "◉",
      color: "#6B8F71",
      nodeCount: 18,
      complexity: "Medium",
      decisions: [
        "Healthcare proxy designation",
        "Power of attorney (healthcare & financial)",
        "Will and estate plan updates",
        "Trust structures and beneficiaries",
        "Guardianship considerations",
        "DNR and advance directives",
        "HIPAA authorizations",
      ],
      connections: ["financial", "medical", "family"],
    },
    {
      id: "housing",
      name: "Housing & Safety",
      icon: "⌂",
      color: "#C4943A",
      nodeCount: 21,
      complexity: "High",
      decisions: [
        "Home safety assessment and modifications",
        "Age-in-place feasibility analysis",
        "Assisted living facility selection",
        "Memory care vs skilled nursing",
        "Facility costs and availability",
        "Home sale timing and proceeds",
        "Accessibility and fall prevention",
      ],
      connections: ["financial", "caregiving", "medical"],
    },
    {
      id: "family",
      name: "Family Dynamics",
      icon: "◎",
      color: "#4A6274",
      nodeCount: 15,
      complexity: "Very High",
      decisions: [
        "Role allocation among siblings",
        "Primary caregiver designation",
        "Cost-sharing agreements",
        "Communication protocols",
        "Conflict resolution frameworks",
        "Geographic constraints",
        "Career and employment impacts",
      ],
      connections: ["caregiving", "legal", "financial"],
    },
    {
      id: "caregiving",
      name: "Caregiving Logistics",
      icon: "▣",
      color: "#2A8FA4",
      nodeCount: 28,
      complexity: "Very High",
      decisions: [
        "Home health aide sourcing and vetting",
        "Scheduling and shift coverage",
        "Caregiver turnover management",
        "Respite care planning",
        "Medical equipment and supplies",
        "Transportation coordination",
        "Adult day programs",
        "Emergency backup plans",
      ],
      connections: ["medical", "housing", "family"],
    },
  ];

  const totalNodes = domains.reduce((sum, d) => sum + d.nodeCount, 0);

  return (
    <div className="min-h-screen bg-warmWhite">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate to-slateMid px-5 py-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative max-w-[420px] mx-auto">
          <Link href="/" className="font-sans text-sm text-white/80 hover:text-white inline-block mb-4">
            ← Home
          </Link>

          <h1 className="font-serif text-3xl font-semibold text-white mb-2">
            The Care Roadmap
          </h1>
          <p className="font-serif text-base text-white/80 leading-relaxed italic mb-4">
            The overwhelming reality every family faces — and why you need help navigating it.
          </p>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-serif text-4xl font-bold text-white">{totalNodes}</span>
              <span className="font-sans text-sm text-white/70 uppercase tracking-wide">Decision Nodes</span>
            </div>
            <div className="font-sans text-xs text-white/60">
              Across 6 domains, all interconnected, most time-sensitive
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="max-w-[420px] mx-auto px-5 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="font-sans text-xs uppercase tracking-wide text-slateLight font-semibold">
            {viewMode === "graph" ? "Network View" : "List View"}
          </div>
          <div className="flex gap-2 bg-sand rounded-lg p-1">
            <button
              onClick={() => setViewMode("graph")}
              className={`px-3 py-1.5 rounded-md font-sans text-xs font-semibold transition-all ${
                viewMode === "graph"
                  ? "bg-ocean text-white"
                  : "text-slateMid hover:text-slate"
              }`}
            >
              Graph
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-md font-sans text-xs font-semibold transition-all ${
                viewMode === "list"
                  ? "bg-ocean text-white"
                  : "text-slateMid hover:text-slate"
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Network Graph View */}
      {viewMode === "graph" && (
        <div className="max-w-[420px] mx-auto px-5 pb-6">
          <NetworkRoadmap />
        </div>
      )}

      {/* Domain Grid (List View) */}
      {viewMode === "list" && (
        <div className="max-w-[420px] mx-auto px-5 pb-6">
          <div className="space-y-3">
          {domains.map((domain) => (
            <button
              key={domain.id}
              onClick={() => setSelectedDomain(selectedDomain === domain.id ? null : domain.id)}
              className="w-full text-left"
            >
              <div
                className="bg-white rounded-xl border-2 transition-all"
                style={{
                  borderColor: selectedDomain === domain.id ? domain.color : "#E8E0D0",
                }}
              >
                {/* Domain Header */}
                <div className="px-4 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-semibold"
                      style={{
                        backgroundColor: `${domain.color}15`,
                        color: domain.color,
                      }}
                    >
                      {domain.icon}
                    </div>
                    <div>
                      <div className="font-sans text-base font-semibold text-slate">
                        {domain.name}
                      </div>
                      <div className="font-sans text-xs text-slateMid">
                        {domain.nodeCount} decision points · {domain.complexity} complexity
                      </div>
                    </div>
                  </div>
                  <div
                    className="text-lg transition-transform"
                    style={{
                      transform: selectedDomain === domain.id ? "rotate(180deg)" : "rotate(0)",
                      color: domain.color,
                    }}
                  >
                    ▾
                  </div>
                </div>

                {/* Expanded Content */}
                {selectedDomain === domain.id && (
                  <div className="px-4 pb-4 border-t border-sand">
                    <div className="mt-3 mb-3">
                      <div className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide mb-2">
                        Critical Questions You Must Answer:
                      </div>
                      <ul className="space-y-2">
                        {domain.decisions.map((decision, i) => (
                          <li key={i} className="flex gap-2 items-start">
                            <span className="text-coral mt-0.5 shrink-0">•</span>
                            <span className="font-sans text-sm text-slate leading-relaxed">
                              {decision}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-sand rounded-lg px-3 py-2.5 mt-3">
                      <div className="font-sans text-xs font-semibold text-slateMid mb-1">
                        Impacts:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {domain.connections.map((conn) => {
                          const connDomain = domains.find((d) => d.id === conn);
                          return (
                            <span
                              key={conn}
                              className="px-2 py-1 rounded-md text-xs font-medium"
                              style={{
                                backgroundColor: `${connDomain?.color}15`,
                                color: connDomain?.color,
                              }}
                            >
                              {connDomain?.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
        </div>
      )}

      {/* Shared Content (shown in both views) */}
      <div className="max-w-[420px] mx-auto px-5 pb-6">
        {/* The Problem Statement */}
        <div className="mt-8 bg-coralLight border-l-4 border-coral rounded-r-xl px-5 py-5">
          <div className="font-serif text-lg font-semibold text-slate mb-3">
            The Brutal Truth
          </div>
          <div className="font-sans text-sm text-slateMid leading-relaxed space-y-3">
            <p>
              When your parent has a health crisis, you have <strong>72 hours</strong> to make
              decisions across all 6 domains simultaneously.
            </p>
            <p>
              <strong>No single professional owns this problem.</strong> The doctor handles
              medical. The attorney handles legal. The financial advisor handles money. The
              social worker is overwhelmed. You're left to be the integration layer — in a state
              of emotional distress and total informational disadvantage.
            </p>
            <p>
              Each decision affects 2-4 other domains. Miss one connection and the whole plan
              unravels. Delay one decision and you lose options worth tens of thousands of dollars.
            </p>
          </div>
        </div>

        {/* The Coordination Failure */}
        <div className="mt-6 bg-white rounded-xl border border-sandDark px-5 py-5">
          <div className="font-serif text-lg font-semibold text-slate mb-3">
            The Coordination Failure
          </div>
          <div className="space-y-4">
            {[
              {
                stat: "53 million",
                label: "Unpaid family caregivers in the US",
                impact: "$600B in uncompensated care annually",
              },
              {
                stat: "24 hrs/week",
                label: "Average time spent caregiving",
                impact: "Plus full-time job for most",
              },
              {
                stat: "$500K+",
                label: "Economic cost per family caregiver",
                impact: "Lost wages + career impact + savings depletion",
              },
              {
                stat: "10,000/day",
                label: "Americans turning 65",
                impact: "And the ratio of caregivers to elders is worsening",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start pb-4 border-b border-sand last:border-0">
                <div className="shrink-0">
                  <div className="font-serif text-2xl font-bold text-ocean">
                    {item.stat}
                  </div>
                  <div className="font-sans text-xs text-slateMid mt-0.5">
                    {item.label}
                  </div>
                </div>
                <div className="font-sans text-sm text-slateMid leading-relaxed pt-1">
                  {item.impact}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* The Harbor Solution */}
        <div className="mt-6 bg-oceanLight rounded-xl px-5 py-5">
          <div className="font-serif text-lg font-semibold text-slate mb-3">
            How Harbor Helps
          </div>
          <div className="font-sans text-sm text-slateMid leading-relaxed space-y-3 mb-4">
            <p>
              Harbor is the <strong>integration layer</strong> you desperately need. An AI-powered
              platform that models your complete situation across all 6 domains, identifies the
              connections you'd miss, and keeps everything coordinated.
            </p>
            <p>
              Think of it as a <strong>fractional family office</strong> for elder care — giving
              you the same level of comprehensive planning that ultra-wealthy families get, but
              accessible and affordable.
            </p>
          </div>

          <div className="space-y-2">
            <Link href="/crisis">
              <button className="w-full bg-coral text-white rounded-xl px-6 py-3.5 font-sans text-sm font-semibold hover:bg-coral/90 transition-colors">
                Start Crisis Intake — Get Help Now →
              </button>
            </Link>
            <Link href="/readiness">
              <button className="w-full bg-ocean text-white rounded-xl px-6 py-3.5 font-sans text-sm font-semibold hover:bg-oceanMid transition-colors">
                Check Your Readiness Score →
              </button>
            </Link>
          </div>
        </div>

        {/* Bottom Padding */}
        <div className="h-8" />
      </div>
    </div>
  );
}
