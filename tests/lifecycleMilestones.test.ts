import { describe, it, expect, vi, beforeEach } from "vitest";
import type { LifecycleMilestone } from "@/lib/data/lifecycleMilestones";
import type { MilestoneProfile } from "@/lib/utils/lifecycleMilestones";
import { evaluateMilestoneTrigger, generateMilestoneDetections } from "@/lib/utils/lifecycleMilestones";
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

vi.mock("@/lib/utils/situationContext", () => ({
  getSituationContextFromProfile: vi.fn(() => null),
}));

vi.mock("@/lib/utils/templateRenderer", () => ({
  renderTemplate: vi.fn((template: string, vars: Record<string, unknown>) => {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value ?? ""));
    }
    return result;
  }),
}));

// --- Helpers ---

function makeProfile(overrides: Partial<MilestoneProfile> = {}): MilestoneProfile {
  return {
    age: 72,
    fractionalAge: 72.3,
    state: "NY",
    veteranStatus: false,
    hasRecentHospitalization: false,
    hasLtcInsurance: false,
    adlDeclineDetected: false,
    cognitiveDeclineDetected: false,
    documentTimestamps: {},
    ...overrides,
  };
}

function makeMilestone(overrides: Partial<LifecycleMilestone> = {}): LifecycleMilestone {
  return {
    milestoneId: "test_milestone",
    milestoneName: "Test Milestone",
    triggerType: "age",
    triggerCondition: { ageThreshold: 65, ageOperator: ">=" },
    leadTimeDays: 0,
    stateSpecific: false,
    briefingCopyTemplate: "{parentName} has reached a milestone.",
    linkedFeatures: [],
    priorityTier: "important",
    careDomain: "medical",
    ...overrides,
  };
}

// --- evaluateMilestoneTrigger tests ---

