// Nudge Priority Engine — pure utility, no side effects

import type {
  NudgeDefinition,
  NudgeSourceType,
  NudgeState,
  PriorityTier,
  DegradationMode,
  ConsolidatedNudge,
  PrioritizedNudgeResult,
} from "@/lib/types/nudges";
import type { AgentDetection } from "@/lib/types/agents";
import type { ScoredSignal } from "@/lib/ai/judgmentAgent";

// --- Config constants ---

export const NUDGE_TYPE_TIER: Record<NudgeSourceType, PriorityTier> = {
  drug_recall: "P0",
  safety_alert: "P0",
  prescription_refill: "P1",
  medicare_enrollment: "P1",
  policy_change: "P2",
  medicare_advantage_disenrollment: "P2",
  insurance_renewal: "P2",
  annual_wellness_visit: "P2",
  spend_down_threshold: "P2",
  benefit_opportunity: "P2",
  lifecycle_milestone: "P2",
  polypharmacy_warning: "P2",
  flu_shot: "P3",
  tax_deadline: "P3",
  drivers_license_renewal: "P3",
  custom: "P4",
};

export const SNOOZE_BY_TIER: Record<
  PriorityTier,
  { durationMs: number; maxSnoozes: number; afterMax: "dismiss" | "lock" }
> = {
  P0: { durationMs: 4 * 60 * 60 * 1000, maxSnoozes: 2, afterMax: "lock" },
  P1: { durationMs: 24 * 60 * 60 * 1000, maxSnoozes: 3, afterMax: "dismiss" },
  P2: { durationMs: 3 * 24 * 60 * 60 * 1000, maxSnoozes: 3, afterMax: "dismiss" },
  P3: { durationMs: 7 * 24 * 60 * 60 * 1000, maxSnoozes: 2, afterMax: "dismiss" },
  P4: { durationMs: 14 * 24 * 60 * 60 * 1000, maxSnoozes: 1, afterMax: "dismiss" },
};

export const SNOOZE_LABELS: Record<PriorityTier, string> = {
  P0: "Snooze 4h",
  P1: "Snooze 1d",
  P2: "Snooze 3d",
  P3: "Snooze 7d",
  P4: "Snooze 14d",
};

/** Auto-expiry durations in ms, by source type */
export const EXPIRY_RULES: Partial<Record<NudgeSourceType, number>> = {
  drug_recall: 30 * 24 * 60 * 60 * 1000,
  safety_alert: 14 * 24 * 60 * 60 * 1000,
  policy_change: 30 * 24 * 60 * 60 * 1000,
  flu_shot: 90 * 24 * 60 * 60 * 1000,
  custom: 30 * 24 * 60 * 60 * 1000,
};

const TIER_ORDER: Record<PriorityTier, number> = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };

const MAX_PER_TYPE = 2;
const HARD_CAP = 8;

// --- Sort & cap functions ---

