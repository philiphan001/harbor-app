// Internal Utility Agents
// These agents analyze the user's captured data and detect issues

import { getParentProfile, getAllParentProfiles } from "@/lib/utils/parentProfile";
import { getAllTaskData, type TaskData } from "@/lib/utils/taskData";
import { getTasks } from "@/lib/utils/taskStorage";
import { calculateReadinessScore } from "@/lib/utils/readinessScore";
import type { Task } from "../ai/claude";

export interface InternalAgentDetection {
  id: string;
  agentType: "gap_detector" | "freshness_monitor" | "conflict_resolver";
  detectedAt: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  domain: "medical" | "legal" | "financial" | "housing" | "general";
  actionable: boolean;
  suggestedTask?: Partial<Task>;
}

/**
 * Gap Detector Agent
 * Identifies missing critical information
 */
export function runGapDetector(): InternalAgentDetection[] {
  const profile = getParentProfile();
  if (!profile) return [];

  const taskData = getAllTaskData();
  const readiness = calculateReadinessScore();
  const detections: InternalAgentDetection[] = [];

  // Critical medical gaps
  if (!taskData.some(d => d.toolName === "save_doctor_info")) {
    detections.push({
      id: `gap-${Date.now()}-1`,
      agentType: "gap_detector",
      detectedAt: new Date().toISOString(),
      title: "Missing Primary Care Doctor Contact",
      description: `You haven't saved ${profile.name}'s primary care doctor information. In an emergency, this is one of the first contacts you'll need.`,
      severity: "critical",
      domain: "medical",
      actionable: true,
      suggestedTask: {
        title: `Get ${profile.name}'s primary care doctor contact info`,
        priority: "high",
        why: "You'll need this for medical coordination in an emergency.",
        domain: "medical",
      },
    });
  }

  if (!taskData.some(d => d.toolName === "save_medication_list")) {
    detections.push({
      id: `gap-${Date.now()}-2`,
      agentType: "gap_detector",
      detectedAt: new Date().toISOString(),
      title: "No Current Medications List",
      description: `You don't have a list of ${profile.name}'s current medications. This is critical for emergency room visits and medication interactions.`,
      severity: "critical",
      domain: "medical",
      actionable: true,
      suggestedTask: {
        title: `Document ${profile.name}'s current medications`,
        priority: "high",
        why: "Emergency rooms need this to avoid dangerous drug interactions.",
        domain: "medical",
      },
    });
  }

  // Critical legal gaps
  if (!taskData.some(d => d.toolName === "save_legal_document_info")) {
    detections.push({
      id: `gap-${Date.now()}-3`,
      agentType: "gap_detector",
      detectedAt: new Date().toISOString(),
      title: "Power of Attorney Status Unknown",
      description: `You haven't documented who has Power of Attorney for ${profile.name}. Without this, you may not be able to make medical or financial decisions in a crisis.`,
      severity: "critical",
      domain: "legal",
      actionable: true,
      suggestedTask: {
        title: `Confirm Power of Attorney for ${profile.name}`,
        priority: "high",
        why: "Without POA, you may not be able to make medical or financial decisions in a crisis.",
        domain: "legal",
      },
    });
  }

  // High priority financial gaps
  if (!taskData.some(d => d.toolName === "save_insurance_info")) {
    detections.push({
      id: `gap-${Date.now()}-4`,
      agentType: "gap_detector",
      detectedAt: new Date().toISOString(),
      title: "Primary Bank Account Not Documented",
      description: `You haven't saved ${profile.name}'s primary bank information. You'll need this to help with bill payments or financial management.`,
      severity: "high",
      domain: "financial",
      actionable: true,
      suggestedTask: {
        title: `Get ${profile.name}'s primary bank account info`,
        priority: "medium",
        why: "You'll need bank access to help with bill payments or financial management.",
        domain: "financial",
      },
    });
  }

  // Housing gaps
  if (!taskData.some(d => d.toolName === "save_task_notes" && d.taskTitle.toLowerCase().includes("emergency contact"))) {
    detections.push({
      id: `gap-${Date.now()}-5`,
      agentType: "gap_detector",
      detectedAt: new Date().toISOString(),
      title: "No Emergency Contact Besides You",
      description: `You don't have a backup emergency contact for ${profile.name}. If you're unavailable, no one else can be reached.`,
      severity: "high",
      domain: "housing",
      actionable: true,
      suggestedTask: {
        title: `Add backup emergency contact for ${profile.name}`,
        priority: "medium",
        why: "If you're unavailable during an emergency, a backup contact ensures someone can be reached.",
        domain: "housing",
      },
    });
  }

  return detections;
}

