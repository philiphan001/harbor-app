// Storage for task-specific captured data
const STORAGE_KEY = "harbor_task_data";

export interface TaskData {
  taskTitle: string;
  toolName: string;
  data: any;
  capturedAt: string;
}

export function saveTaskData(taskTitle: string, toolName: string, data: any) {
  if (typeof window === "undefined") return;

  const allData = getAllTaskData();

  const newData: TaskData = {
    taskTitle,
    toolName,
    data,
    capturedAt: new Date().toISOString(),
  };

  // Add or update task data
  const existingIndex = allData.findIndex((d) => d.taskTitle === taskTitle);
  if (existingIndex >= 0) {
    allData[existingIndex] = newData;
  } else {
    allData.push(newData);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  console.log("💾 Saved task data:", newData);
}

export function getTaskData(taskTitle: string): TaskData | null {
  if (typeof window === "undefined") return null;

  const allData = getAllTaskData();
  return allData.find((d) => d.taskTitle === taskTitle) || null;
}

export function getAllTaskData(): TaskData[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading task data:", error);
    return [];
  }
}

export function removeTaskData(taskTitle: string) {
  if (typeof window === "undefined") return;

  const allData = getAllTaskData();
  const filtered = allData.filter((d) => d.taskTitle !== taskTitle);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function clearAllTaskData() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
