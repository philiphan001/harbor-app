import type { Task } from "@/lib/ai/claude";
import type { AgentDetection } from "@/lib/types/agents";

/**
 * Extract a due date from a task's recurrence or suggestedActions text.
 * Looks for recurrence.nextDueDate first, then "Complete by YYYY-MM-DD" patterns.
 */
export function extractDueDate(task: Task): Date | null {
  // 1. Check recurrence nextDueDate
  if (task.recurrence?.nextDueDate) {
    const d = new Date(task.recurrence.nextDueDate);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. Scan suggestedActions for date patterns
  if (task.suggestedActions) {
    for (const action of task.suggestedActions) {
      const match = action.match(/(?:Complete|Due|Deadline|Submit|File)\s+by\s+(\d{4}-\d{2}-\d{2})/i);
      if (match) {
        const d = new Date(match[1]);
        if (!isNaN(d.getTime())) return d;
      }
    }
  }

  return null;
}

interface ReprioritizeContext {
  now?: Date;
  detections?: AgentDetection[];
}

/**
 * Re-prioritize tasks based on deadline urgency and signal correlation.
 * Returns a NEW array — does not mutate the input.
 */
export function reprioritizeTasks(tasks: Task[], ctx?: ReprioritizeContext): Task[] {
  const now = ctx?.now ?? new Date();
  const detections = ctx?.detections ?? [];
  const unhandledDetections = detections.filter((d) => !d.handled);

  return tasks.map((task) => {
    let newPriority = task.priority;

    // Rule 1: Deadline escalation
    const dueDate = extractDueDate(task);
    if (dueDate) {
      const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil <= 3) {
        // Escalate to high regardless
        newPriority = "high";
      } else if (daysUntil <= 7 && newPriority === "low") {
        // Escalate low → medium
        newPriority = "medium";
      }
    }

    // Rule 2: Signal correlation — if an unhandled detection shares domain + keyword overlap
    if (newPriority === "low" && unhandledDetections.length > 0) {
      const taskWords = new Set(
        task.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
      );

      const hasCorrelation = unhandledDetections.some((det) => {
        if (det.domain !== task.domain && det.domain !== "caregiving") return false;
        const detWords = det.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
        return detWords.some((w) => taskWords.has(w));
      });

      if (hasCorrelation) {
        newPriority = "medium";
      }
    }

    if (newPriority === task.priority) return task;
    return { ...task, priority: newPriority };
  });
}
