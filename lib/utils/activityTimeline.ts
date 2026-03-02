import { getCompletedTasks } from "./taskStorage";
import { getAllTaskData } from "./taskData";
import { getLifeEvents } from "./lifeEventStorage";
import { getBriefingsForParent } from "./briefingStorage";
import { getActiveParentId } from "./parentProfile";
import type { NudgeInstance } from "@/lib/types/nudges";
import { CALENDAR_NUDGES } from "@/lib/data/nudgeDefinitions";

export type ActivityType =
  | "task_completed"
  | "data_captured"
  | "life_event"
  | "nudge_dismissed"
  | "nudge_snoozed"
  | "briefing_generated";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string; // ISO
  domain?: string;
  icon: string;
  actionUrl?: string;
  /** For nudge events, the nudgeDefinitionId to allow reactivation */
  nudgeDefinitionId?: string;
}

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

function formatLifeEventType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getActivityTimeline(filter?: ActivityType): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const parentId = getActiveParentId() || "";

  // 1. Completed tasks
  if (!filter || filter === "task_completed") {
    const tasks = getCompletedTasks();
    for (const task of tasks) {
      events.push({
        id: `task_${task.title}`,
        type: "task_completed",
        title: task.title,
        description: task.why,
        timestamp: task.completedAt || new Date().toISOString(),
        domain: task.domain,
        icon: "✅",
      });
    }
  }

  // 2. Data captures
  if (!filter || filter === "data_captured") {
    const taskData = getAllTaskData();
    for (const td of taskData) {
      events.push({
        id: `data_${td.taskTitle}`,
        type: "data_captured",
        title: `Data captured: ${td.taskTitle}`,
        description: `Via ${td.toolName}`,
        timestamp: td.capturedAt,
        icon: "📋",
      });
    }
  }

  // 3. Life events
  if (!filter || filter === "life_event") {
    const lifeEvents = getLifeEvents();
    for (const le of lifeEvents) {
      events.push({
        id: `life_${le.id}`,
        type: "life_event",
        title: formatLifeEventType(le.type),
        description: le.notes || `${le.severity} severity`,
        timestamp: le.reportedAt,
        icon: "⚡",
      });
    }
  }

  // 4. Nudge dismissals & snoozes
  if (!filter || filter === "nudge_dismissed" || filter === "nudge_snoozed") {
    const instances = getNudgeInstances().filter((i) => i.parentId === parentId);
    for (const inst of instances) {
      if (inst.status === "dismissed" && (!filter || filter === "nudge_dismissed") && inst.dismissedAt) {
        const def = CALENDAR_NUDGES.find((n) => n.id === inst.nudgeDefinitionId);
        events.push({
          id: `nudge_dismiss_${inst.id}`,
          type: "nudge_dismissed",
          title: `Dismissed: ${def?.title || inst.nudgeDefinitionId}`,
          description: def?.description || "Reminder dismissed",
          timestamp: inst.dismissedAt,
          icon: "🔕",
          nudgeDefinitionId: inst.nudgeDefinitionId,
        });
      }
      if (inst.status === "snoozed" && (!filter || filter === "nudge_snoozed") && inst.snoozedUntil) {
        const def = CALENDAR_NUDGES.find((n) => n.id === inst.nudgeDefinitionId);
        events.push({
          id: `nudge_snooze_${inst.id}`,
          type: "nudge_snoozed",
          title: `Snoozed: ${def?.title || inst.nudgeDefinitionId}`,
          description: `Snoozed until ${new Date(inst.snoozedUntil).toLocaleDateString()}`,
          timestamp: inst.snoozedUntil,
          icon: "💤",
          nudgeDefinitionId: inst.nudgeDefinitionId,
        });
      }
    }
  }

  // 5. Briefings
  if (!filter || filter === "briefing_generated") {
    if (parentId) {
      const briefings = getBriefingsForParent(parentId);
      for (const b of briefings) {
        events.push({
          id: `briefing_${b.briefingId}`,
          type: "briefing_generated",
          title: `Weekly Briefing`,
          description: `Week of ${new Date(b.weekOf).toLocaleDateString()} — ${b.signalCount} signals, ${b.urgentCount} urgent`,
          timestamp: b.generatedAt,
          icon: "📰",
          actionUrl: `/briefing/${b.briefingId}`,
        });
      }
    }
  }

  // Sort by timestamp descending
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return events;
}
