import { describe, it, expect } from "vitest";
import type { NudgeState, NudgeSourceType, PriorityTier } from "@/lib/types/nudges";
import type { NudgeDefinition } from "@/lib/types/nudges";
import type { AgentDetection } from "@/lib/types/agents";
import {
  NUDGE_TYPE_TIER,
  SNOOZE_BY_TIER,
  sortNudges,
  applySingleTypeCap,
  applyHardCap,
  getDegradationMode,
  buildConsolidatedCards,
  isExpired,
  isSnoozed,
  unsnoozePastDue,
  calendarNudgeToState,
  detectionToNudge,
  prioritizeNudges,
} from "@/lib/utils/nudgePriority";

// --- Helpers ---

function makeNudge(overrides: Partial<NudgeState> = {}): NudgeState {
  return {
    id: "test_1",
    sourceType: "custom",
    tier: "P3",
    title: "Test Nudge",
    description: "A test nudge",
    icon: "📋",
    domain: "medical",
    status: "active",
    relevanceScore: 50,
    createdAt: "2026-03-01T00:00:00.000Z",
    snoozeCount: 0,
    ...overrides,
  };
}

// --- Tier mapping ---

describe("NUDGE_TYPE_TIER", () => {
  it("maps drug_recall to P0", () => {
    expect(NUDGE_TYPE_TIER.drug_recall).toBe("P0");
  });

  it("maps safety_alert to P0", () => {
    expect(NUDGE_TYPE_TIER.safety_alert).toBe("P0");
  });

  it("maps prescription_refill to P1", () => {
    expect(NUDGE_TYPE_TIER.prescription_refill).toBe("P1");
  });

  it("maps drivers_license_renewal to P3", () => {
    expect(NUDGE_TYPE_TIER.drivers_license_renewal).toBe("P3");
  });

  it("maps custom to P4", () => {
    expect(NUDGE_TYPE_TIER.custom).toBe("P4");
  });
});

// --- SNOOZE_BY_TIER ---

describe("SNOOZE_BY_TIER", () => {
  it("P0 snooze is 4 hours with max 2 and lock", () => {
    expect(SNOOZE_BY_TIER.P0.durationMs).toBe(4 * 60 * 60 * 1000);
    expect(SNOOZE_BY_TIER.P0.maxSnoozes).toBe(2);
    expect(SNOOZE_BY_TIER.P0.afterMax).toBe("lock");
  });

  it("P1 snooze is 24 hours with max 3 and dismiss", () => {
    expect(SNOOZE_BY_TIER.P1.durationMs).toBe(24 * 60 * 60 * 1000);
    expect(SNOOZE_BY_TIER.P1.maxSnoozes).toBe(3);
    expect(SNOOZE_BY_TIER.P1.afterMax).toBe("dismiss");
  });
});

// --- sortNudges ---

describe("sortNudges", () => {
  it("sorts P0 before P1", () => {
    const nudges = [
      makeNudge({ id: "a", tier: "P1" }),
      makeNudge({ id: "b", tier: "P0" }),
    ];
    const sorted = sortNudges(nudges);
    expect(sorted[0].id).toBe("b");
    expect(sorted[1].id).toBe("a");
  });

  it("sorts by relevanceScore within same tier", () => {
    const nudges = [
      makeNudge({ id: "a", tier: "P2", relevanceScore: 60 }),
      makeNudge({ id: "b", tier: "P2", relevanceScore: 80 }),
    ];
    const sorted = sortNudges(nudges);
    expect(sorted[0].id).toBe("b");
  });

  it("sorts by recency within same tier and score", () => {
    const nudges = [
      makeNudge({ id: "a", tier: "P2", relevanceScore: 50, createdAt: "2026-03-01T00:00:00Z" }),
      makeNudge({ id: "b", tier: "P2", relevanceScore: 50, createdAt: "2026-03-05T00:00:00Z" }),
    ];
    const sorted = sortNudges(nudges);
    expect(sorted[0].id).toBe("b"); // newer first
  });

  it("sorts by deadline asc as final tiebreaker", () => {
    const nudges = [
      makeNudge({ id: "a", tier: "P2", relevanceScore: 50, createdAt: "2026-03-01T00:00:00Z", deadline: "2026-04-01T00:00:00Z" }),
      makeNudge({ id: "b", tier: "P2", relevanceScore: 50, createdAt: "2026-03-01T00:00:00Z", deadline: "2026-03-15T00:00:00Z" }),
    ];
    const sorted = sortNudges(nudges);
    expect(sorted[0].id).toBe("b"); // earlier deadline first
  });
});

