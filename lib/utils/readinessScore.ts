// Calculate readiness score based on captured data + completed tasks

import { getParentProfile } from "./parentProfile";
import { getAllTaskData } from "./taskData";
import { getTasks, getCompletedTasks } from "./taskStorage";

export interface ReadinessBreakdown {
  overall: number; // 0-100
  domains: {
    medical: number;
    legal: number;
    financial: number;
    housing: number;
    transportation: number;
    social: number;
  };
  criticalGaps: string[];
  completedCount: number;
  pendingCount: number;
  status: "critical" | "needs-attention" | "prepared" | "well-prepared";
}

/**
 * Calculate readiness score based on captured information + task completion
 */
export function calculateReadinessScore(): ReadinessBreakdown {
  const profile = getParentProfile();
  const taskData = getAllTaskData();
  const pendingTasks = getTasks();
  const completedTasks = getCompletedTasks();

  // If no profile exists, readiness is 0
  if (!profile) {
    return {
      overall: 0,
      domains: { medical: 0, legal: 0, financial: 0, housing: 0, transportation: 0, social: 0 },
      criticalGaps: ["No parent profile created"],
      completedCount: 0,
      pendingCount: 0,
      status: "critical",
    };
  }

  const criticalGaps: string[] = [];
  const hasToolData = (toolName: string) => taskData.some((d) => d.toolName === toolName);
  const hasTaskNoteFor = (keyword: string) =>
    taskData.some((d) =>
      (d.toolName === "save_task_notes" || d.toolName === "manual_notes") &&
      d.taskTitle.toLowerCase().includes(keyword)
    );
  // Check if a task with keyword in title has been completed
  const hasCompletedTask = (keyword: string) =>
    completedTasks.some((t) => t.title.toLowerCase().includes(keyword));

  // Medical domain (0-100)
  let medicalScore = 0;

  if (hasToolData("save_doctor_info") || hasCompletedTask("doctor") || hasCompletedTask("pcp") || hasCompletedTask("physician")) medicalScore += 25;
  else criticalGaps.push("Primary care doctor contact");

  if (hasToolData("save_medication_list") || hasCompletedTask("medication") || hasCompletedTask("medicine")) medicalScore += 20;
  else criticalGaps.push("Current medications list");

  if (hasToolData("save_insurance_info") || hasCompletedTask("insurance") || hasCompletedTask("medicare")) medicalScore += 25;
  else criticalGaps.push("Medicare/insurance information");

  if (hasTaskNoteFor("specialist") || hasCompletedTask("specialist")) medicalScore += 15;

  if (hasTaskNoteFor("pharmacy") || hasCompletedTask("pharmacy")) medicalScore += 15;

  // Legal domain (0-100)
  let legalScore = 0;

  if (hasToolData("save_legal_document_info") || hasTaskNoteFor("power of attorney") || hasCompletedTask("power of attorney") || hasCompletedTask("poa") || hasCompletedTask("proxy")) legalScore += 35;
  else criticalGaps.push("Power of Attorney location/holder");

  if (hasTaskNoteFor("living will") || hasTaskNoteFor("advance directive") || hasCompletedTask("living will") || hasCompletedTask("advance directive")) legalScore += 25;
  else criticalGaps.push("Living will/advance directive");

  if (hasTaskNoteFor("will") || hasTaskNoteFor("estate") || hasCompletedTask("will") || hasCompletedTask("estate")) legalScore += 20;

  if (hasTaskNoteFor("attorney") || hasTaskNoteFor("lawyer") || hasCompletedTask("attorney") || hasCompletedTask("lawyer")) legalScore += 20;

  // Financial domain (0-100)
  let financialScore = 0;

  if (hasTaskNoteFor("bank") || hasCompletedTask("bank")) financialScore += 25;
  else criticalGaps.push("Primary bank account information");

  if (hasTaskNoteFor("income") || hasCompletedTask("income")) financialScore += 20;

  if (hasTaskNoteFor("expense") || hasTaskNoteFor("bill") || hasCompletedTask("expense") || hasCompletedTask("bill")) financialScore += 20;

  if (hasTaskNoteFor("debt") || hasTaskNoteFor("loan") || hasCompletedTask("debt") || hasCompletedTask("loan")) financialScore += 15;

  if (hasTaskNoteFor("asset") || hasTaskNoteFor("investment") || hasCompletedTask("asset") || hasCompletedTask("investment")) financialScore += 20;

  // Housing domain (0-100)
  let housingScore = 0;

  if (profile.livingArrangement) housingScore += 30;
  else criticalGaps.push("Current living situation details");

  if (hasTaskNoteFor("rent") || hasTaskNoteFor("mortgage") || hasTaskNoteFor("own") || hasCompletedTask("rent") || hasCompletedTask("mortgage") || hasCompletedTask("housing")) housingScore += 25;

  if (hasTaskNoteFor("housing cost") || hasTaskNoteFor("rent amount") || hasCompletedTask("housing cost")) housingScore += 20;

  if (hasTaskNoteFor("emergency contact") || hasCompletedTask("emergency contact")) housingScore += 25;
  else criticalGaps.push("Emergency contact besides you");

  // Transportation domain (0-100)
  let transportationScore = 0;

  if (hasTaskNoteFor("transport") || hasTaskNoteFor("ride") || hasTaskNoteFor("driving") || hasCompletedTask("transport") || hasCompletedTask("ride") || hasCompletedTask("driving")) transportationScore += 35;

  if (hasTaskNoteFor("delivery") || hasTaskNoteFor("grocery") || hasCompletedTask("delivery") || hasCompletedTask("grocery")) transportationScore += 30;

  if (hasTaskNoteFor("senior shuttle") || hasTaskNoteFor("medical transport") || hasCompletedTask("senior shuttle") || hasCompletedTask("medical transport")) transportationScore += 35;
  else if (!hasTaskNoteFor("transport") && !hasCompletedTask("transport")) criticalGaps.push("Transportation plan for appointments");

  // Social domain (0-100)
  let socialScore = 0;

  if (hasTaskNoteFor("friend") || hasTaskNoteFor("neighbor") || hasTaskNoteFor("social") || hasCompletedTask("friend") || hasCompletedTask("neighbor") || hasCompletedTask("social")) socialScore += 35;
  else criticalGaps.push("Key social contacts for parent");

  if (hasTaskNoteFor("community") || hasTaskNoteFor("church") || hasTaskNoteFor("senior center") || hasCompletedTask("community") || hasCompletedTask("church") || hasCompletedTask("senior center")) socialScore += 25;

  if (hasTaskNoteFor("checks on") || hasTaskNoteFor("check in") || hasCompletedTask("checks on") || hasCompletedTask("check in")) socialScore += 40;

  // Cap domain scores at 100
  medicalScore = Math.min(medicalScore, 100);
  legalScore = Math.min(legalScore, 100);
  financialScore = Math.min(financialScore, 100);
  housingScore = Math.min(housingScore, 100);
  transportationScore = Math.min(transportationScore, 100);
  socialScore = Math.min(socialScore, 100);

  // Calculate overall score (weighted average)
  const overall = Math.round(
    (medicalScore * 0.20 + legalScore * 0.20 + financialScore * 0.20 + housingScore * 0.15 + transportationScore * 0.12 + socialScore * 0.13)
  );

  // Determine status
  let status: ReadinessBreakdown["status"];
  if (overall < 30) status = "critical";
  else if (overall < 60) status = "needs-attention";
  else if (overall < 85) status = "prepared";
  else status = "well-prepared";

  return {
    overall,
    domains: {
      medical: medicalScore,
      legal: legalScore,
      financial: financialScore,
      housing: housingScore,
      transportation: transportationScore,
      social: socialScore,
    },
    criticalGaps: criticalGaps.slice(0, 5), // Top 5 gaps
    completedCount: completedTasks.length,
    pendingCount: pendingTasks.length,
    status,
  };
}

/**
 * Get status color for readiness score
 */
export function getReadinessColor(score: number): string {
  if (score < 30) return "coral"; // Critical
  if (score < 60) return "amber"; // Needs attention
  if (score < 85) return "ocean"; // Prepared
  return "sage"; // Well prepared
}

/**
 * Get status label for readiness score
 */
export function getReadinessLabel(score: number): string {
  if (score < 30) return "Critical Gaps";
  if (score < 60) return "Needs Attention";
  if (score < 85) return "Prepared";
  return "Well Prepared";
}
