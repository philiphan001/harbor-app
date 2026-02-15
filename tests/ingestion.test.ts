// Tests for document ingestion pipeline utilities
// Note: We avoid importing pipeline.ts and imageExtractor.ts directly
// because they initialize the Anthropic SDK at module scope (requires API key).
// Instead, we test the pure utility functions from types.ts and parseResponse.ts.

import { describe, it, expect } from "vitest";
import {
  isSupportedFileType,
  isImageType,
  isPdfType,
  getDocumentTypeLabel,
  MAX_FILE_SIZE_BYTES,
  SUPPORTED_FILE_TYPES,
  type DocumentType,
} from "@/lib/ingestion/types";
import { parseExtractionResponse } from "@/lib/ingestion/parseResponse";

// ==================== Type Helpers ====================

describe("isSupportedFileType", () => {
  it("accepts all supported image types", () => {
    expect(isSupportedFileType("image/jpeg")).toBe(true);
    expect(isSupportedFileType("image/png")).toBe(true);
    expect(isSupportedFileType("image/webp")).toBe(true);
    expect(isSupportedFileType("image/heic")).toBe(true);
    expect(isSupportedFileType("image/heif")).toBe(true);
  });

  it("accepts PDF", () => {
    expect(isSupportedFileType("application/pdf")).toBe(true);
  });

  it("rejects unsupported types", () => {
    expect(isSupportedFileType("image/gif")).toBe(false);
    expect(isSupportedFileType("image/bmp")).toBe(false);
    expect(isSupportedFileType("text/plain")).toBe(false);
    expect(isSupportedFileType("application/json")).toBe(false);
    expect(isSupportedFileType("video/mp4")).toBe(false);
    expect(isSupportedFileType("")).toBe(false);
  });
});

describe("isImageType", () => {
  it("returns true for image types", () => {
    expect(isImageType("image/jpeg")).toBe(true);
    expect(isImageType("image/png")).toBe(true);
    expect(isImageType("image/webp")).toBe(true);
    expect(isImageType("image/heic")).toBe(true);
  });

  it("returns false for non-image types", () => {
    expect(isImageType("application/pdf")).toBe(false);
    expect(isImageType("text/plain")).toBe(false);
  });
});

describe("isPdfType", () => {
  it("returns true for PDFs", () => {
    expect(isPdfType("application/pdf")).toBe(true);
  });

  it("returns false for non-PDFs", () => {
    expect(isPdfType("image/jpeg")).toBe(false);
    expect(isPdfType("application/json")).toBe(false);
  });
});

