"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { calculateReadinessScore, type ReadinessBreakdown } from "@/lib/utils/readinessScore";
import { getParentProfile, type ParentProfile } from "@/lib/utils/parentProfile";
import { runAllInternalAgents, type InternalAgentDetection } from "@/lib/ai/internalAgents";

export default function ReadinessResultsPage() {
  const router = useRouter();
  const [readiness, setReadiness] = useState<ReadinessBreakdown | null>(null);
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [recommendations, setRecommendations] = useState<InternalAgentDetection[]>([]);

  useEffect(() => {
    const profile = getParentProfile();
    const score = calculateReadinessScore();
    const recs = runAllInternalAgents();

    setParentProfile(profile);
    setReadiness(score);
    setRecommendations(recs.filter(r => r.severity === "critical" || r.severity === "high"));
  }, []);

  if (!readiness) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warmWhite">
        <div className="font-sans text-slate">Loading your results...</div>
      </div>
    );
  }

  const scoreColor =
    readiness.overall < 30
      ? "coral"
      : readiness.overall < 60
      ? "amber"
      : readiness.overall < 85
      ? "ocean"
      : "sage";

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-ocean to-[#164F5C] px-7 pt-10 pb-8">
        <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04] pointer-events-none" />

        <div className="relative">
          <div className="font-sans text-[11px] text-white/60 tracking-[2px] uppercase mb-2">
            Your Results
          </div>
          <h1 className="font-serif text-[28px] font-semibold text-white tracking-tight mb-4">
            Care Readiness Score
          </h1>

          {/* Overall Score */}
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="font-sans text-sm font-medium text-white/80">
                {parentProfile ? `${parentProfile.name}'s Readiness` : "Overall Readiness"}
              </div>
              <div className="font-sans text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white">
                {readiness.status.replace("-", " ").toUpperCase()}
              </div>
            </div>
            <div className="font-serif text-5xl font-bold text-white mb-2">{readiness.overall}</div>
            <div className="font-sans text-sm text-white/80 leading-relaxed">
              {readiness.criticalGaps.length > 0
                ? `${readiness.criticalGaps.length} critical ${readiness.criticalGaps.length === 1 ? "gap" : "gaps"} need immediate attention.`
                : "You're well prepared for emergency situations."}
            </div>
          </div>
        </div>
      </div>

      {/* Domain Breakdown */}
      <div className="flex-1 px-5 py-6">
        <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-slateLight mb-4">
          Domain Scores
        </div>

        <div className="space-y-3 mb-6">
          {Object.entries(readiness.domains).map(([domainName, score]) => {
            const domainInfo = getDomainInfo(domainName);
            return (
              <div key={domainName} className="bg-white border border-sandDark rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-xl">{domainInfo.icon}</div>
                    <div className="font-sans text-sm font-semibold text-slate">
                      {domainInfo.label}
                    </div>
                  </div>
                  <div className="font-serif text-2xl font-bold text-ocean">{score}</div>
                </div>
                <div className="w-full bg-sand rounded-full h-2">
                  <div
                    className={
                      domainInfo.color === "coral"
                        ? "bg-coral h-2 rounded-full transition-all"
                        : domainInfo.color === "sage"
                        ? "bg-sage h-2 rounded-full transition-all"
                        : domainInfo.color === "ocean"
                        ? "bg-ocean h-2 rounded-full transition-all"
                        : domainInfo.color === "teal-500"
                        ? "bg-teal-500 h-2 rounded-full transition-all"
                        : "bg-amber h-2 rounded-full transition-all"
                    }
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Top Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-6">
            <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
              Top Priority Actions
            </div>
            <div className="space-y-3">
              {recommendations.slice(0, 3).map((rec) => (
                <div
                  key={rec.id}
                  className={
                    rec.severity === "critical"
                      ? "bg-coral/5 border-2 border-coral rounded-xl p-4"
                      : "bg-amber/5 border-2 border-amber rounded-xl p-4"
                  }
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={
                        rec.severity === "critical"
                          ? "w-2 h-2 bg-coral rounded-full mt-1.5 shrink-0"
                          : "w-2 h-2 bg-amber rounded-full mt-1.5 shrink-0"
                      }
                    />
                    <div className="flex-1">
                      <div className="font-sans text-sm font-semibold text-slate mb-1">
                        {rec.title}
                      </div>
                      <div className="font-sans text-xs text-slateMid leading-relaxed">
                        {rec.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/tasks")}
            className="w-full bg-ocean text-white rounded-xl px-6 py-4 font-sans text-base font-semibold hover:bg-oceanMid transition-colors"
          >
            View Your Action Items
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-white border-2 border-sandDark text-slate rounded-xl px-6 py-3 font-sans text-sm font-medium hover:bg-sand transition-colors"
          >
            Go to Dashboard
          </button>
        </div>

        {/* Note */}
        <div className="mt-6 bg-sand rounded-xl px-5 py-4">
          <div className="font-sans text-xs text-slateMid leading-relaxed">
            <span className="font-semibold">Note:</span> This score is based on your current preparedness.
            As you complete action items, your readiness will improve over time.
          </div>
        </div>
      </div>
    </div>
  );
}

function getDomainInfo(domain: string): { icon: string; label: string; color: string } {
  const map: Record<string, { icon: string; label: string; color: string }> = {
    medical: { icon: "🏥", label: "Medical", color: "coral" },
    legal: { icon: "⚖️", label: "Legal", color: "sage" },
    financial: { icon: "💰", label: "Financial", color: "ocean" },
    housing: { icon: "🏠", label: "Housing", color: "amber" },
    transportation: { icon: "🚗", label: "Transportation", color: "purple-500" },
    social: { icon: "👥", label: "Social", color: "teal-500" },
  };
  return map[domain] || { icon: "📋", label: domain, color: "ocean" };
}
