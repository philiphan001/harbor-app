"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CARE_TRANSITION_PLAYBOOKS } from "@/lib/data/careTransitionPlaybooks";
import { getParentProfile } from "@/lib/utils/parentProfile";
import {
  getCascadeForPlaybook,
  completeStep,
  resolveCascade,
} from "@/lib/utils/cascadeStorage";
import type { CascadeInstance, StepStatus } from "@/lib/types/cascade";
import type {
  CareTransitionPlaybook,
  CareTransitionStep,
  CareTransitionType,
} from "@/lib/types/careTransitions";
import Disclaimer from "@/components/Disclaimer";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function replaceName(text: string, name: string): string {
  return text.replace(/\{parent_name\}/g, name);
}

const GRADIENT_MAP: Record<string, string> = {
  hospital_to_home: "from-coral to-[#C44A3F]",
  hospital_to_snf: "from-coral to-[#C44A3F]",
  discharge_navigator: "from-coral to-[#C44A3F]",
  home_to_assisted_living: "from-amber to-[#B8860B]",
  al_to_memory_care: "from-sage to-[#4A7350]",
  new_diagnosis: "from-ocean to-[#164F5C]",
};

// ---------------------------------------------------------------------------
// Step components
// ---------------------------------------------------------------------------

function ActionableStep({
  step,
  parentName,
  onComplete,
}: {
  step: CareTransitionStep;
  parentName: string;
  onComplete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border-2 border-amber rounded-[14px] px-5 py-4">
      <div className="flex items-start gap-3">
        <button
          onClick={onComplete}
          className="mt-0.5 w-5 h-5 rounded-md border-2 border-amber flex-shrink-0 hover:bg-amber/20 transition-colors"
          aria-label={`Complete step ${step.stepNumber}`}
        />
        <div className="flex-1 min-w-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-left w-full"
          >
            <div className="font-sans text-sm font-semibold text-slate">
              {step.stepNumber}. {replaceName(step.title, parentName)}
            </div>
          </button>

          {expanded && (
            <div className="mt-3 flex flex-col gap-3">
              <p className="font-sans text-sm text-slateMid leading-relaxed">
                {replaceName(step.description, parentName)}
              </p>

              <div className="bg-amber/10 rounded-[10px] px-4 py-3">
                <div className="font-sans text-[10px] font-semibold tracking-[1.5px] uppercase text-amber mb-1">
                  Why It Matters
                </div>
                <p className="font-sans text-xs text-slate leading-relaxed">
                  {replaceName(step.whyItMatters, parentName)}
                </p>
              </div>

              {step.questionsToAsk.length > 0 && (
                <div>
                  <div className="font-sans text-[10px] font-semibold tracking-[1.5px] uppercase text-ocean mb-2">
                    Questions to Ask
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {step.questionsToAsk.map((q, i) => (
                      <li
                        key={i}
                        className="font-sans text-xs text-slateMid leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-ocean"
                      >
                        {replaceName(q, parentName)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!expanded && (
            <div className="font-sans text-[10px] text-slateMid mt-0.5">
              Tap to expand details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LockedStep({
  step,
  parentName,
}: {
  step: CareTransitionStep;
  parentName: string;
}) {
  return (
    <div className="bg-sand/20 border border-sandDark rounded-[14px] px-5 py-4 opacity-60">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-sandDark flex-shrink-0" />
        <div>
          <div className="font-sans text-sm font-semibold text-slateMid">
            {step.stepNumber}. {replaceName(step.title, parentName)}
          </div>
          <div className="font-sans text-[10px] text-slateLight mt-0.5">
            Available after prior steps
          </div>
        </div>
      </div>
    </div>
  );
}

function CompletedStep({
  step,
  parentName,
}: {
  step: CareTransitionStep;
  parentName: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-sage/5 border border-sage/30 rounded-[14px] px-5 py-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 w-5 h-5 rounded-md bg-sage flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs">✓</span>
        </div>
        <div className="flex-1 min-w-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-left w-full"
          >
            <div className="font-sans text-sm font-semibold text-sage line-through decoration-sage/40">
              {step.stepNumber}. {replaceName(step.title, parentName)}
            </div>
          </button>
          {expanded && (
            <p className="font-sans text-xs text-slateMid leading-relaxed mt-2">
              {replaceName(step.description, parentName)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ReadOnlyStep({
  step,
  parentName,
}: {
  step: CareTransitionStep;
  parentName: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-sandDark flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-left w-full"
          >
            <div className="font-sans text-sm font-semibold text-slate">
              {step.stepNumber}. {replaceName(step.title, parentName)}
            </div>
          </button>
          {expanded && (
            <div className="mt-3 flex flex-col gap-3">
              <p className="font-sans text-sm text-slateMid leading-relaxed">
                {replaceName(step.description, parentName)}
              </p>
              <div className="bg-amber/10 rounded-[10px] px-4 py-3">
                <div className="font-sans text-[10px] font-semibold tracking-[1.5px] uppercase text-amber mb-1">
                  Why It Matters
                </div>
                <p className="font-sans text-xs text-slate leading-relaxed">
                  {replaceName(step.whyItMatters, parentName)}
                </p>
              </div>
              {step.questionsToAsk.length > 0 && (
                <div>
                  <div className="font-sans text-[10px] font-semibold tracking-[1.5px] uppercase text-ocean mb-2">
                    Questions to Ask
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {step.questionsToAsk.map((q, i) => (
                      <li
                        key={i}
                        className="font-sans text-xs text-slateMid leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-ocean"
                      >
                        {replaceName(q, parentName)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {!expanded && (
            <div className="font-sans text-[10px] text-slateMid mt-0.5">
              Tap to expand details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PlaybookPage() {
  const params = useParams();
  const playbookId = params.id as CareTransitionType;

  const [playbook, setPlaybook] = useState<CareTransitionPlaybook | null>(null);
  const [cascade, setCascade] = useState<CascadeInstance | null>(null);
  const [parentName, setParentName] = useState("Your parent");
  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const reload = useCallback(() => {
    const pb = CARE_TRANSITION_PLAYBOOKS.find((p) => p.id === playbookId);
    setPlaybook(pb ?? null);
    setCascade(getCascadeForPlaybook(playbookId));
    const profile = getParentProfile();
    if (profile?.name) setParentName(profile.name.split(" ")[0]);
  }, [playbookId]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!playbook) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warmWhite">
        <div className="font-sans text-sm text-slateMid">
          Playbook not found.
        </div>
      </div>
    );
  }

  const isActive = cascade?.status === "active";
  const gradient = GRADIENT_MAP[playbookId] || "from-ocean to-[#164F5C]";

  // Progress computation
  const totalSteps = playbook.steps.length;
  const completedSteps = isActive
    ? Object.values(cascade!.stepProgress).filter((s) => s === "completed")
        .length
    : 0;
  const progressPct = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  // Group steps by status
  const actionable: CareTransitionStep[] = [];
  const locked: CareTransitionStep[] = [];
  const completed: CareTransitionStep[] = [];

  if (isActive) {
    for (const step of playbook.steps) {
      const status: StepStatus =
        cascade!.stepProgress[step.stepNumber] ?? "locked";
      if (status === "actionable") actionable.push(step);
      else if (status === "locked") locked.push(step);
      else completed.push(step);
    }
  }

  const handleComplete = (stepNumber: number) => {
    if (!cascade) return;
    completeStep(cascade.id, stepNumber);
    reload();
  };

  const handleResolve = () => {
    if (!cascade) return;
    resolveCascade(cascade.id);
    reload();
  };

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div
        className={`relative bg-gradient-to-br ${gradient} px-7 pt-10 pb-8`}
      >
        <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute -bottom-[30px] -left-5 w-[120px] h-[120px] rounded-full bg-white/[0.03] pointer-events-none" />
        <div className="relative">
          <Link
            href="/guides"
            className="inline-flex items-center gap-1 font-sans text-xs text-white/70 hover:text-white/90 transition-colors mb-3"
          >
            &larr; Guides
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{playbook.icon}</span>
            <h1 className="font-serif text-[24px] font-semibold text-white tracking-tight">
              {playbook.label}
            </h1>
          </div>
          <p className="font-sans text-sm text-white/80 leading-relaxed">
            {replaceName(playbook.overview, parentName)}
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-4">
        <Disclaimer type="general" />

        {/* Progress bar (active cascades only) */}
        {isActive && (
          <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-sans text-xs font-semibold text-slate">
                Progress
              </div>
              <div className="font-sans text-xs text-slateMid">
                {completedSteps} of {totalSteps} steps complete
              </div>
            </div>
            <div className="w-full h-2 bg-sand rounded-full overflow-hidden">
              <div
                className="h-full bg-sage rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Read-only banner */}
        {!isActive && (
          <div className="bg-sand/30 border border-sandDark rounded-[14px] px-5 py-4">
            <div className="font-sans text-xs font-semibold text-slateMid">
              {cascade?.status === "resolved"
                ? "This response plan has been completed."
                : "This playbook is available for reference. It will activate when a related event is reported."}
            </div>
          </div>
        )}

        {/* Active cascade: grouped steps */}
        {isActive && (
          <>
            {/* NOW — actionable */}
            {actionable.length > 0 && (
              <div>
                <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-amber mb-2">
                  Now
                </div>
                <div className="flex flex-col gap-3">
                  {actionable.map((step) => (
                    <ActionableStep
                      key={step.stepNumber}
                      step={step}
                      parentName={parentName}
                      onComplete={() => handleComplete(step.stepNumber)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* COMING UP — locked */}
            {locked.length > 0 && (
              <div>
                <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-2">
                  Coming Up
                </div>
                <div className="flex flex-col gap-3">
                  {locked.map((step) => (
                    <LockedStep
                      key={step.stepNumber}
                      step={step}
                      parentName={parentName}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* DONE — completed */}
            {completed.length > 0 && (
              <div>
                <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-sage mb-2">
                  Done
                </div>
                <div className="flex flex-col gap-3">
                  {completed.map((step) => (
                    <CompletedStep
                      key={step.stepNumber}
                      step={step}
                      parentName={parentName}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Read-only steps (no active cascade) */}
        {!isActive && (
          <div>
            <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-ocean mb-2">
              Steps
            </div>
            <div className="flex flex-col gap-3">
              {playbook.steps.map((step) => (
                <ReadOnlyStep
                  key={step.stepNumber}
                  step={step}
                  parentName={parentName}
                />
              ))}
            </div>
          </div>
        )}

        {/* Insurance Considerations */}
        {playbook.insuranceConsiderations.length > 0 && (
          <div className="bg-white border border-sandDark rounded-[14px] overflow-hidden">
            <button
              onClick={() => setInsuranceOpen(!insuranceOpen)}
              className="w-full px-5 py-4 flex items-center justify-between text-left"
            >
              <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean">
                Insurance Considerations
              </div>
              <span className="text-slateMid text-sm">
                {insuranceOpen ? "−" : "+"}
              </span>
            </button>
            {insuranceOpen && (
              <div className="px-5 pb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-sand">
                        <th className="font-sans text-[10px] font-semibold text-slateMid pb-2 pr-3">
                          Item
                        </th>
                        <th className="font-sans text-[10px] font-semibold text-slateMid pb-2 pr-3">
                          Coverage
                        </th>
                        <th className="font-sans text-[10px] font-semibold text-slateMid pb-2">
                          Key Details
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {playbook.insuranceConsiderations.map((ic, i) => (
                        <tr
                          key={i}
                          className="border-b border-sand/50 last:border-0"
                        >
                          <td className="font-sans text-xs text-slate py-2 pr-3 align-top">
                            {ic.item}
                          </td>
                          <td className="font-sans text-xs text-slateMid py-2 pr-3 align-top">
                            {ic.coverage}
                          </td>
                          <td className="font-sans text-xs text-slateMid py-2 align-top">
                            {ic.keyDetails}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timeline Benchmarks */}
        {playbook.timelineBenchmarks.length > 0 && (
          <div className="bg-white border border-sandDark rounded-[14px] overflow-hidden">
            <button
              onClick={() => setTimelineOpen(!timelineOpen)}
              className="w-full px-5 py-4 flex items-center justify-between text-left"
            >
              <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean">
                Timeline Benchmarks
              </div>
              <span className="text-slateMid text-sm">
                {timelineOpen ? "−" : "+"}
              </span>
            </button>
            {timelineOpen && (
              <div className="px-5 pb-4 flex flex-col gap-2">
                {playbook.timelineBenchmarks.map((tb, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="font-sans text-xs font-semibold text-ocean min-w-[80px]">
                      {tb.timeframe}
                    </div>
                    <div className="font-sans text-xs text-slateMid">
                      {tb.milestone}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tasks link */}
        {isActive && (
          <Link
            href="/tasks"
            className="block bg-ocean/5 border border-ocean/20 rounded-[14px] px-5 py-4 hover:bg-ocean/10 transition-colors"
          >
            <div className="font-sans text-sm font-semibold text-ocean">
              Tasks have been added to your action list &rarr;
            </div>
            <div className="font-sans text-xs text-slateMid mt-0.5">
              View and manage all tasks in your task list
            </div>
          </Link>
        )}

        {/* Resolve button */}
        {isActive && (
          <button
            onClick={handleResolve}
            className="w-full rounded-[12px] px-4 py-3 bg-sand/50 text-slateMid font-sans text-sm font-medium text-center hover:bg-sand transition-colors"
          >
            Mark as resolved
          </button>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
