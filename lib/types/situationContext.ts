// Comprehensive data model for parent's complete situation across all domains

export interface SituationContext {
  parentId: string;
  lastUpdated: string;
  profile: ParentProfile;
  medical: MedicalDomain;
  financial: FinancialDomain;
  legal: LegalDomain;
  housing: HousingDomain;
  family: FamilyDomain;
  caregiving: CaregivingDomain;
}

// ==================== Profile ====================

export interface ParentProfile {
  name: string;
  age: number;
  dateOfBirth?: string;
  state: string;
  city?: string;
  zip?: string;
  livingArrangement?: "independent" | "with_family" | "assisted_living" | "nursing_home" | "other";
  phoneNumber?: string;
  email?: string;
  whatMattersMost?: string;
}

// ==================== Medical Domain ====================

export interface MedicalDomain {
  primaryDoctor?: DoctorInfo;
  specialists: DoctorInfo[];
  medications: Medication[];
  conditions: string[];
  allergies: string[];
  recentHospitalizations: Hospitalization[];
  insurance: InsuranceInfo;
  upcomingAppointments: Appointment[];
}

export interface DoctorInfo {
  name: string;
  phone: string;
  address?: string;
  specialty?: string;
  lastVisit?: string;
  notes?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  purpose?: string;
  prescribingDoctor?: string;
  startDate?: string;
  endDate?: string;
  sideEffects?: string[];
}

export interface Hospitalization {
  date: string;
  reason: string;
  hospital: string;
  duration?: number; // days
  outcome?: string;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  phone?: string;
  coverageType: "medicare" | "medicaid" | "private" | "medicare_advantage" | "medigap";
  partDPlan?: string;
  supplementalPlan?: string;
}

export interface Appointment {
  date: string;
  doctor: string;
  purpose: string;
  location?: string;
  notes?: string;
}

// ==================== Financial Domain ====================

export interface FinancialDomain {
  monthlyIncome?: number;
  incomeSourcesDetails?: string;
  assets?: number;
  assetsBreakdown?: AssetBreakdown;
  monthlyExpenses?: number;
  expensesBreakdown?: ExpenseBreakdown;
  medicaidEligible: boolean;
  medicaidStatus?: "not_applied" | "pending" | "approved" | "denied";
  spendDownProjection?: SpendDownProjection;
  longTermCareInsurance?: LongTermCareInsurance;
}

export interface AssetBreakdown {
  checking?: number;
  savings?: number;
  investments?: number;
  home?: number;
  other?: number;
}

export interface ExpenseBreakdown {
  housing?: number;
  medical?: number;
  caregiving?: number;
  food?: number;
  utilities?: number;
  other?: number;
}

export interface SpendDownProjection {
  monthsRemaining: number;
  projectedMedicaidDate: string;
  currentBurnRate: number; // dollars per month
  assumptions: string;
}

export interface LongTermCareInsurance {
  provider: string;
  policyNumber: string;
  dailyBenefit: number;
  benefitPeriod: string; // "3 years", "lifetime", etc.
  waitingPeriod: number; // days
  activated: boolean;
}

// ==================== Legal Domain ====================

export interface LegalDomain {
  healthcareProxy?: LegalDocument;
  powerOfAttorney?: LegalDocument;
  will?: LegalDocument;
  advanceDirective?: LegalDocument;
  other: LegalDocument[];
}

export interface LegalDocument {
  documentType: string;
  status: "not_started" | "in_progress" | "completed";
  agent?: string; // Person named as agent/proxy
  location?: string; // Where document is stored
  dateCompleted?: string;
  dateExpires?: string;
  notes?: string;
  attorneyContact?: string;
}

// ==================== Housing Domain ====================

export interface HousingDomain {
  currentType: "independent" | "with_family" | "assisted_living" | "nursing_home" | "continuing_care";
  address?: string;
  facilityName?: string;
  facilityCost?: number; // monthly
  safetyIssues: string[];
  accessibilityNeeds: string[];
  modifications?: string[]; // "wheelchair ramp", "grab bars"
  moveHistory?: MoveHistory[];
  futureConsiderations?: string;
}

export interface MoveHistory {
  date: string;
  from: string;
  to: string;
  reason: string;
}

// ==================== Family Domain ====================

export interface FamilyDomain {
  primaryCaregiver: FamilyMember;
  otherChildren: FamilyMember[];
  spouse?: FamilyMember;
  otherFamily: FamilyMember[];
  conflicts?: string[];
  communicationPlan?: string;
}

