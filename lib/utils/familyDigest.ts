import { getCompletedTasks, getTasks } from "./taskStorage";
import { getAllDetections } from "./agentStorage";
import { calculateReadinessScore } from "./readinessScore";
import { scanTaskDeadlines } from "./deadlineTracker";

const FAMILY_MEMBERS_KEY = "harbor_family_members";

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  relationship: string;
  updateFrequency: "weekly" | "biweekly" | "monthly";
  addedAt: string;
}

// --- CRUD ---

export function getFamilyMembers(): FamilyMember[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(FAMILY_MEMBERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveFamilyMembers(members: FamilyMember[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAMILY_MEMBERS_KEY, JSON.stringify(members));
}

export function addFamilyMember(member: Omit<FamilyMember, "id" | "addedAt">): FamilyMember {
  const members = getFamilyMembers();
  const newMember: FamilyMember = {
    ...member,
    id: `fm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    addedAt: new Date().toISOString(),
  };
  members.push(newMember);
  saveFamilyMembers(members);
  return newMember;
}

export function removeFamilyMember(memberId: string): void {
  const members = getFamilyMembers();
  const filtered = members.filter((m) => m.id !== memberId);
  saveFamilyMembers(filtered);
}

// --- Digest Generation ---

/**
 * Generate digest content as markdown. Ready to plug into an email service later.
 */
export function generateDigestContent(): string {
  const lines: string[] = [];

  lines.push("# Harbor Care Update");
  lines.push("");

  // Tasks completed this week
  const completedTasks = getCompletedTasks();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recentlyCompleted = completedTasks.filter(
    (t) => t.completedAt && t.completedAt >= oneWeekAgo
  );

  if (recentlyCompleted.length > 0) {
    lines.push("## Completed This Week");
    for (const task of recentlyCompleted) {
      lines.push(`- ✓ ${task.title}`);
    }
    lines.push("");
  }

  // Pending tasks
  const pendingTasks = getTasks();
  if (pendingTasks.length > 0) {
    lines.push(`## Pending Tasks (${pendingTasks.length})`);
    const highPriority = pendingTasks.filter((t) => t.priority === "high");
    if (highPriority.length > 0) {
      lines.push(`- **${highPriority.length}** high priority`);
    }
    const medPriority = pendingTasks.filter((t) => t.priority === "medium");
    if (medPriority.length > 0) {
      lines.push(`- ${medPriority.length} medium priority`);
    }
    lines.push("");
  }

  // Upcoming deadlines
  try {
    const deadlines = scanTaskDeadlines();
    if (deadlines.length > 0) {
      lines.push("## Upcoming Deadlines");
      for (const dl of deadlines.slice(0, 5)) {
        const label = dl.urgency === "overdue" ? "OVERDUE" : `Due in ${dl.daysUntilDue}d`;
        lines.push(`- ${label}: ${dl.taskTitle}`);
      }
      lines.push("");
    }
  } catch {
    // Deadline scanning may fail
  }

  // Notable detections
  try {
    const detections = getAllDetections();
    const recentHighDetections = detections.filter(
      (d) =>
        d.relevanceScore === "high" &&
        d.detectedAt >= oneWeekAgo
    );

    if (recentHighDetections.length > 0) {
      lines.push("## Notable Alerts");
      for (const det of recentHighDetections.slice(0, 5)) {
        lines.push(`- ${det.title}`);
      }
      lines.push("");
    }
  } catch {
    // Detection data may not be available
  }

  // Readiness score
  try {
    const readiness = calculateReadinessScore();
    lines.push("## Readiness Score");
    lines.push(`Overall: **${readiness.overall}%** (${readiness.status})`);
    if (readiness.criticalGaps.length > 0) {
      lines.push(`Critical gaps: ${readiness.criticalGaps.join(", ")}`);
    }
    lines.push("");
  } catch {
    // Readiness calculation may fail
  }

  lines.push("---");
  lines.push("*Sent by Harbor — Caregiving made manageable*");

  return lines.join("\n");
}
