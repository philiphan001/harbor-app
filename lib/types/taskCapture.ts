// Types for task data capture - replaces `any` across task completion flows

// ==================== Captured Data Types ====================

/** Doctor/provider contact information */
export interface DoctorInfo {
  name: string;
  phone: string;
  address?: string;
  specialty?: string;
}

/** Single medication entry */
export interface MedicationEntry {
  name: string;
  dosage: string;
  frequency: string;
  purpose?: string;
  prescriber?: string;
  pharmacy?: string;
  rxNumber?: string;
  refillsRemaining?: number;
  expirationDate?: string;
}

/** Medication list */
export interface MedicationList {
  medications: MedicationEntry[];
}

/** Insurance information */
export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  phone?: string;
}

/** Legal document information */
export interface LegalDocumentInfo {
  documentType: string;
  status: string;
  agent?: string;
  location?: string;
  dateCompleted?: string;
}

/** General task notes */
export interface TaskNotes {
  notes: string;
  complete?: boolean;
}

/** Manual notes from form input */
export interface ManualNotes {
  notes: string;
}

/** Emergency contact information */
export interface EmergencyContactInfo {
  name: string;
  relationship?: string;
  phone?: string;
}

/** Transportation plan data */
export interface TransportPlanInfo {
  currentMethods?: string[];
  primaryTransport?: string;
  backupTransport?: string;
}

/** Delivery services setup */
export interface DeliveryServicesInfo {
  services: string[];
}

/** Check-in schedule */
export interface CheckInScheduleInfo {
  schedule: Array<{ name: string; frequency: string; method: string }>;
}

/** Emergency contacts list */
export interface EmergencyContactsInfo {
  contacts: Array<{ name: string; relationship: string; phone: string }>;
}

/** Housing details */
export interface HousingDetailsInfo {
  livingArrangement: string;
  ownershipNotes?: string;
  landlordOrHoa?: { name: string; phone: string };
}

/** Housing cost */
export interface HousingCostInfo {
  amount: string;
  frequency: string;
}

/** Facility shortlist entry */
export interface FacilityShortlistInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  overallRating: number;
  beds: number;
  distance: number;
}

/** Pet care plan */
export interface PetCareInfo {
  petName: string;
  petType?: string;
  vetName?: string;
  vetPhone?: string;
  emergencySitter?: string;
  dailyCareNotes?: string;
}

// ==================== Discriminated Union for Task Data ====================

/** All possible captured data shapes, discriminated by toolName */
export type CapturedTaskData =
  | { toolName: "save_doctor_info"; data: DoctorInfo }
  | { toolName: "save_medication_list"; data: MedicationList }
  | { toolName: "save_insurance_info"; data: InsuranceInfo }
  | { toolName: "save_legal_document_info"; data: LegalDocumentInfo }
  | { toolName: "save_task_notes"; data: TaskNotes }
  | { toolName: "manual_notes"; data: ManualNotes };

/** The data field type (union of all possible shapes) */
export type TaskDataPayload =
  | DoctorInfo
  | MedicationList
  | InsuranceInfo
  | LegalDocumentInfo
  | TaskNotes
  | ManualNotes
  | EmergencyContactInfo
  | TransportPlanInfo
  | DeliveryServicesInfo
  | CheckInScheduleInfo
  | EmergencyContactsInfo
  | PetCareInfo
  | HousingDetailsInfo
  | HousingCostInfo
  | FacilityShortlistInfo
  | import("@/lib/ingestion/types").ExtractedData;

// ==================== Task Completion Callback Types ====================

/** Data passed to onComplete in TaskChat */
export interface TaskChatResult {
  toolName: string;
  data: TaskDataPayload;
}

/** Data passed to onComplete in TaskForm */
export interface TaskFormResult {
  notes: string;
}

/** Union of all task completion data */
export type TaskCompletionData = TaskChatResult | TaskFormResult | null;

// ==================== Claude API Response Types ====================

/** Metadata returned from Claude API calls */
export interface ClaudeResponseMetadata {
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/** Chat function return type */
export interface ChatResponse {
  message: string;
  complete: boolean;
  extractedData?: Record<string, unknown>;
  tasks?: import("@/lib/ai/claude").Task[];
  parentProfile?: import("@/lib/ai/claude").ParentProfileData;
  metadata?: ClaudeResponseMetadata;
}

/** Task capture API response */
export interface TaskCaptureResponse {
  message: string;
  complete: boolean;
  extractedData: TaskChatResult | null;
}

// ==================== Extraction Tool Definition ====================

/** Shape of an Anthropic tool definition used in task capture */
export interface AnthropicToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
  };
}

// ==================== Healthcare Proxy Help Types ====================

/** Resource link for healthcare proxy guidance */
export interface HealthcareProxyResource {
  type?: string;
  url?: string;
  name?: string;
  features?: string[];
}

/** Option for completing a healthcare proxy */
export interface HealthcareProxyOption {
  name: string;
  difficulty: string;
  cost: string;
  time: string;
  bestFor: string;
  steps: string[];
  resources?: HealthcareProxyResource[];
}

// ==================== Scored Signal Types ====================

/** Result from the judgment agent scoring */
export interface ScoredSignalResult {
  relevanceScore: number;
  reasoning: string;
  priority: import("@/lib/constants/domains").Priority;
  estimatedImpact?: string;
  recommendedAction?: string;
  scoredAt: string;
}

// ==================== Extracted Answer Type ====================

/** Answer extracted from conversation by Claude */
export interface ExtractedAnswer {
  questionId: string;
  selectedOption: string | null;
  isUncertain: boolean;
  confidence: "high" | "medium" | "low";
}
