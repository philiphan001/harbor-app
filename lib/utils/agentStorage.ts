// Agent activity storage (LocalStorage for MVP)
import { AgentRun, AgentDetection, AgentActivity, AgentType, AGENT_METADATA } from "@/lib/types/agents";
import { getParentProfile } from "./parentProfile";
import { getTasks } from "./taskStorage";

const AGENT_RUNS_KEY = "harbor_agent_runs";
const AGENT_DETECTIONS_KEY = "harbor_agent_detections";

// Get all agent runs
export function getAllAgentRuns(): AgentRun[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(AGENT_RUNS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading agent runs:", error);
    return [];
  }
}

// Save agent run
export function saveAgentRun(run: AgentRun): void {
  if (typeof window === "undefined") return;

  try {
    const runs = getAllAgentRuns();
    runs.push(run);
    // Keep only last 100 runs
    const recentRuns = runs.slice(-100);
    localStorage.setItem(AGENT_RUNS_KEY, JSON.stringify(recentRuns));
  } catch (error) {
    console.error("Error saving agent run:", error);
  }
}

// Get all detections
export function getAllDetections(): AgentDetection[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(AGENT_DETECTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading detections:", error);
    return [];
  }
}

// Save detection
export function saveDetection(detection: AgentDetection): void {
  if (typeof window === "undefined") return;

  try {
    const detections = getAllDetections();
    detections.push(detection);
    // Keep only last 200 detections
    const recentDetections = detections.slice(-200);
    localStorage.setItem(AGENT_DETECTIONS_KEY, JSON.stringify(recentDetections));
  } catch (error) {
    console.error("Error saving detection:", error);
  }
}

// Mark detection as handled
export function markDetectionHandled(detectionId: string, handled: boolean): void {
  if (typeof window === "undefined") return;

  try {
    const detections = getAllDetections();
    const updated = detections.map((d) =>
      d.id === detectionId ? { ...d, handled } : d
    );
    localStorage.setItem(AGENT_DETECTIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error updating detection:", error);
  }
}

// Get agent activity summary
export function getAgentActivity(): AgentActivity {
  const runs = getAllAgentRuns();
  const detections = getAllDetections();
  const parentProfile = getParentProfile();
  const tasks = getTasks();

  // Calculate last run time for each agent (external agents only for monitoring page)
  const lastRunTimes: Record<AgentType, string> = {
    policy_monitor: "",
    provider_monitor: "",
    financial_monitor: "",
    news_monitor: "",
    calendar_reminder: "",
    deadline_tracker: "",
    task_prioritizer: "",
    weekly_summary: "",
  };

  runs.forEach((run) => {
    if (run.status === "completed" && run.completedAt) {
      if (!lastRunTimes[run.agentType] || run.completedAt > lastRunTimes[run.agentType]!) {
        lastRunTimes[run.agentType] = run.completedAt;
      }
    }
  });

  // Build agent status list (external agents only for monitoring page)
  const agents = (Object.keys(lastRunTimes) as AgentType[]).map((type) => {
    const metadata = AGENT_METADATA[type];
    const lastRun = lastRunTimes[type];
    const todayRuns = runs.filter(
      (r) =>
        r.agentType === type &&
        r.startedAt.startsWith(new Date().toISOString().split("T")[0])
    ).length;

    return {
      type,
      name: metadata.name,
      description: metadata.description,
      status: "idle" as const, // Will be "running" when actually running
      lastRun: lastRun || undefined,
      nextRun: undefined, // TODO: Calculate based on schedule
      runsToday: todayRuns,
      dataSource: "dataSource" in metadata ? metadata.dataSource : undefined,
    };
  });

  // Get recent detections (last 20, unhandled first)
  const sortedDetections = [...detections]
    .sort((a, b) => {
      // Sort by handled status first (unhandled first)
      if (a.handled !== b.handled) return a.handled ? 1 : -1;
      // Then by date (newest first)
      return b.detectedAt.localeCompare(a.detectedAt);
    })
    .slice(0, 20);

  return {
    agents,
    recentDetections: sortedDetections,
    context: {
      parentId: parentProfile?.id,
      parentName: parentProfile?.name,
      parentAge: parentProfile?.age,
      parentState: parentProfile?.state,
      activeDomains: ["medical", "financial", "legal", "housing"], // TODO: Derive from user activity
      existingTasks: tasks.map((t) => t.title),
      lastRunTimes,
    },
  };
}

// Clear all agent data
export function clearAgentData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AGENT_RUNS_KEY);
  localStorage.removeItem(AGENT_DETECTIONS_KEY);
}
