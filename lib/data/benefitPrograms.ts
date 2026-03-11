// Static catalog of 17 federal and state benefit programs for seniors
// Data sourced from docs/harbor-benefit-program-catalog.xlsx

export interface EligibilityCriteria {
  minAge?: number;
  maxMonthlyIncome?: number;
  maxMonthlyIncomeCouple?: number;
  maxAssets?: number;
  maxAssetsCouple?: number;
  requiredInsurance?: string[];    // e.g., ["medicare"]
  excludedInsurance?: string[];    // e.g., ["medicaid"]
  veteranRequired?: boolean;
  wartimeService?: boolean;
  states?: string[];               // empty = all states (federal)
  requiresMedications?: boolean;
  needsNursingHomeCare?: boolean;
  disabledOrElderly?: boolean;
}

export interface BenefitProgram {
  programId: string;
  name: string;
  shortName: string;
  careDomain: "medical" | "financial" | "housing";
  level: "federal" | "state";
  state?: string;
  eligibilityCriteria: EligibilityCriteria;
  minProfileFields: string[];
  estimatedAnnualValue: string;
  detectionCopyTemplate: string;
  premiumExecutionSteps: string[];
  applicationUrl?: string;
  description: string;
}

export const BENEFIT_PROGRAMS: BenefitProgram[] = [
  {
    programId: "medicare_savings_qmb",
    name: "Qualified Medicare Beneficiary (QMB)",
    shortName: "QMB",
    careDomain: "financial",
    level: "federal",
    eligibilityCriteria: {
      minAge: 65,
      maxMonthlyIncome: 1350,
      maxMonthlyIncomeCouple: 1824,
      maxAssets: 9660,
      maxAssetsCouple: 14470,
      requiredInsurance: ["medicare"],
      disabledOrElderly: true,
    },
    minProfileFields: ["age", "insurance_type", "income_range"],
    estimatedAnnualValue: "$2,400\u2013$4,800",
    detectionCopyTemplate:
      "{parentName} may qualify for the QMB program, which pays Medicare Part A and Part B premiums, deductibles, coinsurance, and copayments. Estimated value: {estimatedValue}/year.",
    premiumExecutionSteps: [
      "Verify income and resource limits against current federal thresholds",
      "Gather documentation: proof of income (SSA-1099, pension statements), bank statements, Medicare card",
      "Locate state Medicaid application (online or paper)",
      "Complete application with pre-filled profile data",
      "Track application status and follow up at 30 days if no response",
    ],
    description:
      "Apply through state Medicaid office. No enrollment period \u2014 can apply any time. Decision typically within 45 days.",
  },
  {
    programId: "medicare_savings_slmb",
    name: "Specified Low-Income Medicare Beneficiary (SLMB)",
    shortName: "SLMB",
    careDomain: "financial",
    level: "federal",
    eligibilityCriteria: {
      minAge: 65,
      maxMonthlyIncome: 1616,
      maxMonthlyIncomeCouple: 2184,
      maxAssets: 9660,
      maxAssetsCouple: 14470,
      requiredInsurance: ["medicare"],
      disabledOrElderly: true,
    },
    minProfileFields: ["age", "insurance_type", "income_range"],
    estimatedAnnualValue: "$2,400\u2013$2,800",
    detectionCopyTemplate:
      "{parentName} may qualify for the SLMB program, which pays the Medicare Part B premium. Estimated savings: {estimatedValue}/year.",
    premiumExecutionSteps: [
      "Verify income is between QMB and SLMB thresholds",
      "Gather documentation: proof of income, bank statements, Medicare card",
      "Submit application to state Medicaid office",
      "Track application status",
    ],
    description:
      "Apply through state Medicaid office. Pays Medicare Part B premium only. No enrollment period.",
  },
  {
    programId: "medicare_savings_qi",
    name: "Qualifying Individual (QI) Program",
    shortName: "QI",
    careDomain: "financial",
    level: "federal",
    eligibilityCriteria: {
      minAge: 65,
      maxMonthlyIncome: 1816,
      maxMonthlyIncomeCouple: 2455,
      maxAssets: 9950,
      maxAssetsCouple: 14910,
      requiredInsurance: ["medicare"],
      excludedInsurance: ["medicaid"],
      disabledOrElderly: true,
    },
    minProfileFields: ["age", "insurance_type", "income_range"],
    estimatedAnnualValue: "$2,400\u2013$2,800",
    detectionCopyTemplate:
      "{parentName} may qualify for the QI program, which pays the Medicare Part B premium. This program has limited funding \u2014 early application is recommended. Estimated savings: {estimatedValue}/year.",
    premiumExecutionSteps: [
      "Verify income is between SLMB and QI thresholds",
      "Confirm not enrolled in Medicaid",
      "Gather documentation and apply to state Medicaid office",
      "Set annual reapplication reminder (QI requires yearly renewal)",
    ],
    description:
      "Apply through state Medicaid office. Must reapply each year. First-come, first-served \u2014 limited funding.",
  },
  {
    programId: "extra_help_lis",
    name: "Extra Help / Low Income Subsidy (LIS)",
    shortName: "Extra Help",
    careDomain: "financial",
    level: "federal",
    eligibilityCriteria: {
      maxMonthlyIncome: 2015,
      maxMonthlyIncomeCouple: 2725,
      maxAssets: 16590,
      maxAssetsCouple: 33100,
      requiredInsurance: ["medicare"],
      requiresMedications: true,
    },
    minProfileFields: ["age", "insurance_type", "income_range", "medications"],
    estimatedAnnualValue: "$1,200\u2013$5,000",
    detectionCopyTemplate:
      "{parentName} may qualify for Extra Help, which reduces Part D prescription drug costs. With {medicationCount} medications, estimated savings could be {estimatedValue}/year.",
    premiumExecutionSteps: [
      "Calculate estimated drug cost savings based on current medication list",
      "Verify income and resource eligibility",
      "Complete SSA-1020 application (online or paper)",
      "If approved, coordinate with Part D plan to apply LIS benefits",
      "Set annual review reminder \u2014 eligibility is reassessed yearly",
    ],
    applicationUrl: "https://www.ssa.gov/extrahelp",
    description:
      "Apply online at ssa.gov/extrahelp, by phone (1-800-772-1213), or at local Social Security office. Decision within 30 days.",
  },
  {
    programId: "va_aid_attendance",
    name: "VA Aid and Attendance Pension",
    shortName: "VA A&A",
    careDomain: "financial",
    level: "federal",
    eligibilityCriteria: {
      veteranRequired: true,
      wartimeService: true,
      maxAssets: 163699,
    },
    minProfileFields: ["veteran_status", "age", "income_range", "conditions"],
    estimatedAnnualValue: "$17,400\u2013$22,800",
    detectionCopyTemplate:
      "{parentName} may qualify for VA Aid and Attendance, which provides up to {estimatedValue}/year for veterans or surviving spouses who need help with daily activities. This is one of the highest-value benefits available.",
    premiumExecutionSteps: [
      "Verify veteran status and wartime service period",
      "Assess ADL needs (bathing, dressing, eating, toileting, transferring)",
      "Calculate net worth against $163,699 limit",
      "Gather medical evidence (doctor's statement of care needs)",
      "Complete VA Form 21-2680 and VA Form 21-534EZ (surviving spouse)",
      "Submit application and track status at va.gov",
    ],
    applicationUrl: "https://www.va.gov",
    description:
      "Apply through VA (va.gov) or with help from a VA-accredited claims agent. Processing time: 3\u20136 months. Apply via VA Form 21-2680.",
  },
  {
    programId: "va_housebound",
    name: "VA Housebound Allowance",
    shortName: "VA Housebound",
    careDomain: "financial",
    level: "federal",
    eligibilityCriteria: {
      veteranRequired: true,
      wartimeService: true,
      maxAssets: 163699,
    },
    minProfileFields: ["veteran_status", "age", "conditions"],
    estimatedAnnualValue: "$10,000\u2013$14,000",
    detectionCopyTemplate:
      "{parentName} may qualify for the VA Housebound allowance if substantially confined to the home. Estimated value: {estimatedValue}/year.",
    premiumExecutionSteps: [
      "Verify veteran status and service period",
      "Document homebound status with medical evidence",
      "Submit application through VA",
    ],
    description:
      "Apply through VA. Can apply concurrently with Aid and Attendance \u2014 VA awards whichever benefit is higher.",
  },
  {
    programId: "pace_program",
    name: "Program of All-Inclusive Care for the Elderly (PACE)",
    shortName: "PACE",
    careDomain: "medical",
    level: "federal",
    eligibilityCriteria: {
      minAge: 55,
      maxMonthlyIncome: 2901,
      maxAssets: 2000,
      needsNursingHomeCare: true,
      states: [
        "AL","AR","CA","CO","DE","FL","IL","IN","IA","KS","KY","LA","MA","MD",
        "MI","MO","NC","ND","NE","NJ","NM","NY","OH","OK","OR","PA","RI","SC",
        "TN","TX","VA","WA","WI","DC",
      ],
    },
    minProfileFields: ["age", "state", "conditions", "income_range"],
    estimatedAnnualValue: "$30,000\u2013$60,000",
    detectionCopyTemplate:
      "{parentName} may be eligible for PACE, which provides comprehensive medical and social services to help older adults live in the community. PACE is available in {parentState} and covers virtually all care needs. Estimated value: {estimatedValue}/year.",
    premiumExecutionSteps: [
      "Verify PACE service area availability for parent's zip code",
      "Confirm nursing-home-level care need through functional assessment",
      "Schedule intake assessment with local PACE organization",
      "Review PACE agreement (participants must use PACE providers)",
      "Coordinate transition from current insurance/providers",
    ],
    description:
      "Contact a local PACE organization. Available in 33 states + DC. Covers all Medicare and Medicaid services including prescriptions, doctor visits, transportation, and home care.",
  },
  {
    programId: "medicaid_hcbs_waiver",
    name: "Medicaid HCBS Waiver (Home & Community Based Services)",
    shortName: "HCBS Waiver",
    careDomain: "medical",
    level: "federal",
    eligibilityCriteria: {
      minAge: 65,
      maxMonthlyIncome: 2982,
      maxAssets: 2000,
      needsNursingHomeCare: true,
      disabledOrElderly: true,
    },
    minProfileFields: ["age", "state", "conditions", "income_range"],
    estimatedAnnualValue: "$20,000\u2013$50,000",
    detectionCopyTemplate:
      "{parentName} may qualify for Medicaid HCBS Waiver services in {parentState}, which cover home health aides, personal care, adult day programs, and respite care. This can help {parentName} remain at home rather than moving to a nursing facility.",
    premiumExecutionSteps: [
      "Check state-specific income and asset limits",
      "Assess functional eligibility (ADLs, nursing home level of care)",
      "Apply through state Medicaid agency",
      "If waitlisted, set follow-up reminders and explore interim options",
      "Coordinate care plan with assigned case manager upon approval",
    ],
    description:
      "Apply through state Medicaid agency. Waitlists common in many states. Covers home health aides, personal care, adult day care, respite care, and more.",
  },
  {
    programId: "snap_elderly",
    name: "SNAP (Supplemental Nutrition Assistance Program)",
    shortName: "SNAP",
    careDomain: "financial",
    level: "federal",
    eligibilityCriteria: {
      minAge: 60,
      maxMonthlyIncome: 1255,
      maxMonthlyIncomeCouple: 1703,
      maxAssets: 4500,
      disabledOrElderly: true,
    },
    minProfileFields: ["age", "income_range"],
    estimatedAnnualValue: "$1,800\u2013$3,600",
    detectionCopyTemplate:
      "{parentName} may qualify for SNAP food assistance. Seniors 60+ have special eligibility rules, and medical expenses can be deducted from income. Estimated value: {estimatedValue}/year.",
    premiumExecutionSteps: [
      "Calculate net income after elderly deductions (medical expenses over $35/month, shelter costs)",
      "Gather documentation: proof of income, rent/mortgage, medical expenses, bank statements",
      "Apply online through state SNAP portal or in-person at local office",
      "Seniors may qualify for simplified reporting (report changes every 6 or 12 months)",
    ],
    description:
      "Apply through state SNAP office or online. Seniors 60+ qualify under special rules using net income (after deductions) rather than gross income.",
  },
  {
    programId: "liheap",
    name: "LIHEAP (Low Income Home Energy Assistance Program)",
    shortName: "LIHEAP",
    careDomain: "housing",
    level: "federal",
    eligibilityCriteria: {
      minAge: 60,
      disabledOrElderly: true,
    },
    minProfileFields: ["age", "state", "income_range"],
    estimatedAnnualValue: "$300\u2013$1,500",
    detectionCopyTemplate:
      "{parentName} may qualify for LIHEAP energy assistance, which helps pay heating and cooling bills. Seniors 60+ receive priority. Estimated value: {estimatedValue}/year.",
    premiumExecutionSteps: [
      "Check state application window (typically opens fall for heating, spring for cooling)",
      "Gather utility bills and proof of income",
      "Apply through local Community Action Agency",
      "If approved, may also qualify for Weatherization Assistance Program",
    ],
    description:
      "Apply through local Community Action Agency or state energy office. Seniors 60+ typically get priority and early application access. Seasonal program.",
  },
  {
    programId: "ssi",
    name: "Supplemental Security Income (SSI)",
    shortName: "SSI",
    careDomain: "financial",
    level: "federal",
    eligibilityCriteria: {
      minAge: 65,
      maxMonthlyIncome: 967,
      maxAssets: 2000,
      maxAssetsCouple: 3000,
      disabledOrElderly: true,
    },
    minProfileFields: ["age", "income_range", "conditions"],
    estimatedAnnualValue: "$4,000\u2013$11,600",
    detectionCopyTemplate:
      "{parentName} may qualify for SSI, which provides monthly cash assistance of up to $967/month. SSI approval also typically qualifies for Medicaid automatically.",
    premiumExecutionSteps: [
      "Verify age, disability status, and citizenship/residency",
      "Calculate countable income and resources",
      "Apply at local Social Security office or online",
      "If denied, file appeal within 60 days (high success rate on appeal)",
    ],
    applicationUrl: "https://www.ssa.gov",
    description:
      "Apply at ssa.gov, by phone (1-800-772-1213), or at local Social Security office. Approval automatically qualifies for Medicaid in most states.",
  },
  {
    programId: "spap_ny_epic",
    name: "EPIC (Elderly Pharmaceutical Insurance Coverage) \u2014 New York",
    shortName: "NY EPIC",
    careDomain: "financial",
    level: "state",
    state: "NY",
    eligibilityCriteria: {
      minAge: 65,
      states: ["NY"],
      maxMonthlyIncome: 6250, // $75,000/yr / 12 (single deductible plan max)
      maxMonthlyIncomeCouple: 8333, // $100,000/yr / 12 (married deductible plan max)
      requiredInsurance: ["medicare"],
      requiresMedications: true,
    },
    minProfileFields: ["age", "state", "income_range", "medications"],
    estimatedAnnualValue: "$1,000\u2013$4,000",
    detectionCopyTemplate:
      "{parentName} lives in New York and may qualify for EPIC, which helps pay Medicare Part D prescription costs. With income thresholds up to $75,000 (single) / $100,000 (married), many seniors qualify. Estimated savings: {estimatedValue}/year.",
    premiumExecutionSteps: [
      "Determine fee plan vs. deductible plan based on income",
      "Gather Medicare Part D plan information",
      "Apply online at health.ny.gov/epic",
      "Coordinate with Part D plan to apply EPIC benefits",
    ],
    applicationUrl: "https://health.ny.gov/epic",
    description:
      "Apply online at health.ny.gov/epic or by mail. Works alongside Medicare Part D \u2014 EPIC pays Part D copays and deductibles.",
  },
  {
    programId: "spap_nj_paad",
    name: "PAAD (Pharmaceutical Assistance to the Aged and Disabled) \u2014 New Jersey",
    shortName: "NJ PAAD",
    careDomain: "financial",
    level: "state",
    state: "NJ",
    eligibilityCriteria: {
      minAge: 65,
      states: ["NJ"],
      maxMonthlyIncome: 4454, // $53,446/yr / 12
      maxMonthlyIncomeCouple: 5058, // $60,690/yr / 12
      disabledOrElderly: true,
    },
    minProfileFields: ["age", "state", "income_range", "medications"],
    estimatedAnnualValue: "$1,500\u2013$5,000",
    detectionCopyTemplate:
      "{parentName} lives in New Jersey and may qualify for PAAD, which significantly reduces prescription drug costs. New Jersey has some of the most generous income limits in the nation ($53,446 single / $60,690 married). Estimated savings: {estimatedValue}/year.",
    premiumExecutionSteps: [
      "Verify 12-month NJ residency requirement",
      "Gather proof of income and Medicare enrollment",
      "Apply through NJ county Office on Aging or online",
      "Benefits begin the month after approval",
    ],
    description:
      "Apply online or through county Office on Aging. One of the most generous SPAPs in the nation with high income limits.",
  },
  {
    programId: "spap_pa_pace",
    name: "PACE/PACENET (Pharmaceutical Assistance) \u2014 Pennsylvania",
    shortName: "PA PACE",
    careDomain: "financial",
    level: "state",
    state: "PA",
    eligibilityCriteria: {
      minAge: 65,
      states: ["PA"],
      maxMonthlyIncome: 3750, // $45,000/yr / 12 (PACENET single max)
      maxMonthlyIncomeCouple: 4583, // $55,000/yr / 12 (PACENET married max)
    },
    minProfileFields: ["age", "state", "income_range", "medications"],
    estimatedAnnualValue: "$1,000\u2013$4,500",
    detectionCopyTemplate:
      "{parentName} lives in Pennsylvania and may qualify for PACE or PACENET prescription assistance. Income limits are expanding in July 2026. Estimated savings: {estimatedValue}/year.",
    premiumExecutionSteps: [
      "Determine PACE vs. PACENET eligibility based on income",
      "Gather income documentation and proof of PA residency",
      "Apply through PA Department of Aging",
      "Note: PACENET ceiling rises to $45,000/$55,000 in July 2026",
    ],
    description:
      "Apply through PA Department of Aging. PACE has lower copays; PACENET has slightly higher copays but broader income eligibility.",
  },
  {
    programId: "medicaid_nursing_home",
    name: "Medicaid Nursing Home Coverage",
    shortName: "Medicaid NH",
    careDomain: "financial",
    level: "federal",
    eligibilityCriteria: {
      minAge: 65,
      maxMonthlyIncome: 2982,
      maxAssets: 2000,
      needsNursingHomeCare: true,
      disabledOrElderly: true,
    },
    minProfileFields: ["age", "state", "income_range", "conditions"],
    estimatedAnnualValue: "$90,000\u2013$120,000",
    detectionCopyTemplate:
      "Based on {parentName}'s financial trajectory, Medicaid nursing home coverage may become relevant. The 60-month lookback period means planning should begin early. Estimated coverage value: {estimatedValue}/year.",
    premiumExecutionSteps: [
      "Calculate spend-down timeline based on current assets and monthly costs",
      "Review 60-month lookback period for any asset transfers",
      "Consult with elder law attorney on asset protection strategies",
      "Apply through state Medicaid agency when financially eligible",
      "Coordinate with nursing facility billing department",
    ],
    description:
      "Apply through state Medicaid agency. 60-month lookback period on asset transfers. Covers room, board, and all care in a nursing facility.",
  },
  {
    programId: "medicare_part_d_lis_auto",
    name: "Medicare Part D \u2014 Auto-Enrollment for Dual Eligibles",
    shortName: "Part D Review",
    careDomain: "medical",
    level: "federal",
    eligibilityCriteria: {
      requiredInsurance: ["medicare", "medicaid"],
      requiresMedications: true,
    },
    minProfileFields: ["insurance_type", "medications"],
    estimatedAnnualValue: "$1,000\u2013$4,000",
    detectionCopyTemplate:
      "{parentName} is dual-eligible and automatically receives Extra Help for prescription costs. However, the auto-assigned Part D plan may not be optimal for {parentName}'s specific medications. A plan review could save additional money.",
    premiumExecutionSteps: [
      "Review current auto-assigned Part D plan against medication list",
      "Compare formulary coverage and copay tiers",
      "Switch to a better-matched LIS-eligible plan during open enrollment if beneficial",
      "Set annual review reminder for October (open enrollment)",
    ],
    description:
      "Dual eligibles are automatically enrolled in Extra Help but may be assigned a random Part D plan. Review plan assignment annually.",
  },
  {
    programId: "weatherization_assistance",
    name: "Weatherization Assistance Program (WAP)",
    shortName: "WAP",
    careDomain: "housing",
    level: "federal",
    eligibilityCriteria: {
      minAge: 60,
      disabledOrElderly: true,
    },
    minProfileFields: ["age", "state", "income_range"],
    estimatedAnnualValue: "$2,000\u2013$7,000",
    detectionCopyTemplate:
      "{parentName} may qualify for free home weatherization, which includes insulation, window repairs, and furnace upgrades. Seniors 60+ receive priority. This one-time improvement can reduce energy costs by $200\u2013$400/year permanently.",
    premiumExecutionSteps: [
      "Contact local Community Action Agency for application",
      "Schedule home energy audit",
      "Improvements are performed at no cost to the homeowner",
      "Average investment per home: $2,000\u2013$7,000 in improvements",
    ],
    description:
      "Apply through local Community Action Agency. Free home energy audit and improvements including insulation, window repair, furnace repair/replacement.",
  },
];
