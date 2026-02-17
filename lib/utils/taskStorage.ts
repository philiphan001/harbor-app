import { Task } from "@/lib/ai/claude";
import { getActiveParentId } from "./parentProfile";

// Task with parent association
export interface TaskWithParent extends Task {
  parentId?: string;
}

const TASKS_KEY = "harbor_tasks";

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

// Get tasks for active parent only
// Also includes orphaned tasks (no parentId) so tasks created before
// a parent profile exists are still visible.
export function getTasks(): Task[] {
  const activeParentId = getActiveParentId();
  if (!activeParentId) return getAllTasks();

  const allTasks = getAllTasks();
  return allTasks.filter((t) => t.parentId === activeParentId || !t.parentId);
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

// Add a single task (associates with active parent)
export function addTask(task: Task): void {
  const activeParentId = getActiveParentId();
  const allTasks = getAllTasks();
  const taskWithParent: TaskWithParent = {
    ...task,
    parentId: activeParentId || undefined
  };
  allTasks.push(taskWithParent);
  saveTasks(allTasks);
}

// Add multiple tasks (associates with active parent)
export function addTasks(newTasks: Task[]): void {
  const activeParentId = getActiveParentId();
  const allTasks = getAllTasks();
  const tasksWithParent: TaskWithParent[] = newTasks.map((task) => ({
    ...task,
    parentId: activeParentId || undefined
  }));
  allTasks.push(...tasksWithParent);
  saveTasks(allTasks);

  // Write-through to Supabase
  if (activeParentId) syncTasksToDb(activeParentId, newTasks);
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
