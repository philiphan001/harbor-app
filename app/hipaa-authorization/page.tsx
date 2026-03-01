"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getParentProfile } from "@/lib/utils/parentProfile";
import { gatherExportData, type ExportData } from "@/lib/utils/exportCareSummary";
import { US_STATES, normalizeStateCode } from "@/lib/constants/usStates";
import {
  HIPAA_FORM,
  HIPAA_COMPLETION_CHECKLIST,
  HIPAA_PITFALLS,
  HIPAA_ONLINE_SERVICES,
  getStateHipaaNote,
} from "@/lib/data/hipaaFormData";

export default function HipaaAuthorizationPage() {
  const [stateCode, setStateCode] = useState<string>("");
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [parentName, setParentName] = useState("");
  const [parentAge, setParentAge] = useState<number | undefined>();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [markedComplete, setMarkedComplete] = useState(false);

  useEffect(() => {
    const profile = getParentProfile();
    if (profile) {
      setParentName(profile.name);
      setParentAge(profile.age);
      if (profile.state) {
        setStateCode(normalizeStateCode(profile.state) || profile.state);
      }
    }
    const data = gatherExportData();
    if (data) setExportData(data);
  }, []);

  const stateName =
    US_STATES.find((s) => s.code === stateCode)?.name || stateCode;

  const hipaaNote = stateCode ? getStateHipaaNote(stateCode) : null;

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMarkComplete = () => {
    if (typeof window === "undefined") return;
    const key = "harbor_hipaa_complete";
    const existing = JSON.parse(localStorage.getItem(key) || "{}");
    existing[stateCode || "federal"] = {
      completedAt: new Date().toISOString(),
      checklist: Array.from(checkedItems),
    };
    localStorage.setItem(key, JSON.stringify(existing));
    setMarkedComplete(true);
  };

  // Build cheat sheet from Harbor data
  const doctorName = exportData?.primaryDoctor?.name;
  const doctorPhone = exportData?.primaryDoctor?.phone;
  const agentName =
    exportData?.legalDocuments?.find(
      (d) =>
        d.type.toLowerCase().includes("proxy") ||
        d.type.toLowerCase().includes("power of attorney")
    )?.agent || null;

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-amber to-[#A87828] px-7 pt-10 pb-8">
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
            HIPAA Authorization
          </h1>
          {parentName && (
            <div className="font-sans text-sm text-white/80 mt-1">
              For {parentName}
              {parentAge ? `, age ${parentAge}` : ""}
              {stateCode ? ` \u00B7 ${stateName}` : ""}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-4">
        {/* State Selector (if no state set) */}
        {!stateCode && (
          <div className="bg-white border-2 border-amber rounded-[14px] px-5 py-4">
            <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-amber mb-2">
              Select Your State
            </div>
            <p className="font-sans text-sm text-slateMid mb-3">
              HIPAA is a federal form (the same in every state), but selecting
              your state lets us check if your advance directive already
              includes HIPAA language.
            </p>
            <select
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              className="w-full rounded-[10px] border border-sandDark px-3 py-2.5 font-sans text-sm text-slate bg-white"
            >
              <option value="">Choose a state...</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* State override selector when state is already set */}
        {stateCode && (
          <div className="flex items-center gap-2">
            <span className="font-sans text-xs text-slateLight">State:</span>
            <select
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              className="rounded-[8px] border border-sandDark px-2 py-1 font-sans text-xs text-slate bg-white"
            >
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {stateCode && (
          <>
            {/* State-specific HIPAA note (good-news banner) */}
            {hipaaNote && (
              <div className="bg-sage/10 border border-sage/30 rounded-[14px] px-5 py-4">
                <div className="flex items-start gap-2">
                  <span className="text-sage mt-0.5 flex-shrink-0 text-lg">&#10003;</span>
                  <p className="font-sans text-sm text-slate leading-relaxed">
                    {hipaaNote}
                  </p>
                </div>
              </div>
            )}

            {/* What Is This? */}
            <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
              <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-amber mb-2">
                What Is This?
              </div>
              <p className="font-sans text-sm text-slate leading-relaxed">
                A HIPAA authorization lets you access your parent&apos;s medical
                records and speak with their healthcare providers on their
                behalf. Without it, doctors and hospitals are legally prohibited
                from sharing medical information with you — even in an
                emergency.
              </p>
              <p className="font-sans text-sm text-slateMid mt-2 leading-relaxed">
                HIPAA is a federal law, so the form is the same in every state.
                It typically takes {HIPAA_FORM.estimatedCompletionTime} to
                complete.
              </p>
            </div>

            {/* What You'll Need */}
            <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
              <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-amber mb-3">
                What You&apos;ll Need
              </div>
              <ul className="flex flex-col gap-2.5">
                <li className="font-sans text-sm text-slate flex items-start gap-2">
                  <span className="text-slateLight mt-px">&#9744;</span>
                  <span>Parent&apos;s full legal name and date of birth</span>
                </li>
                <li className="font-sans text-sm text-slate flex items-start gap-2">
                  <span className="text-slateLight mt-px">&#9744;</span>
                  <span>Your full name (the person being authorized)</span>
                </li>
                <li className="font-sans text-sm text-slate flex items-start gap-2">
                  <span className="text-slateLight mt-px">&#9744;</span>
                  <span>
                    Names and addresses of each healthcare provider to receive a
                    copy
                  </span>
                </li>
                <li className="font-sans text-sm text-slate flex items-start gap-2">
                  <span className="text-slateLight mt-px">&#9744;</span>
                  <span>Parent&apos;s signature (they must sign it themselves)</span>
                </li>
              </ul>
              <div className="mt-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sage" />
                <span className="font-sans text-xs text-slateMid">
                  No notary or witnesses needed
                </span>
              </div>
            </div>

            {/* Your Info From Harbor (Cheat Sheet) */}
            <div className="bg-amber/5 border border-amber/20 rounded-[14px] px-5 py-4">
              <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-amber mb-3">
                Your Info From Harbor
              </div>
              <p className="font-sans text-xs text-slateMid mb-3">
                Copy this info when filling out the form.
              </p>
              <div className="flex flex-col gap-2">
                <div className="font-sans text-sm text-slate">
                  <span className="text-slateLight">Parent: </span>
                  <span className="font-medium">
                    {parentName || "Not recorded"}
                    {parentAge ? `, age ${parentAge}` : ""}
                  </span>
                </div>
                <div className="font-sans text-sm text-slate">
                  <span className="text-slateLight">Primary Doctor: </span>
                  {doctorName ? (
                    <span className="font-medium">
                      {doctorName}
                      {doctorPhone ? `, ${doctorPhone}` : ""}
                    </span>
                  ) : (
                    <span className="text-coral text-xs">
                      [not yet recorded]
                    </span>
                  )}
                </div>
                <div className="font-sans text-sm text-slate">
                  <span className="text-slateLight">Healthcare Agent: </span>
                  {agentName ? (
                    <span className="font-medium">{agentName}</span>
                  ) : (
                    <span className="text-coral text-xs">
                      [not yet recorded]
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col gap-3">
              <a
                href={HIPAA_FORM.pdfPath}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-[12px] px-4 py-3.5 bg-amber text-white border-2 border-amber font-sans text-sm font-semibold text-center hover:bg-amber/90 transition-colors flex items-center justify-center gap-2"
              >
                Open Form (PDF)
              </a>
              <a
                href={HIPAA_FORM.pdfPath}
                download={HIPAA_FORM.downloadFileName}
                className="w-full rounded-[12px] px-4 py-3.5 bg-white text-amber border-2 border-amber font-sans text-sm font-semibold text-center hover:bg-amber/5 transition-colors flex items-center justify-center gap-2"
              >
                Download Form
              </a>
            </div>

            {/* Completion Checklist */}
            <div className="bg-white border-2 border-amber rounded-[14px] px-5 py-4">
              <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-amber mb-3">
                After You Complete It
              </div>
              <ul className="flex flex-col gap-3">
                {HIPAA_COMPLETION_CHECKLIST.map((item) => (
                  <li key={item.id}>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checkedItems.has(item.id)}
                        onChange={() => toggleCheck(item.id)}
                        className="mt-0.5 w-4 h-4 rounded border-slateLight accent-amber flex-shrink-0"
                      />
                      <span
                        className={`font-sans text-sm ${
                          checkedItems.has(item.id)
                            ? "text-slateLight line-through"
                            : "text-slate"
                        }`}
                      >
                        {item.label}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>

              {/* Mark as Complete */}
              {!markedComplete ? (
                <button
                  onClick={handleMarkComplete}
                  className="w-full mt-4 rounded-[12px] px-4 py-3.5 bg-amber text-white border-2 border-amber font-sans text-sm font-semibold text-center hover:bg-amber/90 transition-colors"
                >
                  Mark as Complete
                </button>
              ) : (
                <div className="mt-4 rounded-[12px] px-4 py-3.5 bg-amber/10 border-2 border-amber text-center font-sans text-sm font-semibold text-amber">
                  HIPAA authorization marked as complete
                </div>
              )}
            </div>

            {/* Common Pitfalls */}
            <div className="bg-coral/5 border border-coral/20 rounded-[14px] px-5 py-4">
              <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-coral mb-3">
                Common Pitfalls
              </div>
              <ul className="flex flex-col gap-2">
                {HIPAA_PITFALLS.map((pitfall, i) => (
                  <li
                    key={i}
                    className="font-sans text-sm text-slate flex items-start gap-2"
                  >
                    <span className="text-coral mt-0.5 flex-shrink-0">
                      &#x26A0;
                    </span>
                    <span>{pitfall}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Need Help */}
            <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
              <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-amber mb-3">
                Need Help?
              </div>
              <p className="font-sans text-xs text-slateMid mb-3">
                If you&apos;d prefer a guided experience, these services can
                help.
              </p>
              <div className="flex flex-col gap-3">
                {HIPAA_ONLINE_SERVICES.map((service, i) => (
                  <a
                    key={i}
                    href={service.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-[10px] border border-sandDark px-4 py-3 hover:bg-sand/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-sans text-sm font-semibold text-slate">
                        {service.name}
                      </span>
                      <span className="font-sans text-xs text-amber font-medium">
                        {service.cost}
                      </span>
                    </div>
                    <ul className="flex flex-col gap-0.5">
                      {service.features.map((f, j) => (
                        <li
                          key={j}
                          className="font-sans text-xs text-slateMid"
                        >
                          &bull; {f}
                        </li>
                      ))}
                    </ul>
                  </a>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>
    </div>
  );
}
