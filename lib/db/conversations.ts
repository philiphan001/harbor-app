// Database operations for Conversations and Messages

import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma";
import { createLogger } from "@/lib/utils/logger";

const log = createLogger("db/conversations");

// --- Types ---

export interface ConversationRecord {
  id: string;
  situationId: string | null;
  userId: string;
  conversationType: string;
  createdAt: string;
  messages: MessageRecord[];
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  metadata: unknown;
  createdAt: string;
}

// --- Create ---

/**
 * Create a new conversation.
 */
export async function createConversation(
  userId: string,
  conversationType: string,
  situationId?: string
): Promise<ConversationRecord> {
  log.info("Creating conversation", { userId, conversationType, situationId });

  const conversation = await prisma.conversation.create({
    data: {
      userId,
      conversationType,
      situationId: situationId ?? null,
    },
    include: { messages: true },
  });

  return toConversationRecord(conversation);
}

// --- Read ---

/**
 * Get a conversation by ID with all messages.
 */
export async function getConversation(
  conversationId: string
): Promise<ConversationRecord | null> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) return null;
  return toConversationRecord(conversation);
}

/**
 * Get all conversations for a user, ordered by most recent.
 * Includes the last message for preview.
 */
export async function getConversationsForUser(
  userId: string
): Promise<ConversationRecord[]> {
  const conversations = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1, // Only last message for preview
      },
    },
  });

  return conversations.map(toConversationRecord);
}

/**
 * Get conversations for a specific situation.
 */
export async function getConversationsForSituation(
  situationId: string
): Promise<ConversationRecord[]> {
  const conversations = await prisma.conversation.findMany({
    where: { situationId },
    orderBy: { createdAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return conversations.map(toConversationRecord);
}

// --- Messages ---

/**
 * Add a message to a conversation.
 */
export async function addMessage(
  conversationId: string,
  role: string,
  content: string,
  metadata?: Record<string, unknown>
): Promise<MessageRecord> {
  log.debug("Adding message", { conversationId, role, contentLength: content.length });

  const message = await prisma.message.create({
    data: {
      conversationId,
      role,
      content,
      metadata: (metadata as Prisma.InputJsonValue) ?? undefined,
    },
  });

  return toMessageRecord(message);
}

/**
 * Add multiple messages to a conversation (batch).
 */
export async function addMessages(
  conversationId: string,
  messages: Array<{ role: string; content: string; metadata?: Record<string, unknown> }>
): Promise<MessageRecord[]> {
  log.info("Adding messages batch", { conversationId, count: messages.length });

  const created = await prisma.$transaction(
    messages.map((msg) =>
      prisma.message.create({
        data: {
          conversationId,
          role: msg.role,
          content: msg.content,
          metadata: (msg.metadata as Prisma.InputJsonValue) ?? undefined,
        },
      })
    )
  );

  return created.map(toMessageRecord);
}

/**
 * Get all messages for a conversation.
 */
export async function getMessages(
  conversationId: string
): Promise<MessageRecord[]> {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });

  return messages.map(toMessageRecord);
}

// --- Delete ---

/**
 * Delete a conversation and all its messages.
 */
export async function deleteConversation(
  conversationId: string
): Promise<boolean> {
  try {
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { conversationId } }),
      prisma.conversation.delete({ where: { id: conversationId } }),
    ]);
    log.info("Conversation deleted", { conversationId });
    return true;
  } catch {
    log.warn("Conversation not found for deletion", { conversationId });
    return false;
  }
}

// --- Internal helpers ---

function toConversationRecord(
  conversation: {
    id: string;
    situationId: string | null;
    userId: string;
    conversationType: string;
    createdAt: Date;
    messages: Array<{
      id: string;
      conversationId: string;
      role: string;
      content: string;
      metadata: unknown;
      createdAt: Date;
    }>;
  }
): ConversationRecord {
  return {
    id: conversation.id,
    situationId: conversation.situationId,
    userId: conversation.userId,
    conversationType: conversation.conversationType,
    createdAt: conversation.createdAt.toISOString(),
    messages: conversation.messages.map(toMessageRecord),
  };
}

function toMessageRecord(
  message: {
    id: string;
    conversationId: string;
    role: string;
    content: string;
    metadata: unknown;
    createdAt: Date;
  }
): MessageRecord {
  return {
    id: message.id,
    conversationId: message.conversationId,
    role: message.role,
    content: message.content,
    metadata: message.metadata,
    createdAt: message.createdAt.toISOString(),
  };
}
