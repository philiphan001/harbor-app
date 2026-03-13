"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getParentProfile } from "@/lib/utils/parentProfile";
import { WELLNESS_QUESTIONS } from "@/lib/data/wellnessQuestions";
import {
  saveWellnessCheckin,
  getWellnessCheckins,
  computeWellnessTrend,
} from "@/lib/utils/wellnessStorage";
import type {
  WellnessQuestionId,
  WellnessResponse,
  WellnessTrend,
} from "@/lib/types/wellnessCheckin";
import Disclaimer from "@/components/Disclaimer";

const RESPONSE_OPTIONS: { value: WellnessResponse; label: string }[] = [
  { value: "doing_fine", label: "Doing fine" },
  { value: "sometimes_struggling", label: "Sometimes struggling" },
  { value: "really_struggling", label: "Really struggling" },
];

export default function WellnessCheckinPage() {
  const [parentName, setParentName] = useState("");
  const [responses, setResponses] = useState<Partial<Record<WellnessQuestionId, WellnessResponse>>>({});
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [trend, setTrend] = useState<WellnessTrend | null>(null);

  useEffect(() => {
    const profile = getParentProfile();
    if (profile) setParentName(profile.name);
    const t = computeWellnessTrend();
    if (t.checkins.length > 0) setTrend(t);
  }, []);

  const allAnswered = WELLNESS_QUESTIONS.every((q) => responses[q.id] !== undefined);

  const handleSave = () => {
    if (!allAnswered) return;
    saveWellnessCheckin(
      responses as Record<WellnessQuestionId, WellnessResponse>,
      notes || undefined
    );
    setSaved(true);
    setTrend(computeWellnessTrend());
  };

  const setResponse = (id: WellnessQuestionId, value: WellnessResponse) => {
    setResponses((prev) => ({ ...prev, [id]: value }));
  };

  const burnoutColor = (risk: WellnessTrend["burnoutRisk"]) => {
    switch (risk) {
      case "low": return "text-sage";
      case "moderate": return "text-amber";
      case "high": return "text-coral";
    }
  };

  const trendLabel = (t: WellnessTrend["trend"]) => {
    switch (t) {
      case "improving": return "Improving";
      case "stable": return "Stable";
      case "worsening": return "Worsening";
      default: return "Not enough data yet";
    }
  };

  const trendColor = (t: WellnessTrend["trend"]) => {
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
      <div className="relative bg-gradient-to-br from-ocean to-[#2A6B8A] px-7 pt-10 pb-8">
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
            Caregiver Wellness Check-In
          </h1>
          <div className="font-sans text-sm text-white/80 mt-1">
            Harbor watches out for you too
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-4">
        <Disclaimer type="medical" />

        {/* Previous trend */}
        {trend && trend.checkins.length > 0 && (
          <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
            <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-3">
              Previous Check-Ins
            </div>
            <div className="flex items-center gap-3 mb-3">
              {trend.checkins.slice(0, 3).map((ci, i) => (
                <div key={ci.id} className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 rounded-full bg-ocean/20 relative"
                    style={{ height: `${Math.max(12, (ci.totalScore / 15) * 60)}px` }}
                  >
                    <div
                      className="absolute bottom-0 w-full rounded-full bg-ocean"
                      style={{ height: `${Math.max(4, (ci.totalScore / 15) * 100)}%` }}
                    />
                  </div>
                  <span className="font-sans text-[10px] text-slateMid">
                    {ci.totalScore}
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
            <div className="font-sans text-sm text-slate mt-1">
              Burnout risk: <span className={`font-semibold ${burnoutColor(trend.burnoutRisk)}`}>{trend.burnoutRisk}</span>
            </div>
          </div>
        )}

        {/* Burnout alert */}
        {trend?.burnoutRisk === "high" && (
          <div className="bg-coral/10 border-2 border-coral/30 rounded-[14px] px-5 py-4">
            <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-coral mb-2">
              Your Wellbeing Matters
            </div>
            <p className="font-sans text-sm text-slate leading-relaxed mb-3">
              Your responses indicate high burnout risk. Caregiver burnout is real and common &mdash;
              you are not failing. Getting support is a sign of strength.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/life-events?event=caregiver_burnout"
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
            <div className="bg-white border-2 border-ocean rounded-[14px] px-5 py-4">
              <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-3">
                How Are You Doing?
              </div>
              <p className="font-sans text-xs text-slateMid mb-4">
                Be honest &mdash; this is just for you. Think about the past 2 weeks.
              </p>

              <div className="flex flex-col gap-5">
                {WELLNESS_QUESTIONS.map((q) => (
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
                              ? "bg-ocean text-white border-ocean"
                              : "bg-white text-slate border-sandDark hover:border-ocean"
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
              <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-2">
                Additional Notes (Optional)
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything else on your mind..."
                className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white min-h-[70px] resize-y"
              />
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!allAnswered}
              className="w-full rounded-[12px] px-4 py-3.5 bg-ocean text-white font-sans text-sm font-semibold text-center hover:bg-ocean/90 transition-colors disabled:opacity-50"
            >
              Save Check-In
            </button>
          </>
        ) : (
          <div className="bg-ocean/10 border-2 border-ocean rounded-[14px] px-5 py-4 text-center">
            <div className="font-sans text-lg font-semibold text-ocean mb-1">
              Check-In Saved
            </div>
            <p className="font-sans text-sm text-slateMid">
              {trend?.burnoutRisk === "low" && "You're managing well. Keep it up, and check back in 2 weeks."}
              {trend?.burnoutRisk === "moderate" && "You're carrying a lot. Consider reaching out for support."}
              {trend?.burnoutRisk === "high" && "Please take care of yourself. See the resources below."}
            </p>
          </div>
        )}

        {/* Resources */}
        <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-3">
            Support Resources
          </div>
          <ul className="flex flex-col gap-3">
            <li>
              <a
                href="https://988lifeline.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm text-ocean font-semibold hover:underline"
              >
                988 Suicide & Crisis Lifeline &rarr;
              </a>
              <p className="font-sans text-xs text-slateMid mt-0.5">
                Call or text 988. Free, confidential, 24/7 support.
              </p>
            </li>
            <li>
              <a
                href="https://www.caregiver.org/support-groups"
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm text-ocean font-semibold hover:underline"
              >
                Caregiver Support Groups &rarr;
              </a>
              <p className="font-sans text-xs text-slateMid mt-0.5">
                Connect with other caregivers who understand what you&apos;re going through.
              </p>
            </li>
            <li>
              <a
                href="https://eldercare.acl.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm text-ocean font-semibold hover:underline"
              >
                Respite Care Finder &rarr;
              </a>
              <p className="font-sans text-xs text-slateMid mt-0.5">
                Find local respite care so you can take a break.
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
                Get personalized support and resource recommendations.
              </p>
            </li>
          </ul>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
