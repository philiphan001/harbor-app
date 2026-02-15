// Shared parsing utility for extraction responses
// Separated from imageExtractor to allow testing without API key dependency

import { type DocumentType, type ExtractionResult } from "./types";

/**
 * Parse Claude's JSON response into a typed ExtractionResult.
 * Handles cases where Claude wraps JSON in markdown code blocks.
 */
export function parseExtractionResponse(responseText: string): ExtractionResult {
  // Strip markdown code blocks if present
  let jsonText = responseText.trim();
  const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1].trim();
  }

  // Try to find JSON object
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in extraction response");
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!parsed.documentType || !parsed.data) {
      throw new Error("Missing required fields: documentType, data");
    }

    return {
      documentType: parsed.documentType as DocumentType,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      data: parsed.data,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in extraction response: ${error.message}`);
    }
    throw error;
  }
}
