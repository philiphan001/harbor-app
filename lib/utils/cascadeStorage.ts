import type { CascadeInstance, StepStatus } from "@/lib/types/cascade";
import type { CareTransitionType } from "@/lib/types/careTransitions";
import { getActiveParentId } from "./parentProfile";

const STORAGE_KEY = "harbor_cascade_instances";

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

function getAllCascades(): CascadeInstance[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCascades(cascades: CascadeInstance[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cascades));
  } catch {}
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getActiveCascades(): CascadeInstance[] {
  const parentId = getActiveParentId();
  if (!parentId) return [];
  return getAllCascades().filter(
    (c) => c.parentId === parentId && c.status === "active",
  );
}

export function getCascadeForPlaybook(
  playbookId: CareTransitionType,
): CascadeInstance | null {
  const parentId = getActiveParentId();
  if (!parentId) return null;
  return (
    getAllCascades().find(
      (c) => c.playbookId === playbookId && c.parentId === parentId,
    ) ?? null
  );
}

export function createCascade(
  activationId: string,
  playbookId: CareTransitionType,
  totalSteps: number,
): CascadeInstance {
  // Dedup guard
  const existing = getCascadeForPlaybook(playbookId);
  if (existing) return existing;

  const stepProgress: Record<number, StepStatus> = {};
  for (let i = 1; i <= totalSteps; i++) {
    stepProgress[i] = i <= 2 ? "actionable" : "locked";
  }

  const cascade: CascadeInstance = {
    id: `cascade_${playbookId}_${Date.now()}`,
    playbookId,
    activationId,
    parentId: getActiveParentId() || "unknown",
    createdAt: new Date().toISOString(),
    status: "active",
    stepProgress,
  };

  const all = getAllCascades();
  all.push(cascade);
  saveCascades(all);
  return cascade;
}

export function completeStep(
  cascadeId: string,
  stepNumber: number,
): void {
  const all = getAllCascades();
  const cascade = all.find((c) => c.id === cascadeId);
  if (!cascade) return;

  cascade.stepProgress[stepNumber] = "completed";

  // Unlock next locked step (by stepNumber order)
  const stepNumbers = Object.keys(cascade.stepProgress)
    .map(Number)
    .sort((a, b) => a - b);
  for (const sn of stepNumbers) {
    if (cascade.stepProgress[sn] === "locked") {
      cascade.stepProgress[sn] = "actionable";
      break;
    }
  }

  // Auto-resolve when all steps completed
  const allCompleted = stepNumbers.every(
    (sn) => cascade.stepProgress[sn] === "completed",
  );
  if (allCompleted) {
    cascade.status = "resolved";
  }

  saveCascades(all);
}

export function resolveCascade(cascadeId: string): void {
  const all = getAllCascades();
  const cascade = all.find((c) => c.id === cascadeId);
  if (!cascade) return;
  cascade.status = "resolved";
  saveCascades(all);
}