// --- applySingleTypeCap ---

describe("applySingleTypeCap", () => {
  it("caps at 2 per sourceType", () => {
    const nudges = [
      makeNudge({ id: "a", sourceType: "flu_shot" }),
      makeNudge({ id: "b", sourceType: "flu_shot" }),
      makeNudge({ id: "c", sourceType: "flu_shot" }),
    ];
    const { display, queued } = applySingleTypeCap(nudges);
    expect(display).toHaveLength(2);
    expect(queued).toHaveLength(1);
    expect(queued[0].id).toBe("c");
  });

  it("P0 is exempt from single-type cap", () => {
    const nudges = [
      makeNudge({ id: "a", sourceType: "drug_recall", tier: "P0" }),
      makeNudge({ id: "b", sourceType: "drug_recall", tier: "P0" }),
      makeNudge({ id: "c", sourceType: "drug_recall", tier: "P0" }),
    ];
    const { display, queued } = applySingleTypeCap(nudges);
    expect(display).toHaveLength(3);
    expect(queued).toHaveLength(0);
  });
});

// --- applyHardCap ---

describe("applyHardCap", () => {
  it("allows up to 8 nudges", () => {
    const nudges = Array.from({ length: 8 }, (_, i) => makeNudge({ id: `n${i}` }));
    const { display, queued } = applyHardCap(nudges);
    expect(display).toHaveLength(8);
    expect(queued).toHaveLength(0);
  });

  it("caps at 8 and queues the rest", () => {
    const nudges = Array.from({ length: 10 }, (_, i) => makeNudge({ id: `n${i}` }));
    const { display, queued } = applyHardCap(nudges);
    expect(display).toHaveLength(8);
    expect(queued).toHaveLength(2);
  });
});

// --- getDegradationMode ---

describe("getDegradationMode", () => {
  it("returns normal for 1-8", () => {
    expect(getDegradationMode(1)).toBe("normal");
    expect(getDegradationMode(8)).toBe("normal");
  });

  it("returns consolidation for 9-12", () => {
    expect(getDegradationMode(9)).toBe("consolidation");
    expect(getDegradationMode(12)).toBe("consolidation");
  });

  it("returns summary for 13+", () => {
    expect(getDegradationMode(13)).toBe("summary");
    expect(getDegradationMode(50)).toBe("summary");
  });
});

// --- isExpired ---

describe("isExpired", () => {
  it("returns true when expiresAt is in the past", () => {
    const nudge = makeNudge({ expiresAt: "2026-01-01T00:00:00Z" });
    expect(isExpired(nudge, new Date("2026-03-10T00:00:00Z"))).toBe(true);
  });

  it("returns false when expiresAt is in the future", () => {
    const nudge = makeNudge({ expiresAt: "2026-12-01T00:00:00Z" });
    expect(isExpired(nudge, new Date("2026-03-10T00:00:00Z"))).toBe(false);
  });

  it("returns true when deadline is more than 7 days past", () => {
    const nudge = makeNudge({ deadline: "2026-02-01T00:00:00Z" });
    expect(isExpired(nudge, new Date("2026-03-10T00:00:00Z"))).toBe(true);
  });

  it("returns false when deadline is within 7 days past", () => {
    const nudge = makeNudge({ deadline: "2026-03-05T00:00:00Z" });
    expect(isExpired(nudge, new Date("2026-03-10T00:00:00Z"))).toBe(false);
  });
});

// --- isSnoozed ---

describe("isSnoozed", () => {
  it("returns true when snoozed and snoozeUntil is future", () => {
    const nudge = makeNudge({
      status: "snoozed",
      snoozeUntil: "2026-12-01T00:00:00Z",
    });
    expect(isSnoozed(nudge, new Date("2026-03-10T00:00:00Z"))).toBe(true);
  });

  it("returns false when snoozeUntil is past", () => {
    const nudge = makeNudge({
      status: "snoozed",
      snoozeUntil: "2026-01-01T00:00:00Z",
    });
    expect(isSnoozed(nudge, new Date("2026-03-10T00:00:00Z"))).toBe(false);
  });
});

