"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getParentProfile } from "@/lib/utils/parentProfile";
import {
  gatherExportData,
  exportAsText,
  type ExportData,
  type ExportSection,
} from "@/lib/utils/exportCareSummary";

const APPT_SECTIONS: ExportSection[] = [
  "patient-info",
  "medications",
  "conditions",
  "primary-doctor",
  "specialists",
  "insurance",
];

const DEFAULT_QUESTIONS = [
  "What are the results from my last visit/tests?",
  "Do I need any medication changes?",
  "Are there any screenings or preventive tests I should schedule?",
  "What symptoms should I watch for?",
];

export default function AppointmentPrepPage() {
  const [data, setData] = useState<ExportData | null>(null);
  const [parentName, setParentName] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [questions, setQuestions] = useState<string[]>(DEFAULT_QUESTIONS);
  const [newQuestion, setNewQuestion] = useState("");

  useEffect(() => {
    const profile = getParentProfile();
    if (profile) setParentName(profile.name);

    const exportData = gatherExportData();
    setData(exportData);
  }, []);

  const buildFullText = () => {
    if (!data) return "";
    const base = exportAsText(data, APPT_SECTIONS);
    const qSection = "\n\nQUESTIONS TO ASK\n" + questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
    return base + qSection;
  };

  const handleCopy = async () => {
    const text = buildFullText();
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setQuestions((prev) => [...prev, newQuestion.trim()]);
      setNewQuestion("");
    }
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const now = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-sage to-[#4A7050] px-7 pt-10 pb-8">
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
            Appointment Prep Sheet
          </h1>
          {parentName && (
            <div className="font-sans text-sm text-white/80 mt-1">{parentName}</div>
          )}
          <div className="font-sans text-xs text-white/60 mt-1">{now}</div>
        </div>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-4">
        {/* Medications Card */}
        <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1px] uppercase text-ocean mb-3">
            {"\ud83d\udc8a"} Current Medications
          </div>
          {data && data.medications.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {data.medications.map((med, i) => (
                <li key={i} className="font-sans text-sm text-slate">
                  <span className="font-semibold">{med.name}</span>
                  {med.dosage && <span className="text-slateMid"> — {med.dosage}</span>}
                  {med.frequency && <span className="text-slateLight"> ({med.frequency})</span>}
                </li>
              ))}
            </ul>
          ) : (
            <div className="font-sans text-sm text-slateMid">No medications recorded</div>
          )}
        </div>

        {/* Conditions Card */}
        <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1px] uppercase text-ocean mb-3">
            {"\ud83e\ude7a"} Health Conditions
          </div>
          {data && data.conditions.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {data.conditions.map((cond, i) => (
                <li key={i} className="font-sans text-sm text-slate">{"\u2022"} {cond}</li>
              ))}
            </ul>
          ) : (
            <div className="font-sans text-sm text-slateMid">No conditions recorded</div>
          )}
        </div>

        {/* Doctors Card */}
        <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1px] uppercase text-ocean mb-3">
            {"\ud83d\udc68\u200d\u2695\ufe0f"} Doctors
          </div>
          {data?.primaryDoctor ? (
            <div className="flex flex-col gap-3">
              <div>
                <div className="font-sans text-xs text-slateLight uppercase tracking-wide mb-1">Primary Care</div>
                <div className="font-sans text-sm text-slate font-semibold">{data.primaryDoctor.name}</div>
                <a href={`tel:${data.primaryDoctor.phone}`} className="font-sans text-sm text-ocean underline">{data.primaryDoctor.phone}</a>
              </div>
              {data.specialists.length > 0 && (
                <div>
                  <div className="font-sans text-xs text-slateLight uppercase tracking-wide mb-1">Specialists</div>
                  {data.specialists.map((spec, i) => (
                    <div key={i} className="font-sans text-sm text-slate mb-1">
                      <span className="font-semibold">{spec.name}</span>
                      {spec.specialty && <span className="text-slateMid"> ({spec.specialty})</span>}
                      {spec.phone && (
                        <>
                          {" — "}
                          <a href={`tel:${spec.phone}`} className="text-ocean underline">{spec.phone}</a>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="font-sans text-sm text-slateMid">No doctors recorded</div>
          )}
        </div>

        {/* Insurance Card */}
        <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1px] uppercase text-ocean mb-3">
            {"\ud83c\udfe5"} Insurance
          </div>
          {data?.insurance ? (
            <div className="flex flex-col gap-1.5 font-sans text-sm">
              <div className="text-slate"><span className="text-slateLight">Provider:</span> {data.insurance.provider}</div>
              <div className="text-slate"><span className="text-slateLight">Policy #:</span> {data.insurance.policyNumber}</div>
              {data.insurance.groupNumber && (
                <div className="text-slate"><span className="text-slateLight">Group #:</span> {data.insurance.groupNumber}</div>
              )}
            </div>
          ) : (
            <div className="font-sans text-sm text-slateMid">Insurance not recorded</div>
          )}
        </div>

        {/* Questions to Ask */}
        <div className="bg-white border-2 border-sage rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-sage mb-3">
            Questions to Ask
          </div>
          <ul className="flex flex-col gap-2 mb-3">
            {questions.map((q, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-sans text-sm text-slate flex-1">{i + 1}. {q}</span>
                <button
                  onClick={() => removeQuestion(i)}
                  className="text-slateLight hover:text-coral text-xs mt-0.5 flex-shrink-0"
                >
                  {"\u00d7"}
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addQuestion()}
              placeholder="Add a question..."
              className="flex-1 font-sans text-sm border border-sandDark rounded-lg px-3 py-2 bg-warmWhite focus:outline-none focus:border-sage"
            />
            <button
              onClick={addQuestion}
              className="font-sans text-sm font-semibold text-sage px-3 py-2 hover:bg-sage/10 rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className={`flex-1 rounded-[12px] px-4 py-3.5 flex items-center justify-center gap-2 transition-all font-sans text-sm font-semibold ${
              copySuccess
                ? "bg-sage/20 border-2 border-sage text-sage"
                : "bg-ocean text-white border-2 border-ocean hover:bg-ocean/90"
            }`}
          >
            {copySuccess ? (
              <><span>{"\u2713"}</span><span>Copied!</span></>
            ) : (
              <><span>{"\ud83d\udccb"}</span><span>Copy</span></>
            )}
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 rounded-[12px] px-4 py-3.5 flex items-center justify-center gap-2 transition-all font-sans text-sm font-semibold bg-sand/50 border-2 border-sandDark text-slate hover:bg-sand"
          >
            <span>{"\ud83d\udda8\ufe0f"}</span>
            <span>Print</span>
          </button>
        </div>

        {/* Email CTA */}
        {data && (
          <a
            href={`mailto:?subject=${encodeURIComponent(`Appointment Prep — ${data.parentName}`)}&body=${encodeURIComponent(buildFullText())}`}
            className="block w-full rounded-[12px] px-4 py-3.5 bg-sand/50 border border-sandDark text-center font-sans text-sm text-ocean font-semibold hover:bg-sand transition-colors"
          >
            Email to self &rarr;
          </a>
        )}
      </div>
    </div>
  );
}
