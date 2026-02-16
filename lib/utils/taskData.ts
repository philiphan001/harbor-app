// Storage for task-specific captured data
// Write-through: saves to localStorage (fast) + Supabase (persistent)
import { getActiveParentId } from "./parentProfile";

const STORAGE_KEY = "harbor_task_data";

import type { TaskDataPayload } from "@/lib/types/taskCapture";

// --- Write-through to Supabase (fire-and-forget) ---

function syncTaskDataToDb(
  parentId: string,
  toolName: string,
  taskTitle: string,
  data: TaskDataPayload
): void {
  fetch("/api/domain-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parentId, toolName, taskTitle, data }),
  }).catch(() => {
    // Silently fail — localStorage is the fallback
  });
}

export interface TaskData {
  taskTitle: string;
  toolName: string;
  data: TaskDataPayload;
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

export function saveTaskData(taskTitle: string, toolName: string, data: TaskDataPayload) {
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

  // Write-through to Supabase
  if (parentId) {
    syncTaskDataToDb(parentId, toolName, taskTitle, data);
  }

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

/**
 * Hydrate localStorage task data from the database.
 * Fetches domain data from /api/domain-data and merges into localStorage.
 * Only hydrates if localStorage is empty for this parent (unless force=true).
 */
export async function hydrateTaskDataFromDb(
  parentId: string,
  force = false
): Promise<boolean> {
  if (typeof window === "undefined") return false;

  if (!force) {
    const existing = getTaskDataForParent(parentId);
    if (existing.length > 0) return false;
  }

  try {
    const response = await fetch(
      `/api/domain-data?parentId=${encodeURIComponent(parentId)}`
    );
    if (!response.ok) return false;

    const { data } = await response.json();
    if (!data) return false;

    const now = new Date().toISOString();
    const newEntries: TaskData[] = [];

    // Convert DB domain data back into TaskData format
    if (data.providers && data.providers.length > 0) {
      for (const p of data.providers) {
        newEntries.push({
          taskTitle: `Doctor: ${p.name}`,
          toolName: "save_doctor_info",
          data: {
            name: p.name,
            phone: p.contactInfo?.phone || "",
            address: p.contactInfo?.address,
            specialty: p.specialty,
          },
          capturedAt: now,
          parentId,
        });
      }
    }

    if (data.medications && data.medications.length > 0) {
      newEntries.push({
        taskTitle: "Medications",
        toolName: "save_medication_list",
        data: {
          medications: data.medications.map((m: { name: string; dosage?: string; frequency?: string; purpose?: string }) => ({
            name: m.name,
            dosage: m.dosage || "",
            frequency: "",
            purpose: m.purpose,
          })),
        },
        capturedAt: now,
        parentId,
      });
    }

    if (data.insurance) {
      const policies = Array.isArray(data.insurance) ? data.insurance : [data.insurance];
      for (const policy of policies) {
        if (policy && typeof policy === "object") {
          newEntries.push({
            taskTitle: `Insurance: ${policy.provider || "Unknown"}`,
            toolName: "save_insurance_info",
            data: {
              provider: policy.provider || "",
              policyNumber: policy.policyNumber || "",
              groupNumber: policy.groupNumber,
              phone: policy.phone,
            },
            capturedAt: now,
            parentId,
          });
        }
      }
    }

    if (data.legalDocuments && data.legalDocuments.length > 0) {
      for (const doc of data.legalDocuments) {
        newEntries.push({
          taskTitle: `Legal: ${doc.documentType}`,
          toolName: "save_legal_document_info",
          data: {
            documentType: doc.documentType,
            status: doc.status,
            agent: doc.holder,
          },
          capturedAt: now,
          parentId,
        });
      }
    }

    if (newEntries.length === 0) return false;

    // Merge into localStorage (replace entries for this parent)
    const allData = getAllTaskDataRaw().filter((d) => d.parentId !== parentId);
    saveAllTaskData([...allData, ...newEntries]);

    return true;
  } catch {
    return false;
  }
}
