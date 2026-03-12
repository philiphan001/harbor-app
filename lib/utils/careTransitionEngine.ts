import type { Task } from "@/lib/ai/claude";
import type { LifeEventType } from "@/lib/types/lifeEvents";
import type {
  CareTransitionPlaybook,
  CareTransitionActivation,
  CareTransitionType,
} from "@/lib/types/careTransitions";
import { CARE_TRANSITION_PLAYBOOKS } from "@/lib/data/careTransitionPlaybooks";
import { getTasks, addTasks } from "./taskStorage";
import { getActiveParentId, getParentProfile } from "./parentProfile";
import { getAllDetections } from "./agentStorage";
import { createCascade } from "./cascadeStorage";

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const ACTIVATIONS_KEY = "harbor_care_transition_activations";

export function getAllActivations(): CareTransitionActivation[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(ACTIVATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveActivation(activation: CareTransitionActivation): void {
  if (typeof window === "undefined") return;
  try {
    const all = getAllActivations();
    all.push(activation);
    localStorage.setItem(ACTIVATIONS_KEY, JSON.stringify(all));
  } catch {}
}

export function getActivationsForParent(parentId: string): CareTransitionActivation[] {
  return getAllActivations().filter((a) => a.parentId === parentId);
}

export function isPlaybookActivated(playbookId: CareTransitionType, parentId: string): boolean {
  return getAllActivations().some(
    (a) => a.playbookId === playbookId && a.parentId === parentId
  );
}

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

export function generateTasksForPlaybook(
  playbook: CareTransitionPlaybook,
  parentName: string,
): Task[] {
  const now = new Date();
  const existingTasks = getTasks();
  const existingTitles = new Set(existingTasks.map((t) => t.title.toLowerCase()));

  const tasks: Task[] = [];

  for (const template of playbook.taskTemplates) {
    // Resolve {parent_name} placeholder
    const title = template.title.replace(/\{parent_name\}/g, parentName);
    const description = template.description.replace(/\{parent_name\}/g, parentName);

    // Deduplicate by exact title match
    if (existingTitles.has(title.toLowerCase())) continue;

    // Compute due date
    const due = new Date(now);
    due.setDate(due.getDate() + template.dueDaysAfterEvent);
    const dueDate = due.toISOString().split("T")[0];

    tasks.push({
      title,
      domain: template.domain,
      priority: template.priority,
      why: description,
      suggestedActions: [`Complete by ${dueDate}`],
      source: "playbook",
    });
  }

  return tasks;
}

export function getPlaybooksForLifeEvent(eventType: LifeEventType): CareTransitionPlaybook[] {
  return CARE_TRANSITION_PLAYBOOKS.filter(
    (p) => p.trigger.lifeEventType === eventType
  );
}

export function getPlaybooksForMilestone(milestoneId: string): CareTransitionPlaybook[] {
  return CARE_TRANSITION_PLAYBOOKS.filter(
    (p) => p.trigger.milestoneIds?.includes(milestoneId)
  );
}

// ---------------------------------------------------------------------------
// Side-effect functions
// ---------------------------------------------------------------------------

export function linkMilestoneDetections(
  milestoneIds: string[],
  playbookId: CareTransitionType,
): void {
  if (typeof window === "undefined") return;
  try {
    const detections = getAllDetections();
    let changed = false;

    for (const detection of detections) {
      // Match detections whose id starts with lifecycle_{milestoneId}_
      for (const milestoneId of milestoneIds) {
        if (detection.id.startsWith(`lifecycle_${milestoneId}_`) && !detection.sourceUrl) {
          detection.sourceUrl = `/playbooks/${playbookId}`;
          changed = true;
        }
      }
    }

    if (changed) {
      localStorage.setItem("harbor_agent_detections", JSON.stringify(detections));
    }
  } catch {}
}

export interface PlaybookActivationResult {
  alreadyActivated: boolean;
  activation?: CareTransitionActivation;
  generatedTasks: Task[];
}

export function activatePlaybook(
  playbookId: CareTransitionType,
  triggeredBy: "life_event" | "milestone" | "manual",
  triggerSource?: string,
): PlaybookActivationResult {
  const parentId = getActiveParentId() || "unknown";

  // Guard: prevent re-trigger
  if (isPlaybookActivated(playbookId, parentId)) {
    return { alreadyActivated: true, generatedTasks: [] };
  }

  const playbook = CARE_TRANSITION_PLAYBOOKS.find((p) => p.id === playbookId);
  if (!playbook) {
    return { alreadyActivated: false, generatedTasks: [] };
  }

  const profile = getParentProfile();
  const parentName = profile?.name?.split(" ")[0] || "Your parent";

  // Generate tasks
  const tasks = generateTasksForPlaybook(playbook, parentName);

  // Save via addTasks (fuzzy dedup)
  addTasks(tasks);

  // Create activation record
  const activation: CareTransitionActivation = {
    id: `activation_${playbookId}_${Date.now()}`,
    playbookId,
    parentId,
    activatedAt: new Date().toISOString(),
    triggeredBy,
    triggerSource,
    generatedTaskTitles: tasks.map((t) => t.title),
  };
  saveActivation(activation);

  // Create cascade instance for the presentation layer
  createCascade(activation.id, playbookId, playbook.steps.length);

  // Link milestone detections to playbook URL
  if (playbook.trigger.milestoneIds) {
    linkMilestoneDetections(playbook.trigger.milestoneIds, playbookId);
  }

  return { alreadyActivated: false, activation, generatedTasks: tasks };
}
