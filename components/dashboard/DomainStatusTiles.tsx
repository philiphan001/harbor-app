"use client";

import Link from "next/link";
import type { DomainStatus } from "@/lib/utils/careSummary";
import { getNextBestActions } from "@/lib/utils/readinessScore";

interface DomainStatusTilesProps {
  statuses: DomainStatus[];
}

const STATUS_COLORS = {
  good: { bg: "bg-sage/10", border: "border-sage/40", dot: "bg-sage", text: "text-sage" },
  partial: { bg: "bg-amber/10", border: "border-amber/40", dot: "bg-amber", text: "text-amber" },
  missing: { bg: "bg-sand", border: "border-sandDark", dot: "bg-slateLight", text: "text-slateLight" },
};

export default function DomainStatusTiles({ statuses }: DomainStatusTilesProps) {
  const nextActions = getNextBestActions();
  const actionByDomain = new Map(nextActions.map((a) => [a.domain, a]));

  return (
    <div>
      <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-3">
        Domain Status
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem", marginBottom: "1.25rem" }}>
        {statuses.map((status) => {
          const colors = STATUS_COLORS[status.status];
          const nextAction = (status.status === "missing" || status.status === "partial")
            ? actionByDomain.get(status.domain)
            : undefined;
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
                {status.freshness === "stale" && (
                  <div className="mt-1.5">
                    <span className="inline-block bg-coral/15 text-coral font-sans text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      Needs review
                    </span>
                  </div>
                )}
                {status.freshness === "aging" && status.freshnessLabel && (
                  <div className="font-sans text-[10px] text-amber font-medium mt-1">
                    {status.freshnessLabel}
                  </div>
                )}
                {status.freshness !== "stale" && status.freshness !== "aging" && status.items.length > 0 && (
                  <div className="font-sans text-[10px] text-slateMid mt-1 truncate">
                    {status.items.slice(0, 2).join(" · ")}
                  </div>
                )}
                {nextAction && (
                  <div className="text-[10px] text-ocean font-medium mt-1.5 truncate">
                    → {nextAction.action}
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
