import type { LifeEvent } from "@/lib/types/lifeEvents";
import { getActiveParentId } from "./parentProfile";

const LIFE_EVENTS_KEY = "harbor_life_events";

function getAllLifeEventsRaw(): LifeEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(LIFE_EVENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveAllLifeEvents(events: LifeEvent[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LIFE_EVENTS_KEY, JSON.stringify(events));
}

export function saveLifeEvent(event: LifeEvent): void {
  const events = getAllLifeEventsRaw();
  events.push(event);
  saveAllLifeEvents(events);
}

export function getLifeEvents(): LifeEvent[] {
  const parentId = getActiveParentId();
  if (!parentId) return getAllLifeEventsRaw();
  return getAllLifeEventsRaw().filter((e) => e.parentId === parentId);
}

export function getRecentLifeEvents(days: number = 30): LifeEvent[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString();

  return getLifeEvents().filter((e) => e.reportedAt >= cutoffStr);
}
