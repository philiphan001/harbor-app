// PDF extraction pipeline
// Extracts text from PDFs and sends to Claude for structuring

import Anthropic from "@anthropic-ai/sdk";
import { PDFParse } from "pdf-parse";
import { getAnthropicApiKey } from "@/lib/utils/env";
import { AI_CONFIG } from "@/lib/config/prompts";
import { createLogger } from "@/lib/utils/logger";
import { type DocumentType, type ExtractionResult } from "./types";
import {
  DOCUMENT_EXTRACTION_SYSTEM,
  getExtractionPrompt,
} from "./prompts";

const log = createLogger("PdfExtractor");

const anthropic = new Anthropic({
  apiKey: getAnthropicApiKey(),
});

/** Maximum text length to send to Claude (avoid token limits) */
const MAX_TEXT_LENGTH = 30_000;

/**
 * Extract structured data from a PDF document.
 *
 * Strategy:
 * 1. Parse PDF to extract text
 * 2. If text is found, send to Claude for structuring
 * 3. If no text (scanned PDF), fall back to page-as-image extraction
 *
 * @param pdfBuffer - Raw PDF file as a Buffer
 * @param documentType - Optional hint for document type
 * @returns Extraction result with structured data
 */
export async function extractFromPdf(
  pdfBuffer: Buffer,
  documentType?: DocumentType
): Promise<ExtractionResult> {
  log.info("Starting PDF extraction", {
    sizeBytes: pdfBuffer.length,
    documentType: documentType ?? "auto",
  });

  try {
    // Step 1: Parse PDF text
    const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
    const textResult = await parser.getText();
    const extractedText = textResult.text?.trim() || "";
    const pageCount = textResult.pages?.length || 0;

    log.info("PDF parsed", {
      pages: pageCount,
      textLength: extractedText.length,
    });

    // Step 2: If we got text, use Claude to structure it
    if (extractedText.length > 50) {
      return await structureTextWithClaude(extractedText, documentType, pageCount);
    }

    // Step 3: Scanned PDF (no text) — this is a limitation for now.
    // Full solution would convert pages to images and use Claude Vision.
    // For MVP, return a helpful error.
    log.warn("Scanned PDF detected (no extractable text)", { pages: pageCount });

    return {
      documentType: documentType || "other",
      confidence: 0,
      data: {
        type: "other",
        title: "Scanned PDF",
        summary:
          "This PDF appears to be a scanned document without selectable text. " +
          "Please take a photo of the pages instead for better extraction.",
        keyFacts: [],
        actionItems: [
          "Take a photo of each page and upload as images",
          "Or use a scanning app to create a text-searchable PDF",
        ],
      },
    };
  } catch (error) {
    log.errorWithStack("PDF extraction failed", error);
    throw error;
  }
}

/**
 * Send extracted PDF text to Claude for structuring into our domain types.
 */
async function structureTextWithClaude(
  text: string,
  documentType: DocumentType | undefined,
  pageCount: number
): Promise<ExtractionResult> {
  // Truncate if too long
  const truncated = text.length > MAX_TEXT_LENGTH;
  const textToSend = truncated ? text.slice(0, MAX_TEXT_LENGTH) : text;

  if (truncated) {
    log.warn("PDF text truncated for extraction", {
      originalLength: text.length,
      truncatedTo: MAX_TEXT_LENGTH,
    });
  }

  const prompt = getExtractionPrompt(documentType);

  const userMessage = `Here is the extracted text from a ${pageCount}-page PDF document. Extract structured data from it.

--- DOCUMENT TEXT ---
${textToSend}
--- END DOCUMENT TEXT ---

${prompt}`;

  try {
    const response = await anthropic.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens.extraction,
      temperature: AI_CONFIG.temperature.extraction,
      system: DOCUMENT_EXTRACTION_SYSTEM,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const rawResponse = textBlock.text;

    // Parse JSON
    let jsonText = rawResponse.trim();
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }

    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in extraction response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const result: ExtractionResult = {
      documentType: parsed.documentType as DocumentType,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      data: parsed.data,
      rawResponse,
    };

    log.info("PDF text extraction complete", {
      documentType: result.documentType,
      confidence: result.confidence,
      pages: pageCount,
    });

    return result;
  } catch (error) {
    log.errorWithStack("PDF text structuring failed", error);
    throw error;
  }
}
