import type { LifeEventType, LifeEventSeverity, LifeEvent, LifeEventTaskTemplate } from "@/lib/types/lifeEvents";
import { LIFE_EVENT_TEMPLATES } from "@/lib/data/lifeEventTemplates";
import { saveLifeEvent } from "./lifeEventStorage";
import { getTasks, addTask } from "./taskStorage";
import { getActiveParentId } from "./parentProfile";
import type { Task } from "@/lib/ai/claude";

const SEVERITY_ORDER: Record<LifeEventSeverity, number> = {
  mild: 0,
  moderate: 1,
  severe: 2,
};

function meetsSeverity(required: LifeEventSeverity | undefined, actual: LifeEventSeverity): boolean {
  if (!required) return true;
  return SEVERITY_ORDER[actual] >= SEVERITY_ORDER[required];
}

/**
 * Generate task objects from an event's templates, deduplicating against existing tasks.
 */
export function generateTasksForEvent(
  eventType: LifeEventType,
  severity: LifeEventSeverity
): Task[] {
  const template = LIFE_EVENT_TEMPLATES.find((t) => t.eventType === eventType);
  if (!template) return [];

  const existingTasks = getTasks();
  const existingTitles = new Set(existingTasks.map((t) => t.title.toLowerCase()));

  const tasks: Task[] = [];
  const now = new Date();

  for (const taskTemplate of template.taskTemplates) {
    if (!meetsSeverity(taskTemplate.minSeverity, severity)) continue;

    // Deduplicate
    if (existingTitles.has(taskTemplate.title.toLowerCase())) continue;

    let dueDate: string | undefined;
    if (taskTemplate.dueDaysAfterEvent) {
      const due = new Date(now);
      due.setDate(due.getDate() + taskTemplate.dueDaysAfterEvent);
      dueDate = due.toISOString().split("T")[0];
    }

    tasks.push({
      title: taskTemplate.title,
      domain: taskTemplate.domain as Task["domain"],
      priority: taskTemplate.priority,
      why: taskTemplate.description,
      suggestedActions: dueDate ? [`Complete by ${dueDate}`] : [],
    });
  }

  return tasks;
}

/**
 * Report a life event: creates the event record, generates tasks, and saves both.
 * Returns the generated tasks for display.
 */
export function reportLifeEvent(
  type: LifeEventType,
  severity: LifeEventSeverity,
  notes?: string
): { event: LifeEvent; tasks: Task[] } {
  const parentId = getActiveParentId() || "unknown";
  const generatedTasks = generateTasksForEvent(type, severity);

  // Save tasks
  const taskIds: string[] = [];
  for (const task of generatedTasks) {
    addTask(task);
    taskIds.push(task.title); // Using title as identifier since Task doesn't have id
  }

  // Create and save event
  const event: LifeEvent = {
    id: `event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    parentId,
    reportedAt: new Date().toISOString(),
    notes,
    severity,
    generatedTaskIds: taskIds,
  };

  saveLifeEvent(event);

  return { event, tasks: generatedTasks };
}
