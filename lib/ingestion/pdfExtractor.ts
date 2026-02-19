// PDF extraction pipeline
// Extracts text from PDFs and sends to Claude for structuring.
// For scanned PDFs (no selectable text), renders pages to images
// and sends to Claude Vision for OCR + extraction.

import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicApiKey } from "@/lib/utils/env";
import { AI_CONFIG } from "@/lib/config/prompts";
import { createLogger } from "@/lib/utils/logger";
import { type DocumentType, type ExtractionResult } from "./types";
import {
  DOCUMENT_EXTRACTION_SYSTEM,
  getExtractionPrompt,
} from "./prompts";
import { extractFromMultipleImages } from "./imageExtractor";

const log = createLogger("PdfExtractor");

const anthropic = new Anthropic({
  apiKey: getAnthropicApiKey(),
});

/** Maximum text length to send to Claude (avoid token limits) */
const MAX_TEXT_LENGTH = 30_000;

/** Maximum pages to render for scanned PDF OCR */
const MAX_OCR_PAGES = 5;

/**
 * Extract structured data from a PDF document.
 *
 * Strategy:
 * 1. Parse PDF to extract text
 * 2. If text is found, send to Claude for structuring
 * 3. If no text (scanned PDF), render pages to images and use Claude Vision
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
    // Step 1: Parse PDF text (dynamic import to avoid bundling issues on Vercel)
    const { PDFParse } = await import("pdf-parse");
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

    // Step 3: Scanned PDF — render pages to images and use Claude Vision
    log.info("Scanned PDF detected, rendering pages to images for OCR", { pages: pageCount });

    return await extractScannedPdfViaVision(pdfBuffer, documentType);
  } catch (error) {
    log.errorWithStack("PDF extraction failed", error);
    throw error;
  }
}

/**
 * Render scanned PDF pages to images and send to Claude Vision for extraction.
 */
async function extractScannedPdfViaVision(
  pdfBuffer: Buffer,
  documentType?: DocumentType
): Promise<ExtractionResult> {
  try {
    // Dynamic import to avoid bundling issues
    const { pdf } = await import("pdf-to-img");

    const doc = await pdf(pdfBuffer, { scale: 2 }); // 2x scale for better OCR
    const pagesToRender = Math.min(doc.length, MAX_OCR_PAGES);

    log.info("Rendering PDF pages to images", {
      totalPages: doc.length,
      rendering: pagesToRender,
    });

    const images: Array<{ base64: string; mediaType: "image/png" }> = [];

    let pageNum = 0;
    for await (const pageBuffer of doc) {
      if (pageNum >= pagesToRender) break;

      images.push({
        base64: pageBuffer.toString("base64"),
        mediaType: "image/png",
      });
      pageNum++;
    }

    if (images.length === 0) {
      log.warn("No pages rendered from scanned PDF");
      return {
        documentType: documentType || "other",
        confidence: 0,
        data: {
          type: "other",
          title: "Empty PDF",
          summary: "Could not extract any content from this PDF.",
          keyFacts: [],
          actionItems: ["Try uploading individual pages as photos"],
        },
      };
    }

    log.info("Sending rendered PDF pages to Claude Vision", {
      pageCount: images.length,
    });

    // Use the existing multi-image extraction pipeline
    return await extractFromMultipleImages(images, documentType);
  } catch (importError) {
    // If pdf-to-img fails (e.g., on Vercel), fall back to helpful message
    log.warn("PDF-to-image rendering failed, falling back to user guidance", {
      error: importError instanceof Error ? importError.message : String(importError),
    });

    return {
      documentType: documentType || "other",
      confidence: 0,
      data: {
        type: "other",
        title: "Scanned PDF",
        summary:
          "This PDF appears to be a scanned document. " +
          "For best results, please take a photo of each page and upload as images.",
        keyFacts: [],
        actionItems: [
          "Take a photo of each page and upload as images",
          "Or use a scanning app to create a text-searchable PDF",
        ],
      },
    };
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
