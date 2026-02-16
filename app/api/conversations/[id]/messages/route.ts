import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit, STANDARD_LIMIT } from "@/lib/utils/rateLimit";
import { createLogger } from "@/lib/utils/logger";
import { requireAuth } from "@/lib/supabase/auth";
import {
  getConversation,
  getMessages,
  addMessage,
  addMessages,
} from "@/lib/db/conversations";

const log = createLogger("api/conversations/messages");

/**
 * GET /api/conversations/[id]/messages
 * Get all messages for a conversation.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, "conversation-messages", STANDARD_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { id: conversationId } = await params;

    // Verify the conversation exists and belongs to this user
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (conversation.userId !== auth.user.id) {
      return NextResponse.json(
        { error: "Not authorized to access this conversation" },
        { status: 403 }
      );
    }

    const messages = await getMessages(conversationId);
    return NextResponse.json({ messages });
  } catch (error) {
    log.errorWithStack("Failed to get messages", error);
    return NextResponse.json(
      { error: "Failed to get messages" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversations/[id]/messages
 * Add one or more messages to a conversation.
 * Body: { role, content, metadata? } OR { messages: [{ role, content, metadata? }] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, "conversation-messages", STANDARD_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { id: conversationId } = await params;

    // Verify the conversation exists and belongs to this user
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (conversation.userId !== auth.user.id) {
      return NextResponse.json(
        { error: "Not authorized to access this conversation" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Support both single message and batch
    if (body.messages && Array.isArray(body.messages)) {
      // Batch mode
      const validMessages = body.messages.filter(
        (m: { role?: string; content?: string }) => m.role && m.content
      );

      if (validMessages.length === 0) {
        return NextResponse.json(
          { error: "At least one valid message (with role and content) is required" },
          { status: 400 }
        );
      }

      const created = await addMessages(conversationId, validMessages);
      log.info("Messages batch added", {
        conversationId,
        count: created.length,
      });
      return NextResponse.json({ messages: created }, { status: 201 });
    } else {
      // Single message
      const { role, content, metadata } = body as {
        role: string;
        content: string;
        metadata?: Record<string, unknown>;
      };

      if (!role || !content) {
        return NextResponse.json(
          { error: "role and content are required" },
          { status: 400 }
        );
      }

      const validRoles = ["user", "assistant", "system"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
          { status: 400 }
        );
      }

      const message = await addMessage(conversationId, role, content, metadata);
      log.info("Message added", { conversationId, messageId: message.id, role });
      return NextResponse.json({ message }, { status: 201 });
    }
  } catch (error) {
    log.errorWithStack("Failed to add message", error);
    return NextResponse.json(
      { error: "Failed to add message" },
      { status: 500 }
    );
  }
}
