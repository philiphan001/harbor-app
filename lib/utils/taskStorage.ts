import { Task } from "@/lib/ai/claude";
import { getActiveParentId } from "./parentProfile";

// Task with parent association
export interface TaskWithParent extends Task {
  parentId?: string;
}

const TASKS_KEY = "harbor_tasks";
const TASKS_CLEARED_KEY = "harbor_tasks_cleared";

// --- Write-through to Supabase (fire-and-forget) ---

function syncTasksToDb(parentId: string, tasks: Task[]): void {
  fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parentId, tasks }),
  }).catch(() => {});
}

function removeTaskFromDb(parentId: string, title: string): void {
  fetch(`/api/tasks?parentId=${encodeURIComponent(parentId)}&title=${encodeURIComponent(title)}`, {
    method: "DELETE",
  }).catch(() => {});
}

function deleteAllTasksFromDb(parentId: string): void {
  fetch(`/api/tasks?parentId=${encodeURIComponent(parentId)}`, {
    method: "DELETE",
  }).catch(() => {});
}

/**
 * Hydrate localStorage tasks from the database.
 * If force=true, overwrites localStorage with DB data.
 */
export async function hydrateTasksFromDb(parentId: string, force = false): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // Don't hydrate if tasks were intentionally cleared for this parent
  try {
    const cleared: string[] = JSON.parse(localStorage.getItem(TASKS_CLEARED_KEY) || "[]");
    if (cleared.includes(parentId)) return false;
  } catch {}

  if (!force) {
    const existing = getTasksForParent(parentId);
    if (existing.length > 0) return false;
  }

  try {
    const response = await fetch(`/api/tasks?parentId=${encodeURIComponent(parentId)}`);
    if (!response.ok) return false;

    const { tasks: dbTasks } = await response.json();
    if (!dbTasks || dbTasks.length === 0) return false;

    // Merge DB tasks into localStorage (replace tasks for this parent)
    const allTasks = getAllTasks().filter((t) => t.parentId !== parentId);
    const withParent: TaskWithParent[] = dbTasks.map((t: Task) => ({
      ...t,
      parentId,
    }));
    saveTasks([...allTasks, ...withParent]);
    return true;
  } catch {
    return false;
  }
}

// Get all tasks (across all parents)
export function getAllTasks(): TaskWithParent[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(TASKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading tasks from localStorage:", error);
    return [];
  }
}

// Get tasks for active parent only (pending by default)
// Also includes orphaned tasks (no parentId) so tasks created before
// a parent profile exists are still visible.
export function getTasks(includeCompleted = false): Task[] {
  const activeParentId = getActiveParentId();
  let tasks: TaskWithParent[];

  if (!activeParentId) {
    tasks = getAllTasks();
  } else {
    tasks = getAllTasks().filter((t) => t.parentId === activeParentId || !t.parentId);
  }

  if (!includeCompleted) {
    tasks = tasks.filter((t) => !t.completedAt);
  }

  return tasks;
}

// Get only completed tasks for active parent
export function getCompletedTasks(): Task[] {
  const activeParentId = getActiveParentId();
  const allTasks = getAllTasks();

  return allTasks.filter(
    (t) => t.completedAt && (t.parentId === activeParentId || !t.parentId)
  );
}

// Get tasks for a specific parent
export function getTasksForParent(parentId: string): Task[] {
  const allTasks = getAllTasks();
  return allTasks.filter((t) => t.parentId === parentId);
}

// Save all tasks
export function saveTasks(tasks: TaskWithParent[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Error saving tasks to localStorage:", error);
  }
}

function clearClearedFlag(parentId: string): void {
  try {
    const cleared: string[] = JSON.parse(localStorage.getItem(TASKS_CLEARED_KEY) || "[]");
    const updated = cleared.filter((id) => id !== parentId);
    if (updated.length === 0) {
      localStorage.removeItem(TASKS_CLEARED_KEY);
    } else {
      localStorage.setItem(TASKS_CLEARED_KEY, JSON.stringify(updated));
    }
  } catch {}
}

