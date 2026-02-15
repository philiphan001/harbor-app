// Briefing Storage - Save and retrieve weekly briefings

import { WeeklyBriefing } from "@/lib/ai/briefingAgent";
import { getActiveParentId } from "./parentProfile";

const BRIEFINGS_KEY = "harbor_weekly_briefings";

/**
 * Save a weekly briefing
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
