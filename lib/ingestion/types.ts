// Document ingestion types

/** Supported document types for extraction */
export type DocumentType =
  | "insurance_card"
  | "medication"
  | "discharge_summary"
  | "legal_document"
  | "doctor_card"
  | "bill_statement"
  | "lab_results"
  | "other";

/** Supported file MIME types */
export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const SUPPORTED_PDF_TYPES = ["application/pdf"] as const;

export const SUPPORTED_FILE_TYPES = [
  ...SUPPORTED_IMAGE_TYPES,
  ...SUPPORTED_PDF_TYPES,
] as const;

export type SupportedFileType = (typeof SUPPORTED_FILE_TYPES)[number];

/** Max file size: 10MB */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Claude Vision supported media types (HEIC/HEIF need conversion) */
export type ClaudeMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

// --- Extraction Result Types ---

export interface ExtractionResult {
  documentType: DocumentType;
  confidence: number; // 0.0–1.0
  data: ExtractedData;
  rawResponse?: string;
}

/** Union of all domain-specific extraction outputs */
export type ExtractedData =
  | InsuranceCardData
  | MedicationData
  | DoctorCardData
  | LegalDocumentData
  | DischargeSummaryData
  | BillStatementData
  | LabResultsData
  | GenericDocumentData;

// --- Domain-Specific Extraction Schemas ---

export interface InsuranceCardData {
  type: "insurance_card";
  provider: string;
  planName?: string;
  memberId: string;
  groupNumber?: string;
  rxBin?: string;
  rxPcn?: string;
  rxGroup?: string;
  copays?: {
    primaryCare?: string;
    specialist?: string;
    emergencyRoom?: string;
    urgentCare?: string;
    genericRx?: string;
    brandRx?: string;
  };
  customerServicePhone?: string;
  effectiveDate?: string;
  cardSide?: "front" | "back" | "both";
}

export interface MedicationData {
  type: "medication";
  medications: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    prescriber?: string;
    purpose?: string;
    refillsRemaining?: number;
    pharmacy?: string;
    rxNumber?: string;
    expirationDate?: string;
  }>;
}

export interface DoctorCardData {
  type: "doctor_card";
  name: string;
  specialty?: string;
  practice?: string;
  phone?: string;
  fax?: string;
  address?: string;
  website?: string;
  npi?: string;
}

export interface LegalDocumentData {
  type: "legal_document";
  documentType: string; // healthcare_proxy, poa, will, trust, dnr, etc.
  title?: string;
  dateExecuted?: string;
  parties?: Array<{
    role: string; // principal, agent, witness, notary
    name: string;
  }>;
  state?: string;
  keyProvisions?: string[];
  expirationDate?: string;
  status: "complete" | "incomplete" | "unclear";
}

export interface DischargeSummaryData {
  type: "discharge_summary";
  facility?: string;
  admitDate?: string;
  dischargeDate?: string;
  diagnoses?: string[];
  procedures?: string[];
  medicationsAtDischarge?: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    instructions?: string;
  }>;
  followUpInstructions?: string[];
  restrictions?: string[];
  primaryPhysician?: string;
}

export interface BillStatementData {
  type: "bill_statement";
  provider?: string;
  serviceDate?: string;
  totalAmount?: string;
  amountDue?: string;
  insurancePaid?: string;
  patientResponsibility?: string;
  services?: Array<{
    description: string;
    amount?: string;
    code?: string;
  }>;
  dueDate?: string;
  accountNumber?: string;
}

export interface LabResultsData {
  type: "lab_results";
  facility?: string;
  orderDate?: string;
  resultDate?: string;
  orderingPhysician?: string;
  results: Array<{
    testName: string;
    value: string;
    unit?: string;
    referenceRange?: string;
    flag?: "normal" | "high" | "low" | "critical";
  }>;
}

export interface GenericDocumentData {
  type: "other";
  title?: string;
  summary: string;
  keyFacts: string[];
  dates?: string[];
  people?: string[];
  actionItems?: string[];
}

// --- Upload Request/Response Types ---

export interface UploadRequest {
  file: File;
  documentType?: DocumentType;
  parentId: string;
  situationId?: string;
}

export interface UploadResponse {
  uploadId: string;
  status: "processing" | "extracted" | "failed";
  extractedData?: ExtractionResult;
  error?: string;
}

export interface ConfirmRequest {
  uploadId: string;
  confirmedData: ExtractedData;
}

/** Validate that a MIME type is supported */
export function isSupportedFileType(
  mimeType: string
): mimeType is SupportedFileType {
  return (SUPPORTED_FILE_TYPES as readonly string[]).includes(mimeType);
}

/** Check if a MIME type is an image */
export function isImageType(mimeType: string): boolean {
  return (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(mimeType);
}

/** Check if a MIME type is a PDF */
export function isPdfType(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

/** Get human-readable document type label */
export function getDocumentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    insurance_card: "Insurance Card",
    medication: "Medication / Pill Bottle",
    discharge_summary: "Discharge Papers",
    legal_document: "Legal Document",
    doctor_card: "Doctor's Card",
    bill_statement: "Bill / Statement",
    lab_results: "Lab Results",
    other: "Other Document",
  };
  return labels[type];
}
