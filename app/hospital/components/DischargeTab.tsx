"use client";

import { useState } from "react";
import { CARE_TRANSITION_PLAYBOOKS } from "@/lib/data/careTransitionPlaybooks";
import {
  markDischargeStep,
  unmarkDischargeStep,
} from "@/lib/utils/hospitalNotes";
import type { CareTransitionType } from "@/lib/types/careTransitions";

const DISCHARGE_PLAYBOOK_IDS: CareTransitionType[] = ["hospital_to_home", "hospital_to_snf"];

interface DischargeTabProps {
  parentName: string;
  completedSteps: string[];
  onStepsChange: () => void;
}

function replaceTemplateVars(text: string, parentName: string): string {
  return text.replace(/\{parent_name\}/g, parentName || "your parent");
}

export default function DischargeTab({ parentName, completedSteps, onStepsChange }: DischargeTabProps) {
  const [activePlaybookId, setActivePlaybookId] = useState<CareTransitionType>("hospital_to_home");
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const playbook = CARE_TRANSITION_PLAYBOOKS.find((p) => p.id === activePlaybookId);
  if (!playbook) return null;

  const totalSteps = playbook.steps.length;
  const completedCount = playbook.steps.filter((s) =>
    completedSteps.includes(`${activePlaybookId}-${s.stepNumber}`)
  ).length;
  const progress = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  const toggleStep = (stepNumber: number) => {
    const stepId = `${activePlaybookId}-${stepNumber}`;
    if (completedSteps.includes(stepId)) {
      unmarkDischargeStep(stepId);
    } else {
      markDischargeStep(stepId);
    }
    onStepsChange();
  };

  const toggleExpand = (stepNumber: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNumber)) next.delete(stepNumber);
      else next.add(stepNumber);
      return next;
    });
  };

  const handleCopyQuestions = async (questions: string[]) => {
    const text = questions
      .map((q) => `• ${replaceTemplateVars(q, parentName)}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Playbook Switcher */}
      <div className="flex gap-2">
        {DISCHARGE_PLAYBOOK_IDS.map((id) => {
          const pb = CARE_TRANSITION_PLAYBOOKS.find((p) => p.id === id);
          if (!pb) return null;
          return (
            <button
              key={id}
              onClick={() => {
                setActivePlaybookId(id);
                setExpandedSteps(new Set());
              }}
              className={`font-sans text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors ${
                activePlaybookId === id
                  ? "bg-coral text-white"
                  : "bg-white border border-sandDark text-slateMid hover:bg-sand/50"
              }`}
            >
              {pb.icon} {pb.label}
            </button>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-sans text-xs font-semibold text-slate">Discharge Progress</div>
          <div className="font-sans text-xs text-slateMid">
            {completedCount} of {totalSteps} steps
          </div>
        </div>
        <div className="w-full h-2 bg-sand rounded-full overflow-hidden">
          <div
            className="h-full bg-sage rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Overview */}
      <div className="font-sans text-sm text-slateMid">
        {replaceTemplateVars(playbook.overview, parentName)}
      </div>

      {/* Steps */}
      {playbook.steps.map((step) => {
        const stepId = `${activePlaybookId}-${step.stepNumber}`;
        const isCompleted = completedSteps.includes(stepId);
        const isExpanded = expandedSteps.has(step.stepNumber);

        return (
          <div
            key={step.stepNumber}
            className={`bg-white border rounded-[14px] px-5 py-4 transition-colors ${
              isCompleted ? "border-sage/50 bg-sage/5" : "border-sandDark"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={() => toggleStep(step.stepNumber)}
                className="mt-1 w-4 h-4 rounded border-slateLight accent-sage flex-shrink-0"
              />
              <div className="flex-1">
                <button
                  onClick={() => toggleExpand(step.stepNumber)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`font-sans text-sm font-semibold ${
                        isCompleted ? "text-sage line-through" : "text-slate"
                      }`}
                    >
                      {step.stepNumber}. {replaceTemplateVars(step.title, parentName)}
                    </div>
                    <span className="text-slateLight text-xs ml-2">
                      {isExpanded ? "\u25b2" : "\u25bc"}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-3 flex flex-col gap-3">
                    <div className="font-sans text-sm text-slateMid">
                      {replaceTemplateVars(step.description, parentName)}
                    </div>

                    {/* Why It Matters */}
                    <div className="bg-amber/10 border border-amber/20 rounded-[10px] px-4 py-3">
                      <div className="font-sans text-[10px] font-semibold tracking-[1px] uppercase text-amber mb-1">
                        Why It Matters
                      </div>
                      <div className="font-sans text-xs text-slate">
                        {replaceTemplateVars(step.whyItMatters, parentName)}
                      </div>
                    </div>

                    {/* Questions to Ask */}
                    {step.questionsToAsk.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-sans text-[10px] font-semibold tracking-[1px] uppercase text-ocean">
                            Questions to Ask
                          </div>
                          <button
                            onClick={() => handleCopyQuestions(step.questionsToAsk)}
                            className="font-sans text-[10px] font-semibold text-ocean hover:underline"
                          >
                            Copy
                          </button>
                        </div>
                        <ul className="flex flex-col gap-1.5">
                          {step.questionsToAsk.map((q, i) => (
                            <li key={i} className="font-sans text-xs text-slate flex items-start gap-2">
                              <span className="text-ocean mt-0.5">{"\u2022"}</span>
                              <span>{replaceTemplateVars(q, parentName)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Insurance Considerations */}
      {playbook.insuranceConsiderations.length > 0 && (
        <div>
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-slateLight mt-2 mb-3">
            Insurance Considerations
          </div>
          <div className="flex flex-col gap-3">
            {playbook.insuranceConsiderations.map((ic, i) => (
              <div key={i} className="bg-white border border-sandDark rounded-[14px] px-4 py-3">
                <div className="font-sans text-sm font-semibold text-slate mb-1">{ic.item}</div>
                <div className="font-sans text-xs text-ocean mb-1">{ic.coverage}</div>
                <div className="font-sans text-xs text-slateMid">{ic.keyDetails}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Benchmarks */}
      {playbook.timelineBenchmarks.length > 0 && (
        <div>
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-slateLight mt-2 mb-3">
            Timeline Benchmarks
          </div>
          <div className="bg-white border border-sandDark rounded-[14px] px-4 py-3">
            <div className="flex flex-col gap-2">
              {playbook.timelineBenchmarks.map((tb, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="font-sans text-[10px] font-semibold text-ocean bg-ocean/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {tb.timeframe}
                  </div>
                  <div className="font-sans text-xs text-slate">{replaceTemplateVars(tb.milestone, parentName)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
