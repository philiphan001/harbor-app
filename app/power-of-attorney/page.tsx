"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getParentProfile } from "@/lib/utils/parentProfile";
import { gatherExportData, type ExportData } from "@/lib/utils/exportCareSummary";
import {
  getPoaFormInfo,
  isPoaStateSupported,
  getPoaFormComplexity,
} from "@/lib/data/statePoaForms";
import { US_STATES, normalizeStateCode } from "@/lib/constants/usStates";

const COMPLETION_CHECKLIST = [
  { id: "signed", label: "Signed by your parent" },
  { id: "witnessed", label: "Witnessed by required number of people" },
  { id: "notarized", label: "Notarized (required for financial POA)" },
  { id: "copy-agent", label: "Copy given to the agent (person managing finances)" },
  { id: "copy-bank", label: "Copy given to bank(s)" },
  { id: "copy-advisor", label: "Copy given to financial advisor (if applicable)" },
  { id: "original-stored", label: "Original stored in a safe, accessible place" },
  { id: "agent-access", label: "Agent has account access instructions" },
];

export default function PowerOfAttorneyPage() {
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

  const stateInfo = stateCode ? getPoaFormInfo(stateCode) : null;

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
    const key = "harbor_poa_complete";
    const existing = JSON.parse(localStorage.getItem(key) || "{}");
    existing[stateCode] = {
      completedAt: new Date().toISOString(),
      checklist: Array.from(checkedItems),
    };
    localStorage.setItem(key, JSON.stringify(existing));
    setMarkedComplete(true);
  };

  const complexity = stateCode ? getPoaFormComplexity(stateCode) : null;
  const isSupported = stateCode ? isPoaStateSupported(stateCode) : false;
  const stateName =
    US_STATES.find((s) => s.code === stateCode)?.name || stateCode;

  const pdfPath = stateInfo?.hostedPdfPath;

  // Build cheat sheet from Harbor data — financial-relevant info
  const insuranceProvider = exportData?.insurance?.provider;
  const insurancePolicyNum = exportData?.insurance?.policyNumber;
  const poaAgent =
    exportData?.legalDocuments?.find(
      (d) =>
        d.type.toLowerCase().includes("power of attorney") ||
        d.type.toLowerCase().includes("poa")
    )?.agent || null;

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-ocean to-[#145A6B] px-7 pt-10 pb-8">
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
            Durable Power of Attorney
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
          <div className="bg-white border-2 border-ocean rounded-[14px] px-5 py-4">
            <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-2">
              Select Your State
            </div>
            <p className="font-sans text-sm text-slateMid mb-3">
              Power of attorney forms are state-specific. Select your
              parent&apos;s state to get the right form and requirements.
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
            {/* What Is This? */}
            <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
              <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-2">
                What Is This?
              </div>
              <p className="font-sans text-sm text-slate leading-relaxed">
                A durable power of attorney (POA) is a legal document that lets
                your parent name someone to manage their{" "}
                <span className="font-semibold">financial affairs</span> —
                bank accounts, bills, property, taxes, and investments — if
                they become unable to do so themselves.
              </p>
              {stateInfo && (
                <p className="font-sans text-sm text-slateMid mt-2 leading-relaxed">
                  In {stateName}, this is called a{" "}
                  <span className="font-semibold text-slate">
                    {stateInfo.terminology}
                  </span>
                  .
                  {stateInfo.form && (
                    <>
                      {" "}
                      The form is {stateInfo.form.pageCount} pages and takes
                      about {stateInfo.estimatedCompletionTime} to complete.
                    </>
                  )}
                </p>
              )}
              {stateInfo && (
                <p className="font-sans text-xs text-slateMid mt-2 leading-relaxed">
                  <span className="font-semibold">Scope:</span>{" "}
                  {stateInfo.scopeNotes}
                </p>
              )}
              {complexity && (
                <div className="mt-3 flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      complexity === "easy"
                        ? "bg-sage"
                        : complexity === "moderate"
                        ? "bg-amber"
                        : "bg-coral"
                    }`}
                  />
                  <span className="font-sans text-xs text-slateMid">
                    {complexity === "easy"
                      ? "Straightforward — notary only"
                      : complexity === "moderate"
                      ? "Moderate — requires witnesses + notary"
                      : "Complex — consider professional help"}
                  </span>
                </div>
              )}
            </div>

            {/* What You'll Need */}
            {stateInfo && (
              <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
                <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-3">
                  What You&apos;ll Need
                </div>
                <ul className="flex flex-col gap-2.5">
                  <li className="font-sans text-sm text-slate flex items-start gap-2">
                    <span className="text-slateLight mt-px">&#9744;</span>
                    <span>
                      Parent&apos;s full legal name and date of birth
                    </span>
                  </li>
                  <li className="font-sans text-sm text-slate flex items-start gap-2">
                    <span className="text-slateLight mt-px">&#9744;</span>
                    <span>
                      Name and contact info for the agent (the person who will
                      manage finances)
                    </span>
                  </li>
                  <li className="font-sans text-sm text-slate flex items-start gap-2">
                    <span className="text-slateLight mt-px">&#9744;</span>
                    <span>
                      List of specific powers to grant (banking, real estate,
                      taxes, etc.)
                    </span>
                  </li>
                  <li className="font-sans text-sm text-slate flex items-start gap-2">
                    <span className="text-slateLight mt-px">&#9744;</span>
                    <span>
                      Financial institution information (bank names, account
                      numbers)
                    </span>
                  </li>
                  {stateInfo.requirements.witnessCount > 0 && (
                    <li className="font-sans text-sm text-slate flex items-start gap-2">
                      <span className="text-slateLight mt-px">&#9744;</span>
                      <span>
                        {stateInfo.requirements.witnessCount} witness
                        {stateInfo.requirements.witnessCount > 1 ? "es" : ""}
                        {stateInfo.requirements.witnessRestrictions.length >
                          0 && (
                          <span className="text-slateMid">
                            {" "}
                            (restrictions:{" "}
                            {stateInfo.requirements.witnessRestrictions
                              .slice(0, 2)
                              .join("; ")}
                            )
                          </span>
                        )}
                      </span>
                    </li>
                  )}
                  {stateInfo.requirements.notaryRequired && (
                    <li className="font-sans text-sm text-coral font-medium flex items-start gap-2">
                      <span className="mt-px">&#9744;</span>
                      <span>Notary public (required in {stateName})</span>
                    </li>
                  )}
                </ul>
                {stateInfo.durabilityOptions.length > 0 && (
                  <div className="mt-3 bg-ocean/5 rounded-lg px-3 py-2">
                    <div className="font-sans text-xs font-semibold text-ocean mb-1">
                      Durability Options
                    </div>
                    <ul className="flex flex-col gap-1">
                      {stateInfo.durabilityOptions.map((opt, i) => (
                        <li
                          key={i}
                          className="font-sans text-xs text-slateMid"
                        >
                          &bull; {opt}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Your Info From Harbor (Cheat Sheet) — Financial focus */}
            <div className="bg-ocean/5 border border-ocean/20 rounded-[14px] px-5 py-4">
              <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-3">
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
                  <span className="text-slateLight">Insurance: </span>
                  {insuranceProvider ? (
                    <span className="font-medium">
                      {insuranceProvider}
                      {insurancePolicyNum ? ` — #${insurancePolicyNum}` : ""}
                    </span>
                  ) : (
                    <span className="text-coral text-xs">
                      [not yet recorded]
                    </span>
                  )}
                </div>
                <div className="font-sans text-sm text-slate">
                  <span className="text-slateLight">POA Agent: </span>
                  {poaAgent ? (
                    <span className="font-medium">{poaAgent}</span>
                  ) : (
                    <span className="text-coral text-xs">
                      [not yet recorded]
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            {isSupported && pdfPath ? (
              <div className="flex flex-col gap-3">
                <a
                  href={pdfPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-[12px] px-4 py-3.5 bg-ocean text-white border-2 border-ocean font-sans text-sm font-semibold text-center hover:bg-ocean/90 transition-colors flex items-center justify-center gap-2"
                >
                  Open Form (PDF)
                </a>
                <a
                  href={pdfPath}
                  download={`${stateName.replace(/\s+/g, "_")}_Power_of_Attorney.pdf`}
                  className="w-full rounded-[12px] px-4 py-3.5 bg-white text-ocean border-2 border-ocean font-sans text-sm font-semibold text-center hover:bg-ocean/5 transition-colors flex items-center justify-center gap-2"
                >
                  Download Form
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="bg-amber/10 border border-amber/30 rounded-[14px] px-5 py-3">
                  <p className="font-sans text-sm text-slate">
                    We don&apos;t have the {stateName} POA form hosted yet.
                    We recommend using one of the online services below, or
                    consulting an elder law attorney.
                  </p>
                </div>
              </div>
            )}

            {/* After Completing Section */}
            <div className="bg-white border-2 border-sage rounded-[14px] px-5 py-4">
              <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-sage mb-3">
                After You Complete It
              </div>
              <ul className="flex flex-col gap-3">
                {COMPLETION_CHECKLIST.map((item) => {
                  const isWitness = item.id === "witnessed";
                  if (
                    isWitness &&
                    stateInfo &&
                    stateInfo.requirements.witnessCount === 0
                  ) {
                    return null;
                  }

                  const label =
                    item.id === "witnessed" && stateInfo
                      ? `Witnessed by ${stateInfo.requirements.witnessCount} people`
                      : item.label;

                  return (
                    <li key={item.id}>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checkedItems.has(item.id)}
                          onChange={() => toggleCheck(item.id)}
                          className="mt-0.5 w-4 h-4 rounded border-slateLight accent-sage flex-shrink-0"
                        />
                        <span
                          className={`font-sans text-sm ${
                            checkedItems.has(item.id)
                              ? "text-slateLight line-through"
                              : "text-slate"
                          }`}
                        >
                          {label}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>

              {!markedComplete ? (
                <button
                  onClick={handleMarkComplete}
                  className="w-full mt-4 rounded-[12px] px-4 py-3.5 bg-sage text-white border-2 border-sage font-sans text-sm font-semibold text-center hover:bg-sage/90 transition-colors"
                >
                  Mark as Complete
                </button>
              ) : (
                <div className="mt-4 rounded-[12px] px-4 py-3.5 bg-sage/10 border-2 border-sage text-center font-sans text-sm font-semibold text-sage">
                  Power of Attorney marked as complete
                </div>
              )}
            </div>

            {/* Common Pitfalls */}
            {stateInfo && stateInfo.commonPitfalls.length > 0 && (
              <div className="bg-coral/5 border border-coral/20 rounded-[14px] px-5 py-4">
                <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-coral mb-3">
                  Common Pitfalls
                </div>
                <ul className="flex flex-col gap-2">
                  {stateInfo.commonPitfalls.map((pitfall, i) => (
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
            )}

            {/* Need Help */}
            {stateInfo &&
              stateInfo.onlineServiceRecommendations.length > 0 && (
                <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
                  <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-3">
                    Need Help?
                  </div>
                  <p className="font-sans text-xs text-slateMid mb-3">
                    If the form feels overwhelming, these services can guide you
                    through it and handle notarization.
                  </p>
                  <div className="flex flex-col gap-3">
                    {stateInfo.onlineServiceRecommendations.map(
                      (service, i) => (
                        <a
                          key={i}
                          href={service.affiliateUrl || service.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-[10px] border border-sandDark px-4 py-3 hover:bg-sand/30 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-sans text-sm font-semibold text-slate">
                              {service.name}
                            </span>
                            <span className="font-sans text-xs text-ocean font-medium">
                              {service.cost}
                            </span>
                          </div>
                          <ul className="flex flex-col gap-0.5">
                            {service.features.slice(0, 3).map((f, j) => (
                              <li
                                key={j}
                                className="font-sans text-xs text-slateMid"
                              >
                                &bull; {f}
                              </li>
                            ))}
                          </ul>
                        </a>
                      )
                    )}
                  </div>
                </div>
              )}
          </>
        )}

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>
    </div>
  );
}