describe("evaluateMilestoneTrigger", () => {
  const now = new Date("2026-03-10T12:00:00Z");

  describe("age triggers", () => {
    it("fires when age exceeds threshold", () => {
      const milestone = makeMilestone({
        triggerCondition: { ageThreshold: 65, ageOperator: ">=" },
        leadTimeDays: 0,
      });
      const profile = makeProfile({ age: 72, fractionalAge: 72.3 });
      expect(evaluateMilestoneTrigger(milestone, profile, now)).toBe("fired");
    });

    it("does not fire when age below threshold", () => {
      const milestone = makeMilestone({
        triggerCondition: { ageThreshold: 75, ageOperator: ">=" },
        leadTimeDays: 0,
      });
      const profile = makeProfile({ age: 72, fractionalAge: 72.3 });
      expect(evaluateMilestoneTrigger(milestone, profile, now)).toBe("not_fired");
    });

    it("fires with lead time before threshold", () => {
      const milestone = makeMilestone({
        triggerCondition: { ageThreshold: 73, ageOperator: ">=" },
        leadTimeDays: 365, // 1 year lead = effective threshold 72
      });
      const profile = makeProfile({ age: 72, fractionalAge: 72.3 });
      expect(evaluateMilestoneTrigger(milestone, profile, now)).toBe("fired");
    });

    it("uses fractional age for precise lead time", () => {
      const milestone = makeMilestone({
        triggerCondition: { ageThreshold: 65, ageOperator: ">=" },
        leadTimeDays: 210, // ~0.575 years, effective threshold ~64.42
      });
      const profile = makeProfile({ age: 64, fractionalAge: 64.5 });
      expect(evaluateMilestoneTrigger(milestone, profile, now)).toBe("fired");
    });

    it("returns data_missing when age is undefined", () => {
      const milestone = makeMilestone({
        triggerCondition: { ageThreshold: 65, ageOperator: ">=" },
      });
      const profile = makeProfile({ age: undefined, fractionalAge: undefined });
      expect(evaluateMilestoneTrigger(milestone, profile, now)).toBe("data_missing");
    });

    it("falls back to integer age when fractionalAge not available", () => {
      const milestone = makeMilestone({
        triggerCondition: { ageThreshold: 65, ageOperator: ">=" },
        leadTimeDays: 0,
      });
      const profile = makeProfile({ age: 66, fractionalAge: undefined });
      expect(evaluateMilestoneTrigger(milestone, profile, now)).toBe("fired");
    });
  });

  describe("calendar triggers", () => {
    it("fires when current date is within window", () => {
      const milestone = makeMilestone({
        triggerType: "calendar",
        triggerCondition: {
          windowStartMonth: 3,
          windowStartDay: 1,
          windowEndMonth: 4,
          windowEndDay: 15,
        },
        leadTimeDays: 0,
      });
      const profile = makeProfile();
      // now = March 10
      expect(evaluateMilestoneTrigger(milestone, profile, now)).toBe("fired");
    });

    it("does not fire when outside window", () => {
      const milestone = makeMilestone({
        triggerType: "calendar",
        triggerCondition: {
          windowStartMonth: 6,
          windowStartDay: 1,
          windowEndMonth: 8,
          windowEndDay: 31,
        },
        leadTimeDays: 0,
      });
      const profile = makeProfile();
      expect(evaluateMilestoneTrigger(milestone, profile, now)).toBe("not_fired");
    });

    it("fires with lead time before window", () => {
      const milestone = makeMilestone({
        triggerType: "calendar",
        triggerCondition: {
          windowStartMonth: 4,
          windowStartDay: 1,
          windowEndMonth: 4,
          windowEndDay: 30,
        },
        leadTimeDays: 30, // Lead time pushes start to ~March 2
      });
      const profile = makeProfile();
      // now = March 10, lead-adjusted start ~March 2
      expect(evaluateMilestoneTrigger(milestone, profile, now)).toBe("fired");
    });
  });

  describe("event triggers", () => {
    it("fires when hospitalization logged", () => {
      const milestone = makeMilestone({
        triggerType: "event",
        triggerCondition: { eventKey: "hospitalization_logged" },
      });
      const profile = makeProfile({ hasRecentHospitalization: true });
      expect(evaluateMilestoneTrigger(milestone, profile, now)).toBe("fired");
    });

    it("does not fire without hospitalization", () => {
      const milestone = makeMilestone({
        triggerType: "event",
        triggerCondition: { eventKey: "hospitalization_logged" },
      });
      const profile = makeProfile({ hasRecentHospitalization: false });
      expect(evaluateMilestoneTrigger(milestone, profile, now)).toBe("not_fired");
    });
  });

  describe("threshold triggers", () => {
    it("fires when spend_down_months within threshold", () => {
      const milestone = makeMilestone({
        triggerType: "threshold",
        triggerCondition: { thresholdKey: "spend_down_months", thresholdValue: 72, thresholdOperator: "<=" },
      });
      const profile = makeProfile({ spendDownMonths: 48 });
      expect(evaluateMilestoneTrigger(milestone, profile, now)).toBe("fired");
    });

    it("does not fire when above threshold", () => {
      const milestone = makeMilestone({
        triggerType: "threshold",
        triggerCondition: { thresholdKey: "spend_down_months", thresholdValue: 72, thresholdOperator: "<=" },
      });
      const profile = makeProfile({ spendDownMonths: 100 });
      expect(evaluateMilestoneTrigger(milestone, profile, now)).toBe("not_fired");
    });

    it("returns data_missing when data absent", () => {
      const milestone = makeMilestone({
        triggerType: "threshold",
        triggerCondition: { thresholdKey: "spend_down_months", thresholdValue: 72, thresholdOperator: "<=" },
      });
      const profile = makeProfile({ spendDownMonths: undefined });
      expect(evaluateMilestoneTrigger(milestone, profile, now)).toBe("data_missing");
    });

    it("fires veteran_not_assessed when veteran", () => {
      const milestone = makeMilestone({
        triggerType: "threshold",
        triggerCondition: { thresholdKey: "veteran_not_assessed", thresholdValue: 1, thresholdOperator: ">=" },
      });
      const profile = makeProfile({ veteranStatus: true });
      expect(evaluateMilestoneTrigger(milestone, profile, now)).toBe("fired");
    });

    it("does not fire veteran_not_assessed for non-veteran", () => {
      const milestone = makeMilestone({
        triggerType: "threshold",
        triggerCondition: { thresholdKey: "veteran_not_assessed", thresholdValue: 1, thresholdOperator: ">=" },
      });
      const profile = makeProfile({ veteranStatus: false });
      expect(evaluateMilestoneTrigger(milestone, profile, now)).toBe("not_fired");
    });
  });

  describe("document_expiry triggers", () => {
    it("fires when never reviewed (document captured with empty timestamp)", () => {
      const milestone = makeMilestone({
        triggerType: "document_expiry",
        triggerCondition: { documentKey: "poa", maxDaysSinceReview: 365 },
        leadTimeDays: 90,
      });
      // Document key exists but with empty string (captured but timestamp is falsy)
      // Actually, for "never reviewed" the key shouldn't exist — but if it's in the map it means captured
      // Let's test with key present but going through the flow
      const profile = makeProfile({
        documentTimestamps: { poa: "" },
      });
      // Empty string is falsy, so it goes to the "check if has document" path
      // Since "poa" is in documentTimestamps, hasDocument is true → fires
      expect(evaluateMilestoneTrigger(milestone, profile, now)).toBe("fired");
    });

    it("fires when overdue for review", () => {
      const milestone = makeMilestone({
        triggerType: "document_expiry",
        triggerCondition: { documentKey: "poa", maxDaysSinceReview: 365 },
        leadTimeDays: 90,
      });
      // Last reviewed 300 days ago (effective threshold = 365 - 90 = 275 days)
      const lastReviewed = new Date(now.getTime() - 300 * 24 * 60 * 60 * 1000).toISOString();
      const profile = makeProfile({
        documentTimestamps: { poa: lastReviewed },
      });
      expect(evaluateMilestoneTrigger(milestone, profile, now)).toBe("fired");
    });

    it("does not fire when recently reviewed", () => {
      const milestone = makeMilestone({
        triggerType: "document_expiry",
        triggerCondition: { documentKey: "poa", maxDaysSinceReview: 365 },
        leadTimeDays: 90,
      });
      // Last reviewed 30 days ago (well within 275-day effective threshold)
      const lastReviewed = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const profile = makeProfile({
        documentTimestamps: { poa: lastReviewed },
      });
      expect(evaluateMilestoneTrigger(milestone, profile, now)).toBe("not_fired");
    });

    it("does not fire when document not captured at all", () => {
      const milestone = makeMilestone({
        triggerType: "document_expiry",
        triggerCondition: { documentKey: "poa", maxDaysSinceReview: 365 },
        leadTimeDays: 90,
      });
      const profile = makeProfile({ documentTimestamps: {} });
      expect(evaluateMilestoneTrigger(milestone, profile, now)).toBe("not_fired");
    });
  });
});

