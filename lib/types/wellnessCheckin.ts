// Caregiver Wellness Check-In — self-assessment for burnout risk

export type WellnessQuestionId =
  | "sleep_quality"
  | "stress_level"
  | "missing_activities"
  | "feeling_overwhelmed"
  | "getting_help";

export type WellnessResponse = "doing_fine" | "sometimes_struggling" | "really_struggling";

export interface WellnessCheckin {
  id: string;
  parentId: string;
  checkedInAt: string;
  responses: Record<WellnessQuestionId, WellnessResponse>;
  totalScore: number; // 0-15 (doing_fine=0, sometimes=1, really=3)
  notes?: string;
}

export interface WellnessQuestion {
  id: WellnessQuestionId;
  label: string;
  description: string;
}

export interface WellnessTrend {
  checkins: WellnessCheckin[];
  currentScore: number;
  previousScore: number | null;
  trend: "improving" | "stable" | "worsening" | "insufficient_data";
  burnoutRisk: "low" | "moderate" | "high"; // low<6, moderate 6-9, high>=10
}
