"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { computePrioritizedNudges, dismissPrioritizedNudge, snoozePrioritizedNudge } from "@/lib/utils/nudgeStorage";
import { getActiveCascades } from "@/lib/utils/cascadeStorage";
import { CARE_TRANSITION_PLAYBOOKS } from "@/lib/data/careTransitionPlaybooks";
import { SNOOZE_LABELS } from "@/lib/utils/nudgePriority";
import type { NudgeState, PriorityTier, PrioritizedNudgeResult } from "@/lib/types/nudges";
import type { CascadeInstance } from "@/lib/types/cascade";

const TIER_BORDER: Record<PriorityTier, string> = {
  P0: "border-coral",
  P1: "border-amber",
  P2: "border-amber/60",
  P3: "border-sandDark",
  P4: "border-sand",
};

const TIER_BG: Record<PriorityTier, string> = {
  P0: "bg-coral/10",
  P1: "bg-amber/10",
  P2: "bg-amber/5",
  P3: "bg-sand/30",
  P4: "bg-sand/20",
};

function CascadeCard({ cascade }: { cascade: CascadeInstance }) {
  const playbook = CARE_TRANSITION_PLAYBOOKS.find(
    (p) => p.id === cascade.playbookId,
  );
  if (!playbook) return null;

  const steps = Object.values(cascade.stepProgress);
  const completedCount = steps.filter((s) => s === "completed").length;
  const totalCount = steps.length;

  const stepNumbers = Object.keys(cascade.stepProgress)
    .map(Number)
    .sort((a, b) => a - b);
  const nextActionableNum = stepNumbers.find(
    (sn) => cascade.stepProgress[sn] === "actionable",
  );
  const nextStep = nextActionableNum
    ? playbook.steps.find((s) => s.stepNumber === nextActionableNum)
    : null;

  return (
    <div
      className="bg-amber/5 border-2 border-amber rounded-[14px] px-5 py-4"
      role="article"
      aria-label={`Response plan: ${playbook.label}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-amber/15 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
          {playbook.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-sans text-sm font-semibold text-slate mb-0.5">
            {playbook.label}
          </div>
          <div className="font-sans text-xs text-slateMid">
            {completedCount} of {totalCount} steps completed
          </div>
          {nextStep && (
            <div className="font-sans text-xs text-amber font-medium mt-1.5">
              Next: {nextStep.title}
            </div>
          )}
          <Link
            href={`/playbooks/${cascade.playbookId}`}
            className="inline-block mt-2 font-sans text-xs font-semibold text-ocean hover:underline"
          >
            View response plan &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

function NudgeCard({
  nudge,
  onDismiss,
  onSnooze,
}: {
  nudge: NudgeState;
  onDismiss: (id: string) => void;
  onSnooze: (id: string, tier: PriorityTier) => void;
}) {
  const borderColor = TIER_BORDER[nudge.tier];
  const accentBg = TIER_BG[nudge.tier];
  const snoozeLabel = SNOOZE_LABELS[nudge.tier];

  return (
    <div
      className={`bg-white border-2 ${borderColor} rounded-[14px] px-5 py-4 relative`}
      role="article"
      aria-label={`${nudge.tier === "P0" ? "Urgent: " : ""}${nudge.title}`}
    >
      {nudge.tier === "P0" && (
        <span className="inline-block font-sans text-[9px] font-bold tracking-wide uppercase text-coral bg-coral/10 px-1.5 py-0.5 rounded-full mb-2">
          URGENT
        </span>
      )}

      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 ${accentBg} rounded-xl flex items-center justify-center text-lg flex-shrink-0`}>
          {nudge.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-sans text-sm font-semibold text-slate mb-0.5">
            {nudge.title}
          </div>
          <div className="font-sans text-xs text-slateMid leading-relaxed">
            {nudge.description}
          </div>
          {nudge.actionUrl && nudge.actionLabel && (
            nudge.actionUrl.startsWith("/") ? (
              <Link
                href={nudge.actionUrl}
                className="inline-block mt-2 font-sans text-xs font-semibold text-ocean hover:underline"
              >
                {nudge.actionLabel} &rarr;
              </Link>
            ) : (
              <a
                href={nudge.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 font-sans text-xs font-semibold text-ocean hover:underline"
              >
                {nudge.actionLabel} &rarr;
              </a>
            )
          )}
        </div>
      </div>

      {/* Snooze / Dismiss controls */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-sand">
        <button
          onClick={() => onSnooze(nudge.id, nudge.tier)}
          className="font-sans text-[11px] font-semibold text-slateMid hover:text-slate bg-sand/50 hover:bg-sand px-3 py-1.5 rounded-lg transition-colors"
        >
          {snoozeLabel}
        </button>
        <button
          onClick={() => onDismiss(nudge.id)}
          className="font-sans text-[11px] font-semibold text-slateMid hover:text-slate bg-sand/50 hover:bg-sand px-3 py-1.5 rounded-lg transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default function RemindersPage() {
  const [nudgeResult, setNudgeResult] = useState<PrioritizedNudgeResult | null>(null);
  const [activeCascades, setActiveCascades] = useState<CascadeInstance[]>([]);

  useEffect(() => {
    setActiveCascades(getActiveCascades());
    setNudgeResult(computePrioritizedNudges());
  }, []);

  const handleDismiss = (id: string) => {
    dismissPrioritizedNudge(id);
    setNudgeResult(computePrioritizedNudges());
  };

  const handleSnooze = (id: string, tier: PriorityTier) => {
    snoozePrioritizedNudge(id, tier);
    setNudgeResult(computePrioritizedNudges());
  };

  const allNudges = nudgeResult ? [...nudgeResult.display, ...nudgeResult.queued] : [];
  const totalCount = activeCascades.length + allNudges.length;

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="bg-gradient-to-br from-ocean to-[#164F5C] px-7 pt-10 pb-8 relative">
        <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04]" />
        <div className="absolute -bottom-[30px] -left-5 w-[120px] h-[120px] rounded-full bg-white/[0.03]" />

        <div className="relative">
          <Link href="/dashboard" className="font-sans text-sm text-white/80 hover:text-white inline-block mb-4">
            &larr; Dashboard
          </Link>

          <h1 className="font-serif text-[28px] font-semibold text-white tracking-tight mb-1">
            Reminders &amp; Alerts
          </h1>
          <p className="font-sans text-sm text-white/80">
            {totalCount === 0
              ? "No active reminders"
              : `${totalCount} active reminder${totalCount !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-6">
        {/* Active Cascades */}
        {activeCascades.length > 0 && (
          <div className="mb-5">
            <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
              Active Response Plans
            </div>
            <div className="flex flex-col gap-3">
              {activeCascades.map((cascade) => (
                <CascadeCard key={cascade.id} cascade={cascade} />
              ))}
            </div>
          </div>
        )}

        {/* Nudges */}
        {allNudges.length > 0 && (
          <div className="mb-5">
            <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
              Reminders
            </div>
            <div className="flex flex-col gap-3">
              {allNudges.map((nudge) => (
                <NudgeCard
                  key={nudge.id}
                  nudge={nudge}
                  onDismiss={handleDismiss}
                  onSnooze={handleSnooze}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {totalCount === 0 && (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <div className="font-serif text-xl font-semibold text-slate mb-2">
                You&apos;re all caught up
              </div>
              <div className="font-sans text-sm text-slateMid leading-relaxed">
                No reminders right now
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
