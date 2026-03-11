import type { LifeEventType } from "./lifeEvents";
import type { ExtendedDomain, Priority } from "@/lib/constants/domains";

export type CareTransitionType =
  | "hospital_to_home"
  | "hospital_to_snf"
  | "home_to_assisted_living"
  | "al_to_memory_care"
  | "discharge_navigator"
  | "new_diagnosis";

export interface CareTransitionStep {
  stepNumber: number;
  title: string;
  description: string;
  whyItMatters: string;
  questionsToAsk: string[];
}

export interface InsuranceConsideration {
  item: string;
  coverage: string;
  keyDetails: string;
}

export interface TimelineBenchmark {
  timeframe: string;
  milestone: string;
}

export interface CareTransitionTaskTemplate {
  title: string;
  domain: ExtendedDomain;
  priority: Priority;
  description: string;
  dueDaysAfterEvent: number;
}

export interface CareTransitionTrigger {
  lifeEventType?: LifeEventType;
  milestoneIds?: string[];
  description: string;
}

export interface CareTransitionPlaybook {
  id: CareTransitionType;
  label: string;
  icon: string;
  overview: string;
  trigger: CareTransitionTrigger;
  steps: CareTransitionStep[];
  insuranceConsiderations: InsuranceConsideration[];
  timelineBenchmarks: TimelineBenchmark[];
  taskTemplates: CareTransitionTaskTemplate[];
}

export interface CareTransitionActivation {
  id: string;
  playbookId: CareTransitionType;
  parentId: string;
  activatedAt: string;
  triggeredBy: "life_event" | "milestone" | "manual";
  triggerSource?: string;
  generatedTaskTitles: string[];
}
