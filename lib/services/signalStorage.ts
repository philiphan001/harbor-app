// Signal storage and management

import { Signal, SignalWithJudgment } from "@/lib/types/signal";

const STORAGE_KEY = "harbor_signals";
const BRIEFING_QUEUE_KEY = "harbor_briefing_queue";

// ==================== Core Signal CRUD ====================

export function saveSignal(signal: Signal): void {
  if (typeof window === "undefined") return;

  try {
    const allSignals = getAllSignals();
    const existingIndex = allSignals.findIndex((s) => s.id === signal.id);

    if (existingIndex >= 0) {
      allSignals[existingIndex] = signal;
    } else {
      allSignals.push(signal);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSignals));
    console.log("💾 Saved signal:", signal.id);
  } catch (error) {
    console.error("Error saving signal:", error);
  }
}

export function getSignal(signalId: string): Signal | null {
  if (typeof window === "undefined") return null;

  try {
    const allSignals = getAllSignals();
    return allSignals.find((s) => s.id === signalId) || null;
  } catch (error) {
    console.error("Error reading signal:", error);
    return null;
  }
}

export function getAllSignals(): Signal[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading signals:", error);
    return [];
  }
}

export function getSignalsByParent(parentId: string): Signal[] {
  const allSignals = getAllSignals();
  return allSignals.filter((s) => s.parentId === parentId);
}

export function deleteSignal(signalId: string): void {
  if (typeof window === "undefined") return;

  try {
    const allSignals = getAllSignals();
    const filtered = allSignals.filter((s) => s.id !== signalId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log("🗑️ Deleted signal:", signalId);
  } catch (error) {
    console.error("Error deleting signal:", error);
  }
}

// ==================== Signal State Management ====================

export function markSignalAsRead(signalId: string): void {
  const signal = getSignal(signalId);
  if (!signal) return;

  signal.read = true;
  saveSignal(signal);
}

export function dismissSignal(signalId: string): void {
  const signal = getSignal(signalId);
  if (!signal) return;

  signal.dismissed = true;
  saveSignal(signal);
}

export function undismissSignal(signalId: string): void {
  const signal = getSignal(signalId);
  if (!signal) return;

  signal.dismissed = false;
  saveSignal(signal);
}

export function markSignalTaskCreated(signalId: string): void {
  const signal = getSignal(signalId);
  if (!signal) return;

  signal.taskCreated = true;
  saveSignal(signal);
}

// ==================== Filtering ====================

export function getActiveSignals(parentId: string): Signal[] {
  const signals = getSignalsByParent(parentId);
  return signals.filter((s) => !s.dismissed && !s.read);
}

export function getHighPrioritySignals(parentId: string): Signal[] {
  const signals = getSignalsByParent(parentId);
  return signals.filter((s) => s.priority === "high" && !s.dismissed);
}

export function getActionableSignals(parentId: string): Signal[] {
  const signals = getSignalsByParent(parentId);
  return signals.filter((s) => s.actionable && !s.dismissed);
}

export function getRecentSignals(parentId: string, days: number = 7): Signal[] {
  const signals = getSignalsByParent(parentId);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return signals.filter((s) => {
    const detectedDate = new Date(s.detectedAt);
    return detectedDate >= cutoffDate;
  });
}

// ==================== Briefing Queue ====================

export function addToBriefingQueue(signal: SignalWithJudgment): void {
  if (typeof window === "undefined") return;

  try {
    const queue = getBriefingQueue();

    // Only add if relevance score is high enough
    if (signal.relevanceScore >= 70) {
      queue.push(signal);
      localStorage.setItem(BRIEFING_QUEUE_KEY, JSON.stringify(queue));
      console.log("📋 Added to briefing queue:", signal.id, `(score: ${signal.relevanceScore})`);
    } else {
      console.log("⏭️ Signal below threshold, not adding to briefing:", signal.id, `(score: ${signal.relevanceScore})`);
    }
  } catch (error) {
    console.error("Error adding to briefing queue:", error);
  }
}

export function getBriefingQueue(parentId?: string): SignalWithJudgment[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(BRIEFING_QUEUE_KEY);
    const queue: SignalWithJudgment[] = stored ? JSON.parse(stored) : [];

    if (parentId) {
      return queue.filter((s) => s.parentId === parentId);
    }

    return queue;
  } catch (error) {
    console.error("Error reading briefing queue:", error);
    return [];
  }
}

export function clearBriefingQueue(parentId?: string): void {
  if (typeof window === "undefined") return;

  try {
    if (parentId) {
      const queue = getBriefingQueue();
      const filtered = queue.filter((s) => s.parentId !== parentId);
      localStorage.setItem(BRIEFING_QUEUE_KEY, JSON.stringify(filtered));
      console.log("🗑️ Cleared briefing queue for parent:", parentId);
    } else {
      localStorage.removeItem(BRIEFING_QUEUE_KEY);
      console.log("🗑️ Cleared entire briefing queue");
    }
  } catch (error) {
    console.error("Error clearing briefing queue:", error);
  }
}

// ==================== Cleanup ====================

export function cleanupOldSignals(daysToKeep: number = 90): void {
  if (typeof window === "undefined") return;

  try {
    const allSignals = getAllSignals();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const filtered = allSignals.filter((s) => {
      const detectedDate = new Date(s.detectedAt);
      return detectedDate >= cutoffDate;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log(`🧹 Cleaned up signals older than ${daysToKeep} days`);
  } catch (error) {
    console.error("Error cleaning up old signals:", error);
  }
}
