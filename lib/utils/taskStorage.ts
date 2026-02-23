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

// Add multiple tasks (associates with active parent, deduplicates by title)
export function addTasks(newTasks: Task[]): void {
  const activeParentId = getActiveParentId();

  // Clear the "tasks cleared" flag since we're adding new tasks
  if (activeParentId) clearClearedFlag(activeParentId);

  const allTasks = getAllTasks();

  // Build a set of existing titles for this parent to deduplicate
  const existingTitles = new Set(
    allTasks
      .filter((t) => t.parentId === activeParentId || !t.parentId)
      .map((t) => t.title.toLowerCase().trim())
  );

  const uniqueNewTasks = newTasks.filter(
    (task) => !existingTitles.has(task.title.toLowerCase().trim())
  );

  if (uniqueNewTasks.length === 0) return;

  const tasksWithParent: TaskWithParent[] = uniqueNewTasks.map((task) => ({
    ...task,
    parentId: activeParentId || undefined
  }));
  allTasks.push(...tasksWithParent);
  saveTasks(allTasks);

  // Write-through to Supabase
  if (activeParentId) syncTasksToDb(activeParentId, uniqueNewTasks);
}

// Mark a task as completed (keeps it in storage with completedAt timestamp)
export function completeTask(taskTitle: string): void {
  const activeParentId = getActiveParentId();
  const allTasks = getAllTasks();
  const updated = allTasks.map((t) => {
    if (t.title === taskTitle && (t.parentId === activeParentId || !t.parentId)) {
      return { ...t, completedAt: new Date().toISOString() };
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
