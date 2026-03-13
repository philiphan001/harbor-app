"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getParentProfile } from "@/lib/utils/parentProfile";
import { COGNITIVE_QUESTIONS } from "@/lib/data/cognitiveQuestions";
import {
  saveCognitiveObservation,
  getCognitiveObservations,
  computeCognitiveTrend,
} from "@/lib/utils/cognitiveStorage";
import type {
  CognitiveQuestionId,
  ObservationResponse,
  CognitiveTrend,
} from "@/lib/types/cognitiveCheckin";
import Disclaimer from "@/components/Disclaimer";

const RESPONSE_OPTIONS: { value: ObservationResponse; label: string }[] = [
  { value: "not_noticed", label: "Not noticed" },
  { value: "occasionally", label: "Occasionally" },
  { value: "frequently", label: "Frequently" },
];

export default function CognitiveCheckinPage() {
  const [parentName, setParentName] = useState("");
  const [responses, setResponses] = useState<Partial<Record<CognitiveQuestionId, ObservationResponse>>>({});
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [trend, setTrend] = useState<CognitiveTrend | null>(null);

  useEffect(() => {
    const profile = getParentProfile();
    if (profile) setParentName(profile.name);
    const t = computeCognitiveTrend();
    if (t.observations.length > 0) setTrend(t);
  }, []);

  const allAnswered = COGNITIVE_QUESTIONS.every((q) => responses[q.id] !== undefined);

  const handleSave = () => {
    if (!allAnswered) return;
    saveCognitiveObservation(
      responses as Record<CognitiveQuestionId, ObservationResponse>,
      notes || undefined
    );
    setSaved(true);
    setTrend(computeCognitiveTrend());
  };

  const setResponse = (id: CognitiveQuestionId, value: ObservationResponse) => {
    setResponses((prev) => ({ ...prev, [id]: value }));
  };

  const trendLabel = (t: CognitiveTrend["trend"]) => {
    switch (t) {
      case "improving": return "Improving";
      case "stable": return "Stable";
      case "worsening": return "Worsening";
      default: return "Not enough data yet";
    }
  };

  const trendColor = (t: CognitiveTrend["trend"]) => {
    switch (t) {
      case "improving": return "text-sage";
      case "stable": return "text-ocean";
      case "worsening": return "text-coral";
      default: return "text-slateMid";
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-sage to-[#4A7350] px-7 pt-10 pb-8">
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
            Cognitive Observation Check-In
          </h1>
          {parentName && (
            <div className="font-sans text-sm text-white/80 mt-1">
              Observations about {parentName}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-4">
        <Disclaimer type="medical" />

        {/* Previous trend */}
        {trend && trend.observations.length > 0 && (
          <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
            <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-3">
              Previous Observations
            </div>
            <div className="flex items-center gap-3 mb-3">
              {trend.observations.slice(0, 3).map((obs, i) => (
                <div key={obs.id} className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 rounded-full bg-ocean/20 relative"
                    style={{ height: `${Math.max(12, (obs.totalScore / 24) * 60)}px` }}
                  >
                    <div
                      className="absolute bottom-0 w-full rounded-full bg-ocean"
                      style={{ height: `${Math.max(4, (obs.totalScore / 24) * 100)}%` }}
                    />
                  </div>
                  <span className="font-sans text-[10px] text-slateMid">
                    {obs.totalScore}
                  </span>
                  <span className="font-sans text-[10px] text-slateLight">
                    {i === 0 ? "Latest" : `#${i + 1}`}
                  </span>
                </div>
              ))}
            </div>
            <div className="font-sans text-sm text-slate">
              Trend: <span className={`font-semibold ${trendColor(trend.trend)}`}>{trendLabel(trend.trend)}</span>
            </div>
          </div>
        )}

        {/* Alert card */}
        {trend?.shouldAlert && (
          <div className="bg-coral/10 border-2 border-coral/30 rounded-[14px] px-5 py-4">
            <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-coral mb-2">
              Pattern of Concern
            </div>
            <p className="font-sans text-sm text-slate leading-relaxed mb-3">
              The observations you&apos;ve recorded suggest a pattern worth discussing with a doctor.
              Early conversations lead to better outcomes.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/life-events?event=cognitive_decline"
                className="inline-flex items-center gap-1 font-sans text-sm text-coral font-semibold hover:underline"
              >
                Report as a life event &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Questions */}
        {!saved ? (
          <>
            <div className="bg-white border-2 border-sage rounded-[14px] px-5 py-4">
              <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-sage mb-3">
                What Have You Observed?
              </div>
              <p className="font-sans text-xs text-slateMid mb-4">
                Think about the past 2-4 weeks. For each behavior, select how often you&apos;ve noticed it.
              </p>

              <div className="flex flex-col gap-5">
                {COGNITIVE_QUESTIONS.map((q) => (
                  <div key={q.id}>
                    <div className="font-sans text-sm font-semibold text-slate mb-1">
                      {q.label}
                    </div>
                    <p className="font-sans text-xs text-slateMid mb-2">
                      {q.description}
                    </p>
                    <div className="flex gap-2">
                      {RESPONSE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setResponse(q.id, opt.value)}
                          className={`flex-1 rounded-[10px] px-2 py-2.5 font-sans text-xs font-medium text-center transition-colors border ${
                            responses[q.id] === opt.value
                              ? "bg-sage text-white border-sage"
                              : "bg-white text-slate border-sandDark hover:border-sage"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
              <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-sage mb-2">
                Additional Notes (Optional)
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific incidents or observations you want to remember..."
                className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white min-h-[70px] resize-y"
              />
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!allAnswered}
              className="w-full rounded-[12px] px-4 py-3.5 bg-sage text-white font-sans text-sm font-semibold text-center hover:bg-sage/90 transition-colors disabled:opacity-50"
            >
              Save Observations
            </button>
          </>
        ) : (
          <div className="bg-sage/10 border-2 border-sage rounded-[14px] px-5 py-4 text-center">
            <div className="font-sans text-lg font-semibold text-sage mb-1">
              Observations Saved
            </div>
            <p className="font-sans text-sm text-slateMid">
              Score: {trend?.currentScore ?? 0}/24. Come back in 30 days to track changes over time.
            </p>
          </div>
        )}

        {/* Resources */}
        <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-3">
            Resources
          </div>
          <ul className="flex flex-col gap-3">
            <li>
              <a
                href="https://www.alz.org/alzheimers-dementia/10_signs"
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm text-ocean font-semibold hover:underline"
              >
                Alzheimer&apos;s Association: 10 Early Signs &rarr;
              </a>
              <p className="font-sans text-xs text-slateMid mt-0.5">
                Detailed guide to recognizing early warning signs.
              </p>
            </li>
            <li>
              <a
                href="https://www.alz.org/help-support/resources/helpline"
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm text-ocean font-semibold hover:underline"
              >
                24/7 Helpline: 1-800-272-3900 &rarr;
              </a>
              <p className="font-sans text-xs text-slateMid mt-0.5">
                Free, confidential support from the Alzheimer&apos;s Association.
              </p>
            </li>
            <li>
              <Link
                href="/chat"
                className="font-sans text-sm text-ocean font-semibold hover:underline"
              >
                Talk to Harbor &rarr;
              </Link>
              <p className="font-sans text-xs text-slateMid mt-0.5">
                Get personalized guidance about next steps.
              </p>
            </li>
          </ul>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
