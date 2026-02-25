// Data freshness thresholds — how long until captured data is considered stale
// Tool name → days until stale

export type FreshnessStatus = "fresh" | "aging" | "stale";

const REVIEW_INTERVALS: Record<string, number> = {
  save_medication_list: 90,       // Medications change frequently
  save_doctor_info: 180,          // Doctors change less often
  save_insurance_info: 365,       // Insurance usually annual
  save_legal_document_info: 365,  // Legal docs reviewed annually
  save_task_notes: 180,           // Generic notes
  manual_notes: 180,              // Manual notes
};

const DEFAULT_INTERVAL_DAYS = 180;

// Aging threshold: data is "aging" when it's past 60% of its staleness interval
const AGING_THRESHOLD = 0.6;

export function getReviewIntervalDays(toolName: string): number {
  return REVIEW_INTERVALS[toolName] || DEFAULT_INTERVAL_DAYS;
}

export function getFreshnessStatus(
  toolName: string,
  lastReviewedAt: string | undefined,
  capturedAt: string
): FreshnessStatus {
  const referenceDate = lastReviewedAt || capturedAt;
  if (!referenceDate) return "stale";

  const intervalDays = getReviewIntervalDays(toolName);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysSince = (Date.now() - new Date(referenceDate).getTime()) / msPerDay;

  if (daysSince >= intervalDays) {
    return "stale";
  } else if (daysSince >= intervalDays * AGING_THRESHOLD) {
    return "aging";
  }
  return "fresh";
}

export function getFreshnessLabel(
  toolName: string,
  lastReviewedAt: string | undefined,
  capturedAt: string
): string {
  const referenceDate = lastReviewedAt || capturedAt;
  if (!referenceDate) return "Never updated";

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysSince = Math.floor(
    (Date.now() - new Date(referenceDate).getTime()) / msPerDay
  );

  if (daysSince < 7) return "Updated recently";
  if (daysSince < 30) return "Updated this month";
  if (daysSince < 60) return "Updated about a month ago";

  const months = Math.floor(daysSince / 30);
  if (months < 12) return `Updated ${months} month${months !== 1 ? "s" : ""} ago`;

  const years = Math.floor(months / 12);
  return `Last updated ${years} year${years !== 1 ? "s" : ""} ago`;
}

export function getWorstFreshness(statuses: FreshnessStatus[]): FreshnessStatus {
  if (statuses.includes("stale")) return "stale";
  if (statuses.includes("aging")) return "aging";
  return "fresh";
}
