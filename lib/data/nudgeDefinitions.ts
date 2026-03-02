import type { NudgeDefinition } from "@/lib/types/nudges";

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
