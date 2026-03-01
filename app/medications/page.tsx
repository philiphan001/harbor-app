"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getParentProfile } from "@/lib/utils/parentProfile";
import { getEnrichedMedications, type EnrichedMedication } from "@/lib/utils/medicationHelpers";

type SortMode = "name" | "urgency";

export default function MedicationsPage() {
  const [medications, setMedications] = useState<EnrichedMedication[]>([]);
  const [parentName, setParentName] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("urgency");

  useEffect(() => {
    const profile = getParentProfile();
    if (profile) setParentName(profile.name);

    const meds = getEnrichedMedications();
    setMedications(meds);
  }, []);

  const sorted = [...medications].sort((a, b) => {
    if (sortMode === "name") {
      return a.name.localeCompare(b.name);
    }
    // Sort by urgency: empty > low > unknown > ok
    const urgencyOrder: Record<string, number> = { empty: 0, low: 1, unknown: 2, ok: 3 };
    return (urgencyOrder[a.refillStatus] ?? 2) - (urgencyOrder[b.refillStatus] ?? 2);
  });

  const refillBadge = (status: EnrichedMedication["refillStatus"]) => {
    switch (status) {
      case "empty":
        return (
          <span className="inline-flex items-center gap-1 bg-coral/15 text-coral text-[10px] font-semibold px-2 py-0.5 rounded-full">
            No refills
          </span>
        );
      case "low":
        return (
          <span className="inline-flex items-center gap-1 bg-amber/15 text-amber text-[10px] font-semibold px-2 py-0.5 rounded-full">
            Low refills
          </span>
        );
      case "ok":
        return (
          <span className="inline-flex items-center gap-1 bg-sage/15 text-sage text-[10px] font-semibold px-2 py-0.5 rounded-full">
            OK
          </span>
        );
      default:
        return null;
    }
  };

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
            Medications
          </h1>
          {parentName && (
            <div className="font-sans text-sm text-white/80 mt-1">{parentName}</div>
          )}
        </div>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-4">
        {/* Sort + Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setSortMode("urgency")}
              className={`font-sans text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors ${
                sortMode === "urgency"
                  ? "bg-ocean/15 text-ocean"
                  : "bg-sand/50 text-slateMid hover:bg-sand"
              }`}
            >
              By urgency
            </button>
            <button
              onClick={() => setSortMode("name")}
              className={`font-sans text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors ${
                sortMode === "name"
                  ? "bg-ocean/15 text-ocean"
                  : "bg-sand/50 text-slateMid hover:bg-sand"
              }`}
            >
              By name
            </button>
          </div>
          <Link
            href="/upload"
            className="font-sans text-[11px] font-semibold text-ocean hover:underline"
          >
            + Upload Rx
          </Link>
        </div>

        {/* Medication List */}
        {sorted.length > 0 ? (
          <div className="flex flex-col gap-3">
            {sorted.map((med) => (
              <div
                key={med.name}
                className="bg-white border border-sandDark rounded-[14px] px-5 py-4"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="font-sans text-sm font-semibold text-slate">{med.name}</div>
                  {refillBadge(med.refillStatus)}
                </div>

                {med.dosage && (
                  <div className="font-sans text-xs text-slateMid mb-0.5">
                    {med.dosage}{med.frequency ? ` — ${med.frequency}` : ""}
                  </div>
                )}

                {med.purpose && (
                  <div className="font-sans text-xs text-slateLight mb-1">
                    For: {med.purpose}
                  </div>
                )}

                {/* Extended details */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {med.prescriber && (
                    <div className="font-sans text-[10px] text-slateMid">
                      <span className="text-slateLight">Prescriber:</span> {med.prescriber}
                    </div>
                  )}
                  {med.pharmacy && (
                    <div className="font-sans text-[10px] text-slateMid">
                      <span className="text-slateLight">Pharmacy:</span> {med.pharmacy}
                    </div>
                  )}
                  {med.rxNumber && (
                    <div className="font-sans text-[10px] text-slateMid">
                      <span className="text-slateLight">Rx #:</span> {med.rxNumber}
                    </div>
                  )}
                  {med.refillsRemaining !== undefined && (
                    <div className="font-sans text-[10px] text-slateMid">
                      <span className="text-slateLight">Refills:</span>{" "}
                      <span className={med.refillsRemaining <= 1 ? "font-semibold text-coral" : ""}>
                        {med.refillsRemaining}
                      </span>
                    </div>
                  )}
                  {med.expirationDate && (
                    <div className="font-sans text-[10px] text-slateMid">
                      <span className="text-slateLight">Expires:</span>{" "}
                      <span className={med.daysUntilExpiration !== undefined && med.daysUntilExpiration <= 30 ? "font-semibold text-coral" : ""}>
                        {new Date(med.expirationDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-sandDark rounded-[14px] px-5 py-8 text-center">
            <div className="text-3xl mb-3">{"\ud83d\udc8a"}</div>
            <div className="font-sans text-sm text-slate mb-1">No medications recorded</div>
            <div className="font-sans text-xs text-slateMid mb-3">
              Upload a pill bottle photo or tell Harbor about medications
            </div>
            <Link
              href="/upload"
              className="inline-block font-sans text-sm font-semibold text-ocean hover:underline"
            >
              Upload a prescription &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
