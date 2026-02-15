import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/ai/claude";
import { Message } from "@/lib/types/situation";
import { applyRateLimit, AI_CHAT_LIMIT } from "@/lib/utils/rateLimit";
import { createLogger } from "@/lib/utils/logger";
import { requireAuth } from "@/lib/supabase/auth";

const log = createLogger("api/chat");

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "chat", AI_CHAT_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { messages, mode } = body as {
      messages: Message[];
      mode: "crisis" | "readiness";
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    if (!mode || !["crisis", "readiness"].includes(mode)) {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'crisis' or 'readiness'" },
        { status: 400 }
      );
    }

    const response = await chat(messages, mode);

    return NextResponse.json(response);
  } catch (error) {
    log.errorWithStack("Chat API error", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
