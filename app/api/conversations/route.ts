import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit, STANDARD_LIMIT } from "@/lib/utils/rateLimit";
import { createLogger } from "@/lib/utils/logger";
import { requireAuth } from "@/lib/supabase/auth";
import {
  createConversation,
  getConversationsForUser,
  getConversationsForSituation,
} from "@/lib/db/conversations";

const log = createLogger("api/conversations");

/**
 * GET /api/conversations
 * List conversations for the authenticated user.
 * Optional query param: ?situationId=xxx to filter by situation.
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "conversations", STANDARD_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const situationId = searchParams.get("situationId");

    const conversations = situationId
      ? await getConversationsForSituation(situationId)
      : await getConversationsForUser(auth.user.id);

    return NextResponse.json({ conversations });
  } catch (error) {
    log.errorWithStack("Failed to list conversations", error);
    return NextResponse.json(
      { error: "Failed to list conversations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversations
 * Create a new conversation.
 * Body: { conversationType, situationId? }
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "conversations", STANDARD_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { conversationType, situationId } = body as {
      conversationType: string;
      situationId?: string;
    };

    if (!conversationType) {
      return NextResponse.json(
        { error: "conversationType is required" },
        { status: 400 }
      );
    }

    const validTypes = ["intake", "general", "scenario_exploration", "family", "crisis", "readiness"];
    if (!validTypes.includes(conversationType)) {
      return NextResponse.json(
        { error: `Invalid conversationType. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const conversation = await createConversation(
      auth.user.id,
      conversationType,
      situationId
    );

    log.info("Conversation created", { conversationId: conversation.id, conversationType });
    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    log.errorWithStack("Failed to create conversation", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
