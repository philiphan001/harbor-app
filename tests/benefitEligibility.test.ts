import { describe, it, expect, vi, beforeEach } from "vitest";
import type { BenefitProgram } from "@/lib/data/benefitPrograms";
import type { EligibilityProfile, BenefitMatch } from "@/lib/utils/benefitEligibility";
import { matchBenefits, generateBenefitDetections } from "@/lib/utils/benefitEligibility";
import { getAllDetections } from "@/lib/utils/agentStorage";

// --- Mock dependencies ---

vi.mock("@/lib/utils/agentStorage", () => ({
  getAllDetections: vi.fn(() => []),
  saveDetection: vi.fn(),
  saveAgentRun: vi.fn(),
}));

vi.mock("@/lib/utils/parentProfile", () => ({
  getParentProfile: vi.fn(() => ({ id: "p1", name: "Mom Smith", age: 72, state: "NY" })),
}));

vi.mock("@/lib/utils/taskData", () => ({
  getAllTaskData: vi.fn(() => []),
}));

vi.mock("@/lib/utils/medicationHelpers", () => ({
  getEnrichedMedications: vi.fn(() => []),
}));

vi.mock("@/lib/utils/situationContext", () => ({
  getSituationContextFromProfile: vi.fn(() => null),
}));

// --- Helpers ---

function makeProfile(overrides: Partial<EligibilityProfile> = {}): EligibilityProfile {
  return {
    age: 72,
    state: "NY",
    veteranStatus: undefined,
    hasSpouse: false,
    livingArrangement: "independent",
    insuranceTypes: ["medicare"],
    medicationCount: 3,
    hasPrescriptions: true,
    monthlyIncome: 1200,
    assets: 5000,
    fieldCompleteness: {
      age: true,
      state: true,
      insurance_type: true,
      income_range: true,
      veteran_status: false,
      conditions: false,
      medications: true,
      marital_status: true,
      housing_status: true,
      financial_data: true,
    },
    ...overrides,
  };
}

function makeProgram(overrides: Partial<BenefitProgram> = {}): BenefitProgram {
  return {
    programId: "test_program",
    name: "Test Program",
    shortName: "Test",
    careDomain: "financial",
    level: "federal",
    eligibilityCriteria: {
      minAge: 65,
      maxMonthlyIncome: 1350,
      requiredInsurance: ["medicare"],
    },
    minProfileFields: ["age", "insurance_type", "income_range"],
    estimatedAnnualValue: "$2,400\u2013$4,800",
    detectionCopyTemplate: "{parentName} may qualify for {estimatedValue}/year.",
    premiumExecutionSteps: ["Step 1", "Step 2"],
    description: "Test description",
    ...overrides,
  };
}

// --- Tests ---

describe("matchBenefits", () => {
  it("returns eligible when all criteria pass", () => {
    const profile = makeProfile({ age: 72, monthlyIncome: 1200, insuranceTypes: ["medicare"] });
    const programs = [makeProgram()];

    const results = matchBenefits(profile, programs);

    expect(results).toHaveLength(1);
    expect(results[0].confidence).toBe("eligible");
    expect(results[0].failedCriteria).toHaveLength(0);
    expect(results[0].missingCriteria).toHaveLength(0);
  });

  it("returns ineligible when a criterion definitively fails", () => {
    const profile = makeProfile({ age: 72, monthlyIncome: 5000, insuranceTypes: ["medicare"] });
    const programs = [makeProgram()];

    const results = matchBenefits(profile, programs);

    expect(results).toHaveLength(0); // ineligible excluded from results
  });

  it("returns potentially_eligible when data is missing but nothing fails", () => {
    const profile = makeProfile({ age: 72, monthlyIncome: undefined, insuranceTypes: ["medicare"] });
    const programs = [makeProgram()];

    const results = matchBenefits(profile, programs);

    expect(results).toHaveLength(1);
    expect(results[0].confidence).toBe("potentially_eligible");
    expect(results[0].missingCriteria).toContain("income");
  });

  it("uses couple thresholds when hasSpouse is true", () => {
    const profile = makeProfile({
      age: 72,
      hasSpouse: true,
      monthlyIncome: 1500,
      insuranceTypes: ["medicare"],
    });
    const programs = [makeProgram({
      eligibilityCriteria: {
        minAge: 65,
        maxMonthlyIncome: 1350,
        maxMonthlyIncomeCouple: 1824,
        requiredInsurance: ["medicare"],
      },
    })];

    const results = matchBenefits(profile, programs);

    expect(results).toHaveLength(1);
    expect(results[0].confidence).toBe("eligible");
  });

  it("filters state programs to matching state", () => {
    const profile = makeProfile({ state: "CA" });
    const programs = [makeProgram({
      programId: "ny_only",
      state: "NY",
      eligibilityCriteria: { minAge: 65, states: ["NY"] },
    })];

    const results = matchBenefits(profile, programs);

    expect(results).toHaveLength(0);
  });

  it("includes state programs when state matches", () => {
    const profile = makeProfile({ state: "NY", age: 72 });
    const programs = [makeProgram({
      programId: "ny_program",
      state: "NY",
      eligibilityCriteria: { minAge: 65, states: ["NY"] },
    })];

    const results = matchBenefits(profile, programs);

    expect(results).toHaveLength(1);
  });

  it("requires veteran status for VA programs", () => {
    const profile = makeProfile({ veteranStatus: false });
    const programs = [makeProgram({
      programId: "va_program",
      eligibilityCriteria: { veteranRequired: true },
    })];

    const results = matchBenefits(profile, programs);

    expect(results).toHaveLength(0);
  });

  it("marks veteran as potentially eligible when status unknown", () => {
    const profile = makeProfile({ veteranStatus: undefined });
    const programs = [makeProgram({
      programId: "va_program",
      eligibilityCriteria: { veteranRequired: true },
    })];

    const results = matchBenefits(profile, programs);

    expect(results).toHaveLength(1);
    expect(results[0].confidence).toBe("potentially_eligible");
  });

  it("sorts eligible before potentially_eligible", () => {
    const profile = makeProfile({ age: 72, monthlyIncome: 1200, insuranceTypes: ["medicare"] });
    const programs = [
      makeProgram({
        programId: "maybe",
        eligibilityCriteria: { minAge: 65, veteranRequired: true },
      }),
      makeProgram({
        programId: "yes",
        eligibilityCriteria: { minAge: 65 },
      }),
    ];

    const results = matchBenefits(profile, programs);

    expect(results[0].program.programId).toBe("yes");
    expect(results[0].confidence).toBe("eligible");
    expect(results[1].program.programId).toBe("maybe");
    expect(results[1].confidence).toBe("potentially_eligible");
  });

  it("excludes programs where excluded insurance is present", () => {
    const profile = makeProfile({ insuranceTypes: ["medicaid"] });
    const programs = [makeProgram({
      eligibilityCriteria: { excludedInsurance: ["medicaid"] },
    })];

    const results = matchBenefits(profile, programs);

    expect(results).toHaveLength(0);
  });
});

