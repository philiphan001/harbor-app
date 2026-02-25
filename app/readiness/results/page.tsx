"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  calculateReadinessScore,
  getReadinessActions,
  getReadinessLabel,
  type ReadinessBreakdown,
  type ReadinessAction,
  type Domain,
} from "@/lib/utils/readinessScore";
import { getParentProfile, type ParentProfile } from "@/lib/utils/parentProfile";

const DOMAIN_INFO: Record<Domain, { icon: string; label: string; color: string }> = {
  medical: { icon: "🏥", label: "Medical", color: "coral" },
  legal: { icon: "⚖️", label: "Legal", color: "sage" },
  financial: { icon: "💰", label: "Financial", color: "ocean" },
  housing: { icon: "🏠", label: "Housing", color: "amber" },
  transportation: { icon: "🚗", label: "Transportation", color: "ocean" },
  social: { icon: "👥", label: "Social & Pets", color: "sage" },
};

function getScoreBarColor(score: number): string {
  if (score < 30) return "bg-coral";
  if (score < 60) return "bg-amber";
  if (score < 85) return "bg-ocean";
  return "bg-sage";
}

function getBadgeClasses(points: number): string {
  if (points >= 5) return "bg-coral/15 text-coral";
  if (points >= 4) return "bg-amber/15 text-amber";
  return "bg-sage/15 text-sage";
}

export default function ReadinessResultsPage() {
  const [readiness, setReadiness] = useState<ReadinessBreakdown | null>(null);
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [actions, setActions] = useState<ReadinessAction[]>([]);

  useEffect(() => {
    const profile = getParentProfile();
    const score = calculateReadinessScore();
    const allActions = getReadinessActions();
    const selected = profile?.selectedDomains;

    setParentProfile(profile);
    setReadiness(score);
    // Filter actions to only selected domains
    setActions(selected ? allActions.filter(a => selected.includes(a.domain)) : allActions);
  }, []);

  if (!readiness) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warmWhite">
        <div className="font-sans text-slate">Loading your results...</div>
      </div>
    );
  }

  // Top 5 incomplete actions sorted by points desc
  const topMoves = actions
    .filter((a) => !a.completed)
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  const barColor = getScoreBarColor(readiness.overall);

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Score Header */}
      <div className="relative bg-gradient-to-br from-ocean to-[#164F5C] px-7 pt-10 pb-8">
        <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04] pointer-events-none" />

        <div className="relative">
          <div className="font-sans text-[11px] text-white/60 tracking-[2px] uppercase mb-2">
            {parentProfile ? `${parentProfile.name}'s Readiness` : "Your Readiness"}
          </div>

          <div className="flex items-end gap-3 mb-3">
            <div className="font-serif text-5xl font-bold text-white leading-none">
              {readiness.overall}
            </div>
            <div className="font-sans text-lg text-white/50 mb-1">/ 100</div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/15 rounded-full h-3 mb-2">
            <div
              className={`${barColor} h-3 rounded-full transition-all`}
              style={{ width: `${readiness.overall}%` }}
            />
          </div>

          <div className="font-sans text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white inline-block">
            {getReadinessLabel(readiness.overall)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-5 py-6">
        {/* Top Moves */}
        {topMoves.length > 0 && (
          <div className="mb-6">
            <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
              Top Moves to Level Up
            </div>
            <div className="space-y-2.5">
              {topMoves.map((action) => (
                <div
                  key={action.id}
                  className="bg-white border border-sandDark rounded-xl px-4 py-3.5 flex items-center gap-3"
                >
                  <div
                    className={`shrink-0 font-sans text-xs font-bold px-2.5 py-1 rounded-lg ${getBadgeClasses(action.points)}`}
                  >
                    +{action.points} pts
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-sans text-sm font-medium text-slate leading-snug">
                      {action.label}
                    </div>
                    <div className="font-sans text-[11px] text-slateMid mt-0.5">
                      {DOMAIN_INFO[action.domain].icon} {DOMAIN_INFO[action.domain].label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {topMoves.length === 0 && (
          <div className="mb-6 bg-sage/10 border border-sage rounded-xl px-5 py-4 text-center">
            <div className="font-sans text-sm font-semibold text-sage mb-1">
              All actions complete!
            </div>
            <div className="font-sans text-xs text-slateMid">
              You&apos;ve addressed every readiness item. Great work.
            </div>
          </div>
        )}

        {/* Domain Mini-Breakdown */}
        <div className="mb-6">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
            Domain Progress
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {(Object.entries(readiness.domains) as [Domain, number][])
              .filter(([domain]) => !parentProfile?.selectedDomains || parentProfile.selectedDomains.includes(domain))
              .map(([domain, score]) => (
                <div
                  key={domain}
                  className="bg-white border border-sandDark rounded-xl px-3.5 py-3"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="font-sans text-[11px] font-semibold text-slate">
                      {DOMAIN_INFO[domain].icon} {DOMAIN_INFO[domain].label}
                    </div>
                    <div className="font-sans text-xs font-bold text-slateMid">
                      {score}
                    </div>
                  </div>
                  <div className="w-full bg-sand rounded-full h-1.5">
                    <div
                      className={`${getScoreBarColor(score)} h-1.5 rounded-full transition-all`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/tasks"
            className="block w-full bg-ocean text-white rounded-xl px-6 py-4 font-sans text-base font-semibold hover:bg-oceanMid transition-colors text-center"
          >
            View Your Action Items
          </Link>

          <Link
            href="/dashboard"
            className="block w-full bg-white border-2 border-sandDark text-slate rounded-xl px-6 py-3 font-sans text-sm font-medium hover:bg-sand transition-colors text-center"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Retake Assessment */}
        <div className="mt-6 text-center">
          <Link
            href="/readiness"
            className="font-sans text-sm text-ocean underline underline-offset-2 hover:text-oceanMid transition-colors"
          >
            Retake Assessment
          </Link>
        </div>
      </div>
    </div>
  );
}
