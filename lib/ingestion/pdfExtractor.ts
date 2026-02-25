// PDF extraction pipeline
// Extracts text from PDFs and sends to Claude for structuring.
// For scanned PDFs (no selectable text), renders pages to images
// and sends to Claude Vision for OCR + extraction.
//
// NOTE: pdf-parse and pdf-to-img depend on @napi-rs/canvas which
// does NOT work on Vercel serverless. All native-dep paths are wrapped
// in try/catch so extraction degrades gracefully.

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
 * 1. Parse PDF to extract text (may fail on serverless — native dep)
 * 2. If text is found, send to Claude for structuring
 * 3. If no text (scanned PDF), render pages to images and use Claude Vision
 * 4. If rendering fails (serverless), return guidance to upload as photos
 */
export async function extractFromPdf(
  pdfBuffer: Buffer,
  documentType?: DocumentType
): Promise<ExtractionResult> {
  log.info("Starting PDF extraction", {
    sizeBytes: pdfBuffer.length,
    documentType: documentType ?? "auto",
  });

  // Step 1: Try to parse PDF text (may fail on Vercel due to @napi-rs/canvas)
  let extractedText = "";
  let pageCount = 0;

  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
    const textResult = await parser.getText();
    extractedText = textResult.text?.trim() || "";
    pageCount = textResult.pages?.length || 0;

    log.info("PDF parsed", {
      pages: pageCount,
      textLength: extractedText.length,
    });
  } catch (parseError) {
    log.warn("PDF text parsing failed (likely native dep issue on serverless)", {
      error: parseError instanceof Error ? parseError.message : String(parseError),
    });
  }

  // Step 2: If we got any meaningful text, send it to Claude
  if (extractedText.length > 10) {
    return await structureTextWithClaude(extractedText, documentType, pageCount);
  }

  // Step 3: No text — try rendering pages to images for Claude Vision
  log.info("Using vision extraction for PDF", {
    reason: extractedText.length === 0 ? "no text extracted" : "insufficient text",
    textLength: extractedText.length,
    pages: pageCount,
  });

  return await extractScannedPdfViaVision(pdfBuffer, documentType);
}

/**
 * Render scanned PDF pages to images and send to Claude Vision for extraction.
 * Falls back to a helpful message if rendering fails (e.g., on Vercel serverless).
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
  } catch (visionError) {
    // pdf-to-img fails on Vercel serverless (needs @napi-rs/canvas)
    log.warn("PDF-to-image rendering failed (expected on serverless)", {
      error: visionError instanceof Error ? visionError.message : String(visionError),
    });

    return {
      documentType: documentType || "other",
      confidence: 0,
      data: {
        type: "other",
        title: "PDF Upload",
        summary:
          "We couldn't extract text from this PDF automatically. " +
          "This usually happens with scanned documents.",
        keyFacts: [],
        actionItems: [
          "Take a photo of each page and upload as images instead",
          "Or use a scanning app (like Apple Notes or Adobe Scan) to create a text-searchable PDF",
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
