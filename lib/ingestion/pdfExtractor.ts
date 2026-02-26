// PDF extraction pipeline
// Sends PDFs directly to Claude using native PDF support (document content blocks).
// This works on all platforms including Vercel serverless — no native dependencies needed.

import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicApiKey } from "@/lib/utils/env";
import { AI_CONFIG } from "@/lib/config/prompts";
import { createLogger } from "@/lib/utils/logger";
import { type DocumentType, type ExtractionResult, type ParentContext } from "./types";
import {
  buildSystemPrompt,
  getExtractionPrompt,
} from "./prompts";

const log = createLogger("PdfExtractor");

const anthropic = new Anthropic({
  apiKey: getAnthropicApiKey(),
});

/**
 * Extract structured data from a PDF document.
 *
 * Sends the PDF directly to Claude as a document content block.
 * Claude handles both text-based and scanned PDFs natively — no
 * need for pdf-parse or pdf-to-img (which require @napi-rs/canvas
 * and fail on Vercel serverless).
 */
export async function extractFromPdf(
  pdfBuffer: Buffer,
  documentType?: DocumentType,
  parentContext?: ParentContext
): Promise<ExtractionResult> {
  log.info("Starting PDF extraction via Claude document support", {
    sizeBytes: pdfBuffer.length,
    documentType: documentType ?? "auto",
  });

  const base64Pdf = pdfBuffer.toString("base64");
  const prompt = getExtractionPrompt(documentType);

  try {
    const response = await anthropic.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens.extraction,
      temperature: AI_CONFIG.temperature.extraction,
      system: buildSystemPrompt(parentContext),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Pdf,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const rawResponse = textBlock.text;

    // Parse JSON from response
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
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      rawResponse,
    };

    log.info("PDF extraction complete", {
      documentType: result.documentType,
      confidence: result.confidence,
    });

    return result;
  } catch (error) {
    log.errorWithStack("PDF extraction failed", error);
    throw error;
  }
}
