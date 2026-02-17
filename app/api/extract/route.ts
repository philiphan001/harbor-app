// POST /api/extract — Run AI extraction on a file already in Supabase Storage
// Called after client uploads directly to Storage, passing the storage path.

export const maxDuration = 60; // seconds — Claude extraction takes time
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/utils/logger";
import { applyRateLimit } from "@/lib/utils/rateLimit";
import { requireAuth } from "@/lib/supabase/auth";
import { processFile } from "@/lib/ingestion/pipeline";
import { createDocument } from "@/lib/db/documents";
import { getSituationIdForAuthUser } from "@/lib/db/profiles";
import { createClient } from "@/lib/supabase/server";
import { type DocumentType } from "@/lib/ingestion/types";

const log = createLogger("api/extract");

/** Extraction rate limit: 10 per minute */
const EXTRACT_LIMIT = { maxRequests: 10, windowMs: 60_000 };

const BUCKET = "documents";

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "extract", EXTRACT_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const {
      storagePath,
      fileName,
      fileType,
      fileSizeBytes,
      documentType,
      parentId,
    } = body as {
      storagePath: string;
      fileName: string;
      fileType: string;
      fileSizeBytes: number;
      documentType?: DocumentType;
      parentId: string;
    };

    // Validate required fields
    if (!storagePath || !fileName || !fileType || !parentId) {
      return NextResponse.json(
        { error: "storagePath, fileName, fileType, and parentId are required" },
        { status: 400 }
      );
    }

    log.info("Extraction requested", {
      storagePath,
      fileName,
      fileType,
      fileSizeBytes,
      documentType: documentType ?? "auto",
      parentId,
    });

    // Download file from Supabase Storage
    const supabase = await createClient();
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(BUCKET)
      .download(storagePath);

    if (downloadError || !fileData) {
      log.errorWithStack("Failed to download file from storage", downloadError);
      return NextResponse.json(
        { error: "Failed to retrieve file from storage" },
        { status: 500 }
      );
    }

    // Convert Blob to Buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Run extraction pipeline
    const result = await processFile(buffer, fileType, documentType || undefined);

    log.info("Extraction complete", {
      documentType: result.documentType,
      confidence: result.confidence,
    });

    // Persist document record to DB
    const situationId = await getSituationIdForAuthUser(auth.user.id, parentId);

    let documentId: string | undefined;

    if (situationId) {
      try {
        const doc = await createDocument({
          situationId,
          name: fileName,
          fileType,
          fileSizeBytes: fileSizeBytes || buffer.length,
          documentType: result.documentType,
          storagePath,
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
      log.warn("No situationId found — document not persisted", {
        userId: auth.user.id,
        parentId,
      });
    }

    return NextResponse.json({
      uploadId: documentId || `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: "extracted",
      fileName,
      fileType,
      fileSizeBytes: fileSizeBytes || buffer.length,
      parentId,
      storagePath,
      extraction: {
        documentType: result.documentType,
        confidence: result.confidence,
        data: result.data,
      },
    });
  } catch (error) {
    log.errorWithStack("Extraction failed", error);

    return NextResponse.json(
      {
        error: "Failed to process document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