/**
 * Freshness Monitor Agent
 * Detects outdated information that needs updating
 */
export function runFreshnessMonitor(): InternalAgentDetection[] {
  const profile = getParentProfile();
  if (!profile) return [];

  const taskData = getAllTaskData();
  const detections: InternalAgentDetection[] = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  // Check for stale medical data
  const medicationData = taskData.find(d => d.toolName === "save_medication_list");

  if (medicationData) {
    const lastUpdated = new Date(medicationData.capturedAt);
    if (lastUpdated < sixMonthsAgo) {
      detections.push({
        id: `fresh-${Date.now()}-1`,
        agentType: "freshness_monitor",
        detectedAt: new Date().toISOString(),
        title: "Medication List May Be Outdated",
        description: `${profile.name}'s medication list was last updated ${Math.floor((now.getTime() - lastUpdated.getTime()) / (30 * 24 * 60 * 60 * 1000))} months ago. Medications often change, especially for seniors.`,
        severity: "medium",
        domain: "medical",
        actionable: true,
        suggestedTask: {
          title: `Verify ${profile.name}'s current medications`,
          priority: "medium",
          why: "Medications often change for seniors — an outdated list could be dangerous in an emergency.",
          domain: "medical",
        },
      });
    }
  }

  // Check profile last updated
  if (profile.lastUpdated) {
    const profileUpdated = new Date(profile.lastUpdated);
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    if (profileUpdated < threeMonthsAgo) {
      detections.push({
        id: `fresh-${Date.now()}-2`,
        agentType: "freshness_monitor",
        detectedAt: new Date().toISOString(),
        title: "Profile Information Needs Review",
        description: `${profile.name}'s profile hasn't been updated in ${Math.floor((now.getTime() - profileUpdated.getTime()) / (30 * 24 * 60 * 60 * 1000))} months. Living arrangements, health status, or contacts may have changed.`,
        severity: "low",
        domain: "general",
        actionable: true,
        suggestedTask: {
          title: `Review and update ${profile.name}'s profile`,
          priority: "low",
          why: "Living arrangements, health status, or contacts may have changed since last update.",
          domain: "general" as any,
        },
      });
    }
  }

  return detections;
}

/**
 * Conflict Resolver Agent
 * Detects contradictory or inconsistent information
 */
export function runConflictResolver(): InternalAgentDetection[] {
  const profile = getParentProfile();
  if (!profile) return [];

  const taskData = getAllTaskData();
  const tasks = getTasks();
  const detections: InternalAgentDetection[] = [];

  // Check for duplicate tasks
  const taskTitles = tasks.map(t => t.title.toLowerCase());
  const duplicates = taskTitles.filter((title, index) => taskTitles.indexOf(title) !== index);

  if (duplicates.length > 0) {
    detections.push({
      id: `conflict-${Date.now()}-1`,
      agentType: "conflict_resolver",
      detectedAt: new Date().toISOString(),
      title: "Duplicate Tasks Detected",
      description: `You have ${duplicates.length} duplicate task(s) in your action items. Consider consolidating or removing duplicates.`,
      severity: "low",
      domain: "general",
      actionable: true,
    });
  }

  // Check for conflicting data (example: multiple primary care doctors)
  const primaryDoctors = taskData.filter(d => d.toolName === "save_doctor_info");
  if (primaryDoctors.length > 1) {
    detections.push({
      id: `conflict-${Date.now()}-2`,
      agentType: "conflict_resolver",
      detectedAt: new Date().toISOString(),
      title: "Multiple Primary Care Doctors Saved",
      description: `You have ${primaryDoctors.length} different primary care doctors saved for ${profile.name}. This may indicate outdated information or a data entry error.`,
      severity: "medium",
      domain: "medical",
      actionable: true,
      suggestedTask: {
        title: `Verify ${profile.name}'s current primary care doctor`,
        priority: "medium",
        why: "Multiple entries may indicate outdated information — confirm the current doctor.",
        domain: "medical",
      },
    });
  }

  return detections;
}

/**
 * Run all internal agents and return combined detections
 */
export function runAllInternalAgents(): InternalAgentDetection[] {
  const gapDetections = runGapDetector();
  const freshnessDetections = runFreshnessMonitor();
  const conflictDetections = runConflictResolver();

  return [...gapDetections, ...freshnessDetections, ...conflictDetections];
}
