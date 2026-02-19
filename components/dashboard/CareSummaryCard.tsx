"use client";

import Link from "next/link";
import type { CareSummaryData } from "@/lib/utils/careSummary";

interface CareSummaryCardProps {
  summary: CareSummaryData;
}

export default function CareSummaryCard({ summary }: CareSummaryCardProps) {
  const hasCapturedData = summary.totalCaptured > 0;

  // Freshness
  const freshness = getFreshness(summary.lastUpdated);

  return (
    <div className="bg-white border border-sandDark rounded-[14px] overflow-hidden mb-5">
      {/* Header bar */}
      <div className="px-5 py-3 bg-ocean/5 border-b border-sandDark flex items-center justify-between">
        <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean">
          Care Summary
        </div>
        <div className="flex items-center gap-3">
          {summary.lastUpdated && (
            <div className={`font-sans text-[10px] font-medium ${freshness.color}`}>
              {freshness.label}
            </div>
          )}
          {hasCapturedData && (
            <Link href="/export" className="font-sans text-[10px] font-medium text-ocean hover:underline">
              Export
            </Link>
          )}
        </div>
      </div>

      {!hasCapturedData ? (
        <div className="px-5 py-6 text-center">
          <div className="font-sans text-sm text-slateMid leading-relaxed">
            Complete tasks to start building {summary.parentName}&apos;s care summary.
            Information you capture will appear here.
          </div>
        </div>
      ) : (
        <div className="px-5 py-4 space-y-3">
          {/* Doctor */}
          <SummaryRow
            icon="🩺"
            label="PCP"
            value={summary.primaryDoctor ? `${summary.primaryDoctor.name} · ${summary.primaryDoctor.phone}` : undefined}
            placeholder="No doctor recorded"
          />

          {/* Insurance */}
          <SummaryRow
            icon="🛡️"
            label="Insurance"
            value={summary.insurance ? `${summary.insurance.provider} · ${summary.insurance.policyNumber}` : undefined}
            placeholder="No insurance recorded"
          />

          {/* Medications */}
          <SummaryRow
            icon="💊"
            label="Medications"
            value={summary.medicationCount > 0 ? `${summary.medicationCount} active` : undefined}
            detail={summary.medications.slice(0, 3).map(m => m.name).join(", ")}
            placeholder="No medications recorded"
          />

          {/* POA */}
          <SummaryRow
            icon="📋"
            label="POA"
            value={summary.poaStatus !== "unknown" ? (
              summary.poaStatus === "completed"
                ? `Completed${summary.poaAgent ? ` · Agent: ${summary.poaAgent}` : ""}`
                : "In progress"
            ) : undefined}
            placeholder="Not recorded"
            statusColor={summary.poaStatus === "completed" ? "text-sage" : summary.poaStatus === "in-progress" ? "text-amber" : undefined}
          />

          {/* Progress bar */}
          <div className="pt-2 border-t border-sand">
            <div className="flex items-center justify-between mb-1.5">
              <div className="font-sans text-[11px] text-slateMid">
                {summary.completedTasks} completed · {summary.pendingTasks} remaining
              </div>
            </div>
            <div className="w-full h-1.5 bg-sand rounded-full overflow-hidden">
              <div
                className="h-full bg-ocean rounded-full transition-all duration-500"
                style={{
                  width: `${summary.completedTasks + summary.pendingTasks > 0
                    ? Math.round((summary.completedTasks / (summary.completedTasks + summary.pendingTasks)) * 100)
                    : 0}%`
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  detail,
  placeholder,
  statusColor,
}: {
  icon: string;
  label: string;
  value?: string;
  detail?: string;
  placeholder: string;
  statusColor?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-base mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-sans text-[10px] font-semibold tracking-[1px] uppercase text-slateLight mb-0.5">
          {label}
        </div>
        {value ? (
          <>
            <div className={`font-sans text-sm text-slate leading-snug ${statusColor || ""}`}>
              {value}
            </div>
            {detail && (
              <div className="font-sans text-[11px] text-slateMid mt-0.5">{detail}</div>
            )}
          </>
        ) : (
          <div className="font-sans text-sm text-slateLight italic">{placeholder}</div>
        )}
      </div>
    </div>
  );
}

function getFreshness(lastUpdated: string | null): { label: string; color: string } {
  if (!lastUpdated) return { label: "", color: "" };

  const now = new Date();
  const updated = new Date(lastUpdated);
  const daysDiff = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 7) return { label: `Updated ${daysDiff === 0 ? "today" : daysDiff === 1 ? "yesterday" : `${daysDiff}d ago`}`, color: "text-sage" };
  if (daysDiff <= 30) return { label: `Updated ${Math.floor(daysDiff / 7)}w ago`, color: "text-slateMid" };
  if (daysDiff <= 90) return { label: `Updated ${Math.floor(daysDiff / 30)}mo ago`, color: "text-amber" };
  return { label: `Stale — ${Math.floor(daysDiff / 30)}mo ago`, color: "text-coral" };
}
