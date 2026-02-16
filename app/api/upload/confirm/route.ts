// POST /api/upload/confirm — Confirm extracted data and persist to DB
// This is the human-in-the-loop step: user reviews and optionally edits before saving

import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/utils/logger";
import { applyRateLimit, AI_EXTRACTION_LIMIT } from "@/lib/utils/rateLimit";
import { requireAuth } from "@/lib/supabase/auth";
import { confirmDocument, getDocument } from "@/lib/db/documents";
import { type ExtractedData, type DocumentType } from "@/lib/ingestion/types";

const log = createLogger("api/upload-confirm");

interface ConfirmBody {
  uploadId: string;
  parentId: string;
  documentType: DocumentType;
  confirmedData: ExtractedData;
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "upload-confirm", AI_EXTRACTION_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as ConfirmBody;
    const { uploadId, parentId, documentType, confirmedData } = body;

    if (!uploadId || !parentId || !confirmedData) {
      return NextResponse.json(
        { error: "uploadId, parentId, and confirmedData are required" },
        { status: 400 }
      );
    }

    log.info("Confirming extraction", {
      uploadId,
      parentId,
      documentType,
      dataType: confirmedData.type,
    });

    // Try to update the Document record in DB
    let dbConfirmed = false;

    // Check if uploadId is a real document ID (UUID format)
    const isDbId = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(uploadId);

    if (isDbId) {
      try {
        const doc = await getDocument(uploadId);
        if (doc) {
          await confirmDocument(
            uploadId,
            confirmedData as unknown as Record<string, unknown>
          );
          dbConfirmed = true;
          log.info("Document confirmed in DB", { uploadId });
        }
      } catch (dbError) {
        log.errorWithStack("Failed to confirm document in DB", dbError);
        // Continue — client can still save to localStorage
      }
    }

    return NextResponse.json({
      success: true,
      uploadId,
      parentId,
      documentType,
      dbConfirmed,
      message: dbConfirmed
        ? "Data confirmed and saved to database"
        : "Data confirmed (save to local storage)",
      confirmedAt: new Date().toISOString(),
    });
  } catch (error) {
    log.errorWithStack("Confirmation failed", error);
    return NextResponse.json(
      {
        error: "Failed to confirm extraction",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
