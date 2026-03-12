import type {
  WellnessCheckin,
  WellnessQuestionId,
  WellnessTrend,
  WellnessResponse,
} from "@/lib/types/wellnessCheckin";
import { getActiveParentId } from "./parentProfile";

const STORAGE_KEY = "harbor_wellness_checkins";

// getting_help scores inversely: "doing_fine" means they ARE getting help (score=0)
const RESPONSE_SCORES: Record<WellnessResponse, number> = {
  doing_fine: 0,
  sometimes_struggling: 1,
  really_struggling: 3,
};

function getAllCheckins(): WellnessCheckin[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveAllCheckins(checkins: WellnessCheckin[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checkins));
}

export function scoreWellnessResponses(
  responses: Record<WellnessQuestionId, WellnessResponse>
): number {
  return Object.values(responses).reduce(
    (sum, r) => sum + RESPONSE_SCORES[r],
    0
  );
}

export function saveWellnessCheckin(
  responses: Record<WellnessQuestionId, WellnessResponse>,
  notes?: string
): WellnessCheckin {
  const parentId = getActiveParentId() || "";
  const checkin: WellnessCheckin = {
    id: `well_${Date.now()}`,
    parentId,
    checkedInAt: new Date().toISOString(),
    responses,
    totalScore: scoreWellnessResponses(responses),
    notes,
  };

  const all = getAllCheckins();
  all.push(checkin);
  saveAllCheckins(all);
  return checkin;
}

export function getWellnessCheckins(): WellnessCheckin[] {
  const parentId = getActiveParentId() || "";
  return getAllCheckins().filter((c) => c.parentId === parentId);
}

export function getLatestWellnessCheckin(): WellnessCheckin | null {
  const checkins = getWellnessCheckins();
  if (checkins.length === 0) return null;
  return checkins.sort(
    (a, b) => new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime()
  )[0];
}

function getBurnoutRisk(score: number): WellnessTrend["burnoutRisk"] {
  if (score >= 10) return "high";
  if (score >= 6) return "moderate";
  return "low";
}

export function computeWellnessTrend(): WellnessTrend {
  const checkins = getWellnessCheckins().sort(
    (a, b) => new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime()
  );

  if (checkins.length === 0) {
    return {
      checkins: [],
      currentScore: 0,
      previousScore: null,
      trend: "insufficient_data",
      burnoutRisk: "low",
    };
  }

  const currentScore = checkins[0].totalScore;
  const previousScore = checkins.length > 1 ? checkins[1].totalScore : null;

  let trend: WellnessTrend["trend"];
  if (previousScore === null) {
    trend = "insufficient_data";
  } else if (currentScore > previousScore + 1) {
    trend = "worsening";
  } else if (currentScore < previousScore - 1) {
    trend = "improving";
  } else {
    trend = "stable";
  }

  return {
    checkins,
    currentScore,
    previousScore,
    trend,
    burnoutRisk: getBurnoutRisk(currentScore),
  };
}
