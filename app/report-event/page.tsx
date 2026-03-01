"use client";

import { useState } from "react";
import Link from "next/link";
import { LIFE_EVENT_TEMPLATES } from "@/lib/data/lifeEventTemplates";
import { reportLifeEvent } from "@/lib/utils/lifeEventEngine";
import type { LifeEventType, LifeEventSeverity } from "@/lib/types/lifeEvents";
import type { Task } from "@/lib/ai/claude";

type Step = "select" | "details" | "confirm";

export default function ReportEventPage() {
  const [step, setStep] = useState<Step>("select");
  const [selectedType, setSelectedType] = useState<LifeEventType | null>(null);
  const [severity, setSeverity] = useState<LifeEventSeverity>("moderate");
  const [notes, setNotes] = useState("");
  const [generatedTasks, setGeneratedTasks] = useState<Task[]>([]);

  const selectedTemplate = selectedType
    ? LIFE_EVENT_TEMPLATES.find((t) => t.eventType === selectedType)
    : null;

  const handleSelectType = (type: LifeEventType) => {
    setSelectedType(type);
    setStep("details");
  };

  const handleGenerate = () => {
    if (!selectedType) return;
    const { tasks } = reportLifeEvent(selectedType, severity, notes || undefined);
    setGeneratedTasks(tasks);
    setStep("confirm");
  };

  const severityOptions: { value: LifeEventSeverity; label: string; description: string }[] = [
    { value: "mild", label: "Mild", description: "Minor incident, situation is manageable" },
    { value: "moderate", label: "Moderate", description: "Significant impact, needs attention" },
    { value: "severe", label: "Severe", description: "Major event, urgent action needed" },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-amber to-[#B8862D] px-7 pt-10 pb-8">
        <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute -bottom-[30px] -left-5 w-[120px] h-[120px] rounded-full bg-white/[0.03] pointer-events-none" />
        <div className="relative">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 font-sans text-xs text-white/70 hover:text-white/90 transition-colors mb-3"
          >
            &larr; Dashboard
          </Link>
          <h1 className="font-serif text-[26px] font-semibold text-white tracking-tight">
            Report a Life Event
          </h1>
          <p className="font-sans text-sm text-white/80 mt-1">
            Harbor will generate relevant tasks to help you respond
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 py-6">
        {/* Step 1: Select Event Type */}
        {step === "select" && (
          <>
            <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
              What happened?
            </div>
            <div className="grid grid-cols-2 gap-3">
              {LIFE_EVENT_TEMPLATES.map((template) => (
                <button
                  key={template.eventType}
                  onClick={() => handleSelectType(template.eventType)}
                  className="bg-white border border-sandDark rounded-[14px] px-4 py-4 text-left cursor-pointer hover:scale-[1.01] transition-transform"
                >
                  <div className="text-2xl mb-2">{template.icon}</div>
                  <div className="font-sans text-xs font-semibold text-slate mb-0.5">
                    {template.label}
                  </div>
                  <div className="font-sans text-[10px] text-slateMid leading-tight">
                    {template.description}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Details */}
        {step === "details" && selectedTemplate && (
          <div className="flex flex-col gap-5">
            <button
              onClick={() => { setStep("select"); setSelectedType(null); }}
              className="font-sans text-xs text-ocean hover:underline self-start"
            >
              &larr; Back to event types
            </button>

            <div className="flex items-center gap-3">
              <div className="text-3xl">{selectedTemplate.icon}</div>
              <div>
                <div className="font-sans text-lg font-semibold text-slate">{selectedTemplate.label}</div>
                <div className="font-sans text-xs text-slateMid">{selectedTemplate.description}</div>
              </div>
            </div>

            {/* Severity */}
            <div>
              <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-2">
                Severity
              </div>
              <div className="flex flex-col gap-2">
                {severityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSeverity(opt.value)}
                    className={`rounded-[12px] px-4 py-3 text-left transition-all ${
                      severity === opt.value
                        ? "bg-amber/10 border-2 border-amber"
                        : "bg-white border border-sandDark hover:border-amber/40"
                    }`}
                  >
                    <div className="font-sans text-sm font-semibold text-slate">{opt.label}</div>
                    <div className="font-sans text-xs text-slateMid">{opt.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-2">
                Notes (optional)
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any details about what happened..."
                className="w-full font-sans text-sm border border-sandDark rounded-[12px] px-4 py-3 bg-white focus:outline-none focus:border-amber resize-none"
                rows={3}
              />
            </div>

            {/* Generate */}
            <button
              onClick={handleGenerate}
              className="w-full rounded-[12px] px-4 py-3.5 bg-ocean text-white font-sans text-sm font-semibold border-2 border-ocean hover:bg-ocean/90 transition-all"
            >
              Generate Tasks
            </button>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === "confirm" && selectedTemplate && (
          <div className="flex flex-col gap-5">
            <div className="bg-sage/10 border-2 border-sage rounded-[14px] px-5 py-4">
              <div className="font-sans text-xs font-semibold text-sage uppercase tracking-wide mb-1">
                Event Recorded
              </div>
              <div className="font-sans text-sm text-slate">
                {selectedTemplate.label} ({severity}) — {generatedTasks.length} tasks generated
              </div>
            </div>

            {generatedTasks.length > 0 && (
              <div>
                <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
                  Generated Tasks
                </div>
                <div className="flex flex-col gap-2">
                  {generatedTasks.map((task, i) => (
                    <div
                      key={i}
                      className="bg-white border border-sandDark rounded-[12px] px-4 py-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="font-sans text-sm font-semibold text-slate mb-0.5">
                          {task.title}
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            task.priority === "high"
                              ? "bg-coral/15 text-coral"
                              : task.priority === "medium"
                              ? "bg-amber/15 text-amber"
                              : "bg-sage/15 text-sage"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <div className="font-sans text-xs text-slateMid">{task.why}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Link
                href="/tasks"
                className="flex-1 rounded-[12px] px-4 py-3.5 bg-ocean text-white font-sans text-sm font-semibold text-center border-2 border-ocean hover:bg-ocean/90 transition-all"
              >
                View All Tasks
              </Link>
              <Link
                href="/dashboard"
                className="flex-1 rounded-[12px] px-4 py-3.5 bg-sand/50 text-slate font-sans text-sm font-semibold text-center border border-sandDark hover:bg-sand transition-all"
              >
                Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
