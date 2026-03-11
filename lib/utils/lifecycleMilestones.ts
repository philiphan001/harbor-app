// Lifecycle Milestone Evaluation Engine
// Evaluates triggers against parent profile and surfaces fired milestones as agent detections

import type { AgentDetection, AgentRun } from "@/lib/types/agents";
import {
  LIFECYCLE_MILESTONES,
  type LifecycleMilestone,
  type MilestonePriorityTier,
} from "@/lib/data/lifecycleMilestones";
import { getParentProfile } from "./parentProfile";
import { getAllTaskData } from "./taskData";
import { getSituationContextFromProfile } from "./situationContext";
import { getAllDetections, saveDetection, saveAgentRun } from "./agentStorage";
import { renderTemplate } from "./templateRenderer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MilestoneProfile {
  age?: number;
  fractionalAge?: number;
  state?: string;
  veteranStatus?: boolean;
  hasRecentHospitalization: boolean;
  spendDownMonths?: number;
  hasLtcInsurance: boolean;
  insuranceCoverageType?: string;
  adlDeclineDetected: boolean;
  cognitiveDeclineDetected: boolean;
  // Document timestamps: documentKey → capturedAt ISO string
  documentTimestamps: Record<string, string>;
}

export type TriggerResult = "fired" | "not_fired" | "data_missing";

// ---------------------------------------------------------------------------
// Profile Builder
// ---------------------------------------------------------------------------

export function buildMilestoneProfile(): MilestoneProfile {
  const profile = getParentProfile();
  const taskData = getAllTaskData();

  // Fractional age: use integer age from profile (DOB not stored yet)
  // When DOB is available in the future, compute fractional age here
  const fractionalAge: number | undefined = profile?.age;

  // Extract data from situation context
  let spendDownMonths: number | undefined;
  let hasLtcInsurance = false;
  let insuranceCoverageType: string | undefined;
  if (profile?.id) {
    const context = getSituationContextFromProfile(profile.id);
    if (context) {
      spendDownMonths = context.financial.spendDownProjection?.monthsRemaining;
      hasLtcInsurance = !!context.financial.longTermCareInsurance;
      insuranceCoverageType = context.medical.insurance?.coverageType;
    }
  }

  // Check for hospitalization events in task data
  const hasRecentHospitalization = taskData.some(
    (td) => td.toolName === "report_hospitalization" || td.toolName === "log_hospitalization"
  );

  // Build document timestamps from legal document captures
  const documentTimestamps: Record<string, string> = {};
  const documentKeyMap: Record<string, string> = {
    "power of attorney": "poa",
    "poa": "poa",
    "advance directive": "advance_directive",
    "living will": "advance_directive",
    "hipaa": "hipaa",
    "hipaa authorization": "hipaa",
    "long-term care insurance": "ltc_insurance",
    "ltc insurance": "ltc_insurance",
    "long term care": "ltc_insurance",
  };

  for (const td of taskData) {
    if (td.toolName === "save_legal_document_info") {
      const docType = ((td.data as Record<string, unknown>)?.documentType as string || "").toLowerCase();
      for (const [keyword, key] of Object.entries(documentKeyMap)) {
        if (docType.includes(keyword)) {
          // Use the most recent timestamp
          const existing = documentTimestamps[key];
          const timestamp = td.lastReviewedAt || td.capturedAt;
          if (!existing || timestamp > existing) {
            documentTimestamps[key] = timestamp;
          }
          break;
        }
      }
    }
  }

  return {
    age: profile?.age,
    fractionalAge,
    state: profile?.state,
    veteranStatus: profile?.veteranStatus,
    hasRecentHospitalization,
    spendDownMonths,
    hasLtcInsurance,
    insuranceCoverageType,
    adlDeclineDetected: false, // Future: derived from reported events
    cognitiveDeclineDetected: false, // Future: derived from reported events
    documentTimestamps,
  };
}

// ---------------------------------------------------------------------------
// Trigger Evaluator (pure function)
// ---------------------------------------------------------------------------

