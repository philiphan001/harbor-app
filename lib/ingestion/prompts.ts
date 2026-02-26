// Document extraction prompts for Claude Vision and text extraction
// Each prompt returns a JSON schema matching our ExtractedData types

import { DocumentType, type ParentContext } from "./types";

/** System prompt for all document extraction */
export const DOCUMENT_EXTRACTION_SYSTEM = `You are a precise document data extractor for an elder care application called Harbor. Your job is to extract structured information from photos and documents that caregivers upload about their aging parents.

CRITICAL RULES:
1. Extract ONLY what you can actually see/read in the document. Never guess or fabricate data.
2. If a field is unclear or partially visible, set it to null rather than guessing.
3. For medications, get the EXACT spelling and dosage — errors here are dangerous.
4. Return confidence as a decimal 0.0–1.0 reflecting how clearly you could read the document.
5. Always return valid JSON matching the requested schema. No markdown, no explanation.
6. If the document doesn't match the expected type, set documentType to what it actually is.
7. Always include a "warnings" array in your response (empty array if no issues). Add a warning string for each of these situations:
   - If a name on the document doesn't match the parent's name (e.g. "Name on document (John Smith) doesn't match parent's name (Mary Jones). Please verify this document belongs to the right person.")
   - If the document appears to be completely unrelated to elder care (e.g. a recipe, a random article, a selfie). In this case, set documentType to "other" and add a warning like "This document doesn't appear to contain medical, legal, financial, or care-related information."
   - If the document is too blurry, dark, or cut off to extract meaningful information.`;

/** Build the full system prompt, injecting parent context if available */
export function buildSystemPrompt(parentContext?: ParentContext): string {
  if (!parentContext?.name) return DOCUMENT_EXTRACTION_SYSTEM;

  const parts = [`The parent/elder's name is "${parentContext.name}".`];
  if (parentContext.age) parts.push(`They are ${parentContext.age} years old.`);
  if (parentContext.state) parts.push(`They live in ${parentContext.state}.`);

  return `${DOCUMENT_EXTRACTION_SYSTEM}\n\nPARENT CONTEXT:\n${parts.join(" ")} Use this to check if names on documents match. If a name on the document is clearly different from the parent's name, include a warning — but still extract the data.`;
}

/** Get the extraction prompt for a specific document type */
export function getExtractionPrompt(
  documentType: DocumentType | undefined
): string {
  if (documentType && documentType in EXTRACTION_PROMPTS) {
    return EXTRACTION_PROMPTS[documentType];
  }
  return EXTRACTION_PROMPTS.auto_detect;
}

