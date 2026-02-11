// Weekly briefing storage and management

import { WeeklyBriefing } from "@/lib/agents/BriefingGenerator";

const STORAGE_KEY = "harbor_weekly_briefings";

// ==================== Core CRUD Operations ====================

export function saveBriefing(briefing: WeeklyBriefing): void {
  if (typeof window === "undefined") return;

  try {
    const allBriefings = getAllBriefings();
    const existingIndex = allBriefings.findIndex((b) => b.briefingId === briefing.briefingId);

    if (existingIndex >= 0) {
      allBriefings[existingIndex] = briefing;
    } else {
      allBriefings.push(briefing);
    }

    // Sort by weekOf descending (newest first)
    allBriefings.sort((a, b) => b.weekOf.localeCompare(a.weekOf));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allBriefings));
    console.log("💾 Saved briefing:", briefing.briefingId);
  } catch (error) {
    console.error("Error saving briefing:", error);
  }
}

export function getBriefing(briefingId: string): WeeklyBriefing | null {
  if (typeof window === "undefined") return null;

  try {
    const allBriefings = getAllBriefings();
    return allBriefings.find((b) => b.briefingId === briefingId) || null;
  } catch (error) {
    console.error("Error reading briefing:", error);
    return null;
  }
}

export function getAllBriefings(): WeeklyBriefing[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading briefings:", error);
    return [];
  }
}

export function getBriefingsByParent(parentId: string): WeeklyBriefing[] {
  const allBriefings = getAllBriefings();
  return allBriefings.filter((b) => b.parentId === parentId);
}

export function getLatestBriefing(parentId: string): WeeklyBriefing | null {
  const briefings = getBriefingsByParent(parentId);
  return briefings.length > 0 ? briefings[0] : null;
}

export function deleteBriefing(briefingId: string): void {
  if (typeof window === "undefined") return;

  try {
    const allBriefings = getAllBriefings();
    const filtered = allBriefings.filter((b) => b.briefingId !== briefingId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log("🗑️ Deleted briefing:", briefingId);
  } catch (error) {
    console.error("Error deleting briefing:", error);
  }
}

// ==================== Briefing State Management ====================

export function markBriefingAsRead(briefingId: string): void {
  const briefing = getBriefing(briefingId);
  if (!briefing) return;

  briefing.read = true;
  saveBriefing(briefing);
}

export function updateActionCount(briefingId: string, completed: number): void {
  const briefing = getBriefing(briefingId);
  if (!briefing) return;

  briefing.actions.completed = Math.min(completed, briefing.actions.total);
  saveBriefing(briefing);
}

// ==================== Cleanup ====================

export function cleanupOldBriefings(weeksToKeep: number = 12): void {
  if (typeof window === "undefined") return;

  try {
    const allBriefings = getAllBriefings();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - weeksToKeep * 7);

    const filtered = allBriefings.filter((b) => {
      const weekDate = new Date(b.weekOf);
      return weekDate >= cutoffDate;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log(`🧹 Cleaned up briefings older than ${weeksToKeep} weeks`);
  } catch (error) {
    console.error("Error cleaning up old briefings:", error);
  }
}
