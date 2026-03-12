import type { NudgeDefinition, NudgeState } from "@/lib/types/nudges";
import type { CognitiveTrend } from "@/lib/types/cognitiveCheckin";
import type { WellnessTrend } from "@/lib/types/wellnessCheckin";
import { NUDGE_TYPE_TIER } from "@/lib/utils/nudgePriority";

export const CALENDAR_NUDGES: NudgeDefinition[] = [
  {
    id: "medicare_open_enrollment",
    type: "medicare_enrollment",
    title: "Medicare Open Enrollment",
    description: "Review and change Medicare plans. Oct 15 – Dec 7.",
    icon: "\ud83c\udfe5",
    domain: "medical",
    recurrence: "annual",
    startMonth: 10,
    startDay: 15,
    endMonth: 12,
    endDay: 7,
    leadTimeDays: 14,
    actionUrl: "https://www.medicare.gov/plan-compare",
    actionLabel: "Compare plans",
  },
  {
    id: "medicare_advantage_disenrollment",
    type: "medicare_advantage_disenrollment",
    title: "Medicare Advantage Open Enrollment",
    description: "Switch from Medicare Advantage back to Original Medicare. Jan 1 – Mar 31.",
    icon: "\ud83c\udfe5",
    domain: "medical",
    recurrence: "annual",
    startMonth: 1,
    startDay: 1,
    endMonth: 3,
    endDay: 31,
    leadTimeDays: 7,
    actionUrl: "https://www.medicare.gov/plan-compare",
    actionLabel: "Compare plans",
  },
  {
    id: "flu_shot_season",
    type: "flu_shot",
    title: "Flu Shot Season",
    description: "Schedule a flu shot for your parent. Best time: September–October.",
    icon: "\ud83d\udc89",
    domain: "medical",
    recurrence: "annual",
    startMonth: 9,
    startDay: 1,
    endMonth: 10,
    endDay: 31,
    leadTimeDays: 7,
    actionUrl: "https://www.vaccines.gov/",
    actionLabel: "Find vaccines nearby",
  },
  {
    id: "annual_wellness_visit",
    type: "annual_wellness_visit",
    title: "Annual Wellness Visit",
    description: "Medicare covers a free annual wellness visit. Schedule if not done this year.",
    icon: "\ud83e\ude7a",
    domain: "medical",
    recurrence: "annual",
    startMonth: 1,
    startDay: 1,
    endMonth: 12,
    endDay: 31,
    leadTimeDays: 0,
    actionUrl: "/appointment-prep",
    actionLabel: "Prep for visit",
  },
  {
    id: "tax_deadline",
    type: "tax_deadline",
    title: "Tax Filing Deadline",
    description: "Ensure your parent's taxes are filed or an extension is requested by April 15.",
    icon: "\ud83d\udcca",
    domain: "financial",
    recurrence: "annual",
    startMonth: 3,
    startDay: 15,
    endMonth: 4,
    endDay: 15,
    leadTimeDays: 30,
    actionUrl: "https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free",
    actionLabel: "IRS Free File",
  },
];

/**
 * Generate dynamic medication refill nudges from medication data.
 * Called by computeVisibleNudges when medication data is available.
 */
export function generateMedicationRefillNudges(
  medications: Array<{
    name: string;
    refillsRemaining?: number;
    expirationDate?: string;
  }>
): NudgeDefinition[] {
  const nudges: NudgeDefinition[] = [];
  const now = new Date();

  for (const med of medications) {
    // Nudge if refills are 0 or 1
    if (med.refillsRemaining !== undefined && med.refillsRemaining <= 1) {
      nudges.push({
        id: `refill_${med.name.toLowerCase().replace(/\s+/g, "_")}`,
        type: "prescription_refill",
        title: `Refill: ${med.name}`,
        description: med.refillsRemaining === 0
          ? `${med.name} has no refills remaining. Contact prescriber.`
          : `${med.name} has only 1 refill left.`,
        icon: "\ud83d\udc8a",
        domain: "medical",
        recurrence: "once",
        leadTimeDays: 0,
      });
    }

    // Nudge if expiring within 30 days
    if (med.expirationDate) {
      const exp = new Date(med.expirationDate);
      const daysUntil = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 30 && daysUntil > -7) {
        nudges.push({
          id: `expiring_${med.name.toLowerCase().replace(/\s+/g, "_")}`,
          type: "prescription_refill",
          title: `Expiring: ${med.name}`,
          description: daysUntil <= 0
            ? `${med.name} has expired. Contact prescriber for renewal.`
            : `${med.name} expires in ${daysUntil} days.`,
          icon: "\u26a0\ufe0f",
          domain: "medical",
          recurrence: "once",
          leadTimeDays: 0,
        });
      }
    }
  }

  return nudges;
}

