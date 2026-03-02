"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getParentProfile } from "@/lib/utils/parentProfile";
import { gatherExportData, type ExportData } from "@/lib/utils/exportCareSummary";
import {
  getStateFormInfo,
  isStateSupported,
  getFormComplexity,
} from "@/lib/data/stateHealthcareProxyForms";
import { US_STATES, normalizeStateCode } from "@/lib/constants/usStates";

function getCaringInfoSlug(stateCode: string): string {
  const state = US_STATES.find((s) => s.code === stateCode);
  if (!state) return "";
  return state.name.toLowerCase().replace(/\s+/g, "-");
}

const COMPLETION_CHECKLIST = [
  { id: "signed", label: "Signed by your parent" },
  { id: "witnessed", label: "Witnessed by required number of people" },
  { id: "notarized", label: "Notarized (if required or recommended)" },
  { id: "copy-doctor", label: "Copy given to primary care doctor" },
  { id: "copy-agent", label: "Copy given to healthcare agent" },
  { id: "original-stored", label: "Original stored in a safe, accessible place" },
];

export default function AdvanceDirectivePage() {
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
        // Normalize to 2-letter code (handles profiles saved as "California" etc.)
        setStateCode(normalizeStateCode(profile.state) || profile.state);
      }
    }
    const data = gatherExportData();
    if (data) setExportData(data);
  }, []);

  const stateInfo = stateCode ? getStateFormInfo(stateCode) : null;

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
    // Save advance directive completion to localStorage
    const key = "harbor_advance_directive_complete";
    const existing = JSON.parse(localStorage.getItem(key) || "{}");
    existing[stateCode] = {
      completedAt: new Date().toISOString(),
      checklist: Array.from(checkedItems),
    };
    localStorage.setItem(key, JSON.stringify(existing));
    setMarkedComplete(true);
  };

  const complexity = stateCode ? getFormComplexity(stateCode) : null;
  const isSupported = stateCode ? isStateSupported(stateCode) : false;
  const stateName =
    US_STATES.find((s) => s.code === stateCode)?.name || stateCode;

  const pdfPath = stateInfo?.hostedPdfPath;
  const externalUrl =
    stateInfo?.caringInfoLandingUrl ||
    (stateCode
      ? `https://www.caringinfo.org/planning/advance-directives/by-state/${getCaringInfoSlug(stateCode)}/`
      : "");

  // Build cheat sheet from Harbor data
  const doctorName = exportData?.primaryDoctor?.name;
  const doctorPhone = exportData?.primaryDoctor?.phone;
  const agentName =
    exportData?.legalDocuments?.find(
      (d) =>
        d.type.toLowerCase().includes("proxy") ||
        d.type.toLowerCase().includes("power of attorney")
    )?.agent || null;
  const emergencyContacts = exportData?.emergencyContacts || [];

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-sage to-[#4A7350] px-7 pt-10 pb-8">
        <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute -bottom-[30px] -left-5 w-[120px] h-[120px] rounded-full bg-white/[0.03] pointer-events-none" />
        <div className="relative">
          <Link
            href="/guides"
            className="inline-flex items-center gap-1 font-sans text-xs text-white/70 hover:text-white/90 transition-colors mb-3"
          >
            &larr; Guides
          </Link>
          <h1 className="font-serif text-[26px] font-semibold text-white tracking-tight">
            Advance Health Care Directive
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
              Advance directive forms are state-specific. Select your
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
                An advance directive is a legal document that lets your parent
                name someone to make medical decisions if they can&apos;t speak
                for themselves, and express their wishes about end-of-life care.
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
                      ? "Simple form — good for DIY"
                      : complexity === "moderate"
                      ? "Moderate complexity"
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
                      Name and contact info for the healthcare agent (the person
                      who will make decisions)
                    </span>
                  </li>
                  <li className="font-sans text-sm text-slate flex items-start gap-2">
                    <span className="text-slateLight mt-px">&#9744;</span>
                    <span>Doctor&apos;s name and contact information</span>
                  </li>
                  <li className="font-sans text-sm text-slate flex items-start gap-2">
                    <span className="text-slateLight mt-px">&#9744;</span>
                    <span>
                      {stateInfo.requirements.witnessCount} witnesses
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
                  {stateInfo.requirements.notaryRequired && (
                    <li className="font-sans text-sm text-coral font-medium flex items-start gap-2">
                      <span className="mt-px">&#9744;</span>
                      <span>Notary public (required in {stateName})</span>
                    </li>
                  )}
                  {!stateInfo.requirements.notaryRequired &&
                    stateInfo.requirements.notaryRecommended && (
                      <li className="font-sans text-sm text-slate flex items-start gap-2">
                        <span className="text-slateLight mt-px">&#9744;</span>
                        <span>
                          Notary public (not required, but recommended)
                        </span>
                      </li>
                    )}
                </ul>
              </div>
            )}

            {/* Your Info From Harbor (Cheat Sheet) */}
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
                  <span className="text-slateLight">Doctor: </span>
                  {doctorName ? (
                    <span className="font-medium">
                      {doctorName}
                      {doctorPhone ? `, ${doctorPhone}` : ""}
                    </span>
                  ) : (
                    <span className="text-coral text-xs">[not yet recorded]</span>
                  )}
                </div>
                <div className="font-sans text-sm text-slate">
                  <span className="text-slateLight">Healthcare Agent: </span>
                  {agentName ? (
                    <span className="font-medium">{agentName}</span>
                  ) : (
                    <span className="text-coral text-xs">[not yet recorded]</span>
                  )}
                </div>
                {emergencyContacts.length > 0 && (
                  <div className="font-sans text-sm text-slate">
                    <span className="text-slateLight">
                      Emergency Contacts:{" "}
                    </span>
                    <span className="font-medium">
                      {emergencyContacts
                        .map(
                          (c) =>
                            `${c.name}${
                              c.relationship ? ` (${c.relationship})` : ""
                            } ${c.phone}`
                        )
                        .join("; ")}
                    </span>
                  </div>
                )}
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
                  download={`${stateName.replace(/\s+/g, "_")}_Advance_Directive.pdf`}
                  className="w-full rounded-[12px] px-4 py-3.5 bg-white text-ocean border-2 border-ocean font-sans text-sm font-semibold text-center hover:bg-ocean/5 transition-colors flex items-center justify-center gap-2"
                >
                  Download Form
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="bg-amber/10 border border-amber/30 rounded-[14px] px-5 py-3">
                  <p className="font-sans text-sm text-slate">
                    We don&apos;t have the {stateName} form hosted yet.
                    You can get it directly from CaringInfo (a service of the
                    National Hospice and Palliative Care Organization).
                  </p>
                </div>
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-[12px] px-4 py-3.5 bg-ocean text-white border-2 border-ocean font-sans text-sm font-semibold text-center hover:bg-ocean/90 transition-colors flex items-center justify-center gap-2"
                >
                  Get Form from CaringInfo &rarr;
                </a>
              </div>
            )}

            {/* After Completing Section */}
            <div className="bg-white border-2 border-sage rounded-[14px] px-5 py-4">
              <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-sage mb-3">
                After You Complete It
              </div>
              <ul className="flex flex-col gap-3">
                {COMPLETION_CHECKLIST.map((item) => {
                  // Adjust label for state-specific notary requirements
                  const isNotary = item.id === "notarized";
                  if (isNotary && stateInfo) {
                    if (
                      !stateInfo.requirements.notaryRequired &&
                      !stateInfo.requirements.notaryRecommended
                    ) {
                      return null; // Skip if not needed
                    }
                  }

                  // Adjust witness label
                  const label =
                    item.id === "witnessed" && stateInfo
                      ? `Witnessed by ${stateInfo.requirements.witnessCount} people`
                      : item.id === "notarized" && stateInfo
                      ? stateInfo.requirements.notaryRequired
                        ? "Notarized (required in your state)"
                        : "Notarized (recommended but not required)"
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

              {/* Mark as Complete */}
              {!markedComplete ? (
                <button
                  onClick={handleMarkComplete}
                  className="w-full mt-4 rounded-[12px] px-4 py-3.5 bg-sage text-white border-2 border-sage font-sans text-sm font-semibold text-center hover:bg-sage/90 transition-colors"
                >
                  Mark as Complete
                </button>
              ) : (
                <div className="mt-4 rounded-[12px] px-4 py-3.5 bg-sage/10 border-2 border-sage text-center font-sans text-sm font-semibold text-sage">
                  Advance directive marked as complete
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
                    through it.
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

            {/* Additional Forms */}
            {stateInfo &&
              stateInfo.additionalForms &&
              stateInfo.additionalForms.length > 0 && (
                <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
                  <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-3">
                    Additional Forms to Consider
                  </div>
                  <ul className="flex flex-col gap-2">
                    {stateInfo.additionalForms.map((form, i) => {
                      const isHipaa = form.name.toLowerCase().includes("hipaa");
                      return (
                        <li
                          key={i}
                          className="font-sans text-sm text-slate flex items-start gap-2"
                        >
                          <span className="text-ocean mt-0.5 flex-shrink-0">
                            {form.recommended ? "✓" : "○"}
                          </span>
                          <div>
                            {isHipaa ? (
                              <Link
                                href="/hipaa-authorization"
                                className="font-medium text-ocean hover:underline"
                              >
                                {form.name}
                              </Link>
                            ) : (
                              <span className="font-medium">{form.name}</span>
                            )}
                            <span className="text-slateMid">
                              {" "}
                              &mdash; {form.description}
                            </span>
                            {form.recommended && (
                              <span className="text-ocean text-xs ml-1">
                                {isHipaa ? (
                                  <Link href="/hipaa-authorization" className="hover:underline">
                                    Harbor has a guide →
                                  </Link>
                                ) : (
                                  "(recommended)"
                                )}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
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
