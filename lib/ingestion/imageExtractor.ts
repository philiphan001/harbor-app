// Image extraction using Claude Vision API
// Sends images directly to Claude for structured data extraction

import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicApiKey } from "@/lib/utils/env";
import { AI_CONFIG } from "@/lib/config/prompts";
import { createLogger } from "@/lib/utils/logger";
import {
  type DocumentType,
  type ExtractionResult,
  type ClaudeMediaType,
  type ParentContext,
} from "./types";
import {
  buildSystemPrompt,
  getExtractionPrompt,
} from "./prompts";
import { parseExtractionResponse } from "./parseResponse";

const log = createLogger("ImageExtractor");

const anthropic = new Anthropic({
  apiKey: getAnthropicApiKey(),
});

/**
 * Extract structured data from an image using Claude Vision.
 *
 * @param imageBase64 - Base64-encoded image data (no data URI prefix)
 * @param mediaType - MIME type of the image
 * @param documentType - Optional hint for what type of document this is
 * @returns Extraction result with structured data and confidence score
 */
export async function extractFromImage(
  imageBase64: string,
  mediaType: ClaudeMediaType,
  documentType?: DocumentType,
  parentContext?: ParentContext
): Promise<ExtractionResult> {
  log.info("Starting image extraction", { mediaType, documentType: documentType ?? "auto" });

  const prompt = getExtractionPrompt(documentType);
  const systemPrompt = buildSystemPrompt(parentContext);

  try {
    const response = await anthropic.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens.extraction,
      temperature: AI_CONFIG.temperature.extraction,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: imageBase64,
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
      throw new Error("No text response from Claude Vision");
    }

    const rawResponse = textBlock.text;
    log.debug("Claude Vision response received", { length: rawResponse.length });

    // Parse JSON response
    const result = parseExtractionResponse(rawResponse);

    log.info("Image extraction complete", {
      documentType: result.documentType,
      confidence: result.confidence,
    });

    return {
      ...result,
      rawResponse,
    };
  } catch (error) {
    log.errorWithStack("Image extraction failed", error);
    throw error;
  }
}

/**
 * Extract from multiple images (e.g., front + back of insurance card).
 * Sends all images in a single request for context.
 */
export async function extractFromMultipleImages(
  images: Array<{ base64: string; mediaType: ClaudeMediaType }>,
  documentType?: DocumentType
): Promise<ExtractionResult> {
  log.info("Starting multi-image extraction", {
    imageCount: images.length,
    documentType: documentType ?? "auto",
  });

  const prompt = getExtractionPrompt(documentType);

  const content: Anthropic.Messages.ContentBlockParam[] = [
    ...images.map(
      (img): Anthropic.Messages.ImageBlockParam => ({
        type: "image",
        source: {
          type: "base64",
          media_type: img.mediaType,
          data: img.base64,
        },
      })
    ),
    {
      type: "text",
      text:
        images.length > 1
          ? `These are ${images.length} images of the same document (e.g., front and back of a card). Extract all information from all images and combine into a single result.\n\n${prompt}`
          : prompt,
    },
  ];

  try {
    const response = await anthropic.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens.extraction,
      temperature: AI_CONFIG.temperature.extraction,
      system: buildSystemPrompt(),
      messages: [{ role: "user", content }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude Vision");
    }

    const result = parseExtractionResponse(textBlock.text);

    log.info("Multi-image extraction complete", {
      documentType: result.documentType,
      confidence: result.confidence,
    });

    return { ...result, rawResponse: textBlock.text };
  } catch (error) {
    log.errorWithStack("Multi-image extraction failed", error);
    throw error;
  }
}

// parseExtractionResponse is in ./parseResponse.ts (shared with pdfExtractor)