// --- unsnoozePastDue ---

describe("unsnoozePastDue", () => {
  it("reactivates snoozed nudges past their snoozeUntil", () => {
    const nudges = [
      makeNudge({ id: "a", status: "snoozed", snoozeUntil: "2026-01-01T00:00:00Z" }),
      makeNudge({ id: "b", status: "snoozed", snoozeUntil: "2026-12-01T00:00:00Z" }),
    ];
    const result = unsnoozePastDue(nudges, new Date("2026-03-10T00:00:00Z"));
    expect(result[0].status).toBe("active");
    expect(result[0].snoozeUntil).toBeUndefined();
    expect(result[1].status).toBe("snoozed");
  });
});

// --- calendarNudgeToState ---

describe("calendarNudgeToState", () => {
  it("maps a NudgeDefinition to NudgeState", () => {
    const def: NudgeDefinition = {
      id: "flu_2026",
      type: "flu_shot",
      title: "Flu Shot",
      description: "Time for a flu shot",
      icon: "💉",
      domain: "medical",
      recurrence: "annual",
      startMonth: 9,
      startDay: 1,
      endMonth: 3,
      endDay: 31,
      leadTimeDays: 14,
    };
    const state = calendarNudgeToState(def, "parent_1", new Date("2026-03-10T00:00:00Z"));
    expect(state.id).toBe("cal_flu_2026");
    expect(state.sourceType).toBe("flu_shot");
    expect(state.tier).toBe("P3");
    expect(state.status).toBe("active");
    expect(state.nudgeDefinitionId).toBe("flu_2026");
    expect(state.parentId).toBe("parent_1");
  });

  it("boosts relevance for prescription_refill", () => {
    const def: NudgeDefinition = {
      id: "refill_1",
      type: "prescription_refill",
      title: "Refill Lisinopril",
      description: "Refill needed",
      icon: "💊",
      domain: "medical",
      recurrence: "custom",
      leadTimeDays: 7,
    };
    const state = calendarNudgeToState(def, "parent_1");
    expect(state.relevanceScore).toBeGreaterThanOrEqual(70);
    expect(state.tier).toBe("P1");
  });

  it("boosts relevance when deadline is within 7 days", () => {
    const def: NudgeDefinition = {
      id: "test_1",
      type: "tax_deadline",
      title: "Tax Deadline",
      description: "File taxes",
      icon: "📝",
      domain: "financial",
      recurrence: "annual",
      startMonth: 3,
      startDay: 1,
      endMonth: 3,
      endDay: 15,
      leadTimeDays: 30,
    };
    const state = calendarNudgeToState(def, "parent_1", new Date("2026-03-10T00:00:00Z"));
    expect(state.relevanceScore).toBeGreaterThanOrEqual(70);
  });
});

// --- detectionToNudge ---

describe("detectionToNudge", () => {
  it("maps an AgentDetection to NudgeState", () => {
    const detection: AgentDetection = {
      id: "det_abc",
      agentType: "drug_recall",
      runId: "run_1",
      detectedAt: "2026-03-09T00:00:00Z",
      title: "Drug Recall: Lisinopril",
      description: "Batch recalled",
      relevanceScore: "high",
      domain: "medical",
      actionable: true,
      handled: false,
    };
    const state = detectionToNudge(detection, "parent_1");
    expect(state.id).toBe("det_det_abc");
    expect(state.sourceType).toBe("drug_recall");
    expect(state.tier).toBe("P0");
    expect(state.relevanceScore).toBe(80);
  });

  it("uses scored.relevanceScore when available", () => {
    const detection: AgentDetection = {
      id: "det_xyz",
      agentType: "policy_monitor",
      runId: "run_2",
      detectedAt: "2026-03-08T00:00:00Z",
      title: "Medicare Premium Update",
      description: "Premium change",
      relevanceScore: "medium",
      domain: "financial",
      actionable: true,
      handled: false,
    };
    const scored = {
      ...detection,
      relevanceScore: 92,
      reasoning: "High impact",
      priority: "high" as const,
      scoredAt: "2026-03-08T01:00:00Z",
    };
    const state = detectionToNudge(detection, "parent_1", scored);
    expect(state.relevanceScore).toBe(92);
  });
});