export function evaluateMilestoneTrigger(
  milestone: LifecycleMilestone,
  profile: MilestoneProfile,
  now: Date = new Date(),
): TriggerResult {
  const { triggerType, triggerCondition, leadTimeDays } = milestone;

  switch (triggerType) {
    case "age": {
      const { ageThreshold, ageOperator = ">=" } = triggerCondition;
      if (ageThreshold === undefined) return "data_missing";

      // Use fractional age for precise lead-time windows, fall back to integer age
      const age = profile.fractionalAge ?? profile.age;
      if (age === undefined) return "data_missing";

      // Adjust threshold by lead time for early detection
      const effectiveThreshold = ageThreshold - leadTimeDays / 365;

      switch (ageOperator) {
        case ">=": return age >= effectiveThreshold ? "fired" : "not_fired";
        case ">":  return age > effectiveThreshold ? "fired" : "not_fired";
        case "==": return Math.abs(age - effectiveThreshold) < 0.5 ? "fired" : "not_fired";
        case "<":  return age < effectiveThreshold ? "fired" : "not_fired";
        default:   return "not_fired";
      }
    }

    case "calendar": {
      const { windowStartMonth, windowStartDay = 1, windowEndMonth, windowEndDay = 31 } = triggerCondition;
      if (!windowStartMonth || !windowEndMonth) return "data_missing";

      const year = now.getFullYear();

      // Build window with lead time
      const windowStart = new Date(year, windowStartMonth - 1, windowStartDay);
      const leadAdjustedStart = new Date(windowStart.getTime() - leadTimeDays * 24 * 60 * 60 * 1000);
      const windowEnd = new Date(year, windowEndMonth - 1, windowEndDay, 23, 59, 59);

      // Handle year wrapping for lead-adjusted start
      if (now >= leadAdjustedStart && now <= windowEnd) {
        return "fired";
      }

      // Check if the window wraps around to next year (e.g., lead time pushes start to previous year)
      const nextYearStart = new Date(year + 1, windowStartMonth - 1, windowStartDay);
      const nextLeadStart = new Date(nextYearStart.getTime() - leadTimeDays * 24 * 60 * 60 * 1000);
      const nextYearEnd = new Date(year + 1, windowEndMonth - 1, windowEndDay, 23, 59, 59);
      if (now >= nextLeadStart && now <= nextYearEnd) {
        return "fired";
      }

      return "not_fired";
    }

    case "event": {
      const { eventKey } = triggerCondition;
      if (!eventKey) return "data_missing";

      switch (eventKey) {
        case "hospitalization_logged":
          return profile.hasRecentHospitalization ? "fired" : "not_fired";
        default:
          return "data_missing";
      }
    }

    case "threshold": {
      const { thresholdKey, thresholdValue, thresholdOperator = "<=" } = triggerCondition;
      if (!thresholdKey || thresholdValue === undefined) return "data_missing";

      let actualValue: number | undefined;

      switch (thresholdKey) {
        case "spend_down_months":
          actualValue = profile.spendDownMonths;
          break;
        case "adl_decline_detected":
          actualValue = profile.adlDeclineDetected ? 1 : 0;
          break;
        case "cognitive_decline_detected":
          actualValue = profile.cognitiveDeclineDetected ? 1 : 0;
          break;
        case "veteran_not_assessed":
          // Fire if veteran status is true (veteran exists but benefits not yet assessed)
          if (profile.veteranStatus === undefined) return "data_missing";
          actualValue = profile.veteranStatus ? 1 : 0;
          break;
        default:
          return "data_missing";
      }

      if (actualValue === undefined) return "data_missing";

      switch (thresholdOperator) {
        case "<=": return actualValue <= thresholdValue ? "fired" : "not_fired";
        case "<":  return actualValue < thresholdValue ? "fired" : "not_fired";
        case ">=": return actualValue >= thresholdValue ? "fired" : "not_fired";
        case ">":  return actualValue > thresholdValue ? "fired" : "not_fired";
        default:   return "not_fired";
      }
    }

    case "document_expiry": {
      const { documentKey, maxDaysSinceReview } = triggerCondition;
      if (!documentKey || maxDaysSinceReview === undefined) return "data_missing";

      const lastReviewed = profile.documentTimestamps[documentKey];

      // If document was captured but never reviewed, fire immediately
      if (!lastReviewed) {
        // Check if the document exists at all — if no timestamp, it hasn't been captured
        // For document_expiry, we only fire if the document type has been captured
        // We check by looking for any key matching the documentKey
        const hasDocument = documentKey in profile.documentTimestamps;
        if (!hasDocument) return "not_fired";
        return "fired";
      }

      const daysSince = (now.getTime() - new Date(lastReviewed).getTime()) / (1000 * 60 * 60 * 24);
      const effectiveThreshold = maxDaysSinceReview - leadTimeDays;

      return daysSince >= effectiveThreshold ? "fired" : "not_fired";
    }

    default:
      return "data_missing";
  }
}

