"use client";

import Link from "next/link";
import type { NudgeState, PriorityTier, PrioritizedNudgeResult, ConsolidatedNudge } from "@/lib/types/nudges";
import type { CascadeInstance } from "@/lib/types/cascade";
import { CARE_TRANSITION_PLAYBOOKS } from "@/lib/data/careTransitionPlaybooks";
import { SNOOZE_LABELS } from "@/lib/utils/nudgePriority";

interface NudgeBannerProps {
  result: PrioritizedNudgeResult | null;
  activeCascades?: CascadeInstance[];
  onDismiss: (id: string) => void;
  onSnooze: (id: string, tier: PriorityTier) => void;
}

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
      className={`flex-shrink-0 w-[260px] bg-white border-2 ${borderColor} rounded-[14px] px-4 py-3 relative transition-opacity duration-200`}
      role="article"
      aria-label={`${nudge.tier === "P0" ? "Urgent: " : ""}${nudge.title}`}
    >
      {/* Urgent pill */}
      {nudge.tier === "P0" && (
        <span className="absolute top-2 left-3 font-sans text-[9px] font-bold tracking-wide uppercase text-coral bg-coral/10 px-1.5 py-0.5 rounded-full">
          URGENT
        </span>
      )}

      {/* Dismiss / Snooze controls */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5">
        <button
          onClick={() => onSnooze(nudge.id, nudge.tier)}
          className="w-6 h-6 rounded-full bg-sand/50 flex items-center justify-center text-[10px] text-slateMid hover:bg-sand transition-colors"
          title={snoozeLabel}
          aria-label={`${snoozeLabel} for ${nudge.title}`}
        >
          {"\ud83d\udca4"}
        </button>
        <button
          onClick={() => onDismiss(nudge.id)}
          className="w-6 h-6 rounded-full bg-sand/50 flex items-center justify-center text-xs text-slateMid hover:bg-sand transition-colors"
          title="Dismiss"
          aria-label={`Dismiss ${nudge.title}`}
        >
          {"\u00d7"}
        </button>
      </div>

      <div className={`flex items-start gap-3 pr-14 ${nudge.tier === "P0" ? "mt-5" : ""}`}>
        <div className={`w-8 h-8 ${accentBg} rounded-lg flex items-center justify-center text-sm flex-shrink-0`}>
          {nudge.icon}
        </div>
        <div className="min-w-0">
          <div className="font-sans text-xs font-semibold text-slate mb-0.5 truncate">
            {nudge.title}
          </div>
          <div className="font-sans text-[10px] text-slateMid leading-tight line-clamp-2">
            {nudge.description}
          </div>
          {nudge.actionUrl && nudge.actionLabel && (
            nudge.actionUrl.startsWith("/") ? (
              <Link
                href={nudge.actionUrl}
                className="inline-block mt-1.5 font-sans text-[10px] font-semibold text-ocean hover:underline"
              >
                {nudge.actionLabel} &rarr;
              </Link>
            ) : (
              <a
                href={nudge.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-1.5 font-sans text-[10px] font-semibold text-ocean hover:underline"
              >
                {nudge.actionLabel} &rarr;
              </a>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function ConsolidatedCard({ card }: { card: ConsolidatedNudge }) {
  const borderColor = TIER_BORDER[card.tier];
  const accentBg = TIER_BG[card.tier];

  return (
    <div
      className={`flex-shrink-0 w-[260px] bg-white border-2 ${borderColor} rounded-[14px] px-4 py-3 relative`}
      role="article"
      aria-label={`${card.count} ${card.title} updates`}
    >
      {/* Count badge */}
      <span className="absolute top-2 right-2 font-sans text-[10px] font-bold text-white bg-slateMid px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
        {card.count}
      </span>

      <div className="flex items-start gap-3 pr-10">
        <div className={`w-8 h-8 ${accentBg} rounded-lg flex items-center justify-center text-sm flex-shrink-0`}>
          {card.icon}
        </div>
        <div className="min-w-0">
          <div className="font-sans text-xs font-semibold text-slate mb-0.5 truncate">
            {card.topNudge.title}
          </div>
          <div className="font-sans text-[10px] text-slateMid leading-tight">
            {card.count > 1 ? `+${card.count - 1} more update${card.count > 2 ? "s" : ""}` : card.topNudge.description}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ count }: { count: number }) {
  return (
    <div
      className="flex-shrink-0 w-[200px] bg-sand/30 border-2 border-sand rounded-[14px] px-4 py-3 flex items-center justify-center"
      role="article"
      aria-label={`${count} more updates in your feed`}
    >
      <div className="font-sans text-[11px] text-slateMid text-center">
        <span className="font-semibold text-slate">{count}</span> more update{count !== 1 ? "s" : ""} in your feed
      </div>
    </div>
  );
}

function CascadeCard({ cascade }: { cascade: CascadeInstance }) {
  const playbook = CARE_TRANSITION_PLAYBOOKS.find(
    (p) => p.id === cascade.playbookId,
  );
  if (!playbook) return null;

  const steps = Object.values(cascade.stepProgress);
  const completedCount = steps.filter((s) => s === "completed").length;
  const totalCount = steps.length;

  // Find next actionable step title
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
      className="flex-shrink-0 w-[300px] bg-amber/5 border-2 border-amber rounded-[14px] px-4 py-3"
      role="article"
      aria-label={`Response plan: ${playbook.label}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-amber/15 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
          {playbook.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-sans text-xs font-semibold text-slate mb-0.5 truncate">
            {playbook.label}
          </div>
          <div className="font-sans text-[10px] text-slateMid leading-tight">
            {completedCount} of {totalCount} steps
          </div>
          {nextStep && (
            <div className="font-sans text-[10px] text-amber font-medium mt-1 truncate">
              Next: {nextStep.title}
            </div>
          )}
          <Link
            href={`/playbooks/${cascade.playbookId}`}
            className="inline-block mt-1.5 font-sans text-[10px] font-semibold text-ocean hover:underline"
          >
            View response plan &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function NudgeBanner({ result, activeCascades, onDismiss, onSnooze }: NudgeBannerProps) {
  const cascades = activeCascades ?? [];
  const hasNudges = result && result.display.length > 0;
  const hasCascades = cascades.length > 0;

  if (!hasNudges && !hasCascades) return null;

  const display = result?.display ?? [];
  const queued = result?.queued ?? [];
  const degradation = result?.degradation;
  const consolidated = result?.consolidated;

  // Cascade cards take visual budget from nudge cards (8-card total)
  const nudgeBudget = Math.max(0, 8 - cascades.length);

  return (
    <div className="mb-5" role="region" aria-label="Priority notifications">
      <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-2">
        Reminders
      </div>
      <div
        className="flex gap-3 pb-2 -mx-5 px-5"
        style={{
          overflowX: "auto",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Cascade cards first (leftmost) */}
        {cascades.map((cascade) => (
          <CascadeCard key={cascade.id} cascade={cascade} />
        ))}

        {/* Nudge cards */}
        {degradation === "consolidation" && consolidated ? (
          consolidated.map((card) => (
            <ConsolidatedCard key={`cons_${card.sourceType}`} card={card} />
          ))
        ) : (
          display.slice(0, nudgeBudget).map((nudge) => (
            <NudgeCard
              key={nudge.id}
              nudge={nudge}
              onDismiss={onDismiss}
              onSnooze={onSnooze}
            />
          ))
        )}

        {/* Overflow indicator */}
        {queued.length > 0 && (
          <div className="flex-shrink-0 flex items-center">
            <span className="font-sans text-[10px] font-semibold text-slateMid bg-sand/50 px-2.5 py-1 rounded-full whitespace-nowrap">
              +{queued.length} more
            </span>
          </div>
        )}

        {/* Summary card for summary degradation mode */}
        {degradation === "summary" && queued.length > 0 && (
          <SummaryCard count={queued.length} />
        )}
      </div>
    </div>
  );
}
