// Calculate readiness score based on captured data

import { getParentProfile } from "./parentProfile";
import { getAllTaskData } from "./taskData";
import { getTasks } from "./taskStorage";

export interface ReadinessBreakdown {
  overall: number; // 0-100
  domains: {
    medical: number;
    legal: number;
    financial: number;
    housing: number;
  };
  criticalGaps: string[];
  status: "critical" | "needs-attention" | "prepared" | "well-prepared";
}

/**
 * Calculate readiness score based on captured information
 */
export function calculateReadinessScore(): ReadinessBreakdown {
  const profile = getParentProfile();
  const taskData = getAllTaskData();
  const tasks = getTasks();

  // If no profile exists, readiness is 0
  if (!profile) {
    return {
      overall: 0,
      domains: { medical: 0, legal: 0, financial: 0, housing: 0 },
      criticalGaps: ["No parent profile created"],
      status: "critical",
    };
  }

  const criticalGaps: string[] = [];
  const hasToolData = (toolName: string) => taskData.some((d) => d.toolName === toolName);
  const hasTaskNoteFor = (keyword: string) =>
    taskData.some((d) => d.toolName === "save_task_notes" && d.taskTitle.toLowerCase().includes(keyword));

  // Medical domain (0-100)
  let medicalScore = 0;

  if (hasToolData("save_doctor_info")) medicalScore += 25;
  else criticalGaps.push("Primary care doctor contact");

  if (hasToolData("save_medication_list")) medicalScore += 20;
  else criticalGaps.push("Current medications list");

  if (hasToolData("save_insurance_info")) medicalScore += 25;
  else criticalGaps.push("Medicare/insurance information");

  if (hasTaskNoteFor("specialist")) medicalScore += 15;

  if (hasTaskNoteFor("pharmacy")) medicalScore += 15;

  // Legal domain (0-100)
  let legalScore = 0;

  if (hasToolData("save_legal_document_info") || hasTaskNoteFor("power of attorney")) legalScore += 35;
  else criticalGaps.push("Power of Attorney location/holder");

  if (hasTaskNoteFor("living will") || hasTaskNoteFor("advance directive")) legalScore += 25;
  else criticalGaps.push("Living will/advance directive");

  if (hasTaskNoteFor("will") || hasTaskNoteFor("estate")) legalScore += 20;

  if (hasTaskNoteFor("attorney") || hasTaskNoteFor("lawyer")) legalScore += 20;

  // Financial domain (0-100)
  let financialScore = 0;

  if (hasTaskNoteFor("bank")) financialScore += 25;
  else criticalGaps.push("Primary bank account information");

  if (hasTaskNoteFor("income")) financialScore += 20;

  if (hasTaskNoteFor("expense") || hasTaskNoteFor("bill")) financialScore += 20;

  if (hasTaskNoteFor("debt") || hasTaskNoteFor("loan")) financialScore += 15;

  if (hasTaskNoteFor("asset") || hasTaskNoteFor("investment")) financialScore += 20;

  // Housing domain (0-100)
  let housingScore = 0;

  if (profile.livingArrangement) housingScore += 30;
  else criticalGaps.push("Current living situation details");

  if (hasTaskNoteFor("rent") || hasTaskNoteFor("mortgage") || hasTaskNoteFor("own")) housingScore += 25;

  if (hasTaskNoteFor("housing cost") || hasTaskNoteFor("rent amount")) housingScore += 20;

  if (hasTaskNoteFor("emergency contact")) housingScore += 25;
  else criticalGaps.push("Emergency contact besides you");

  // Calculate overall score (weighted average)
  const overall = Math.round(
    (medicalScore * 0.3 + legalScore * 0.3 + financialScore * 0.25 + housingScore * 0.15)
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
    },
    criticalGaps: criticalGaps.slice(0, 5), // Top 5 gaps
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
