// Lifecycle Milestone Catalog
// 18 net-new milestones (4 calendar overlaps with CALENDAR_NUDGES excluded)

export type MilestoneTriggerType = "age" | "calendar" | "event" | "threshold" | "document_expiry";
export type MilestonePriorityTier = "urgent" | "important" | "recommended";

export interface MilestoneTriggerCondition {
  // Age triggers
  ageThreshold?: number;
  ageOperator?: ">=" | ">" | "==" | "<";
  // Calendar triggers
  windowStartMonth?: number;
  windowStartDay?: number;
  windowEndMonth?: number;
  windowEndDay?: number;
  // Event triggers
  eventKey?: string;
  // Threshold triggers
  thresholdKey?: string;
  thresholdValue?: number;
  thresholdOperator?: "<=" | "<" | ">=" | ">";
  // Document expiry triggers
  documentKey?: string;
  maxDaysSinceReview?: number;
}

export interface LifecycleMilestone {
  milestoneId: string;
  milestoneName: string;
  triggerType: MilestoneTriggerType;
  triggerCondition: MilestoneTriggerCondition;
  leadTimeDays: number;
  stateSpecific: boolean;
  stateRules?: Record<string, string>;
  briefingCopyTemplate: string;
  linkedFeatures: string[];
  priorityTier: MilestonePriorityTier;
  careDomain: string;
}

