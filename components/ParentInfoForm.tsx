"use client";

import { useState } from "react";
import { saveParentProfile } from "@/lib/utils/parentProfile";
import { US_STATES } from "@/lib/constants/usStates";

interface ParentInfoFormProps {
  onComplete: () => void;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
}

export default function ParentInfoForm({
  onComplete,
  onBack,
  title = "First, tell us about your parent",
  subtitle = "This helps us personalize the assessment and your action plan.",
  submitLabel = "Start Assessment",
}: ParentInfoFormProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const canContinue = name.trim().length > 0 && age.trim().length > 0;

  const handleSubmit = () => {
    if (!canContinue) return;

    saveParentProfile({
      name: name.trim(),
      age: parseInt(age, 10) || undefined,
      state: state || undefined,
      zip: zip.trim() || undefined,
    });

    console.log("Parent profile created:", name.trim(), age);
    onComplete();
  };

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-ocean to-[#164F5C] px-7 pt-10 pb-8 overflow-hidden">
        <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute -bottom-[30px] -left-5 w-[120px] h-[120px] rounded-full bg-white/[0.03] pointer-events-none" />

        <div className="relative">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-sans mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}

          <h1 className="font-serif text-[28px] font-semibold text-white tracking-tight mb-3 leading-tight">
            {title}
          </h1>
          <p className="font-sans text-[14px] text-white/80 leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 py-8">
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block font-sans text-sm font-semibold text-slate mb-2">
              Parent&apos;s first name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mary"
              className="w-full px-4 py-3 rounded-xl border-2 border-sandDark bg-white font-sans text-sm text-slate placeholder:text-slateLight focus:outline-none focus:border-ocean transition-colors"
              autoFocus
            />
          </div>

          {/* Age */}
          <div>
            <label className="block font-sans text-sm font-semibold text-slate mb-2">
              Age
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 82"
              min="50"
              max="120"
              className="w-full px-4 py-3 rounded-xl border-2 border-sandDark bg-white font-sans text-sm text-slate placeholder:text-slateLight focus:outline-none focus:border-ocean transition-colors"
            />
          </div>

          {/* State */}
          <div>
            <label className="block font-sans text-sm font-semibold text-slate mb-1">
              State
            </label>
            <div className="font-sans text-xs text-slateMid mb-2">
              Used for state-specific programs like Medicaid, PACE, and pharmaceutical assistance
            </div>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-sandDark bg-white font-sans text-sm text-slate focus:outline-none focus:border-ocean transition-colors"
            >
              <option value="">Select a state...</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* ZIP Code */}
          <div>
            <label className="block font-sans text-sm font-semibold text-slate mb-1">
              ZIP Code
            </label>
            <div className="font-sans text-xs text-slateMid mb-2">
              Used for local housing costs, transportation options, and nearby services
            </div>
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="e.g. 33601"
              maxLength={10}
              className="w-full px-4 py-3 rounded-xl border-2 border-sandDark bg-white font-sans text-sm text-slate placeholder:text-slateLight focus:outline-none focus:border-ocean transition-colors"
            />
          </div>
        </div>

        {/* Continue button */}
        <button
          onClick={handleSubmit}
          disabled={!canContinue}
          className={`w-full mt-8 rounded-xl px-6 py-4 font-sans text-base font-semibold transition-colors ${
            canContinue
              ? "bg-ocean text-white hover:bg-oceanMid"
              : "bg-sandDark text-slateLight cursor-not-allowed"
          }`}
        >
          {submitLabel}
        </button>

        <div className="mt-4 text-center">
          <div className="font-sans text-xs text-slateMid">
            We never share your information. It stays in your account.
          </div>
        </div>
      </div>
    </div>
  );
}
