import type {
  CognitiveObservation,
  CognitiveQuestionId,
  CognitiveTrend,
  ObservationResponse,
} from "@/lib/types/cognitiveCheckin";
import { getActiveParentId } from "./parentProfile";

const STORAGE_KEY = "harbor_cognitive_observations";

const RESPONSE_SCORES: Record<ObservationResponse, number> = {
  not_noticed: 0,
  occasionally: 1,
  frequently: 3,
};

function getAllObservations(): CognitiveObservation[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveAllObservations(observations: CognitiveObservation[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));
}

export function scoreResponses(
  responses: Record<CognitiveQuestionId, ObservationResponse>
): number {
  return Object.values(responses).reduce(
    (sum, r) => sum + RESPONSE_SCORES[r],
    0
  );
}

export function saveCognitiveObservation(
  responses: Record<CognitiveQuestionId, ObservationResponse>,
  notes?: string
): CognitiveObservation {
  const parentId = getActiveParentId() || "";
  const observation: CognitiveObservation = {
    id: `cog_${Date.now()}`,
    parentId,
    observedAt: new Date().toISOString(),
    responses,
    totalScore: scoreResponses(responses),
    notes,
  };

  const all = getAllObservations();
  all.push(observation);
  saveAllObservations(all);
  return observation;
}

export function getCognitiveObservations(): CognitiveObservation[] {
  const parentId = getActiveParentId() || "";
  return getAllObservations().filter((o) => o.parentId === parentId);
}

export function getLatestCognitiveObservation(): CognitiveObservation | null {
  const observations = getCognitiveObservations();
  if (observations.length === 0) return null;
  return observations.sort(
    (a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime()
  )[0];
}

export function computeCognitiveTrend(): CognitiveTrend {
  const observations = getCognitiveObservations().sort(
    (a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime()
  );

  if (observations.length === 0) {
    return {
      observations: [],
      currentScore: 0,
      previousScore: null,
      trend: "insufficient_data",
      shouldAlert: false,
    };
  }

  const currentScore = observations[0].totalScore;
  const previousScore = observations.length > 1 ? observations[1].totalScore : null;

  // Determine trend
  let trend: CognitiveTrend["trend"];
  if (previousScore === null) {
    trend = "insufficient_data";
  } else if (currentScore > previousScore + 1) {
    trend = "worsening";
  } else if (currentScore < previousScore - 1) {
    trend = "improving";
  } else {
    trend = "stable";
  }

  // Alert: single score >= 16, OR 2+ observations in 90 days with avg >= 8
  let shouldAlert = currentScore >= 16;

  if (!shouldAlert) {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const recentObs = observations.filter((o) => o.observedAt >= ninetyDaysAgo);
    if (recentObs.length >= 2) {
      const avg = recentObs.reduce((sum, o) => sum + o.totalScore, 0) / recentObs.length;
      if (avg >= 8) shouldAlert = true;
    }
  }

  return {
    observations,
    currentScore,
    previousScore,
    trend,
    shouldAlert,
  };
}