export const LIFECYCLE_MILESTONES: LifecycleMilestone[] = [
  // ── Age triggers (7) ──────────────────────────────────────────────────

  {
    milestoneId: "medicare_initial_enrollment",
    milestoneName: "Medicare Initial Enrollment Period",
    triggerType: "age",
    triggerCondition: { ageThreshold: 65, ageOperator: ">=" },
    leadTimeDays: 210,
    stateSpecific: false,
    briefingCopyTemplate:
      "{parentName} turns 65 in approximately {leadTimeDisplay}. The Medicare Initial Enrollment Period begins 3 months before the birthday month and ends 3 months after. Missing this window can result in a permanent late enrollment penalty of 10% per year for Part B. Now is the time to compare plans, gather insurance information, and decide between Original Medicare and Medicare Advantage.",
    linkedFeatures: ["Plan Comparison", "Coverage Lookup"],
    priorityTier: "urgent",
    careDomain: "medical",
  },
  {
    milestoneId: "social_security_early_62",
    milestoneName: "Social Security Early Claiming Eligibility",
    triggerType: "age",
    triggerCondition: { ageThreshold: 62, ageOperator: ">=" },
    leadTimeDays: 365,
    stateSpecific: false,
    briefingCopyTemplate:
      "{parentName} will be eligible to claim Social Security at age 62 in approximately {leadTimeDisplay}. Claiming at 62 permanently reduces benefits by approximately 30% compared to full retirement age (67). For {parentName}, this decision should factor in health status, other income sources, and whether a spouse may claim spousal benefits. Consider consulting a financial advisor before claiming early.",
    linkedFeatures: ["Financial Monitor"],
    priorityTier: "recommended",
    careDomain: "financial",
  },
  {
    milestoneId: "social_security_fra_67",
    milestoneName: "Social Security Full Retirement Age",
    triggerType: "age",
    triggerCondition: { ageThreshold: 67, ageOperator: ">=" },
    leadTimeDays: 365,
    stateSpecific: false,
    briefingCopyTemplate:
      "{parentName} approaches full retirement age (67) in approximately {leadTimeDisplay}. At FRA, {parentName} receives 100% of the earned benefit. Delaying beyond FRA earns an 8% increase per year until age 70. If {parentName} hasn't claimed yet, now is the time to evaluate whether claiming at 67 or delaying further makes financial sense.",
    linkedFeatures: ["Financial Monitor"],
    priorityTier: "important",
    careDomain: "financial",
  },
  {
    milestoneId: "social_security_max_70",
    milestoneName: "Social Security Maximum Benefit Age",
    triggerType: "age",
    triggerCondition: { ageThreshold: 70, ageOperator: ">=" },
    leadTimeDays: 180,
    stateSpecific: false,
    briefingCopyTemplate:
      "{parentName} is approaching age 70 in {leadTimeDisplay}. Delayed retirement credits stop accruing at 70 — there is no benefit to waiting beyond this age. If {parentName} hasn't yet claimed Social Security, file now to begin receiving the maximum benefit.",
    linkedFeatures: ["Financial Monitor"],
    priorityTier: "urgent",
    careDomain: "financial",
  },
  {
    milestoneId: "rmd_age_73",
    milestoneName: "Required Minimum Distributions Begin (Age 73)",
    triggerType: "age",
    triggerCondition: { ageThreshold: 73, ageOperator: ">=" },
    leadTimeDays: 180,
    stateSpecific: false,
    briefingCopyTemplate:
      "{parentName} must begin taking Required Minimum Distributions from retirement accounts (401(k), traditional IRA) by April 1 of the year after turning 73. Missing the deadline triggers a 25% excise tax on the undistributed amount. Note: taking the first RMD by April 1 means two RMDs in the same calendar year, which could affect tax bracket. Consider consulting a tax advisor.",
    linkedFeatures: ["Financial Monitor"],
    priorityTier: "urgent",
    careDomain: "financial",
  },
  {
    milestoneId: "rmd_age_75",
    milestoneName: "Required Minimum Distributions Begin (Age 75)",
    triggerType: "age",
    triggerCondition: { ageThreshold: 75, ageOperator: ">=" },
    leadTimeDays: 180,
    stateSpecific: false,
    briefingCopyTemplate:
      "{parentName} (born 1960 or later) must begin Required Minimum Distributions by April 1 of the year after turning 75. The same penalty and dual-RMD considerations apply. Harbor's Financial Monitor can project the RMD amount based on account balances.",
    linkedFeatures: ["Financial Monitor"],
    priorityTier: "urgent",
    careDomain: "financial",
  },
  {
    milestoneId: "medigap_open_enrollment",
    milestoneName: "Medigap Open Enrollment Period",
    triggerType: "age",
    triggerCondition: { ageThreshold: 65, ageOperator: ">=" },
    leadTimeDays: 180,
    stateSpecific: true,
    stateRules: {
      default: "6_month_window_from_part_b_start",
      note: "Some states offer additional guaranteed issue rights",
    },
    briefingCopyTemplate:
      "The Medigap (Medicare Supplement) Open Enrollment Period begins when {parentName} is 65 and enrolled in Medicare Part B. During this 6-month window, insurance companies cannot deny coverage or charge more due to health conditions. After this period, Medigap plans may require medical underwriting. If {parentName} is on Original Medicare, this is the best time to secure supplemental coverage.",
    linkedFeatures: ["Plan Comparison", "Coverage Lookup"],
    priorityTier: "urgent",
    careDomain: "medical",
  },

  // ── Calendar triggers (1) ─────────────────────────────────────────────

  {
    milestoneId: "medicare_part_d_formulary_review",
    milestoneName: "Annual Part D Formulary Review",
    triggerType: "calendar",
    triggerCondition: {
      windowStartMonth: 10,
      windowStartDay: 1,
      windowEndMonth: 12,
      windowEndDay: 7,
    },
    leadTimeDays: 0,
    stateSpecific: false,
    briefingCopyTemplate:
      "Part D plans publish next year's formulary changes on October 1. Harbor has checked {parentName}'s medication list against the updated formulary. If any medications have changed tiers or been removed, consider switching plans during Open Enrollment (October 15 – December 7).",
    linkedFeatures: ["Plan Comparison", "Medication Cost Finder"],
    priorityTier: "important",
    careDomain: "medical",
  },

  // ── Event triggers (1) ────────────────────────────────────────────────

  {
    milestoneId: "hospital_3day_rule_snf",
    milestoneName: "3-Day Rule for Skilled Nursing Facility Coverage",
    triggerType: "event",
    triggerCondition: { eventKey: "hospitalization_logged" },
    leadTimeDays: 0,
    stateSpecific: false,
    briefingCopyTemplate:
      "{parentName} has been hospitalized. If skilled nursing care is needed afterward, Medicare requires a qualifying 3-day inpatient hospital stay for SNF coverage. Important: observation status does NOT count as inpatient. Ask the hospital whether {parentName} has been admitted as inpatient. If under observation, request a formal admission. SNF coverage provides up to 100 days: days 1–20 are fully covered, days 21–100 require a coinsurance of $217/day (2026).",
    linkedFeatures: ["Care Transition Guide", "Coverage Lookup"],
    priorityTier: "urgent",
    careDomain: "medical",
  },

  // ── Threshold triggers (3) ────────────────────────────────────────────

  {
    milestoneId: "medicaid_lookback",
    milestoneName: "Medicaid 60-Month Lookback Planning",
    triggerType: "threshold",
    triggerCondition: {
      thresholdKey: "spend_down_months",
      thresholdValue: 72,
      thresholdOperator: "<=",
    },
    leadTimeDays: 1825,
    stateSpecific: true,
    stateRules: {
      CA: "lookback_months=30",
      NY: "lookback_months=60",
      default: "lookback_months=60",
    },
    briefingCopyTemplate:
      "Based on {parentName}'s current financial trajectory, Medicaid eligibility may become relevant within the next 6 years. Medicaid has a 60-month lookback period on asset transfers (30 months in California). Any gifts, transfers, or asset restructuring done within this window can result in a penalty period of ineligibility. This is the time to consult an elder law attorney about asset protection strategies.",
    linkedFeatures: ["Financial Monitor", "Benefits Optimizer"],
    priorityTier: "important",
    careDomain: "financial",
  },
  {
    milestoneId: "care_transition_home_to_al",
    milestoneName: "Care Setting Transition: Home to Assisted Living",
    triggerType: "threshold",
    triggerCondition: {
      thresholdKey: "adl_decline_detected",
      thresholdValue: 1,
      thresholdOperator: ">=",
    },
    leadTimeDays: 90,
    stateSpecific: true,
    stateRules: {
      default: "assisted_living_costs_vary_by_state",
      note: "State-specific licensing, cost ranges, and Medicaid waiver coverage differ significantly",
    },
    briefingCopyTemplate:
      "Based on {parentName}'s care needs, it may be time to evaluate assisted living options. Key considerations: visit at least 3 facilities, check inspection reports, review what's included in the base rate vs. add-on services, and understand the community's policy on aging in place vs. transfer to higher care.",
    linkedFeatures: ["Care Transition Guide", "Provider Search", "Financial Monitor"],
    priorityTier: "important",
    careDomain: "housing",
  },
  {
    milestoneId: "care_transition_al_to_memory",
    milestoneName: "Care Setting Transition: Assisted Living to Memory Care",
    triggerType: "threshold",
    triggerCondition: {
      thresholdKey: "cognitive_decline_detected",
      thresholdValue: 1,
      thresholdOperator: ">=",
    },
    leadTimeDays: 90,
    stateSpecific: true,
    stateRules: {
      default: "memory_care_costs_vary_by_state",
      note: "Memory care typically costs 20-30% more than standard assisted living",
    },
    briefingCopyTemplate:
      "{parentName} may benefit from a memory care environment. Memory care provides specialized support for dementia and Alzheimer's, including secured environments, structured activities, and trained staff. Key steps: get a cognitive assessment, visit memory care communities, review staff-to-resident ratios, and update legal documents (POA, advance directive) while {parentName} can still participate.",
    linkedFeatures: ["Care Transition Guide", "Provider Search", "Financial Monitor"],
    priorityTier: "important",
    careDomain: "housing",
  },

  // ── Document expiry triggers (4) ──────────────────────────────────────

  {
    milestoneId: "poa_review",
    milestoneName: "Power of Attorney Annual Review",
    triggerType: "document_expiry",
    triggerCondition: { documentKey: "poa", maxDaysSinceReview: 365 },
    leadTimeDays: 90,
    stateSpecific: true,
    stateRules: {
      default: "poa_laws_vary_by_state",
      note: "Some states require specific POA forms or notarization",
    },
    briefingCopyTemplate:
      "It has been {daysSinceReview} days since {parentName}'s Power of Attorney was last reviewed. While POAs don't technically expire, they should be reviewed annually to ensure they still reflect {parentName}'s wishes and meet current state requirements. Check that the named agent is still willing and able to serve, that the document covers healthcare and financial decisions, and that copies are on file with {parentName}'s providers and financial institutions.",
    linkedFeatures: ["Deadline Tracker"],
    priorityTier: "recommended",
    careDomain: "legal",
  },
  {
    milestoneId: "advance_directive_review",
    milestoneName: "Advance Directive Review",
    triggerType: "document_expiry",
    triggerCondition: { documentKey: "advance_directive", maxDaysSinceReview: 365 },
    leadTimeDays: 90,
    stateSpecific: true,
    stateRules: {
      default: "ad_laws_vary_by_state",
      note: "Some states have specific statutory forms",
    },
    briefingCopyTemplate:
      "{parentName}'s advance directive should be reviewed. Has {parentName}'s health status changed? Do the current wishes around life-sustaining treatment, resuscitation, and hospice still apply? Review with {parentName} if possible, update if needed, and ensure copies are distributed to healthcare providers, the healthcare agent, and the hospital.",
    linkedFeatures: ["Deadline Tracker"],
    priorityTier: "recommended",
    careDomain: "legal",
  },
  {
    milestoneId: "hipaa_authorization_review",
    milestoneName: "HIPAA Authorization Review",
    triggerType: "document_expiry",
    triggerCondition: { documentKey: "hipaa", maxDaysSinceReview: 365 },
    leadTimeDays: 30,
    stateSpecific: false,
    briefingCopyTemplate:
      "{parentName}'s HIPAA authorization should be reviewed. When providers or care settings change, existing authorizations may not cover new providers. Ensure all current doctors, facilities, and specialists have a valid HIPAA release on file so the care team can share information with the family.",
    linkedFeatures: ["Deadline Tracker"],
    priorityTier: "recommended",
    careDomain: "legal",
  },
  {
    milestoneId: "long_term_care_insurance_review",
    milestoneName: "Long-Term Care Insurance Annual Review",
    triggerType: "document_expiry",
    triggerCondition: { documentKey: "ltc_insurance", maxDaysSinceReview: 365 },
    leadTimeDays: 60,
    stateSpecific: false,
    briefingCopyTemplate:
      "{parentName}'s long-term care insurance policy should be reviewed annually. Check: Has the premium changed? What is the current daily/monthly benefit amount? What is the elimination period? How many years of coverage remain? Does the policy cover home care, assisted living, and nursing home care? Are there inflation protection riders? Understanding the policy now prevents surprises when a claim is needed.",
    linkedFeatures: ["Financial Monitor", "Coverage Lookup"],
    priorityTier: "recommended",
    careDomain: "financial",
  },

  // ── Other triggers (2) ────────────────────────────────────────────────

  {
    milestoneId: "drivers_license_renewal",
    milestoneName: "Driver's License Renewal (Age-Based)",
    triggerType: "age",
    triggerCondition: { ageThreshold: 70, ageOperator: ">=" },
    leadTimeDays: 180,
    stateSpecific: true,
    stateRules: {
      IL: "age_75_in_person_required, age_87_annual",
      DC: "age_70_every_5_years_vision_test",
      NH: "age_75_every_5_years_road_test",
      NM: "age_75_every_year",
      default: "varies_by_state_check_dmv",
    },
    briefingCopyTemplate:
      "{parentName}'s state ({parentState}) has age-based requirements for driver's license renewal. This is a good time to assess whether {parentName} is still driving safely. Consider a driving evaluation, and regardless of the outcome, ensure {parentName} has transportation alternatives in place (ride services, public transit, family coordination).",
    linkedFeatures: ["Deadline Tracker"],
    priorityTier: "recommended",
    careDomain: "medical",
  },
  {
    milestoneId: "veteran_benefits_assessment",
    milestoneName: "VA Benefits Eligibility Assessment",
    triggerType: "threshold",
    triggerCondition: {
      thresholdKey: "veteran_not_assessed",
      thresholdValue: 1,
      thresholdOperator: ">=",
    },
    leadTimeDays: 0,
    stateSpecific: false,
    briefingCopyTemplate:
      "{parentName} is a veteran and may qualify for VA healthcare, Aid and Attendance pension, or other VA benefits that have not yet been assessed. VA benefits can provide significant financial support — Aid and Attendance alone is worth up to $22,800/year. Harbor recommends a comprehensive VA benefits assessment.",
    linkedFeatures: ["Benefits Optimizer"],
    priorityTier: "important",
    careDomain: "financial",
  },
];
