"use client";

import Link from "next/link";
import type { VisibleNudge } from "@/lib/utils/nudgeStorage";
import { dismissNudge, snoozeNudge } from "@/lib/utils/nudgeStorage";

interface NudgeBannerProps {
  nudges: VisibleNudge[];
  onUpdate: () => void;
}

export default function NudgeBanner({ nudges, onUpdate }: NudgeBannerProps) {
  if (nudges.length === 0) return null;

  const handleDismiss = (nudgeId: string) => {
    dismissNudge(nudgeId);
    onUpdate();
  };

  const handleSnooze = (nudgeId: string) => {
    snoozeNudge(nudgeId, 7);
    onUpdate();
  };

  return (
    <div className="mb-5">
      <div className="font-sans text-[11px] font-semibold tracking-[1.5px] uppercase text-slateLight mb-2">
        Reminders
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
        {nudges.map((nudge) => {
          const { definition, urgent } = nudge;
          const borderColor = urgent ? "border-coral" : "border-amber";
          const accentBg = urgent ? "bg-coral/10" : "bg-amber/10";

          return (
            <div
              key={definition.id}
              className={`flex-shrink-0 w-[260px] bg-white border-2 ${borderColor} rounded-[14px] px-4 py-3 relative`}
            >
              {/* Dismiss / Snooze controls */}
              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <button
                  onClick={() => handleSnooze(definition.id)}
                  className="w-6 h-6 rounded-full bg-sand/50 flex items-center justify-center text-[10px] text-slateMid hover:bg-sand transition-colors"
                  title="Snooze 7 days"
                >
                  {"\ud83d\udca4"}
                </button>
                <button
                  onClick={() => handleDismiss(definition.id)}
                  className="w-6 h-6 rounded-full bg-sand/50 flex items-center justify-center text-xs text-slateMid hover:bg-sand transition-colors"
                  title="Dismiss"
                >
                  {"\u00d7"}
                </button>
              </div>

              <div className="flex items-start gap-3 pr-14">
                <div className={`w-8 h-8 ${accentBg} rounded-lg flex items-center justify-center text-sm flex-shrink-0`}>
                  {definition.icon}
                </div>
                <div className="min-w-0">
                  <div className="font-sans text-xs font-semibold text-slate mb-0.5 truncate">
                    {definition.title}
                  </div>
                  <div className="font-sans text-[10px] text-slateMid leading-tight line-clamp-2">
                    {definition.description}
                  </div>
                  {definition.actionUrl && definition.actionLabel && (
                    definition.actionUrl.startsWith("/") ? (
                      <Link
                        href={definition.actionUrl}
                        className="inline-block mt-1.5 font-sans text-[10px] font-semibold text-ocean hover:underline"
                      >
                        {definition.actionLabel} &rarr;
                      </Link>
                    ) : (
                      <a
                        href={definition.actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-1.5 font-sans text-[10px] font-semibold text-ocean hover:underline"
                      >
                        {definition.actionLabel} &rarr;
                      </a>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
