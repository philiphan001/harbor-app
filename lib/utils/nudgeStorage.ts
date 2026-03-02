import type { NudgeDefinition, NudgeInstance } from "@/lib/types/nudges";
import { CALENDAR_NUDGES, generateMedicationRefillNudges } from "@/lib/data/nudgeDefinitions";
import { getActiveParentId } from "./parentProfile";
import { getMedicationsNeedingRefill, getEnrichedMedications } from "./medicationHelpers";

const NUDGE_INSTANCES_KEY = "harbor_nudge_instances";

function getNudgeInstances(): NudgeInstance[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(NUDGE_INSTANCES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveNudgeInstances(instances: NudgeInstance[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NUDGE_INSTANCES_KEY, JSON.stringify(instances));
}

export function dismissNudge(nudgeDefinitionId: string): void {
  const parentId = getActiveParentId() || "";
  const instances = getNudgeInstances();
  const now = new Date();
  const year = now.getFullYear();

  const existing = instances.find(
    (i) => i.nudgeDefinitionId === nudgeDefinitionId && i.parentId === parentId
  );

  if (existing) {
    existing.status = "dismissed";
    existing.dismissedAt = now.toISOString();
    existing.dismissedForYear = year;
  } else {
    instances.push({
      id: `${nudgeDefinitionId}_${parentId}_${year}`,
      nudgeDefinitionId,
      parentId,
      status: "dismissed",
      dismissedAt: now.toISOString(),
      dismissedForYear: year,
    });
  }

  saveNudgeInstances(instances);
}

export function snoozeNudge(nudgeDefinitionId: string, days: number = 7): void {
  const parentId = getActiveParentId() || "";
  const instances = getNudgeInstances();
  const snoozeUntil = new Date();
  snoozeUntil.setDate(snoozeUntil.getDate() + days);

  const existing = instances.find(
    (i) => i.nudgeDefinitionId === nudgeDefinitionId && i.parentId === parentId
  );

  if (existing) {
    existing.status = "snoozed";
    existing.snoozedUntil = snoozeUntil.toISOString();
  } else {
    instances.push({
      id: `${nudgeDefinitionId}_${parentId}_snooze`,
      nudgeDefinitionId,
      parentId,
      status: "snoozed",
      snoozedUntil: snoozeUntil.toISOString(),
    });
  }

  saveNudgeInstances(instances);
}

/**
 * Check if a nudge definition is currently within its active window.
 */
function isInActiveWindow(nudge: NudgeDefinition): boolean {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentDay = now.getDate();

  if (nudge.startMonth === undefined || nudge.endMonth === undefined) {
    // One-time or always-active nudges
    return true;
  }

  const startDate = (nudge.startMonth * 100) + (nudge.startDay || 1);
  const endDate = (nudge.endMonth * 100) + (nudge.endDay || 28);
  const currentDate = (currentMonth * 100) + currentDay;

  // Account for lead time
  const leadStart = new Date(now.getFullYear(), (nudge.startMonth - 1), (nudge.startDay || 1));
  leadStart.setDate(leadStart.getDate() - nudge.leadTimeDays);
  const leadMonth = leadStart.getMonth() + 1;
  const leadDay = leadStart.getDate();
  const leadDate = (leadMonth * 100) + leadDay;

  if (leadDate <= endDate) {
    // Normal range (doesn't wrap around year)
    return currentDate >= leadDate && currentDate <= endDate;
  } else {
    // Wraps around year boundary
    return currentDate >= leadDate || currentDate <= endDate;
  }
}

/**
 * Check if a nudge is dismissed or snoozed for the current period.
 */
function isNudgeSuppressed(nudge: NudgeDefinition, instances: NudgeInstance[], parentId: string): boolean {
  const instance = instances.find(
    (i) => i.nudgeDefinitionId === nudge.id && i.parentId === parentId
  );

  if (!instance) return false;

  const now = new Date();
  const currentYear = now.getFullYear();

  if (instance.status === "dismissed") {
    // For annual nudges, only suppressed for the dismissed year
    if (nudge.recurrence === "annual") {
      return instance.dismissedForYear === currentYear;
    }
    return true;
  }

  if (instance.status === "snoozed" && instance.snoozedUntil) {
    return now < new Date(instance.snoozedUntil);
  }

  return false;
}

export function reactivateNudge(nudgeDefinitionId: string): void {
  const parentId = getActiveParentId() || "";
  const instances = getNudgeInstances();
  const filtered = instances.filter(
    (i) => !(i.nudgeDefinitionId === nudgeDefinitionId && i.parentId === parentId)
  );
  saveNudgeInstances(filtered);
}

export interface VisibleNudge {
  definition: NudgeDefinition;
  urgent: boolean;
}

/**
 * Compute which nudges should be visible right now.
 */
export function computeVisibleNudges(): VisibleNudge[] {
  const parentId = getActiveParentId() || "";
  const instances = getNudgeInstances();
  const now = new Date();

  // Collect all nudge definitions (static + dynamic medication nudges)
  const allDefinitions: NudgeDefinition[] = [...CALENDAR_NUDGES];

  try {
    const meds = getEnrichedMedications();
    const medNudges = generateMedicationRefillNudges(
      meds.map((m) => ({
        name: m.name,
        refillsRemaining: m.refillsRemaining,
        expirationDate: m.expirationDate,
      }))
    );
    allDefinitions.push(...medNudges);
  } catch {
    // Medication data may not be available
  }

  const visible: VisibleNudge[] = [];

  for (const nudge of allDefinitions) {
    if (!isInActiveWindow(nudge)) continue;
    if (isNudgeSuppressed(nudge, instances, parentId)) continue;

    // Determine urgency: within 7 days of deadline or past it
    let urgent = false;
    if (nudge.endMonth && nudge.endDay) {
      const endDate = new Date(now.getFullYear(), nudge.endMonth - 1, nudge.endDay);
      const daysUntilEnd = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      urgent = daysUntilEnd <= 7;
    }
    if (nudge.type === "prescription_refill") {
      urgent = true; // Refill nudges are always urgent
    }

    visible.push({ definition: nudge, urgent });
  }

  return visible;
}