/**
 * Generate polypharmacy warning nudges based on medication count.
 * ≥8 meds → warning (fall risk), 5-7 → notice (consider simplifying), <5 → none.
 */
export function generatePolypharmacyNudge(medCount: number): NudgeDefinition[] {
  if (medCount >= 8) {
    return [
      {
        id: "polypharmacy_warning",
        type: "polypharmacy_warning",
        title: "Polypharmacy Warning",
        description: `${medCount} medications \u2014 patients on 8+ have 2.5x fall risk. Ask about simplifying.`,
        icon: "\u26a0\ufe0f",
        domain: "medical",
        recurrence: "once",
        leadTimeDays: 0,
      },
    ];
  }
  if (medCount >= 5) {
    return [
      {
        id: "polypharmacy_warning",
        type: "polypharmacy_warning",
        title: "Medication Review Suggested",
        description: `${medCount} medications \u2014 consider asking about simplifying the regimen.`,
        icon: "\ud83d\udc8a",
        domain: "medical",
        recurrence: "once",
        leadTimeDays: 0,
      },
    ];
  }
  return [];
}

/**
 * Generate a cognitive check-in reminder nudge.
 * Fires if never done or last observation > 30 days ago.
 */
export function generateCognitiveCheckInNudge(
  lastDate: string | null,
  parentId: string
): NudgeState[] {
  const now = new Date();
  if (lastDate) {
    const daysSince = (now.getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 30) return [];
  }

  return [
    {
      id: "cognitive_checkin_due",
      sourceType: "cognitive_checkin_due",
      tier: NUDGE_TYPE_TIER.cognitive_checkin_due,
      title: "Cognitive Check-In Due",
      description: lastDate
        ? "It's been over 30 days since your last cognitive observation. Track any changes you've noticed."
        : "Start tracking cognitive changes to catch early warning signs.",
      icon: "\uD83E\uDDE0",
      domain: "medical",
      status: "active",
      relevanceScore: 55,
      createdAt: now.toISOString(),
      snoozeCount: 0,
      actionUrl: "/cognitive-checkin",
      actionLabel: "Start check-in",
      parentId,
    },
  ];
}

/**
 * Generate a cognitive decline alert nudge when trend indicates concern.
 */
export function generateCognitiveAlertNudge(
  trend: CognitiveTrend,
  parentId: string
): NudgeState[] {
  if (!trend.shouldAlert) return [];

  return [
    {
      id: "cognitive_decline_alert",
      sourceType: "cognitive_decline_alert",
      tier: NUDGE_TYPE_TIER.cognitive_decline_alert,
      title: "Cognitive Changes Detected",
      description: `Score: ${trend.currentScore}/24. The pattern of observations suggests discussing these changes with a doctor.`,
      icon: "\u26A0\uFE0F",
      domain: "medical",
      status: "active",
      relevanceScore: 80,
      createdAt: new Date().toISOString(),
      snoozeCount: 0,
      actionUrl: "/cognitive-checkin",
      actionLabel: "View details",
      parentId,
    },
  ];
}

/**
 * Generate a wellness check-in reminder nudge.
 * Fires if never done or last check-in > 14 days ago.
 */
export function generateWellnessCheckInNudge(
  lastDate: string | null,
  parentId: string
): NudgeState[] {
  const now = new Date();
  if (lastDate) {
    const daysSince = (now.getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 14) return [];
  }

  return [
    {
      id: "caregiver_wellness_due",
      sourceType: "caregiver_wellness_due",
      tier: NUDGE_TYPE_TIER.caregiver_wellness_due,
      title: "Caregiver Wellness Check-In",
      description: lastDate
        ? "It's been over 2 weeks. How are you holding up?"
        : "Take a moment to check in on your own wellbeing.",
      icon: "\uD83D\uDC9A",
      domain: "social",
      status: "active",
      relevanceScore: 50,
      createdAt: now.toISOString(),
      snoozeCount: 0,
      actionUrl: "/wellness-checkin",
      actionLabel: "Check in",
      parentId,
    },
  ];
}

/**
 * Generate a caregiver burnout alert when risk is high.
 */
export function generateBurnoutAlertNudge(
  trend: WellnessTrend,
  parentId: string
): NudgeState[] {
  if (trend.burnoutRisk !== "high") return [];

  return [
    {
      id: "caregiver_burnout_alert",
      sourceType: "caregiver_burnout_alert",
      tier: NUDGE_TYPE_TIER.caregiver_burnout_alert,
      title: "Caregiver Burnout Risk: High",
      description: `Your wellness score (${trend.currentScore}/15) indicates high burnout risk. You deserve support.`,
      icon: "\u2764\uFE0F",
      domain: "social",
      status: "active",
      relevanceScore: 90,
      createdAt: new Date().toISOString(),
      snoozeCount: 0,
      actionUrl: "/wellness-checkin",
      actionLabel: "Get support",
      parentId,
    },
  ];
}