// --- buildConsolidatedCards ---

describe("buildConsolidatedCards", () => {
  it("groups nudges by sourceType", () => {
    const nudges = [
      makeNudge({ id: "a", sourceType: "flu_shot", tier: "P3" }),
      makeNudge({ id: "b", sourceType: "flu_shot", tier: "P3" }),
      makeNudge({ id: "c", sourceType: "drug_recall", tier: "P0" }),
    ];
    const cards = buildConsolidatedCards(nudges);
    expect(cards).toHaveLength(2);
    // P0 group should be first
    expect(cards[0].sourceType).toBe("drug_recall");
    expect(cards[0].count).toBe(1);
    expect(cards[1].sourceType).toBe("flu_shot");
    expect(cards[1].count).toBe(2);
  });
});

// --- prioritizeNudges ---

describe("prioritizeNudges", () => {
  const now = new Date("2026-03-10T12:00:00Z");

  it("merges calendar and agent nudges", () => {
    const cal = [makeNudge({ id: "cal_1", sourceType: "flu_shot", tier: "P3" })];
    const agent = [makeNudge({ id: "det_1", sourceType: "drug_recall", tier: "P0", relevanceScore: 90 })];
    const result = prioritizeNudges(cal, agent, [], now);
    expect(result.display).toHaveLength(2);
    expect(result.display[0].id).toBe("det_1"); // P0 first
    expect(result.degradation).toBe("normal");
  });

  it("preserves dismissed state from existing states", () => {
    const cal = [makeNudge({ id: "cal_1", sourceType: "flu_shot", tier: "P3" })];
    const existing = [makeNudge({ id: "cal_1", status: "dismissed" })];
    const result = prioritizeNudges(cal, [], existing, now);
    expect(result.display).toHaveLength(0);
  });

  it("preserves snoozed state from existing states", () => {
    const cal = [makeNudge({ id: "cal_1", sourceType: "flu_shot", tier: "P3" })];
    const existing = [makeNudge({ id: "cal_1", status: "snoozed", snoozeUntil: "2026-12-01T00:00:00Z" })];
    const result = prioritizeNudges(cal, [], existing, now);
    expect(result.display).toHaveLength(0);
  });

  it("expires nudges past their expiresAt", () => {
    const cal = [makeNudge({ id: "cal_1", expiresAt: "2026-01-01T00:00:00Z" })];
    const result = prioritizeNudges(cal, [], [], now);
    expect(result.display).toHaveLength(0);
  });

  it("unsnoozes nudges past their snoozeUntil", () => {
    const cal = [makeNudge({ id: "cal_1", sourceType: "flu_shot", tier: "P3" })];
    const existing = [makeNudge({ id: "cal_1", status: "snoozed", snoozeUntil: "2026-03-01T00:00:00Z" })];
    const result = prioritizeNudges(cal, [], existing, now);
    expect(result.display).toHaveLength(1);
    expect(result.display[0].status).toBe("active");
  });

  it("returns summary mode and suppresses P3/P4 when 13+ nudges", () => {
    const nudges = Array.from({ length: 15 }, (_, i) => {
      const tier: PriorityTier = i < 5 ? "P1" : i < 10 ? "P2" : "P3";
      return makeNudge({
        id: `n${i}`,
        sourceType: i < 5 ? "prescription_refill" : i < 10 ? "insurance_renewal" : "flu_shot",
        tier,
        relevanceScore: 90 - i,
      });
    });
    const result = prioritizeNudges(nudges, [], [], now);
    expect(result.degradation).toBe("summary");
    // P3 nudges should be in queued
    expect(result.display.every((n) => n.tier !== "P3")).toBe(true);
    expect(result.queued.length).toBeGreaterThan(0);
  });

  it("returns consolidation mode for 9-12 nudges", () => {
    const nudges = Array.from({ length: 10 }, (_, i) =>
      makeNudge({
        id: `n${i}`,
        sourceType: i < 5 ? "prescription_refill" : "insurance_renewal",
        tier: i < 5 ? "P1" : "P2",
        relevanceScore: 90 - i,
      })
    );
    const result = prioritizeNudges(nudges, [], [], now);
    expect(result.degradation).toBe("consolidation");
    expect(result.consolidated).toBeDefined();
    expect(result.consolidated!.length).toBeGreaterThan(0);
  });
});
