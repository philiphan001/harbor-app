// POST /api/upload — Accept file upload, run extraction pipeline
// Accepts multipart/form-data with: file, documentType?, parentId

import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/utils/logger";
import { applyRateLimit } from "@/lib/utils/rateLimit";
import { requireAuth } from "@/lib/supabase/auth";
import { processFile } from "@/lib/ingestion/pipeline";
import {
  type DocumentType,
  MAX_FILE_SIZE_BYTES,
  isSupportedFileType,
} from "@/lib/ingestion/types";

const log = createLogger("api/upload");

/** Upload rate limit: 10 per minute (extraction is expensive) */
const UPLOAD_LIMIT = { maxRequests: 10, windowMs: 60_000 };

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "upload", UPLOAD_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("documentType") as DocumentType | null;
    const parentId = formData.get("parentId") as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!parentId) {
      return NextResponse.json(
        { error: "parentId is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isSupportedFileType(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${file.type}`,
          supported: "JPEG, PNG, WebP, HEIC, PDF",
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const maxMB = MAX_FILE_SIZE_BYTES / (1024 * 1024);
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxMB}MB` },
        { status: 400 }
      );
    }

    log.info("File upload received", {
      name: file.name,
      type: file.type,
      sizeBytes: file.size,
      documentType: documentType ?? "auto",
      parentId,
    });

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Run extraction pipeline
    const result = await processFile(
      buffer,
      file.type,
      documentType || undefined
    );

    // Generate an upload ID for tracking
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    log.info("Extraction complete", {
      uploadId,
      documentType: result.documentType,
      confidence: result.confidence,
    });

    // Note: In production, we would:
    // 1. Store original file to Supabase Storage
    // 2. Create a Document record in the database
    // 3. Return uploadId for status tracking
    // For now, we return the extraction result directly (localStorage flow)

    return NextResponse.json({
      uploadId,
      status: "extracted",
      fileName: file.name,
      fileType: file.type,
      fileSizeBytes: file.size,
      parentId,
      extraction: {
        documentType: result.documentType,
        confidence: result.confidence,
        data: result.data,
      },
    });
  } catch (error) {
    log.errorWithStack("Upload processing failed", error);

    return NextResponse.json(
      {
        error: "Failed to process upload",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Configure Next.js to handle large file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};