export function sortNudges(nudges: NudgeState[]): NudgeState[] {
  return [...nudges].sort((a, b) => {
    // Tier order (lower = higher priority)
    const tierDiff = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
    if (tierDiff !== 0) return tierDiff;

    // Relevance score desc
    if (a.relevanceScore !== b.relevanceScore) return b.relevanceScore - a.relevanceScore;

    // Recency desc (newer first)
    const createdDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (createdDiff !== 0) return createdDiff;

    // Deadline asc (sooner first)
    if (a.deadline && b.deadline) {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (a.deadline) return -1;
    if (b.deadline) return 1;

    return 0;
  });
}

export function applySingleTypeCap(
  nudges: NudgeState[]
): { display: NudgeState[]; queued: NudgeState[] } {
  const counts: Record<string, number> = {};
  const display: NudgeState[] = [];
  const queued: NudgeState[] = [];

  for (const nudge of nudges) {
    const count = counts[nudge.sourceType] || 0;
    if (nudge.tier === "P0" || count < MAX_PER_TYPE) {
      display.push(nudge);
      counts[nudge.sourceType] = count + 1;
    } else {
      queued.push(nudge);
    }
  }

  return { display, queued };
}

export function applyHardCap(
  nudges: NudgeState[]
): { display: NudgeState[]; queued: NudgeState[] } {
  if (nudges.length <= HARD_CAP) {
    return { display: nudges, queued: [] };
  }
  return {
    display: nudges.slice(0, HARD_CAP),
    queued: nudges.slice(HARD_CAP),
  };
}

export function getDegradationMode(count: number): DegradationMode {
  if (count <= 8) return "normal";
  if (count <= 12) return "consolidation";
  return "summary";
}

export function buildConsolidatedCards(nudges: NudgeState[]): ConsolidatedNudge[] {
  const groups = new Map<NudgeSourceType, NudgeState[]>();
  for (const nudge of nudges) {
    const list = groups.get(nudge.sourceType) || [];
    list.push(nudge);
    groups.set(nudge.sourceType, list);
  }

  const consolidated: ConsolidatedNudge[] = [];
  for (const [sourceType, group] of groups) {
    consolidated.push({
      sourceType,
      tier: group[0].tier,
      title: group[0].title,
      icon: group[0].icon,
      count: group.length,
      topNudge: group[0],
      nudges: group,
    });
  }

  // Sort by tier then count desc
  consolidated.sort((a, b) => {
    const tierDiff = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
    if (tierDiff !== 0) return tierDiff;
    return b.count - a.count;
  });

  return consolidated;
}

// --- State helpers ---

export function isExpired(nudge: NudgeState, now: Date = new Date()): boolean {
  if (nudge.expiresAt && new Date(nudge.expiresAt) <= now) return true;
  if (nudge.deadline && new Date(nudge.deadline) < now) {
    // Past deadline by more than 7 days = expired
    const daysPast = (now.getTime() - new Date(nudge.deadline).getTime()) / (1000 * 60 * 60 * 24);
    if (daysPast > 7) return true;
  }
  return false;
}

export function isSnoozed(nudge: NudgeState, now: Date = new Date()): boolean {
  return nudge.status === "snoozed" && !!nudge.snoozeUntil && new Date(nudge.snoozeUntil) > now;
}

export function unsnoozePastDue(nudges: NudgeState[], now: Date = new Date()): NudgeState[] {
  return nudges.map((nudge) => {
    if (nudge.status === "snoozed" && nudge.snoozeUntil && new Date(nudge.snoozeUntil) <= now) {
      return { ...nudge, status: "active" as const, snoozeUntil: undefined };
    }
    return nudge;
  });
}

// --- Bridge functions ---

/** Map NudgeType to NudgeSourceType (they overlap except for a few mappings) */
function nudgeTypeToSourceType(type: string): NudgeSourceType {
  // Direct match for most types
  const directMap: Record<string, NudgeSourceType> = {
    medicare_enrollment: "medicare_enrollment",
    medicare_advantage_disenrollment: "medicare_advantage_disenrollment",
    insurance_renewal: "insurance_renewal",
    prescription_refill: "prescription_refill",
    drivers_license_renewal: "drivers_license_renewal",
    annual_wellness_visit: "annual_wellness_visit",
    flu_shot: "flu_shot",
    tax_deadline: "tax_deadline",
    polypharmacy_warning: "polypharmacy_warning",
    custom: "custom",
  };
  return directMap[type] || "custom";
}

export function calendarNudgeToState(
  definition: NudgeDefinition,
  parentId: string,
  now: Date = new Date()
): NudgeState {
  const sourceType = nudgeTypeToSourceType(definition.type);
  const tier = NUDGE_TYPE_TIER[sourceType];

  // Heuristic relevance score based on deadline proximity
  let relevanceScore = 50;
  let deadline: string | undefined;

  if (definition.endMonth && definition.endDay) {
    const endDate = new Date(now.getFullYear(), definition.endMonth - 1, definition.endDay);
    // If end date has passed this year, use next year
    if (endDate < now) {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    deadline = endDate.toISOString();
    const daysUntil = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntil <= 7) relevanceScore += 20;
    else if (daysUntil <= 14) relevanceScore += 10;
  }

  if (definition.dueDate) {
    deadline = definition.dueDate;
    const daysUntil = (new Date(definition.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntil <= 7) relevanceScore += 20;
    else if (daysUntil <= 14) relevanceScore += 10;
  }

  if (sourceType === "prescription_refill") {
    relevanceScore += 20;
  }

  // Compute expiresAt from EXPIRY_RULES
  const expiryDuration = EXPIRY_RULES[sourceType];
  const expiresAt = expiryDuration ? new Date(now.getTime() + expiryDuration).toISOString() : undefined;

  return {
    id: `cal_${definition.id}`,
    sourceType,
    tier,
    title: definition.title,
    description: definition.description,
    icon: definition.icon,
    domain: definition.domain,
    status: "active",
    relevanceScore: Math.min(relevanceScore, 100),
    createdAt: now.toISOString(),
    deadline,
    snoozeCount: 0,
    expiresAt,
    actionUrl: definition.actionUrl,
    actionLabel: definition.actionLabel,
    nudgeDefinitionId: definition.id,
    parentId,
  };
}

/** Map AgentType to NudgeSourceType */
function agentTypeToSourceType(agentType: string): NudgeSourceType {
  const map: Record<string, NudgeSourceType> = {
    drug_recall: "drug_recall",
    policy_monitor: "policy_change",
    provider_monitor: "safety_alert",
    financial_monitor: "spend_down_threshold",
    benefit_eligibility: "benefit_opportunity",
    lifecycle_milestone: "lifecycle_milestone",
    news_monitor: "custom",
  };
  return map[agentType] || "custom";
}

export function detectionToNudge(
  detection: AgentDetection,
  parentId: string,
  scored?: ScoredSignal
): NudgeState {
  const sourceType = agentTypeToSourceType(detection.agentType);
  const tier = NUDGE_TYPE_TIER[sourceType];

  let relevanceScore: number;
  if (scored) {
    relevanceScore = scored.relevanceScore;
  } else {
    // Heuristic from string relevance
    const scoreMap: Record<string, number> = { high: 80, medium: 60, low: 40 };
    relevanceScore = scoreMap[detection.relevanceScore] || 50;
  }

  const expiryDuration = EXPIRY_RULES[sourceType];
  const now = new Date();
  const expiresAt = expiryDuration ? new Date(now.getTime() + expiryDuration).toISOString() : undefined;

  return {
    id: `det_${detection.id}`,
    sourceType,
    tier,
    title: detection.title,
    description: detection.description,
    icon: sourceType === "drug_recall" ? "💊" : sourceType === "safety_alert" ? "🏥" : sourceType === "policy_change" ? "🔍" : sourceType === "spend_down_threshold" ? "💰" : sourceType === "lifecycle_milestone" ? "📅" : "📰",
    domain: detection.domain as NudgeState["domain"],
    status: "active",
    relevanceScore,
    createdAt: detection.detectedAt,
    deadline: detection.dueDate,
    snoozeCount: 0,
    expiresAt,
    detectionId: detection.id,
    parentId,
    actionUrl: detection.sourceUrl,
    actionLabel: detection.sourceUrl ? "View source" : undefined,
  };
}

// --- Main pipeline ---

export function prioritizeNudges(
  calendarNudges: NudgeState[],
  agentNudges: NudgeState[],
  existingStates: NudgeState[],
  now: Date = new Date()
): PrioritizedNudgeResult {
  // 1. Build ID map from existing states (preserve snooze/dismiss)
  const stateMap = new Map<string, NudgeState>();
  for (const state of existingStates) {
    stateMap.set(state.id, state);
  }

  // 2. Merge: incoming nudges inherit snooze/dismiss state from existing
  const allNudges: NudgeState[] = [];
  for (const nudge of [...calendarNudges, ...agentNudges]) {
    const existing = stateMap.get(nudge.id);
    if (existing) {
      // Preserve user state, update content fields
      allNudges.push({
        ...nudge,
        status: existing.status,
        snoozeUntil: existing.snoozeUntil,
        snoozeCount: existing.snoozeCount,
        expiresAt: existing.expiresAt || nudge.expiresAt,
      });
    } else {
      allNudges.push(nudge);
    }
  }

  // 3. Expire past-due
  const afterExpiry = allNudges.map((nudge) => {
    if (nudge.status !== "dismissed" && isExpired(nudge, now)) {
      return { ...nudge, status: "expired" as const };
    }
    return nudge;
  });

  // 4. Unsnooze past-due
  const afterUnsnooze = unsnoozePastDue(afterExpiry, now);

  // 5. Filter to active only
  const active = afterUnsnooze.filter((n) => n.status === "active");

  // 6. Sort
  const sorted = sortNudges(active);

  // 7. Determine degradation mode based on total active count
  const degradation = getDegradationMode(sorted.length);

  if (degradation === "summary") {
    // Suppress P3/P4, show top P0-P2 + summary card
    const highPriority = sorted.filter((n) => n.tier === "P0" || n.tier === "P1" || n.tier === "P2");
    const suppressed = sorted.filter((n) => n.tier === "P3" || n.tier === "P4");
    const capped = applyHardCap(highPriority);
    return {
      display: capped.display,
      queued: [...capped.queued, ...suppressed],
      degradation,
    };
  }

  if (degradation === "consolidation") {
    const consolidated = buildConsolidatedCards(sorted);
    const { display, queued } = applyHardCap(sorted);
    return { display, queued, degradation, consolidated };
  }

  // Normal mode: apply caps
  const afterTypeCap = applySingleTypeCap(sorted);
  const final = applyHardCap(afterTypeCap.display);
  return {
    display: final.display,
    queued: [...final.queued, ...afterTypeCap.queued],
    degradation,
  };
}
