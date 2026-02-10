import { Task } from "@/lib/ai/claude";

const TASKS_KEY = "harbor_tasks";

export function getTasks(): Task[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(TASKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading tasks from localStorage:", error);
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Error saving tasks to localStorage:", error);
  }
}

export function addTask(task: Task): void {
  const tasks = getTasks();
  tasks.push(task);
  saveTasks(tasks);
}

export function addTasks(newTasks: Task[]): void {
  const tasks = getTasks();
  tasks.push(...newTasks);
  saveTasks(tasks);
}

export function removeTask(taskTitle: string): void {
  const tasks = getTasks();
  const filtered = tasks.filter((t) => t.title !== taskTitle);
  saveTasks(filtered);
}

export function clearTasks(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TASKS_KEY);
}
