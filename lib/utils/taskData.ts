// Storage for task-specific captured data
import { getActiveParentId } from "./parentProfile";

const STORAGE_KEY = "harbor_task_data";

export interface TaskData {
  taskTitle: string;
  toolName: string;
  data: any;
  capturedAt: string;
  parentId?: string;
}

// Get all task data from storage (raw, unfiltered)
function getAllTaskDataRaw(): TaskData[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading task data:", error);
    return [];
  }
}

function saveAllTaskData(data: TaskData[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function saveTaskData(taskTitle: string, toolName: string, data: any) {
  if (typeof window === "undefined") return;

  const parentId = getActiveParentId();
  const allData = getAllTaskDataRaw();

  const newData: TaskData = {
    taskTitle,
    toolName,
    data,
    capturedAt: new Date().toISOString(),
    parentId: parentId || undefined,
  };

  // Add or update task data (scoped to parent)
  const existingIndex = allData.findIndex(
    (d) => d.taskTitle === taskTitle && d.parentId === parentId
  );
  if (existingIndex >= 0) {
    allData[existingIndex] = newData;
  } else {
    allData.push(newData);
  }

  saveAllTaskData(allData);
  console.log("💾 Saved task data:", newData);
}

export function getTaskData(taskTitle: string): TaskData | null {
  if (typeof window === "undefined") return null;

  const allData = getAllTaskData();
  return allData.find((d) => d.taskTitle === taskTitle) || null;
}

// Get task data for the active parent
export function getAllTaskData(): TaskData[] {
  const parentId = getActiveParentId();
  if (!parentId) return getAllTaskDataRaw();

  return getAllTaskDataRaw().filter((d) => d.parentId === parentId);
}

// Get task data for a specific parent
export function getTaskDataForParent(parentId: string): TaskData[] {
  return getAllTaskDataRaw().filter((d) => d.parentId === parentId);
}

export function removeTaskData(taskTitle: string) {
  if (typeof window === "undefined") return;

  const parentId = getActiveParentId();
  const allData = getAllTaskDataRaw();
  const filtered = allData.filter(
    (d) => !(d.taskTitle === taskTitle && d.parentId === parentId)
  );
  saveAllTaskData(filtered);
}

// Delete all task data for a specific parent
export function deleteTaskDataForParent(parentId: string): void {
  const allData = getAllTaskDataRaw();
  const filtered = allData.filter((d) => d.parentId !== parentId);
  saveAllTaskData(filtered);
}

export function clearAllTaskData() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