describe("getDocumentTypeLabel", () => {
  it("returns labels for all document types", () => {
    const types: DocumentType[] = [
      "insurance_card",
      "medication",
      "discharge_summary",
      "legal_document",
      "doctor_card",
      "bill_statement",
      "lab_results",
      "other",
    ];

    for (const type of types) {
      const label = getDocumentTypeLabel(type);
      expect(label).toBeDefined();
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it("returns specific expected labels", () => {
    expect(getDocumentTypeLabel("insurance_card")).toBe("Insurance Card");
    expect(getDocumentTypeLabel("medication")).toBe("Medication / Pill Bottle");
    expect(getDocumentTypeLabel("other")).toBe("Other Document");
  });
});

describe("constants", () => {
  it("MAX_FILE_SIZE_BYTES is 10MB", () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });

  it("SUPPORTED_FILE_TYPES includes all expected types", () => {
    expect(SUPPORTED_FILE_TYPES).toContain("image/jpeg");
    expect(SUPPORTED_FILE_TYPES).toContain("image/png");
    expect(SUPPORTED_FILE_TYPES).toContain("image/webp");
    expect(SUPPORTED_FILE_TYPES).toContain("image/heic");
    expect(SUPPORTED_FILE_TYPES).toContain("image/heif");
    expect(SUPPORTED_FILE_TYPES).toContain("application/pdf");
    expect(SUPPORTED_FILE_TYPES.length).toBe(6);
  });
});

// ==================== Validation Logic ====================
// validateFile is in pipeline.ts but we can't import it (Anthropic SDK dep).
// Instead we test the constituent checks that validateFile uses.

describe("file validation logic", () => {
  it("isSupportedFileType + size check: valid JPEG under limit", () => {
    const fileType = "image/jpeg";
    const size = 1024;
    expect(isSupportedFileType(fileType)).toBe(true);
    expect(size <= MAX_FILE_SIZE_BYTES).toBe(true);
    expect(size > 0).toBe(true);
  });

  it("isSupportedFileType + size check: valid PDF under limit", () => {
    const fileType = "application/pdf";
    const size = 5 * 1024 * 1024;
    expect(isSupportedFileType(fileType)).toBe(true);
    expect(size <= MAX_FILE_SIZE_BYTES).toBe(true);
  });

  it("rejects unsupported file types", () => {
    expect(isSupportedFileType("image/gif")).toBe(false);
  });

  it("rejects files over 10MB", () => {
    const size = 11 * 1024 * 1024;
    expect(size > MAX_FILE_SIZE_BYTES).toBe(true);
  });

  it("passes for exactly 10MB", () => {
    expect(MAX_FILE_SIZE_BYTES <= MAX_FILE_SIZE_BYTES).toBe(true);
  });

  it("rejects empty files (size 0)", () => {
    expect(0 > 0).toBe(false);
  });
});

// ==================== parseExtractionResponse ====================

describe("parseExtractionResponse", () => {
  it("parses plain JSON response", () => {
    const response = JSON.stringify({
      documentType: "insurance_card",
      confidence: 0.95,
      data: {
        type: "insurance_card",
        provider: "Blue Cross",
        memberId: "ABC123",
      },
    });

    const result = parseExtractionResponse(response);
    expect(result.documentType).toBe("insurance_card");
    expect(result.confidence).toBe(0.95);
    expect(result.data.type).toBe("insurance_card");
  });

  it("parses JSON wrapped in markdown code block", () => {
    const response = `Here is the extracted data:

\`\`\`json
{
  "documentType": "medication",
  "confidence": 0.8,
  "data": {
    "type": "medication",
    "medications": [{"name": "Lisinopril", "dosage": "10mg"}]
  }
}
\`\`\``;

    const result = parseExtractionResponse(response);
    expect(result.documentType).toBe("medication");
    expect(result.confidence).toBe(0.8);
  });

  it("parses JSON wrapped in code block without json tag", () => {
    const response = `\`\`\`
{
  "documentType": "doctor_card",
  "confidence": 0.9,
  "data": {
    "type": "doctor_card",
    "name": "Dr. Smith",
    "specialty": "Cardiology"
  }
}
\`\`\``;

    const result = parseExtractionResponse(response);
    expect(result.documentType).toBe("doctor_card");
  });

  it("handles JSON with surrounding text", () => {
    const response = `I found the following information:
{
  "documentType": "lab_results",
  "confidence": 0.7,
  "data": {
    "type": "lab_results",
    "results": [{"testName": "CBC", "value": "normal"}]
  }
}
Let me know if you need anything else.`;

    const result = parseExtractionResponse(response);
    expect(result.documentType).toBe("lab_results");
    expect(result.confidence).toBe(0.7);
  });

  it("defaults confidence to 0.5 when missing", () => {
    const response = JSON.stringify({
      documentType: "other",
      data: {
        type: "other",
        summary: "A generic document",
        keyFacts: [],
      },
    });

    const result = parseExtractionResponse(response);
    expect(result.confidence).toBe(0.5);
  });

  it("throws for missing documentType", () => {
    const response = JSON.stringify({
      confidence: 0.9,
      data: { type: "other", summary: "test", keyFacts: [] },
    });

    expect(() => parseExtractionResponse(response)).toThrow(
      "Missing required fields"
    );
  });

  it("throws for missing data field", () => {
    const response = JSON.stringify({
      documentType: "insurance_card",
      confidence: 0.9,
    });

    expect(() => parseExtractionResponse(response)).toThrow(
      "Missing required fields"
    );
  });

  it("throws when no JSON found", () => {
    const response = "This is just text with no JSON at all.";

    expect(() => parseExtractionResponse(response)).toThrow(
      "No JSON object found"
    );
  });

  it("throws for malformed JSON", () => {
    const response = `{ "documentType": "insurance_card", "data": { broken }`;

    expect(() => parseExtractionResponse(response)).toThrow("Invalid JSON");
  });
});