// Add a single task (associates with active parent)
export function addTask(task: Task): void {
  const activeParentId = getActiveParentId();
  if (activeParentId) clearClearedFlag(activeParentId);
  const allTasks = getAllTasks();
  const taskWithParent: TaskWithParent = {
    ...task,
    parentId: activeParentId || undefined
  };
  allTasks.push(taskWithParent);
  saveTasks(allTasks);
}

// Extract meaningful keywords from a task title for fuzzy dedup
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "for", "in", "on", "to", "of", "with",
  "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
  "do", "does", "did", "will", "would", "could", "should", "may", "might",
  "so", "you", "your", "their", "that", "this", "it", "its", "can",
  "all", "each", "every", "both", "few", "more", "most", "other", "some",
  "up", "about", "into", "through", "during", "before", "after",
  "harbor", "record", "create", "document", "set", "establish", "get",
  "make", "ensure", "confirm", "check", "verify", "update", "add",
  "complete", "gather", "collect", "obtain", "secure", "prepare",
]);

function extractKeywords(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
}

function isSimilarTask(existingTitle: string, existingDomain: string, newTitle: string, newDomain: string): boolean {
  // Exact match (case-insensitive)
  if (existingTitle.toLowerCase().trim() === newTitle.toLowerCase().trim()) return true;

  // Different domains are never duplicates
  if (existingDomain !== newDomain) return false;

  // Keyword overlap check
  const existingKw = extractKeywords(existingTitle);
  const newKw = extractKeywords(newTitle);
  if (existingKw.size === 0 || newKw.size === 0) return false;

  let overlap = 0;
  for (const word of newKw) {
    if (existingKw.has(word)) overlap++;
  }

  const smaller = Math.min(existingKw.size, newKw.size);
  // If 60%+ of the smaller keyword set overlaps, it's a duplicate
  return smaller > 0 && overlap / smaller >= 0.6;
}

// Add multiple tasks (associates with active parent, deduplicates by similarity)
export function addTasks(newTasks: Task[]): void {
  const activeParentId = getActiveParentId();

  // Clear the "tasks cleared" flag since we're adding new tasks
  if (activeParentId) clearClearedFlag(activeParentId);

  const allTasks = getAllTasks();

  // Get existing tasks for this parent
  const existingTasks = allTasks.filter(
    (t) => t.parentId === activeParentId || !t.parentId
  );

  const uniqueNewTasks = newTasks.filter((task) => {
    // Check against existing tasks
    const isDupe = existingTasks.some((existing) =>
      isSimilarTask(existing.title, existing.domain, task.title, task.domain)
    );
    return !isDupe;
  });

  // Also deduplicate within the new batch itself
  const dedupedNew: Task[] = [];
  for (const task of uniqueNewTasks) {
    const isDupeInBatch = dedupedNew.some((added) =>
      isSimilarTask(added.title, added.domain, task.title, task.domain)
    );
    if (!isDupeInBatch) dedupedNew.push(task);
  }

  if (dedupedNew.length === 0) return;

  const tasksWithParent: TaskWithParent[] = dedupedNew.map((task) => ({
    ...task,
    parentId: activeParentId || undefined
  }));
  allTasks.push(...tasksWithParent);
  saveTasks(allTasks);

  // Write-through to Supabase
  if (activeParentId) syncTasksToDb(activeParentId, dedupedNew);
}

// Calculate the next due date based on recurrence frequency
function calculateNextDueDate(
  frequency: "monthly" | "quarterly" | "semi-annual" | "annual",
  fromDate?: string
): string {
  const base = fromDate ? new Date(fromDate) : new Date();
  switch (frequency) {
    case "monthly":
      base.setMonth(base.getMonth() + 1);
      break;
    case "quarterly":
      base.setMonth(base.getMonth() + 3);
      break;
    case "semi-annual":
      base.setMonth(base.getMonth() + 6);
      break;
    case "annual":
      base.setFullYear(base.getFullYear() + 1);
      break;
  }
  return base.toISOString().split("T")[0]; // ISO date only
}

// Create the next occurrence of a recurring task
function createNextRecurrence(task: TaskWithParent): TaskWithParent | null {
  if (!task.recurrence) return null;

  const nextDueDate = calculateNextDueDate(
    task.recurrence.frequency,
    task.recurrence.nextDueDate
  );

  return {
    ...task,
    completedAt: undefined,
    recurrence: {
      ...task.recurrence,
      nextDueDate,
    },
    // Reset checklist items if present
    checklist: task.checklist?.map((item) => ({ ...item, completed: false })),
  };
}