describe("generateBenefitDetections", () => {
  beforeEach(() => {
    vi.mocked(getAllDetections).mockReturnValue([]);
  });

  it("creates detections for matches", () => {
    const profile = makeProfile();
    const matches: BenefitMatch[] = [
      {
        program: makeProgram(),
        confidence: "eligible",
        matchedCriteria: ["age", "income", "insurance"],
        failedCriteria: [],
        missingCriteria: [],
        dataCompleteness: 1,
      },
    ];

    const detections = generateBenefitDetections(matches, profile, "Mom");

    expect(detections).toHaveLength(1);
    expect(detections[0].title).toContain("Likely Eligible");
    expect(detections[0].relevanceScore).toBe("high");
    expect(detections[0].agentType).toBe("benefit_eligibility");
  });

  it("uses 'May Qualify' title for potentially eligible", () => {
    const profile = makeProfile();
    const matches: BenefitMatch[] = [
      {
        program: makeProgram(),
        confidence: "potentially_eligible",
        matchedCriteria: ["age"],
        failedCriteria: [],
        missingCriteria: ["income"],
        dataCompleteness: 0.5,
      },
    ];

    const detections = generateBenefitDetections(matches, profile, "Mom");

    expect(detections).toHaveLength(1);
    expect(detections[0].title).toContain("May Qualify");
    expect(detections[0].relevanceScore).toBe("medium");
    expect(detections[0].description).toContain("Add income to confirm eligibility");
  });

  it("renders template variables correctly", () => {
    const profile = makeProfile({ medicationCount: 5 });
    const matches: BenefitMatch[] = [
      {
        program: makeProgram({
          detectionCopyTemplate: "{parentName} takes {medicationCount} meds. Value: {estimatedValue}.",
          estimatedAnnualValue: "$1,000",
        }),
        confidence: "eligible",
        matchedCriteria: ["age"],
        failedCriteria: [],
        missingCriteria: [],
        dataCompleteness: 1,
      },
    ];

    const detections = generateBenefitDetections(matches, profile, "Dad");

    expect(detections[0].description).toBe("Dad takes 5 meds. Value: $1,000.");
  });

  it("deduplicates against existing unhandled detections", () => {
    vi.mocked(getAllDetections).mockReturnValue([
      {
        id: "benefit_test_program_12345",
        agentType: "benefit_eligibility",
        runId: "old",
        detectedAt: "2026-01-01",
        title: "Existing",
        description: "Old detection",
        relevanceScore: "high",
        domain: "financial",
        actionable: true,
        handled: false,
      },
    ]);

    const profile = makeProfile();
    const matches: BenefitMatch[] = [
      {
        program: makeProgram({ programId: "test_program" }),
        confidence: "eligible",
        matchedCriteria: ["age"],
        failedCriteria: [],
        missingCriteria: [],
        dataCompleteness: 1,
      },
    ];

    const detections = generateBenefitDetections(matches, profile, "Mom");

    expect(detections).toHaveLength(0);
  });

  it("does not dedup against handled detections", () => {
    vi.mocked(getAllDetections).mockReturnValue([
      {
        id: "benefit_test_program_12345",
        agentType: "benefit_eligibility",
        runId: "old",
        detectedAt: "2026-01-01",
        title: "Existing",
        description: "Old detection",
        relevanceScore: "high",
        domain: "financial",
        actionable: true,
        handled: true,
      },
    ]);

    const profile = makeProfile();
    const matches: BenefitMatch[] = [
      {
        program: makeProgram({ programId: "test_program" }),
        confidence: "eligible",
        matchedCriteria: ["age"],
        failedCriteria: [],
        missingCriteria: [],
        dataCompleteness: 1,
      },
    ];

    const detections = generateBenefitDetections(matches, profile, "Mom");

    expect(detections).toHaveLength(1);
  });
});
