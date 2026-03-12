// Cognitive Decline Early Detection — behavioral observation tracking

export type CognitiveQuestionId =
  | "missed_medications"
  | "repeating_stories"
  | "finance_trouble"
  | "getting_lost"
  | "personality_changes"
  | "familiar_task_difficulty"
  | "word_finding"
  | "poor_judgment";

export type ObservationResponse = "not_noticed" | "occasionally" | "frequently";

export interface CognitiveObservation {
  id: string;
  parentId: string;
  observedAt: string;
  responses: Record<CognitiveQuestionId, ObservationResponse>;
  totalScore: number; // 0-24 (not_noticed=0, occasionally=1, frequently=3)
  notes?: string;
}

export interface CognitiveQuestion {
  id: CognitiveQuestionId;
  label: string;
  description: string;
}

export interface CognitiveTrend {
  observations: CognitiveObservation[];
  currentScore: number;
  previousScore: number | null;
  trend: "improving" | "stable" | "worsening" | "insufficient_data";
  shouldAlert: boolean; // score >= 16 OR 2+ observations in 90 days with avg >= 8
}
