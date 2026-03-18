// Briefing Storage - Save and retrieve weekly briefings

import { WeeklyBriefing } from "@/lib/ai/briefingAgent";
import { getActiveParentId } from "./parentProfile";

const BRIEFINGS_KEY = "harbor_weekly_briefings";

/**
 * Save a weekly briefing (localStorage + write-through to DB)
 */
export function saveBriefing(briefing: WeeklyBriefing): void {
  if (typeof window === "undefined") return;

  try {
    const briefings = getAllBriefings();
    briefings.push(briefing);

    // Keep only last 12 weeks (3 months)
    const recentBriefings = briefings.slice(-12);

    localStorage.setItem(BRIEFINGS_KEY, JSON.stringify(recentBriefings));
    console.log(`Briefing saved: ${briefing.briefingId}`);

    // Write-through to DB (fire-and-forget)
    fetch("/api/briefings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentId: briefing.parentId,
        briefing: {
          parentId: briefing.parentId,
          parentName: briefing.parentName,
          weekOf: briefing.weekOf,
          generatedAt: briefing.generatedAt,
          content: briefing.content,
          signalCount: briefing.signalCount,
          urgentCount: briefing.urgentCount,
          importantCount: briefing.importantCount,
        },
      }),
    }).catch(() => {});
  } catch (error) {
    console.error("Error saving briefing:", error);
  }
}

/**
 * Get all briefings
 */
export function getAllBriefings(): WeeklyBriefing[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(BRIEFINGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading briefings:", error);
    return [];
  }
}

/**
 * Get briefings for a specific parent
 */
export function getBriefingsForParent(parentId: string): WeeklyBriefing[] {
  const all = getAllBriefings();
  return all
    .filter((b) => b.parentId === parentId)
    .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt)); // Newest first
}

/**
 * Get the most recent briefing for a parent (defaults to active parent)
 */
export function getLatestBriefing(parentId?: string): WeeklyBriefing | null {
  const targetId = parentId || getActiveParentId();

  if (targetId) {
    const briefings = getBriefingsForParent(targetId);
    return briefings.length > 0 ? briefings[0] : null;
  }

  const all = getAllBriefings();
  if (all.length === 0) return null;

  // Return most recent across all parents
  return all.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))[0];
}

/**
 * Delete a briefing
 */
export function deleteBriefing(briefingId: string): void {
  if (typeof window === "undefined") return;

  try {
    const briefings = getAllBriefings();
    const filtered = briefings.filter((b) => b.briefingId !== briefingId);
    localStorage.setItem(BRIEFINGS_KEY, JSON.stringify(filtered));
    console.log(`Briefing deleted: ${briefingId}`);
  } catch (error) {
    console.error("Error deleting briefing:", error);
  }
}

/**
 * Delete all briefings for a specific parent
 */
export function deleteBriefingsForParent(parentId: string): void {
  if (typeof window === "undefined") return;

  try {
    const briefings = getAllBriefings();
    const filtered = briefings.filter((b) => b.parentId !== parentId);
    localStorage.setItem(BRIEFINGS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting briefings for parent:", error);
  }
}

/**
 * Clear all briefings
 */
export function clearAllBriefings(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BRIEFINGS_KEY);
  console.log("All briefings cleared");
}

/**
 * Hydrate localStorage briefings from DB.
 * No-op if localStorage already has briefings for this parent (unless force=true).
 */
export async function hydrateBriefingsFromDb(parentId: string, force = false): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (!force) {
    const existing = getBriefingsForParent(parentId);
    if (existing.length > 0) return false;
  }

  try {
    const response = await fetch(`/api/briefings?parentId=${encodeURIComponent(parentId)}`);
    if (!response.ok) return false;

    const { briefings: dbBriefings } = await response.json();
    if (!dbBriefings || dbBriefings.length === 0) return false;

    // Merge DB briefings into localStorage (replace briefings for this parent)
    const allLocal = getAllBriefings().filter((b) => b.parentId !== parentId);
    const fromDb: WeeklyBriefing[] = dbBriefings.map((b: {
      id: string;
      parentId: string;
      parentName: string;
      weekOf: string;
      generatedAt: string;
      content: string;
      signalCount: number;
      urgentCount: number;
      importantCount: number;
    }) => ({
      briefingId: b.id,
      parentId: b.parentId,
      parentName: b.parentName,
      weekOf: b.weekOf,
      generatedAt: b.generatedAt,
      content: b.content,
      signalCount: b.signalCount,
      urgentCount: b.urgentCount,
      importantCount: b.importantCount,
    }));

    const merged = [...allLocal, ...fromDb].slice(-12);
    localStorage.setItem(BRIEFINGS_KEY, JSON.stringify(merged));
    console.log(`Hydrated ${fromDb.length} briefings from DB for ${parentId}`);
    return true;
  } catch {
    return false;
  }
}