// Mark a task as completed (keeps it in storage with completedAt timestamp)
// If the task is recurring, auto-creates the next occurrence
export function completeTask(taskTitle: string): void {
  const activeParentId = getActiveParentId();
  const allTasks = getAllTasks();

  // Find the task being completed
  const completingTask = allTasks.find(
    (t) => t.title === taskTitle && (t.parentId === activeParentId || !t.parentId) && !t.completedAt
  );

  const updated = allTasks.map((t) => {
    if (t.title === taskTitle && (t.parentId === activeParentId || !t.parentId) && !t.completedAt) {
      return { ...t, completedAt: new Date().toISOString() };
    }
    return t;
  });

  // If recurring, create next occurrence
  if (completingTask?.recurrence) {
    const nextTask = createNextRecurrence(completingTask);
    if (nextTask) {
      updated.push(nextTask);
    }
  }

  saveTasks(updated);

  // Write-through to Supabase
  if (activeParentId) syncTasksToDb(activeParentId, updated.filter((t) => t.parentId === activeParentId));
}

// Toggle a checklist item on a task
export function toggleChecklistItem(taskTitle: string, itemId: string): void {
  const activeParentId = getActiveParentId();
  const allTasks = getAllTasks();
  const updated = allTasks.map((t) => {
    if (
      t.title === taskTitle &&
      (t.parentId === activeParentId || !t.parentId) &&
      t.checklist
    ) {
      return {
        ...t,
        checklist: t.checklist.map((item) =>
          item.id === itemId ? { ...item, completed: !item.completed } : item
        ),
      };
    }
    return t;
  });
  saveTasks(updated);

  // Write-through to Supabase
  if (activeParentId) syncTasksToDb(activeParentId, updated.filter((t) => t.parentId === activeParentId));
}

// Remove a task (from active parent's tasks)
export function removeTask(taskTitle: string): void {
  const activeParentId = getActiveParentId();
  const allTasks = getAllTasks();
  const filtered = allTasks.filter(
    (t) => !(t.title === taskTitle && t.parentId === activeParentId)
  );
  saveTasks(filtered);

  // Write-through to Supabase
  if (activeParentId) removeTaskFromDb(activeParentId, taskTitle);
}

// Clear all tasks
export function clearTasks(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TASKS_KEY);
}

// Clear tasks for active parent only
export function clearTasksForActiveParent(): void {
  const activeParentId = getActiveParentId();
  if (!activeParentId) {
    clearTasks();
    return;
  }

  const allTasks = getAllTasks();
  const filtered = allTasks.filter((t) => t.parentId !== activeParentId);
  saveTasks(filtered);

  // Mark this parent's tasks as intentionally cleared so hydration
  // doesn't restore them from the DB before the delete completes
  try {
    const cleared = JSON.parse(localStorage.getItem(TASKS_CLEARED_KEY) || "[]");
    if (!cleared.includes(activeParentId)) cleared.push(activeParentId);
    localStorage.setItem(TASKS_CLEARED_KEY, JSON.stringify(cleared));
  } catch {}

  // Write-through to Supabase
  deleteAllTasksFromDb(activeParentId);
}

// Delete all tasks for a specific parent
export function deleteTasksForParent(parentId: string): void {
  const allTasks = getAllTasks();
  const filtered = allTasks.filter((t) => t.parentId !== parentId);
  saveTasks(filtered);
}

// Clean up orphaned tasks (no parentId) by assigning them to a parent
export function assignOrphanedTasks(parentId: string): number {
  const allTasks = getAllTasks();
  let count = 0;
  const updated = allTasks.map((t) => {
    if (!t.parentId) {
      count++;
      return { ...t, parentId };
    }
    return t;
  });
  if (count > 0) saveTasks(updated);
  return count;
}

// Remove all orphaned tasks (no parentId)
export function removeOrphanedTasks(): number {
  const allTasks = getAllTasks();
  const filtered = allTasks.filter((t) => t.parentId);
  const removed = allTasks.length - filtered.length;
  if (removed > 0) saveTasks(filtered);
  return removed;
}
