import type { Domain } from "@/lib/constants/domains";

export type NudgeType =
  | "medicare_enrollment"
  | "medicare_advantage_disenrollment"
  | "insurance_renewal"
  | "prescription_refill"
  | "drivers_license_renewal"
  | "annual_wellness_visit"
  | "flu_shot"
  | "tax_deadline"
  | "polypharmacy_warning"
  | "custom";

export interface NudgeDefinition {
  id: string;
  type: NudgeType;
  title: string;
  description: string;
  icon: string;
  domain: Domain;
  recurrence: "annual" | "once" | "custom";
  /** Month (1-12) when the nudge window starts */
  startMonth?: number;
  startDay?: number;
  /** Month (1-12) when the nudge window ends */
  endMonth?: number;
  endDay?: number;
  /** Specific due date (ISO string) for one-time nudges */
  dueDate?: string;
  /** Days before the window/due date to start showing the nudge */
  leadTimeDays: number;
  actionUrl?: string;
  actionLabel?: string;
}

export interface NudgeInstance {
  id: string;
  nudgeDefinitionId: string;
  parentId: string;
  status: "active" | "snoozed" | "dismissed";
  snoozedUntil?: string;
  dismissedAt?: string;
  /** Year the nudge was dismissed for (to allow annual recurrence) */
  dismissedForYear?: number;
}

// --- Priority Nudge System ---

export type PriorityTier = "P0" | "P1" | "P2" | "P3" | "P4";

export type NudgeSourceType =
  | "drug_recall"
  | "safety_alert"
  | "policy_change"
  | "prescription_refill"
  | "medicare_enrollment"
  | "medicare_advantage_disenrollment"
  | "insurance_renewal"
  | "drivers_license_renewal"
  | "annual_wellness_visit"
  | "flu_shot"
  | "tax_deadline"
  | "spend_down_threshold"
  | "benefit_opportunity"
  | "lifecycle_milestone"
  | "polypharmacy_warning"
  | "cognitive_checkin_due"
  | "cognitive_decline_alert"
  | "caregiver_wellness_due"
  | "caregiver_burnout_alert"
  | "custom";

export type NudgeStatus = "active" | "snoozed" | "dismissed" | "expired" | "queued";

export type DegradationMode = "normal" | "consolidation" | "summary";

export interface NudgeState {
  id: string;
  sourceType: NudgeSourceType;
  tier: PriorityTier;
  title: string;
  description: string;
  icon: string;
  domain: Domain;
  status: NudgeStatus;
  relevanceScore: number; // 0-100
  createdAt: string;
  deadline?: string;
  snoozeUntil?: string;
  snoozeCount: number;
  expiresAt?: string;
  actionUrl?: string;
  actionLabel?: string;
  detectionId?: string;
  nudgeDefinitionId?: string;
  parentId?: string;
}

export interface ConsolidatedNudge {
  sourceType: NudgeSourceType;
  tier: PriorityTier;
  title: string;
  icon: string;
  count: number;
  topNudge: NudgeState;
  nudges: NudgeState[];
}

export interface PrioritizedNudgeResult {
  display: NudgeState[];
  queued: NudgeState[];
  degradation: DegradationMode;
  consolidated?: ConsolidatedNudge[];
}
