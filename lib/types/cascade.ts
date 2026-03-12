import type { CareTransitionType } from "./careTransitions";

export type StepStatus = "locked" | "actionable" | "completed";

export interface CascadeInstance {
  id: string;                               // "cascade_{playbookId}_{timestamp}"
  playbookId: CareTransitionType;
  activationId: string;                     // links to CareTransitionActivation.id
  parentId: string;
  createdAt: string;
  status: "active" | "resolved";
  stepProgress: Record<number, StepStatus>; // stepNumber → status
}
