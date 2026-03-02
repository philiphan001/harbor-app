"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getActivityTimeline,
  type ActivityEvent,
  type ActivityType,
} from "@/lib/utils/activityTimeline";
import { reactivateNudge } from "@/lib/utils/nudgeStorage";

const FILTER_CHIPS: { label: string; value: ActivityType | null }[] = [
  { label: "All", value: null },
  { label: "Tasks", value: "task_completed" },
  { label: "Data", value: "data_captured" },
  { label: "Events", value: "life_event" },
  { label: "Reminders", value: "nudge_dismissed" },
  { label: "Briefings", value: "briefing_generated" },
];

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString();
}

function groupByDate(events: ActivityEvent[]): Map<string, ActivityEvent[]> {
  const groups = new Map<string, ActivityEvent[]>();
  for (const event of events) {
    const dateKey = new Date(event.timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const existing = groups.get(dateKey) || [];
    existing.push(event);
    groups.set(dateKey, existing);
  }
  return groups;
}

const DOMAIN_COLORS: Record<string, string> = {
  medical: "bg-ocean/15 text-ocean",
  financial: "bg-amber/15 text-amber",
  legal: "bg-coral/15 text-coral",
  housing: "bg-sage/15 text-sage",
  family: "bg-[#9B59B6]/15 text-[#9B59B6]",
  logistics: "bg-slateMid/15 text-slateMid",
};

export default function ActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [filter, setFilter] = useState<ActivityType | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timeline = getActivityTimeline(filter ?? undefined);
    setEvents(timeline);
    setLoaded(true);
  }, [filter]);

  function handleReactivate(nudgeDefinitionId: string) {
    reactivateNudge(nudgeDefinitionId);
    // Refresh the timeline
    const timeline = getActivityTimeline(filter ?? undefined);
    setEvents(timeline);
  }

  const grouped = groupByDate(events);

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-ocean to-[#164F5C] px-7 pt-10 pb-8">
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
            Activity History
          </h1>
          <p className="font-sans text-sm text-white/80 mt-1">
            Everything that&apos;s happened with your care plan
          </p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="px-5 pt-5 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.label}
            onClick={() => setFilter(chip.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full font-sans text-xs font-medium transition-colors ${
              filter === chip.value
                ? "bg-ocean text-white"
                : "bg-sand/60 text-slate hover:bg-sand"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-4">
        {!loaded ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-sand/40 rounded-[14px] animate-pulse"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📭</div>
            <h3 className="font-serif text-lg text-slate font-medium">
              No activity yet
            </h3>
            <p className="font-sans text-sm text-slateLight mt-1">
              Complete tasks, capture data, or report events to see them here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(grouped.entries()).map(([dateLabel, dateEvents]) => (
              <div key={dateLabel}>
                <h3 className="font-sans text-xs font-semibold text-slateLight uppercase tracking-wider mb-3">
                  {dateLabel}
                </h3>
                <div className="space-y-2">
                  {dateEvents.map((event) => (
                    <div
                      key={event.id}
                      className="bg-white rounded-[14px] border border-sand px-4 py-3 flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-sand/50 flex items-center justify-center text-base shrink-0 mt-0.5">
                        {event.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-sm font-medium text-slate truncate">
                            {event.title}
                          </span>
                          {event.domain && (
                            <span
                              className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-sans font-medium ${
                                DOMAIN_COLORS[event.domain] ||
                                "bg-sand/50 text-slateLight"
                              }`}
                            >
                              {event.domain}
                            </span>
                          )}
                        </div>
                        <p className="font-sans text-xs text-slateLight mt-0.5 truncate">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="font-sans text-[10px] text-slateLight/70">
                            {relativeTime(event.timestamp)}
                          </span>
                          {event.nudgeDefinitionId &&
                            (event.type === "nudge_dismissed" ||
                              event.type === "nudge_snoozed") && (
                              <button
                                onClick={() =>
                                  handleReactivate(event.nudgeDefinitionId!)
                                }
                                className="font-sans text-[10px] font-medium text-ocean hover:text-ocean/80 transition-colors"
                              >
                                Reactivate
                              </button>
                            )}
                        </div>
                      </div>
                      {event.actionUrl && (
                        <Link
                          href={event.actionUrl}
                          className="shrink-0 text-slateLight hover:text-slate transition-colors text-sm mt-1"
                        >
                          &rarr;
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
