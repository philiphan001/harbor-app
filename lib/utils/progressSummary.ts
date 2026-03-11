import { getCompletedTasks, getTasks } from "./taskStorage";
import { getAllTaskData } from "./taskData";
import { getAllDetections } from "./agentStorage";
import { calculateReadinessScore, type ReadinessBreakdown } from "./readinessScore";

const PROGRESS_SNAPSHOT_KEY = "harbor_progress_snapshot";

interface ProgressSnapshot {
  readinessScore: number;
  savedAt: string;
}

function getLastSnapshot(): ProgressSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(PROGRESS_SNAPSHOT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveSnapshot(score: number): void {
  if (typeof window === "undefined") return;
  const snapshot: ProgressSnapshot = {
    readinessScore: score,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(PROGRESS_SNAPSHOT_KEY, JSON.stringify(snapshot));
}

export interface ProgressSummary {
  periodDays: number;
  tasksCompleted: number;
  tasksPending: number;
  documentsCaptured: number;
  readinessScore: number;
  readinessDelta: number | null; // null if no prior snapshot
  detectionsSurfaced: number;
}

/**
 * Compute progress summary for the given period (default 7 days).
 */
export function computeProgressSummary(periodDays: number = 7, now?: Date): ProgressSummary {
  const currentDate = now ?? new Date();
  const periodStart = new Date(currentDate.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const periodStartISO = periodStart.toISOString();

  // Tasks completed in this period
  const completedTasks = getCompletedTasks();
  const completedInPeriod = completedTasks.filter(
    (t) => t.completedAt && t.completedAt >= periodStartISO
  );

  // Pending tasks
  const pendingTasks = getTasks();

  // Documents captured
  const allTaskData = getAllTaskData();
  const docsCapturedInPeriod = allTaskData.filter(
    (d) => d.capturedAt >= periodStartISO
  );

  // Detections surfaced
  const allDetections = getAllDetections();
  const detectionsInPeriod = allDetections.filter(
    (d) => d.detectedAt >= periodStartISO
  );

  // Readiness score + delta
  const readiness = calculateReadinessScore();
  const lastSnapshot = getLastSnapshot();
  const readinessDelta = lastSnapshot
    ? readiness.overall - lastSnapshot.readinessScore
    : null;

  // Save current score as snapshot for next comparison
  saveSnapshot(readiness.overall);

  return {
    periodDays,
    tasksCompleted: completedInPeriod.length,
    tasksPending: pendingTasks.length,
    documentsCaptured: docsCapturedInPeriod.length,
    readinessScore: readiness.overall,
    readinessDelta,
    detectionsSurfaced: detectionsInPeriod.length,
  };
}

/**
 * Format a progress summary as markdown for display.
 */
export function formatProgressMarkdown(summary: ProgressSummary): string {
  const lines: string[] = [];

  lines.push("## Your Progress This Week");
  lines.push("");

  if (summary.tasksCompleted > 0) {
    lines.push(`- **${summary.tasksCompleted}** task${summary.tasksCompleted === 1 ? "" : "s"} completed`);
  } else {
    lines.push("- No tasks completed yet this week");
  }

  if (summary.documentsCaptured > 0) {
    lines.push(`- **${summary.documentsCaptured}** document${summary.documentsCaptured === 1 ? "" : "s"} captured`);
  }

  if (summary.detectionsSurfaced > 0) {
    lines.push(`- **${summary.detectionsSurfaced}** alert${summary.detectionsSurfaced === 1 ? "" : "s"} surfaced by AI agents`);
  }

  lines.push("");

  const deltaStr = summary.readinessDelta !== null
    ? summary.readinessDelta > 0
      ? ` (+${summary.readinessDelta})`
      : summary.readinessDelta < 0
      ? ` (${summary.readinessDelta})`
      : " (no change)"
    : "";

  lines.push(`- Readiness Score: **${summary.readinessScore}%**${deltaStr}`);

  if (summary.tasksPending > 0) {
    lines.push(`- **${summary.tasksPending}** task${summary.tasksPending === 1 ? "" : "s"} still pending`);
  }

  return lines.join("\n");
}
