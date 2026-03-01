import type { ExtendedDomain, Priority } from "@/lib/constants/domains";

export type LifeEventType =
  | "hospitalization"
  | "fall"
  | "cognitive_decline"
  | "spouse_death"
  | "new_diagnosis"
  | "moved_to_facility"
  | "caregiver_burnout";

export type LifeEventSeverity = "mild" | "moderate" | "severe";

export interface LifeEvent {
  id: string;
  type: LifeEventType;
  parentId: string;
  reportedAt: string;
  notes?: string;
  severity: LifeEventSeverity;
  generatedTaskIds: string[];
}

export interface LifeEventTemplate {
  eventType: LifeEventType;
  label: string;
  icon: string;
  description: string;
  taskTemplates: LifeEventTaskTemplate[];
}

export interface LifeEventTaskTemplate {
  title: string;
  domain: ExtendedDomain;
  priority: Priority;
  description: string;
  /** Only include this task if severity meets this minimum */
  minSeverity?: LifeEventSeverity;
  /** Days after the event when this task should be due */
  dueDaysAfterEvent?: number;
}
