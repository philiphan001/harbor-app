import { getAllDetections } from "./agentStorage";
import { getCompletedTasks } from "./taskStorage";
import { getAllTaskData } from "./taskData";

const FIRST_USE_KEY = "harbor_first_use";
const ESTIMATED_BENEFIT_VALUE = 2400; // Conservative annual estimate per benefit match

export interface ValueStats {
  totalDetections: number;
  tasksConverted: number;
  tasksCompleted: number;
  documentsCaptured: number;
  estimatedSavings: number;
  activeAgentCount: number;
  daysSinceFirstUse: number;
}

function getFirstUseDate(): string {
  if (typeof window === "undefined") return new Date().toISOString();
  try {
    const stored = localStorage.getItem(FIRST_USE_KEY);
    if (stored) return stored;
    const now = new Date().toISOString();
    localStorage.setItem(FIRST_USE_KEY, now);
    return now;
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Compute cumulative value statistics across the user's Harbor usage.
 */
export function computeValueStats(now?: Date): ValueStats {
  const currentDate = now ?? new Date();
  const detections = getAllDetections();
  const completedTasks = getCompletedTasks();
  const taskData = getAllTaskData();

  // Count tasks converted from detections
  const tasksConverted = detections.filter((d) => d.convertedToTask).length;

  // Count benefit_eligibility detections for savings estimate
  const benefitDetections = detections.filter(
    (d) => d.agentType === "benefit_eligibility" && d.relevanceScore !== "low"
  );
  const estimatedSavings = benefitDetections.length * ESTIMATED_BENEFIT_VALUE;

  // Count unique active agent types from detections
  const activeAgentTypes = new Set(detections.map((d) => d.agentType));

  // Days since first use
  const firstUse = new Date(getFirstUseDate());
  const daysSinceFirstUse = Math.max(
    0,
    Math.floor((currentDate.getTime() - firstUse.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    totalDetections: detections.length,
    tasksConverted,
    tasksCompleted: completedTasks.length,
    documentsCaptured: taskData.length,
    estimatedSavings,
    activeAgentCount: activeAgentTypes.size,
    daysSinceFirstUse,
  };
}