const EXTRACTION_PROMPTS: Record<string, string> = {
  auto_detect: `Analyze this document and determine what type it is, then extract all relevant structured data.

First, identify the document type from these categories:
- insurance_card: Health insurance card (front or back)
- medication: Pill bottle label, prescription label, or medication list
- discharge_summary: Hospital discharge papers
- legal_document: Power of attorney, healthcare proxy, will, etc.
- doctor_card: Doctor's business card or contact info
- bill_statement: Medical bill, EOB, or statement
- lab_results: Laboratory test results
- other: Anything else

Then extract data matching the appropriate schema below.

Return JSON:
{
  "documentType": "<detected type>",
  "confidence": 0.0-1.0,
  "warnings": [],
  "data": { ... } // Schema depends on detected type — use the matching schema from below
}

SCHEMAS BY TYPE:

insurance_card: { "type": "insurance_card", "provider": "", "planName": "", "memberId": "", "groupNumber": "", "rxBin": "", "rxPcn": "", "rxGroup": "", "copays": { "primaryCare": "", "specialist": "", "emergencyRoom": "", "genericRx": "", "brandRx": "" }, "customerServicePhone": "", "effectiveDate": "", "cardSide": "front|back|both" }

medication: { "type": "medication", "medications": [{ "name": "", "dosage": "", "frequency": "", "prescriber": "", "purpose": "", "refillsRemaining": null, "pharmacy": "", "rxNumber": "", "expirationDate": "" }] }

doctor_card: { "type": "doctor_card", "name": "", "specialty": "", "practice": "", "phone": "", "fax": "", "address": "", "website": "" }

legal_document: { "type": "legal_document", "documentType": "", "title": "", "dateExecuted": "", "parties": [{ "role": "", "name": "" }], "state": "", "keyProvisions": [], "status": "complete|incomplete|unclear" }

discharge_summary: { "type": "discharge_summary", "facility": "", "admitDate": "", "dischargeDate": "", "diagnoses": [], "procedures": [], "medicationsAtDischarge": [{ "name": "", "dosage": "", "frequency": "", "instructions": "" }], "followUpInstructions": [], "restrictions": [], "primaryPhysician": "" }

bill_statement: { "type": "bill_statement", "provider": "", "serviceDate": "", "totalAmount": "", "amountDue": "", "insurancePaid": "", "services": [{ "description": "", "amount": "", "code": "" }], "dueDate": "", "accountNumber": "" }

lab_results: { "type": "lab_results", "facility": "", "orderDate": "", "resultDate": "", "orderingPhysician": "", "results": [{ "testName": "", "value": "", "unit": "", "referenceRange": "", "flag": "normal|high|low|critical" }] }

other: { "type": "other", "title": "", "summary": "", "keyFacts": [], "dates": [], "people": [], "actionItems": [] }`,

  insurance_card: `Extract all information from this insurance card photo.

Return JSON:
{
  "documentType": "insurance_card",
  "confidence": 0.0-1.0,
  "data": {
    "type": "insurance_card",
    "provider": "Insurance company name",
    "planName": "Plan name if visible",
    "memberId": "Member/subscriber ID number",
    "groupNumber": "Group number if visible",
    "rxBin": "Rx BIN number (for pharmacy benefits)",
    "rxPcn": "Rx PCN number",
    "rxGroup": "Rx Group number",
    "copays": {
      "primaryCare": "PCP copay amount",
      "specialist": "Specialist copay amount",
      "emergencyRoom": "ER copay amount",
      "urgentCare": "Urgent care copay",
      "genericRx": "Generic prescription copay",
      "brandRx": "Brand prescription copay"
    },
    "customerServicePhone": "Customer service number",
    "effectiveDate": "Coverage effective date",
    "cardSide": "front or back"
  }
}

IMPORTANT: Insurance cards often have different info on front vs back. Extract everything visible. If this is the back of the card, focus on Rx/pharmacy benefits and customer service numbers.`,

  medication: `Extract medication information from this photo. This could be a pill bottle label, prescription printout, or medication list.

Return JSON:
{
  "documentType": "medication",
  "confidence": 0.0-1.0,
  "data": {
    "type": "medication",
    "medications": [
      {
        "name": "Exact medication name (generic and/or brand)",
        "dosage": "Strength (e.g., '10mg', '500mg')",
        "frequency": "How often (e.g., 'twice daily', 'every 8 hours')",
        "prescriber": "Prescribing doctor name",
        "purpose": "What it's for, if stated",
        "refillsRemaining": null,
        "pharmacy": "Pharmacy name",
        "rxNumber": "Prescription number",
        "expirationDate": "Expiration date if visible"
      }
    ]
  }
}

CRITICAL: Get medication name and dosage EXACTLY right. If you can't clearly read it, set confidence lower and note which fields are uncertain. Never guess a medication name.`,

  discharge_summary: `Extract information from these hospital discharge papers.

Return JSON:
{
  "documentType": "discharge_summary",
  "confidence": 0.0-1.0,
  "data": {
    "type": "discharge_summary",
    "facility": "Hospital/facility name",
    "admitDate": "Admission date",
    "dischargeDate": "Discharge date",
    "diagnoses": ["Primary and secondary diagnoses"],
    "procedures": ["Any procedures performed"],
    "medicationsAtDischarge": [
      {
        "name": "Medication name",
        "dosage": "Dosage",
        "frequency": "How often",
        "instructions": "Special instructions"
      }
    ],
    "followUpInstructions": ["Follow-up appointments and instructions"],
    "restrictions": ["Activity restrictions, diet restrictions, etc."],
    "primaryPhysician": "Attending/primary physician name"
  }
}

Focus on actionable information: follow-up appointments, medication changes, and restrictions. These are what the caregiver needs most.`,

  legal_document: `Extract information from this legal document (healthcare proxy, power of attorney, will, etc.).

Return JSON:
{
  "documentType": "legal_document",
  "confidence": 0.0-1.0,
  "data": {
    "type": "legal_document",
    "documentType": "Type of document (healthcare_proxy, poa, will, trust, dnr, other)",
    "title": "Document title",
    "dateExecuted": "Date signed/executed",
    "parties": [
      { "role": "principal/agent/witness/notary", "name": "Full name" }
    ],
    "state": "State where executed (2-letter code)",
    "keyProvisions": ["Key provisions or powers granted"],
    "expirationDate": "Expiration date if any",
    "status": "complete if fully signed and witnessed, incomplete if missing signatures, unclear if can't determine"
  }
}

IMPORTANT: Note whether the document appears to be fully executed (all signatures present, notarized if required). This affects whether it's legally valid.`,

  doctor_card: `Extract contact information from this doctor's business card or contact info.

Return JSON:
{
  "documentType": "doctor_card",
  "confidence": 0.0-1.0,
  "data": {
    "type": "doctor_card",
    "name": "Doctor's full name with credentials (e.g., 'John Smith, MD')",
    "specialty": "Medical specialty",
    "practice": "Practice or group name",
    "phone": "Office phone number",
    "fax": "Fax number",
    "address": "Full office address",
    "website": "Website URL",
    "npi": "NPI number if visible"
  }
}`,

  bill_statement: `Extract information from this medical bill or explanation of benefits (EOB).

Return JSON:
{
  "documentType": "bill_statement",
  "confidence": 0.0-1.0,
  "data": {
    "type": "bill_statement",
    "provider": "Provider/facility name",
    "serviceDate": "Date of service",
    "totalAmount": "Total billed amount",
    "amountDue": "Amount patient owes",
    "insurancePaid": "Amount insurance covered",
    "patientResponsibility": "Patient's total responsibility",
    "services": [
      { "description": "Service description", "amount": "Charge amount", "code": "CPT/billing code" }
    ],
    "dueDate": "Payment due date",
    "accountNumber": "Account or statement number"
  }
}`,

  lab_results: `Extract laboratory test results from this document.

Return JSON:
{
  "documentType": "lab_results",
  "confidence": 0.0-1.0,
  "data": {
    "type": "lab_results",
    "facility": "Lab name",
    "orderDate": "Order date",
    "resultDate": "Result date",
    "orderingPhysician": "Doctor who ordered the tests",
    "results": [
      {
        "testName": "Test name (e.g., 'Hemoglobin A1c')",
        "value": "Result value",
        "unit": "Unit of measurement",
        "referenceRange": "Normal range",
        "flag": "normal, high, low, or critical"
      }
    ]
  }
}

IMPORTANT: Get exact values and reference ranges. Flag any results outside the normal range.`,

  other: `Extract key information from this document.

Return JSON:
{
  "documentType": "other",
  "confidence": 0.0-1.0,
  "data": {
    "type": "other",
    "title": "Document title or description",
    "summary": "2-3 sentence summary of what this document is",
    "keyFacts": ["Important facts or data points"],
    "dates": ["Any relevant dates mentioned"],
    "people": ["Names of people mentioned"],
    "actionItems": ["Any actions the caregiver should take based on this"]
  }
}`,
};
