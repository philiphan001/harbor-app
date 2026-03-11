import { NextRequest, NextResponse } from "next/server";
import { generateMedicationReview } from "@/lib/ai/medicationReview";
import { applyRateLimit, AI_CHAT_LIMIT } from "@/lib/utils/rateLimit";
import { createLogger } from "@/lib/utils/logger";
import { requireAuth } from "@/lib/supabase/auth";

const log = createLogger("api/medication-review");

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "medication-review", AI_CHAT_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { medications, parentAge, conditions } = body;

    if (!medications || !Array.isArray(medications) || medications.length < 2) {
      return NextResponse.json(
        { error: "At least 2 medications are required for review" },
        { status: 400 }
      );
    }

    const result = await generateMedicationReview(medications, parentAge, conditions);

    return NextResponse.json(result);
  } catch (error) {
    log.errorWithStack("Medication review API error", error);
    return NextResponse.json(
      { error: "Failed to generate medication review" },
      { status: 500 }
    );
  }
}
