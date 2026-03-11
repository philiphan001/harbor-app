"use client";

import { useState } from "react";
import Link from "next/link";
import {
  type ExportData,
  type ExportSection,
  exportAsText,
} from "@/lib/utils/exportCareSummary";
import { CRISIS_PLAYBOOKS, type CrisisType } from "@/lib/data/crisisPlaybooks";

const ER_SECTIONS: ExportSection[] = [
  "patient-info",
  "medications",
  "conditions",
  "insurance",
  "primary-doctor",
  "emergency-contacts",
  "legal",
];

const CHECKLIST_ITEMS = [
  "Hand medication list to admitting nurse",
  "Show insurance card / provide policy number",
  "Ask who the attending physician is",
  "Call parent's primary care doctor to notify",
  "Ask about expected timeline and next steps",
  "Notify family members",
];

interface OverviewTabProps {
  data: ExportData | null;
  criticalGaps: string[];
}

export default function OverviewTab({ data, criticalGaps }: OverviewTabProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [selectedPlaybook, setSelectedPlaybook] = useState<CrisisType | null>(null);
  const [checkedPlaybookSteps, setCheckedPlaybookSteps] = useState<Set<string>>(new Set());

  const handleCopy = async () => {
    if (!data) return;
    const text = exportAsText(data, ER_SECTIONS);
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

  const toggleChecklist = (item: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const togglePlaybookStep = (key: string) => {
    setCheckedPlaybookSteps((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const activePlaybook = selectedPlaybook
    ? CRISIS_PLAYBOOKS.find((p) => p.id === selectedPlaybook)
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Critical Gaps Banner */}
      {criticalGaps.length > 0 && (
        <div className="bg-coral/10 border-2 border-coral rounded-[14px] px-5 py-4">
          <div className="font-sans text-xs font-semibold tracking-[1px] uppercase text-coral mb-2">
            Missing Information
          </div>
          <ul className="flex flex-col gap-1.5">
            {criticalGaps.map((gap) => (
              <li key={gap} className="font-sans text-sm text-coral flex items-start gap-2">
                <span className="mt-0.5">{"\u26a0"}</span>
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Medications Card */}
      <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
        <div className="font-sans text-xs font-semibold tracking-[1px] uppercase text-ocean mb-3">
          {"\ud83d\udc8a"} Medications
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
          <div className="font-sans text-sm text-coral">No medications recorded</div>
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
            {data.insurance.phone && (
              <div className="text-slate">
                <span className="text-slateLight">Phone:</span>{" "}
                <a href={`tel:${data.insurance.phone}`} className="text-ocean underline">{data.insurance.phone}</a>
              </div>
            )}
          </div>
        ) : (
          <div className="font-sans text-sm text-coral">Insurance not recorded</div>
        )}
      </div>

      {/* Doctor Card */}
      <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
        <div className="font-sans text-xs font-semibold tracking-[1px] uppercase text-ocean mb-3">
          {"\ud83d\udc68\u200d\u2695\ufe0f"} Primary Care Doctor
        </div>
        {data?.primaryDoctor ? (
          <div className="flex flex-col gap-1.5 font-sans text-sm">
            <div className="text-slate font-semibold">{data.primaryDoctor.name}</div>
            <div className="text-slate">
              <a href={`tel:${data.primaryDoctor.phone}`} className="text-ocean underline">{data.primaryDoctor.phone}</a>
            </div>
            {data.primaryDoctor.address && (
              <div className="text-slateMid text-xs">{data.primaryDoctor.address}</div>
            )}
          </div>
        ) : (
          <div className="font-sans text-sm text-coral">Doctor not recorded</div>
        )}
      </div>

      {/* Legal Docs Card */}
      <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
        <div className="font-sans text-xs font-semibold tracking-[1px] uppercase text-ocean mb-3">
          {"\ud83d\udcd1"} Legal Documents
        </div>
        {data && data.legalDocuments.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {data.legalDocuments.map((doc, i) => (
              <li key={i} className="font-sans text-sm text-slate">
                <span className="font-semibold">{doc.type}</span>
                <span className="text-slateMid"> — {doc.status}</span>
                {doc.agent && <span className="text-slateLight"> (Agent: {doc.agent})</span>}
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="font-sans text-sm text-coral">No legal documents recorded</div>
            <Link
              href="/advance-directives"
              className="font-sans text-xs text-ocean font-semibold hover:underline"
            >
              Create an advance directive &rarr;
            </Link>
          </div>
        )}
      </div>

      {/* Emergency Contacts Card */}
      <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
        <div className="font-sans text-xs font-semibold tracking-[1px] uppercase text-ocean mb-3">
          {"\ud83d\udcde"} Emergency Contacts
        </div>
        {data && data.emergencyContacts.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {data.emergencyContacts.map((contact, i) => (
              <li key={i} className="font-sans text-sm text-slate flex items-center justify-between">
                <div>
                  <span className="font-semibold">{contact.name}</span>
                  {contact.relationship && <span className="text-slateLight"> ({contact.relationship})</span>}
                </div>
                <a href={`tel:${contact.phone}`} className="text-ocean underline text-sm">{contact.phone}</a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="font-sans text-sm text-coral">No emergency contacts recorded</div>
        )}
      </div>

      {/* Copy ER Handoff Sheet Button */}
      <button
        onClick={handleCopy}
        className={`w-full rounded-[12px] px-4 py-3.5 flex items-center justify-center gap-2 transition-all font-sans text-sm font-semibold ${
          copySuccess
            ? "bg-sage/20 border-2 border-sage text-sage"
            : "bg-ocean text-white border-2 border-ocean hover:bg-ocean/90"
        }`}
      >
        {copySuccess ? (
          <>
            <span>{"\u2713"}</span>
            <span>Copied!</span>
          </>
        ) : (
          <>
            <span>{"\ud83d\udccb"}</span>
            <span>Copy ER Handoff Sheet</span>
          </>
        )}
      </button>

      {/* What to Do Right Now Checklist */}
      <div className="bg-white border-2 border-ocean rounded-[14px] px-5 py-4">
        <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-3">
          What to Do Right Now
        </div>
        <ul className="flex flex-col gap-3">
          {CHECKLIST_ITEMS.map((item) => (
            <li key={item}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkedItems.has(item)}
                  onChange={() => toggleChecklist(item)}
                  className="mt-0.5 w-4 h-4 rounded border-slateLight accent-ocean flex-shrink-0"
                />
                <span
                  className={`font-sans text-sm ${
                    checkedItems.has(item) ? "text-slateLight line-through" : "text-slate"
                  }`}
                >
                  {item}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Crisis Playbooks */}
      <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-slateLight mt-2 mb-1">
        Crisis Playbooks
      </div>
      <div className="grid grid-cols-2 gap-3">
        {CRISIS_PLAYBOOKS.map((playbook) => (
          <button
            key={playbook.id}
            onClick={() =>
              setSelectedPlaybook(selectedPlaybook === playbook.id ? null : playbook.id)
            }
            className={`rounded-[14px] px-4 py-3.5 text-left transition-all ${
              selectedPlaybook === playbook.id
                ? "bg-ocean/10 border-2 border-ocean"
                : "bg-white border border-sandDark hover:scale-[1.01]"
            }`}
          >
            <div className="text-xl mb-1.5">{playbook.icon}</div>
            <div className="font-sans text-xs font-semibold text-slate">{playbook.label}</div>
          </button>
        ))}
      </div>

      {/* Playbook View */}
      {activePlaybook && (
        <div className="flex flex-col gap-4 mt-1">
          <div className="font-sans text-sm text-slateMid">{activePlaybook.description}</div>
          {activePlaybook.sections.map((section) => (
            <div key={section.title} className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
              <div className="font-sans text-xs font-semibold tracking-[1px] uppercase text-ocean mb-3">
                {section.title}
              </div>
              <ul className="flex flex-col gap-3">
                {section.steps.map((step) => {
                  const key = `${activePlaybook.id}-${section.title}-${step.text}`;
                  const isChecked = checkedPlaybookSteps.has(key);
                  return (
                    <li
                      key={key}
                      className={`${step.urgent ? "border-l-[3px] border-coral pl-3" : ""}`}
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePlaybookStep(key)}
                          className="mt-0.5 w-4 h-4 rounded border-slateLight accent-ocean flex-shrink-0"
                        />
                        <div>
                          <span
                            className={`font-sans text-sm ${
                              isChecked ? "text-slateLight line-through" : "text-slate font-medium"
                            }`}
                          >
                            {step.text}
                          </span>
                          {step.detail && (
                            <div className="font-sans text-xs text-slateMid mt-0.5">
                              {step.detail}
                            </div>
                          )}
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
