// POST /api/upload — Accept file upload, store to Supabase Storage, run extraction
// Accepts multipart/form-data with: file, documentType?, parentId

import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/utils/logger";
import { applyRateLimit } from "@/lib/utils/rateLimit";
import { requireAuth } from "@/lib/supabase/auth";
import { processFile } from "@/lib/ingestion/pipeline";
import { uploadFile } from "@/lib/supabase/storage";
import { createDocument } from "@/lib/db/documents";
import { getSituationIdForAuthUser } from "@/lib/db/profiles";
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

    log.info("Extraction complete", {
      documentType: result.documentType,
      confidence: result.confidence,
    });

    // --- Persist to DB + Storage (fire-and-forget friendly) ---

    // Find the situationId for this user + parent
    const situationId = await getSituationIdForAuthUser(auth.user.id, parentId);

    let documentId: string | undefined;
    let storagePath: string | undefined;

    if (situationId) {
      // Create a temporary document ID for storage path
      const tempId = crypto.randomUUID();

      // Upload file to Supabase Storage
      const path = await uploadFile(
        situationId,
        tempId,
        buffer,
        file.type,
        file.name
      );
      storagePath = path || undefined;

      // Create Document record in database
      try {
        const doc = await createDocument({
          situationId,
          name: file.name,
          fileType: file.type,
          fileSizeBytes: file.size,
          documentType: result.documentType,
          storagePath: storagePath || `pending/${tempId}`,
          extractedData: result.data as unknown as Record<string, unknown>,
          confidence: result.confidence,
          extractionModel: "claude-sonnet-4-20250514",
          uploadedBy: auth.user.id,
        });

        documentId = doc.id;
        log.info("Document persisted", { documentId, storagePath });
      } catch (dbError) {
        // DB write failed — still return extraction to client
        log.errorWithStack("Failed to persist document to DB", dbError);
      }
    } else {
      log.warn("No situationId found for upload — file not persisted to DB", {
        userId: auth.user.id,
        parentId,
      });
    }

    return NextResponse.json({
      uploadId: documentId || `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: "extracted",
      fileName: file.name,
      fileType: file.type,
      fileSizeBytes: file.size,
      parentId,
      storagePath,
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