// ---------------------------------------------------------------------------
// Detection Generator
// ---------------------------------------------------------------------------

const PRIORITY_RELEVANCE: Record<MilestonePriorityTier, number> = {
  urgent: 85,
  important: 65,
  recommended: 45,
};

const PRIORITY_RELEVANCE_LABEL: Record<MilestonePriorityTier, "high" | "medium" | "low"> = {
  urgent: "high",
  important: "medium",
  recommended: "low",
};

export function generateMilestoneDetections(
  firedMilestones: LifecycleMilestone[],
  profile: MilestoneProfile,
  parentName: string,
): AgentDetection[] {
  const existingDetections = getAllDetections();
  const now = new Date().toISOString();
  const runId = `lifecycle_run_${Date.now()}`;
  const detections: AgentDetection[] = [];

  for (const milestone of firedMilestones) {
    const detectionIdPrefix = `lifecycle_${milestone.milestoneId}_`;

    // Dedup: skip milestones already present as unhandled detections
    const alreadyExists = existingDetections.some(
      (d) => d.id.startsWith(detectionIdPrefix) && !d.handled
    );
    if (alreadyExists) continue;

    // Render briefing copy
    const description = renderTemplate(milestone.briefingCopyTemplate, {
      parentName,
      parentState: profile.state,
      leadTimeDisplay: `${milestone.leadTimeDays} days`,
      daysSinceReview: milestone.triggerCondition.documentKey
        ? getDaysSinceReview(profile, milestone.triggerCondition.documentKey)
        : undefined,
    });

    const domain = normalizeDomain(milestone.careDomain);

    detections.push({
      id: `${detectionIdPrefix}${Date.now()}`,
      agentType: "lifecycle_milestone",
      runId,
      detectedAt: now,
      title: milestone.milestoneName,
      description,
      relevanceScore: PRIORITY_RELEVANCE_LABEL[milestone.priorityTier],
      domain,
      actionable: true,
      handled: false,
      dataSource: "Internal calculations",
    });
  }

  return detections;
}

function getDaysSinceReview(profile: MilestoneProfile, documentKey: string): number | undefined {
  const timestamp = profile.documentTimestamps[documentKey];
  if (!timestamp) return undefined;
  return Math.floor((Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24));
}

function normalizeDomain(domain: string): "medical" | "financial" | "legal" | "housing" | "caregiving" {
  const map: Record<string, "medical" | "financial" | "legal" | "housing" | "caregiving"> = {
    medical: "medical",
    financial: "financial",
    legal: "legal",
    housing: "housing",
    caregiving: "caregiving",
    transportation: "medical", // Map transportation to medical as closest domain
  };
  return map[domain] || "caregiving";
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export function runLifecycleMilestoneScan(): {
  firedCount: number;
  detectionsCreated: number;
} {
  const profile = buildMilestoneProfile();

  // Guard: require age present (otherwise too noisy)
  if (profile.age === undefined && profile.fractionalAge === undefined) {
    return { firedCount: 0, detectionsCreated: 0 };
  }

  const now = new Date();
  const firedMilestones: LifecycleMilestone[] = [];

  for (const milestone of LIFECYCLE_MILESTONES) {
    const result = evaluateMilestoneTrigger(milestone, profile, now);
    if (result === "fired") {
      firedMilestones.push(milestone);
    }
  }

  const parentProfile = getParentProfile();
  const parentName = parentProfile?.name?.split(" ")[0] || "Your parent";

  const detections = generateMilestoneDetections(firedMilestones, profile, parentName);

  // Save detections
  for (const detection of detections) {
    saveDetection(detection);
  }

  // Save agent run
  const run: AgentRun = {
    id: `lifecycle_run_${Date.now()}`,
    agentType: "lifecycle_milestone",
    startedAt: now.toISOString(),
    completedAt: new Date().toISOString(),
    status: "completed",
    detectionsCount: detections.length,
    dataSource: "Internal calculations",
  };
  saveAgentRun(run);

  return { firedCount: firedMilestones.length, detectionsCreated: detections.length };
}
