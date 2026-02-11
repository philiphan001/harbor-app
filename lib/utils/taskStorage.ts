import { Task } from "@/lib/ai/claude";
import { getActiveParentId } from "./parentProfile";

// Task with parent association
export interface TaskWithParent extends Task {
  parentId?: string;
}

const TASKS_KEY = "harbor_tasks";

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
export function getTasks(): Task[] {
  const activeParentId = getActiveParentId();
  if (!activeParentId) return getAllTasks();

  const allTasks = getAllTasks();
  return allTasks.filter((t) => t.parentId === activeParentId);
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
}

// Remove a task (from active parent's tasks)
export function removeTask(taskTitle: string): void {
  const activeParentId = getActiveParentId();
  const allTasks = getAllTasks();
  const filtered = allTasks.filter(
    (t) => !(t.title === taskTitle && t.parentId === activeParentId)
  );
  saveTasks(filtered);
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
}
