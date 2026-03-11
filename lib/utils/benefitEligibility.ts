// Benefit Eligibility Matching Engine
// Cross-references parent profile data against static benefit catalog

import type { AgentDetection, AgentRun } from "@/lib/types/agents";
import { BENEFIT_PROGRAMS, type BenefitProgram, type EligibilityCriteria } from "@/lib/data/benefitPrograms";
import { getParentProfile } from "./parentProfile";
import { getAllTaskData } from "./taskData";
import { getEnrichedMedications } from "./medicationHelpers";
import { getSituationContextFromProfile } from "./situationContext";
import { getAllDetections, saveDetection, saveAgentRun } from "./agentStorage";
import { renderTemplate } from "./templateRenderer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EligibilityProfile {
  age?: number;
  state?: string;
  veteranStatus?: boolean;
  hasSpouse?: boolean;
  livingArrangement?: string;
  insuranceTypes: string[];      // e.g., ["medicare"], ["medicare", "medicaid"]
  medicationCount: number;
  hasPrescriptions: boolean;
  monthlyIncome?: number;
  assets?: number;
  fieldCompleteness: Record<string, boolean>;
}

export type MatchConfidence = "eligible" | "potentially_eligible" | "ineligible";

export interface BenefitMatch {
  program: BenefitProgram;
  confidence: MatchConfidence;
  matchedCriteria: string[];
  failedCriteria: string[];
  missingCriteria: string[];
  dataCompleteness: number; // 0-1
}

// ---------------------------------------------------------------------------
// Profile Builder
// ---------------------------------------------------------------------------

export function buildEligibilityProfile(): EligibilityProfile {
  const profile = getParentProfile();
  const taskData = getAllTaskData();
  const medications = getEnrichedMedications();

  // Extract insurance type from task data
  const insuranceTypes: string[] = [];
  const insuranceCapture = taskData.find((td) => td.toolName === "save_insurance_info");
  if (insuranceCapture) {
    // Default to "medicare" when insurance data is captured but coverageType is untyped
    const coverageType = (insuranceCapture.data as Record<string, unknown>)?.coverageType;
    if (typeof coverageType === "string" && coverageType) {
      insuranceTypes.push(coverageType);
    } else {
      insuranceTypes.push("medicare");
    }
  }

  // Extract financial data from situation context
  let monthlyIncome: number | undefined;
  let assets: number | undefined;
  if (profile?.id) {
    const context = getSituationContextFromProfile(profile.id);
    if (context) {
      monthlyIncome = context.financial.monthlyIncome;
      assets = context.financial.assets;
    }
  }

  const fieldCompleteness: Record<string, boolean> = {
    age: !!profile?.age,
    state: !!profile?.state,
    insurance_type: insuranceTypes.length > 0,
    income_range: monthlyIncome !== undefined,
    veteran_status: profile?.veteranStatus !== undefined,
    conditions: false, // TODO: check conditions from situation context
    medications: medications.length > 0,
    marital_status: profile?.spouse !== undefined,
    housing_status: !!profile?.livingArrangement,
    financial_data: assets !== undefined,
  };

  return {
    age: profile?.age,
    state: profile?.state,
    veteranStatus: profile?.veteranStatus,
    hasSpouse: profile?.spouse !== undefined ? profile.spouse.living : undefined,
    livingArrangement: profile?.livingArrangement,
    insuranceTypes,
    medicationCount: medications.length,
    hasPrescriptions: medications.length > 0,
    monthlyIncome,
    assets,
    fieldCompleteness,
  };
}

// ---------------------------------------------------------------------------
// Matching Engine (pure function)
// ---------------------------------------------------------------------------

type CriterionResult = "matched" | "failed" | "missing";

function checkCriterion(
  name: string,
  check: () => CriterionResult,
  matched: string[],
  failed: string[],
  missing: string[],
): void {
  const result = check();
  if (result === "matched") matched.push(name);
  else if (result === "failed") failed.push(name);
  else missing.push(name);
}

