// Document ingestion pipeline orchestrator
// Routes files to the appropriate extractor based on type

import { createLogger } from "@/lib/utils/logger";
import {
  type DocumentType,
  type ExtractionResult,
  type ClaudeMediaType,
  type ParentContext,
  MAX_FILE_SIZE_BYTES,
  isSupportedFileType,
  isImageType,
  isPdfType,
} from "./types";
import { extractFromImage, extractFromMultipleImages } from "./imageExtractor";
import { extractFromPdf } from "./pdfExtractor";

const log = createLogger("IngestionPipeline");

/** Check if file type is HEIC/HEIF (needs conversion for Claude Vision) */
function isHeicType(fileType: string): boolean {
  return fileType === "image/heic" || fileType === "image/heif";
}

/**
 * Convert HEIC/HEIF buffer to JPEG.
 * Uses heic-convert (pure JS, works everywhere) as primary,
 * falls back to sharp if available.
 */
async function convertHeicToJpeg(
  buffer: Buffer
): Promise<{ buffer: Buffer; fileType: string }> {
  // Approach 1: heic-convert (pure JavaScript — no native dependencies)
  try {
    const convert = (await import("heic-convert")).default;
    const outputBuffer = await convert({
      buffer: buffer as unknown as ArrayBufferLike,
      format: "JPEG",
      quality: 0.92,
    });
    const jpegBuffer = Buffer.from(outputBuffer);
    log.info("HEIC converted to JPEG via heic-convert", {
      originalSize: buffer.length,
      convertedSize: jpegBuffer.length,
    });
    return { buffer: jpegBuffer, fileType: "image/jpeg" };
  } catch (heicError) {
    log.warn("heic-convert failed, trying sharp fallback", {
      error: heicError instanceof Error ? heicError.message : String(heicError),
    });
  }

  // Approach 2: sharp (native — may not have HEIC support on all platforms)
  try {
    const sharp = (await import("sharp")).default;
    const jpegBuffer = await sharp(buffer).jpeg({ quality: 92 }).toBuffer();
    log.info("HEIC converted to JPEG via sharp", {
      originalSize: buffer.length,
      convertedSize: jpegBuffer.length,
    });
    return { buffer: jpegBuffer, fileType: "image/jpeg" };
  } catch (sharpError) {
    log.errorWithStack("Both HEIC converters failed", sharpError);
    throw new Error(
      "Unable to process HEIC image. Please take a screenshot or use your camera app to save as JPEG."
    );
  }
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a file before processing.
 * Checks file type and size constraints.
 */
export function validateFile(
  fileType: string,
  fileSizeBytes: number
): ValidationResult {
  if (!isSupportedFileType(fileType)) {
    return {
      valid: false,
      error: `Unsupported file type: ${fileType}. Supported: JPEG, PNG, WebP, HEIC, PDF`,
    };
  }

  if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    const maxMB = MAX_FILE_SIZE_BYTES / (1024 * 1024);
    const fileMB = (fileSizeBytes / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File too large: ${fileMB}MB (max ${maxMB}MB)`,
    };
  }

  if (fileSizeBytes === 0) {
    return { valid: false, error: "File is empty" };
  }

  return { valid: true };
}

/**
 * Process a single file through the extraction pipeline.
 *
 * @param fileBuffer - Raw file data
 * @param fileType - MIME type of the file
 * @param documentType - Optional hint for what type of document this is
 * @param parentContext - Optional parent info for diligence checks (name matching, relevance)
 * @returns Extraction result with structured data
 */
export async function processFile(
  fileBuffer: Buffer,
  fileType: string,
  documentType?: DocumentType,
  parentContext?: ParentContext
): Promise<ExtractionResult> {
  log.info("Processing file", {
    fileType,
    sizeBytes: fileBuffer.length,
    documentType: documentType ?? "auto",
  });

  // Validate
  const validation = validateFile(fileType, fileBuffer.length);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Route to appropriate extractor
  if (isImageType(fileType)) {
    // Convert HEIC/HEIF to JPEG before sending to Claude Vision
    let processBuffer = fileBuffer;
    let processFileType = fileType;
    if (isHeicType(fileType)) {
      log.info("Converting HEIC to JPEG server-side");
      const converted = await convertHeicToJpeg(fileBuffer);
      processBuffer = converted.buffer;
      processFileType = converted.fileType;
    }

    const mediaType = normalizeMediaType(processFileType);
    const base64 = processBuffer.toString("base64");
    return extractFromImage(base64, mediaType, documentType, parentContext);
  }

  if (isPdfType(fileType)) {
    return extractFromPdf(fileBuffer, documentType, parentContext);
  }

  // Should never reach here due to validation, but just in case
  throw new Error(`No extractor available for file type: ${fileType}`);
}

/**
 * Process multiple files together (e.g., front + back of insurance card).
 * All images are sent in a single Claude request for context.
 */
export async function processMultipleFiles(
  files: Array<{ buffer: Buffer; fileType: string }>,
  documentType?: DocumentType
): Promise<ExtractionResult> {
  log.info("Processing multiple files", {
    count: files.length,
    documentType: documentType ?? "auto",
  });

  // Validate all files
  for (const file of files) {
    const validation = validateFile(file.fileType, file.buffer.length);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
  }

  // For now, only support multiple images (not mixed PDF + image)
  const allImages = files.every((f) => isImageType(f.fileType));
  if (!allImages) {
    throw new Error(
      "Multi-file upload currently only supports images. Please upload PDFs individually."
    );
  }

  const images = files.map((f) => ({
    base64: f.buffer.toString("base64"),
    mediaType: normalizeMediaType(f.fileType),
  }));

  return extractFromMultipleImages(images, documentType);
}

/**
 * Normalize MIME types to what Claude Vision supports.
 * HEIC/HEIF get mapped to JPEG (the API handler should convert them first).
 */
function normalizeMediaType(fileType: string): ClaudeMediaType {
  switch (fileType) {
    case "image/jpeg":
      return "image/jpeg";
    case "image/png":
      return "image/png";
    case "image/webp":
      return "image/webp";
    case "image/heic":
    case "image/heif":
      // HEIC/HEIF should have been converted to JPEG by convertHeicToJpeg()
      // If we still get here, something went wrong — log and try JPEG
      log.warn("HEIC/HEIF reached normalizeMediaType without conversion");
      return "image/jpeg";
    default:
      return "image/jpeg";
  }
}