// --- generateMilestoneDetections tests ---

describe("generateMilestoneDetections", () => {
  beforeEach(() => {
    vi.mocked(getAllDetections).mockReturnValue([]);
  });

  it("creates detections for fired milestones", () => {
    const profile = makeProfile();
    const milestones = [makeMilestone({ priorityTier: "urgent" })];

    const detections = generateMilestoneDetections(milestones, profile, "Mom");

    expect(detections).toHaveLength(1);
    expect(detections[0].agentType).toBe("lifecycle_milestone");
    expect(detections[0].relevanceScore).toBe("high");
    expect(detections[0].title).toBe("Test Milestone");
  });

  it("maps priority tiers to relevance scores correctly", () => {
    const profile = makeProfile();

    const urgentDetections = generateMilestoneDetections(
      [makeMilestone({ milestoneId: "m1", priorityTier: "urgent" })],
      profile, "Mom"
    );
    expect(urgentDetections[0].relevanceScore).toBe("high");

    const importantDetections = generateMilestoneDetections(
      [makeMilestone({ milestoneId: "m2", priorityTier: "important" })],
      profile, "Mom"
    );
    expect(importantDetections[0].relevanceScore).toBe("medium");

    const recommendedDetections = generateMilestoneDetections(
      [makeMilestone({ milestoneId: "m3", priorityTier: "recommended" })],
      profile, "Mom"
    );
    expect(recommendedDetections[0].relevanceScore).toBe("low");
  });

  it("deduplicates against existing unhandled detections", () => {
    vi.mocked(getAllDetections).mockReturnValue([
      {
        id: "lifecycle_test_milestone_12345",
        agentType: "lifecycle_milestone",
        runId: "old",
        detectedAt: "2026-01-01",
        title: "Existing",
        description: "Old detection",
        relevanceScore: "high",
        domain: "medical",
        actionable: true,
        handled: false,
      },
    ]);

    const profile = makeProfile();
    const milestones = [makeMilestone({ milestoneId: "test_milestone" })];

    const detections = generateMilestoneDetections(milestones, profile, "Mom");

    expect(detections).toHaveLength(0);
  });

  it("allows re-detection of handled milestones", () => {
    vi.mocked(getAllDetections).mockReturnValue([
      {
        id: "lifecycle_test_milestone_12345",
        agentType: "lifecycle_milestone",
        runId: "old",
        detectedAt: "2026-01-01",
        title: "Existing",
        description: "Old detection",
        relevanceScore: "high",
        domain: "medical",
        actionable: true,
        handled: true,
      },
    ]);

    const profile = makeProfile();
    const milestones = [makeMilestone({ milestoneId: "test_milestone" })];

    const detections = generateMilestoneDetections(milestones, profile, "Mom");

    expect(detections).toHaveLength(1);
  });

  it("renders template with parentName variable", () => {
    const profile = makeProfile({ state: "CA" });
    const milestones = [makeMilestone({
      briefingCopyTemplate: "{parentName} in {parentState} has a milestone.",
    })];

    const detections = generateMilestoneDetections(milestones, profile, "Dad");

    expect(detections[0].description).toContain("Dad");
    expect(detections[0].description).toContain("CA");
  });

  it("normalizes domain correctly", () => {
    const profile = makeProfile();

    const medicalDetections = generateMilestoneDetections(
      [makeMilestone({ milestoneId: "m1", careDomain: "medical" })],
      profile, "Mom"
    );
    expect(medicalDetections[0].domain).toBe("medical");

    const financialDetections = generateMilestoneDetections(
      [makeMilestone({ milestoneId: "m2", careDomain: "financial" })],
      profile, "Mom"
    );
    expect(financialDetections[0].domain).toBe("financial");
  });
});
