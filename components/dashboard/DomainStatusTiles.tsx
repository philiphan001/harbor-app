"use client";

import Link from "next/link";
import type { DomainStatus } from "@/lib/utils/careSummary";

interface DomainStatusTilesProps {
  statuses: DomainStatus[];
}

const STATUS_COLORS = {
  good: { bg: "bg-sage/10", border: "border-sage/40", dot: "bg-sage", text: "text-sage" },
  partial: { bg: "bg-amber/10", border: "border-amber/40", dot: "bg-amber", text: "text-amber" },
  missing: { bg: "bg-sand", border: "border-sandDark", dot: "bg-slateLight", text: "text-slateLight" },
};

export default function DomainStatusTiles({ statuses }: DomainStatusTilesProps) {
  return (
    <div>
      <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
        Domain Status
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem", marginBottom: "1.25rem" }}>
        {statuses.map((status) => {
          const colors = STATUS_COLORS[status.status];
          return (
            <Link key={status.domain} href={`/profile?domain=${status.domain}`} className="block">
              <div
                className={`${colors.bg} border ${colors.border} rounded-[12px] px-3.5 py-3 cursor-pointer hover:scale-[1.01] transition-transform h-full`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-base">{status.icon}</div>
                  <div className="font-sans text-xs font-semibold text-slate">{status.label}</div>
                  <div className={`w-2 h-2 ${colors.dot} rounded-full ml-auto`} />
                </div>
                <div className={`font-sans text-[11px] ${colors.text} font-medium`}>
                  {status.summary}
                </div>
                {status.items.length > 0 && (
                  <div className="font-sans text-[10px] text-slateMid mt-1 truncate">
                    {status.items.slice(0, 2).join(" · ")}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
