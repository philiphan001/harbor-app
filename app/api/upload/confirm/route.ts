// POST /api/upload/confirm — Confirm extracted data and save to situation context
// This is the human-in-the-loop step: user reviews and optionally edits before saving

import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/utils/logger";
import { applyRateLimit, AI_EXTRACTION_LIMIT } from "@/lib/utils/rateLimit";
import { requireAuth } from "@/lib/supabase/auth";
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

    // In production, this would:
    // 1. Update Document record: status = 'confirmed', confirmedData, confirmedAt
    // 2. Map confirmed data into the appropriate Situation domain tables:
    //    - insurance_card → FinancialProfile.insurancePolicies
    //    - medication → Medication table
    //    - doctor_card → Provider table
    //    - legal_document → LegalDocument table
    //    - discharge_summary → MedicalCondition + Medication + Provider
    //    - bill_statement → FinancialProfile data
    //    - lab_results → stored as document reference
    //
    // For now, we return success and let the client store in localStorage

    return NextResponse.json({
      success: true,
      uploadId,
      parentId,
      documentType,
      message: "Data confirmed and saved",
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