function evaluateCriteria(
  criteria: EligibilityCriteria,
  profile: EligibilityProfile,
): { matched: string[]; failed: string[]; missing: string[] } {
  const matched: string[] = [];
  const failed: string[] = [];
  const missing: string[] = [];

  // Age check
  if (criteria.minAge !== undefined) {
    checkCriterion("age", () => {
      if (profile.age === undefined) return "missing";
      return profile.age >= criteria.minAge! ? "matched" : "failed";
    }, matched, failed, missing);
  }

  // Income check (use couple threshold if has spouse)
  if (criteria.maxMonthlyIncome !== undefined) {
    checkCriterion("income", () => {
      if (profile.monthlyIncome === undefined) return "missing";
      const threshold = (profile.hasSpouse && criteria.maxMonthlyIncomeCouple)
        ? criteria.maxMonthlyIncomeCouple
        : criteria.maxMonthlyIncome!;
      return profile.monthlyIncome <= threshold ? "matched" : "failed";
    }, matched, failed, missing);
  }

  // Asset check
  if (criteria.maxAssets !== undefined) {
    checkCriterion("assets", () => {
      if (profile.assets === undefined) return "missing";
      const threshold = (profile.hasSpouse && criteria.maxAssetsCouple)
        ? criteria.maxAssetsCouple
        : criteria.maxAssets!;
      return profile.assets <= threshold ? "matched" : "failed";
    }, matched, failed, missing);
  }

  // Required insurance
  if (criteria.requiredInsurance && criteria.requiredInsurance.length > 0) {
    checkCriterion("insurance", () => {
      if (profile.insuranceTypes.length === 0) return "missing";
      const hasAll = criteria.requiredInsurance!.every((req) =>
        profile.insuranceTypes.some((ins) => ins.toLowerCase().includes(req.toLowerCase()))
      );
      return hasAll ? "matched" : "failed";
    }, matched, failed, missing);
  }

  // Excluded insurance
  if (criteria.excludedInsurance && criteria.excludedInsurance.length > 0) {
    checkCriterion("excluded_insurance", () => {
      if (profile.insuranceTypes.length === 0) return "missing";
      const hasExcluded = criteria.excludedInsurance!.some((exc) =>
        profile.insuranceTypes.some((ins) => ins.toLowerCase().includes(exc.toLowerCase()))
      );
      return hasExcluded ? "failed" : "matched";
    }, matched, failed, missing);
  }

  // Veteran required
  if (criteria.veteranRequired) {
    checkCriterion("veteran", () => {
      if (profile.veteranStatus === undefined) return "missing";
      return profile.veteranStatus ? "matched" : "failed";
    }, matched, failed, missing);
  }

  // State restriction
  if (criteria.states && criteria.states.length > 0) {
    checkCriterion("state", () => {
      if (!profile.state) return "missing";
      return criteria.states!.includes(profile.state.toUpperCase()) ? "matched" : "failed";
    }, matched, failed, missing);
  }

  // Medications required
  if (criteria.requiresMedications) {
    checkCriterion("medications", () => {
      return profile.hasPrescriptions ? "matched" : "missing";
    }, matched, failed, missing);
  }

  // Nursing home care needed (soft — always missing since we don't assess this directly)
  if (criteria.needsNursingHomeCare) {
    checkCriterion("nursing_home_care", () => "missing", matched, failed, missing);
  }

  return { matched, failed, missing };
}

