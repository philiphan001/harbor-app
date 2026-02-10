// Situation Model Types - based on harbor-spec.md

export interface SituationModel {
  id: string;
  elder: ElderInfo;
  medical: MedicalInfo;
  financial: FinancialInfo;
  legal: LegalInfo;
  housing: HousingInfo;
  family: FamilyInfo;
  coordination: CoordinationInfo;
  readinessScore: ReadinessScore;
  mode: "preparedness" | "crisis" | "ongoing";
  createdAt: Date;
  updatedAt: Date;
}

export interface ElderInfo {
  name: string;
  age: number;
  dob?: Date;
  location: string;
  currentLivingSituation: string;
  cognitiveStatus?: string;
  mobilityStatus?: string;
  overallHealthAssessment?: string;
  preferences?: {
    livingPreferences?: string;
    carePreferences?: string;
    endOfLifeWishes?: string;
  };
}

export interface MedicalInfo {
  conditions: MedicalCondition[];
  medications: Medication[];
  providers: Provider[];
  recentEvents: MedicalEvent[];
  insuranceCoverage?: {
    medicare?: boolean;
    medigap?: string;
    ltcPolicy?: boolean;
    other?: string;
  };
}

export interface MedicalCondition {
  name: string;
  diagnosisDate?: Date;
  severity?: string;
  trajectory?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  prescriber?: string;
  purpose?: string;
  interactions?: string[];
}

export interface Provider {
  name: string;
  specialty: string;
  contact?: string;
  nextAppointment?: Date;
}

export interface MedicalEvent {
  date: Date;
  type: string;
  description: string;
  outcome?: string;
}

export interface FinancialInfo {
  income: IncomeSource[];
  assets: {
    savings?: number;
    investments?: number;
    retirement?: number;
    homeEquity?: number;
    other?: number;
  };
  expenses: {
    monthly: {
      fixed?: number;
      variable?: number;
      medical?: number;
    };
  };
  insurance: InsurancePolicy[];
  projections?: {
    monthlyGap?: number;
    runwayMonths?: number;
    medicaidEligibilityDate?: Date;
  };
}

export interface IncomeSource {
  source: string;
  monthlyAmount: number;
  taxable: boolean;
}

export interface InsurancePolicy {
  carrier: string;
  type: string;
  coverage: string;
  premiums: number;
  terms?: string;
}

export interface LegalInfo {
  healthcareProxy?: LegalDocument;
  powerOfAttorney?: LegalDocument;
  will?: LegalDocument;
  trust?: LegalDocument;
  otherDocuments: LegalDocument[];
}

export interface LegalDocument {
  exists: boolean;
  holder?: string;
  type?: string;
  dateExecuted?: Date;
  documentUploaded?: boolean;
}

export interface HousingInfo {
  currentHome: {
    type: string;
    ownership: string;
    value?: number;
    floors?: number;
    accessibility?: string;
  };
  safetyAssessment?: {
    grabBars?: boolean;
    stairs?: boolean;
    bathroom?: string;
    lighting?: string;
    fallRisk?: string;
  };
  modificationEstimate?: {
    needed: boolean;
    estimatedCost?: number;
    items?: string[];
  };
  alternatives?: HousingAlternative[];
}

export interface HousingAlternative {
  type: string;
  facility?: string;
  cost?: number;
  availability?: string;
  rating?: number;
}

export interface FamilyInfo {
  members: FamilyMember[];
  dynamics?: {
    alignmentStatus?: string;
    knownConflicts?: string;
    communicationPreferences?: string;
  };
  primaryCaregiver?: {
    memberId: string;
    hoursPerWeek?: number;
    employmentImpact?: string;
  };
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  location: string;
  role: string;
  authorizationTier: "admin" | "full" | "standard" | "limited" | "provider";
  contactInfo?: string;
  involvement?: {
    frequency?: string;
    type?: string;
    willingness?: string;
  };
  financialCapacity?: {
    canContribute: boolean;
    amount?: number;
  };
}

export interface CoordinationInfo {
  tasks: Task[];
  timeline: TimelineEvent[];
  documents: Document[];
  alerts: Alert[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee?: string;
  dueDate?: Date;
  priority: "urgent" | "high" | "normal" | "low";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  domain: "medical" | "financial" | "legal" | "housing" | "family" | "logistics";
}

export interface TimelineEvent {
  date: Date;
  event: string;
  type: string;
  notes?: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  status: "uploaded" | "processing" | "verified" | "needs_update";
  uploadDate: Date;
  url?: string;
}

export interface Alert {
  id: string;
  type: "regulatory" | "insurance" | "provider" | "benefits" | "medical" | "financial";
  message: string;
  urgency: "informational" | "actionable" | "urgent";
  dateGenerated: Date;
  acknowledged: boolean;
}

export interface ReadinessScore {
  overall: number; // 0-100
  byDomain: {
    medical: number;
    financial: number;
    legal: number;
    housing: number;
    family: number;
  };
  gaps: Gap[];
  history: ScoreHistory[];
}

export interface Gap {
  domain: "medical" | "financial" | "legal" | "housing" | "family";
  item: string;
  priority: "high" | "medium" | "low";
  actionNeeded: string;
}

export interface ScoreHistory {
  date: Date;
  score: number;
  changes: string[];
}

// Chat/Conversation types
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  situationId?: string;
  userId: string;
  conversationType: "intake" | "general" | "scenario_exploration" | "family";
  messages: Message[];
  createdAt: Date;
}
