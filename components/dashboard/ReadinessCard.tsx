"use client";

import Link from "next/link";
import { getReadinessLabel, type ReadinessBreakdown } from "@/lib/utils/readinessScore";

interface ReadinessCardProps {
  readiness: ReadinessBreakdown;
}

function getScoreColorClass(score: number): {
  bg: string;
  border: string;
  text: string;
  bgSolid: string;
} {
  if (score < 30) return { bg: "bg-coral/10", border: "border-coral", text: "text-coral", bgSolid: "bg-coral" };
  if (score < 60) return { bg: "bg-amber/10", border: "border-amber", text: "text-amber", bgSolid: "bg-amber" };
  if (score < 85) return { bg: "bg-ocean/10", border: "border-ocean", text: "text-ocean", bgSolid: "bg-ocean" };
  return { bg: "bg-sage/10", border: "border-sage", text: "text-sage", bgSolid: "bg-sage" };
}

export default function ReadinessCard({ readiness }: ReadinessCardProps) {
  const colors = getScoreColorClass(readiness.overall);

  return (
    <Link href="/readiness" className="block mb-6">
      <div className={`w-full ${colors.bg} border-2 ${colors.border} rounded-[14px] px-5 py-4 cursor-pointer hover:scale-[1.01] transition-transform`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 ${colors.bgSolid} rounded-xl flex items-center justify-center text-white`}>
              <div className="text-center">
                <div className="font-sans text-xl font-bold leading-none">{readiness.overall}</div>
                <div className="font-sans text-[9px] font-medium opacity-80">/ 100</div>
              </div>
            </div>
            <div>
              <div className={`font-sans text-xs font-semibold tracking-[1.5px] uppercase ${colors.text} mb-0.5`}>
                Emergency Readiness
              </div>
              <div className="font-sans text-sm font-medium text-slate">
                {getReadinessLabel(readiness.overall)}
              </div>
            </div>
          </div>
          <div className={`${colors.text} text-lg`}>&rarr;</div>
        </div>

        {readiness.criticalGaps.length > 0 && (
          <div className="pt-3 border-t border-sand/50">
            <div className="font-sans text-xs font-semibold text-slateMid mb-2">
              Critical Gaps:
            </div>
            {readiness.criticalGaps.slice(0, 2).map((gap, index) => (
              <div key={index} className="flex items-start gap-2 mb-1">
                <div className="w-1 h-1 bg-coral rounded-full mt-1.5 shrink-0" />
                <div className="font-sans text-xs text-slate">{gap}</div>
              </div>
            ))}
            {readiness.criticalGaps.length > 2 && (
              <div className="font-sans text-xs text-slateMid mt-1">
                +{readiness.criticalGaps.length - 2} more
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
