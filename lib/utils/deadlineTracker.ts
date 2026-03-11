import type { Task } from "@/lib/ai/claude";
import type { NudgeState } from "@/lib/types/nudges";
import type { Domain } from "@/lib/constants/domains";
import { getTasks } from "./taskStorage";
import { extractDueDate } from "./taskPrioritizer";

export type DeadlineUrgency = "overdue" | "1-day" | "3-day" | "7-day";

export interface DeadlineNudge {
  taskTitle: string;
  domain: Domain;
  dueDate: Date;
  urgency: DeadlineUrgency;
  daysUntilDue: number;
}

const URGENCY_ORDER: Record<DeadlineUrgency, number> = {
  overdue: 0,
  "1-day": 1,
  "3-day": 2,
  "7-day": 3,
};

function classifyUrgency(daysUntil: number): DeadlineUrgency | null {
  if (daysUntil < 0) return "overdue";
  if (daysUntil <= 1) return "1-day";
  if (daysUntil <= 3) return "3-day";
  if (daysUntil <= 7) return "7-day";
  return null;
}

/**
 * Scan pending tasks for upcoming deadlines.
 */
export function scanTaskDeadlines(now?: Date): DeadlineNudge[] {
  const currentDate = now ?? new Date();
  const tasks = getTasks();
  const nudges: DeadlineNudge[] = [];

  for (const task of tasks) {
    const dueDate = extractDueDate(task);
    if (!dueDate) continue;

    const daysUntil = Math.ceil(
      (dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const urgency = classifyUrgency(daysUntil);
    if (!urgency) continue;

    nudges.push({
      taskTitle: task.title,
      domain: task.domain as Domain,
      dueDate,
      urgency,
      daysUntilDue: daysUntil,
    });
  }

  // Sort by urgency (most urgent first), then by days until due
  nudges.sort((a, b) => {
    const urgencyDiff = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;
    return a.daysUntilDue - b.daysUntilDue;
  });

  return nudges;
}

const URGENCY_TO_TIER: Record<DeadlineUrgency, "P0" | "P1" | "P2" | "P3"> = {
  overdue: "P0",
  "1-day": "P1",
  "3-day": "P2",
  "7-day": "P3",
};

const URGENCY_RELEVANCE: Record<DeadlineUrgency, number> = {
  overdue: 95,
  "1-day": 85,
  "3-day": 70,
  "7-day": 55,
};

const URGENCY_ICON: Record<DeadlineUrgency, string> = {
  overdue: "🚨",
  "1-day": "⏰",
  "3-day": "📅",
  "7-day": "📋",
};

/**
 * Convert deadline nudges into NudgeState objects compatible with the nudge pipeline.
 */
export function deadlineNudgesToNudgeStates(
  deadlines: DeadlineNudge[],
  parentId: string
): NudgeState[] {
  return deadlines.map((dl) => {
    const label =
      dl.urgency === "overdue"
        ? `Overdue: ${dl.taskTitle}`
        : `Due in ${dl.daysUntilDue}d: ${dl.taskTitle}`;

    return {
      id: `deadline_${dl.taskTitle.replace(/\s+/g, "_").toLowerCase()}`,
      sourceType: "custom" as const,
      tier: URGENCY_TO_TIER[dl.urgency],
      title: label,
      description: `This task is ${dl.urgency === "overdue" ? "past its deadline" : `due on ${dl.dueDate.toLocaleDateString()}`}.`,
      icon: URGENCY_ICON[dl.urgency],
      domain: dl.domain,
      status: "active" as const,
      relevanceScore: URGENCY_RELEVANCE[dl.urgency],
      createdAt: new Date().toISOString(),
      deadline: dl.dueDate.toISOString(),
      snoozeCount: 0,
      parentId,
    };
  });
}