export interface FamilyMember {
  name: string;
  relationship: string;
  phoneNumber?: string;
  email?: string;
  city?: string;
  state?: string;
  availability: "high" | "medium" | "low";
  role?: string; // "financial POA", "medical decisions", "daily care"
  notes?: string;
}

// ==================== Caregiving Domain ====================

export interface CaregivingDomain {
  currentSupport: CaregivingSupport[];
  gaps: string[];
  burnoutRisk: "low" | "medium" | "high";
  burnoutFactors?: string[];
  respitePlan?: string;
  dailySchedule?: DailySchedule;
}

export interface CaregivingSupport {
  type: "family" | "home_health_aide" | "meal_delivery" | "transportation" | "medical_equipment" | "other";
  provider?: string;
  frequency?: string;
  cost?: number; // monthly
  startDate?: string;
  notes?: string;
}

export interface DailySchedule {
  morning?: string;
  afternoon?: string;
  evening?: string;
  night?: string;
  notes?: string;
}

// ==================== Helper Functions ====================

export function createEmptySituationContext(parentId: string, name: string, age: number, state: string): SituationContext {
  return {
    parentId,
    lastUpdated: new Date().toISOString(),
    profile: {
      name,
      age,
      state,
    },
    medical: {
      specialists: [],
      medications: [],
      conditions: [],
      allergies: [],
      recentHospitalizations: [],
      insurance: {
        provider: "",
        policyNumber: "",
        coverageType: "medicare",
      },
      upcomingAppointments: [],
    },
    financial: {
      medicaidEligible: false,
    },
    legal: {
      other: [],
    },
    housing: {
      currentType: "independent",
      safetyIssues: [],
      accessibilityNeeds: [],
    },
    family: {
      primaryCaregiver: {
        name: "",
        relationship: "adult_child",
        availability: "high",
      },
      otherChildren: [],
      otherFamily: [],
    },
    caregiving: {
      currentSupport: [],
      gaps: [],
      burnoutRisk: "low",
    },
  };
}

export interface SituationSummaryExtras {
  readinessScore?: number;
  pendingTaskCount?: number;
  overdueTasks?: string[];
  profileCompleteness?: number;
}

export function getSituationSummary(
  context: SituationContext,
  extras?: SituationSummaryExtras
): string {
  const { profile, medical, financial, legal, housing, caregiving } = context;

  let summary = `
PARENT: ${profile.name}, age ${profile.age}, ${profile.city ? `${profile.city}, ` : ""}${profile.state}
LIVING: ${housing.currentType}${housing.facilityName ? ` (${housing.facilityName})` : ""}

MEDICAL:
- Doctors: ${medical.primaryDoctor ? medical.primaryDoctor.name : "Not set"} + ${medical.specialists.length} specialists
- Medications: ${medical.medications.length} active
- Conditions: ${medical.conditions.length > 0 ? medical.conditions.join(", ") : "None listed"}
- Insurance: ${medical.insurance.provider || "Not set"}

FINANCIAL:
- Income: ${financial.monthlyIncome ? `$${financial.monthlyIncome}/mo` : "Not set"}
- Assets: ${financial.assets ? `$${financial.assets.toLocaleString()}` : "Not set"}
- Medicaid: ${financial.medicaidEligible ? "Eligible" : "Not eligible"}${
    financial.spendDownProjection
      ? ` (${financial.spendDownProjection.monthsRemaining} months to eligibility)`
      : ""
  }

LEGAL:
- Healthcare Proxy: ${legal.healthcareProxy?.status || "Not started"}
- Power of Attorney: ${legal.powerOfAttorney?.status || "Not started"}
- Will: ${legal.will?.status || "Not started"}

CAREGIVING:
- Current Support: ${caregiving.currentSupport.length} services
- Burnout Risk: ${caregiving.burnoutRisk}
- Gaps: ${caregiving.gaps.length}${profile.whatMattersMost ? `\n\nGOALS & VALUES: ${profile.whatMattersMost}` : ""}`;

  if (extras) {
    if (extras.readinessScore != null) {
      summary += `\n\nREADINESS: ${extras.readinessScore}/100`;
    }
    if (extras.pendingTaskCount != null) {
      summary += `\nPENDING TASKS: ${extras.pendingTaskCount}`;
    }
    if (extras.overdueTasks && extras.overdueTasks.length > 0) {
      summary += `\nOVERDUE: ${extras.overdueTasks.join("; ")}`;
    }
    if (extras.profileCompleteness != null) {
      summary += `\nPROFILE COMPLETENESS: ${Math.round(extras.profileCompleteness * 100)}%`;
    }
  }

  return summary.trim();
}
