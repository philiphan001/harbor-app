// Database operations for Tasks

import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/utils/logger";
import { getSituationId } from "./profiles";
import type { Priority, ExtendedDomain } from "@/lib/constants/domains";

const log = createLogger("db/tasks");

export interface TaskInput {
  title: string;
  priority: Priority;
  domain: ExtendedDomain;
  why: string;
  suggestedActions: string[];
}

export interface TaskRecord {
  id: string;
  title: string;
  description: string | null;
  domain: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  // Extended fields from the original Task type
  why?: string;
  suggestedActions?: string[];
}

/**
 * Save tasks for a parent (bulk upsert by title).
 */
export async function saveTasks(
  parentId: string,
  tasks: TaskInput[]
): Promise<TaskRecord[]> {
  const situationId = await getSituationId(parentId);
  if (!situationId) {
    log.warn("No situation found for parent, skipping task save", { parentId });
    return [];
  }

  log.info("Saving tasks", { situationId, count: tasks.length });

  const results: TaskRecord[] = [];

  for (const task of tasks) {
    // Upsert by title within situation
    const existing = await prisma.task.findFirst({
      where: { situationId, title: task.title },
    });

    const description = JSON.stringify({
      why: task.why,
      suggestedActions: task.suggestedActions,
    });

    let record;
    if (existing) {
      record = await prisma.task.update({
        where: { id: existing.id },
        data: {
          priority: task.priority,
          domain: task.domain,
          description,
        },
      });
    } else {
      record = await prisma.task.create({
        data: {
          situationId,
          title: task.title,
          priority: task.priority,
          domain: task.domain,
          description,
          status: "pending",
        },
      });
    }

    results.push(toTaskRecord(record));
  }

  return results;
}

/**
 * Get all tasks for a parent.
 */
export async function getTasks(parentId: string): Promise<TaskRecord[]> {
  const situationId = await getSituationId(parentId);
  if (!situationId) return [];

  const tasks = await prisma.task.findMany({
    where: { situationId },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });

  return tasks.map(toTaskRecord);
}

/**
 * Update a task's status.
 */
export async function updateTaskStatus(
  taskId: string,
  status: string
): Promise<TaskRecord | null> {
  try {
    const record = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        completedAt: status === "completed" ? new Date() : null,
      },
    });
    return toTaskRecord(record);
  } catch {
    log.warn("Task not found for update", { taskId });
    return null;
  }
}

/**
 * Remove a task by title for a parent.
 */
export async function removeTask(
  parentId: string,
  taskTitle: string
): Promise<boolean> {
  const situationId = await getSituationId(parentId);
  if (!situationId) return false;

  const result = await prisma.task.deleteMany({
    where: { situationId, title: taskTitle },
  });

  return result.count > 0;
}

/**
 * Delete all tasks for a parent.
 */
export async function deleteAllTasks(parentId: string): Promise<number> {
  const situationId = await getSituationId(parentId);
  if (!situationId) return 0;

  const result = await prisma.task.deleteMany({
    where: { situationId },
  });

  return result.count;
}

// --- Internal helpers ---

function toTaskRecord(
  record: {
    id: string;
    title: string;
    description: string | null;
    domain: string | null;
    priority: string;
    status: string;
    dueDate: Date | null;
    completedAt: Date | null;
    createdAt: Date;
  }
): TaskRecord {
  let why: string | undefined;
  let suggestedActions: string[] | undefined;

  if (record.description) {
    try {
      const parsed = JSON.parse(record.description);
      why = parsed.why;
      suggestedActions = parsed.suggestedActions;
    } catch {
      // description is plain text, not JSON
    }
  }

  return {
    id: record.id,
    title: record.title,
    description: record.description,
    domain: record.domain,
    priority: record.priority,
    status: record.status,
    dueDate: record.dueDate?.toISOString() ?? null,
    completedAt: record.completedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    why,
    suggestedActions,
  };
}
