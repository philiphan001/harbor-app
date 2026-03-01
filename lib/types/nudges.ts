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
