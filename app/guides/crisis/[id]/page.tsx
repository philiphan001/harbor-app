"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CRISIS_PLAYBOOKS, type CrisisType } from "@/lib/data/crisisPlaybooks";
import Disclaimer from "@/components/Disclaimer";

export default function CrisisPlaybookPage() {
  const { id } = useParams<{ id: string }>();
  const playbook = CRISIS_PLAYBOOKS.find((pb) => pb.id === (id as CrisisType));
  const [checked, setChecked] = useState<Set<string>>(new Set());

  if (!playbook) {
    return (
      <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite items-center justify-center">
        <p className="font-sans text-sm text-slateMid">Playbook not found.</p>
        <Link href="/guides" className="font-sans text-sm text-ocean mt-2">
          &larr; Back to Guides
        </Link>
      </div>
    );
  }

  const toggle = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-coral to-[#B8443A] px-7 pt-10 pb-8">
        <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute -bottom-[30px] -left-5 w-[120px] h-[120px] rounded-full bg-white/[0.03] pointer-events-none" />
        <div className="relative">
          <Link
            href="/guides"
            className="inline-flex items-center gap-1 font-sans text-xs text-white/70 hover:text-white/90 transition-colors mb-3"
          >
            &larr; Guides
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{playbook.icon}</span>
            <h1 className="font-serif text-[24px] font-semibold text-white tracking-tight">
              {playbook.label}
            </h1>
          </div>
          <p className="font-sans text-sm text-white/80 mt-1">
            {playbook.description}
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-4">
        <Disclaimer type="emergency" />

        {playbook.sections.map((section) => (
          <div key={section.title} className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
            <div className="font-sans text-xs font-semibold tracking-[1px] uppercase text-coral mb-3">
              {section.title}
            </div>
            <ul className="flex flex-col gap-3">
              {section.steps.map((step) => {
                const key = `${playbook.id}-${section.title}-${step.text}`;
                const isChecked = checked.has(key);
                return (
                  <li
                    key={key}
                    className={step.urgent ? "border-l-[3px] border-coral pl-3" : ""}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(key)}
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

        <Link
          href="/crisis/triage"
          className="block w-full rounded-[12px] px-4 py-3.5 bg-sand/50 border border-sandDark text-center font-sans text-sm text-ocean font-semibold hover:bg-sand transition-colors"
        >
          In an emergency? Go to ER Triage Sheet &rarr;
        </Link>
      </div>
    </div>
  );
}