export function matchBenefits(
  profile: EligibilityProfile,
  programs: BenefitProgram[],
): BenefitMatch[] {
  const results: BenefitMatch[] = [];

  for (const program of programs) {
    // State programs: wrong state = ineligible
    if (program.state && profile.state && profile.state.toUpperCase() !== program.state.toUpperCase()) {
      continue;
    }

    const { matched, failed, missing } = evaluateCriteria(program.eligibilityCriteria, profile);
    const totalCriteria = matched.length + failed.length + missing.length;
    const dataCompleteness = totalCriteria > 0 ? matched.length / totalCriteria : 0;

    let confidence: MatchConfidence;
    if (failed.length > 0) {
      confidence = "ineligible";
    } else if (missing.length === 0) {
      confidence = "eligible";
    } else {
      confidence = "potentially_eligible";
    }

    if (confidence !== "ineligible") {
      results.push({
        program,
        confidence,
        matchedCriteria: matched,
        failedCriteria: failed,
        missingCriteria: missing,
        dataCompleteness,
      });
    }
  }

  // Sort: eligible first, then by dataCompleteness desc
  results.sort((a, b) => {
    if (a.confidence !== b.confidence) {
      return a.confidence === "eligible" ? -1 : 1;
    }
    return b.dataCompleteness - a.dataCompleteness;
  });

  return results;
}

// ---------------------------------------------------------------------------
// Detection Generator
// ---------------------------------------------------------------------------

export function generateBenefitDetections(
  matches: BenefitMatch[],
  profile: EligibilityProfile,
  parentName: string,
): AgentDetection[] {
  const existingDetections = getAllDetections();
  const now = new Date().toISOString();
  const runId = `benefit_run_${Date.now()}`;
  const detections: AgentDetection[] = [];

  for (const match of matches) {
    const detectionIdPrefix = `benefit_${match.program.programId}_`;

    // Dedup: skip programs already present as unhandled detections
    const alreadyExists = existingDetections.some(
      (d) => d.id.startsWith(detectionIdPrefix) && !d.handled
    );
    if (alreadyExists) continue;

    // Render description from template
    let description = renderTemplate(match.program.detectionCopyTemplate, {
      parentName,
      parentState: profile.state,
      estimatedValue: match.program.estimatedAnnualValue,
      medicationCount: profile.medicationCount,
    });

    // For potentially eligible, append missing data prompt
    if (match.confidence === "potentially_eligible" && match.missingCriteria.length > 0) {
      const missingFields = match.missingCriteria
        .map((c) => c.replace(/_/g, " "))
        .join(", ");
      description += ` Add ${missingFields} to confirm eligibility.`;
    }

    const title = match.confidence === "eligible"
      ? `Likely Eligible: ${match.program.shortName}`
      : `May Qualify: ${match.program.shortName}`;

    detections.push({
      id: `${detectionIdPrefix}${Date.now()}`,
      agentType: "benefit_eligibility",
      runId,
      detectedAt: now,
      title,
      description,
      relevanceScore: match.confidence === "eligible" ? "high" : "medium",
      domain: match.program.careDomain,
      actionable: true,
      handled: false,
      sourceUrl: match.program.applicationUrl,
      dataSource: "Internal calculations",
    });
  }

  return detections;
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export function runBenefitEligibilityScan(): {
  matches: BenefitMatch[];
  detectionsCreated: number;
} {
  const profile = buildEligibilityProfile();

  // Guard: require age + state (otherwise too noisy)
  if (!profile.age || !profile.state) {
    return { matches: [], detectionsCreated: 0 };
  }

  const parentProfile = getParentProfile();
  const parentName = parentProfile?.name?.split(" ")[0] || "Your parent";

  const matches = matchBenefits(profile, BENEFIT_PROGRAMS);
  const detections = generateBenefitDetections(matches, profile, parentName);

  // Save detections and agent run
  for (const detection of detections) {
    saveDetection(detection);
  }

  const run: AgentRun = {
    id: `benefit_run_${Date.now()}`,
    agentType: "benefit_eligibility",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    status: "completed",
    detectionsCount: detections.length,
    dataSource: "Internal calculations",
  };
  saveAgentRun(run);

  return { matches, detectionsCreated: detections.length };
}
