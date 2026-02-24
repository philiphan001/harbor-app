// POST /api/chat/stream — Streaming chat endpoint using SSE
// Returns text tokens as they arrive from Claude

import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Message } from "@/lib/types/situation";
import { applyRateLimit, AI_CHAT_LIMIT } from "@/lib/utils/rateLimit";
import { createLogger } from "@/lib/utils/logger";
import { requireAuth } from "@/lib/supabase/auth";
import { getAnthropicApiKey } from "@/lib/utils/env";
import { AI_CONFIG, CRISIS_INTAKE_PROMPT, READINESS_PROMPT } from "@/lib/config/prompts";

const log = createLogger("api/chat-stream");

export const maxDuration = 60; // Allow up to 60s for streaming responses

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "chat-stream", AI_CHAT_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { messages, mode, dataSummary } = body as {
      messages: Message[];
      mode: "crisis" | "readiness";
      dataSummary?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!mode || !["crisis", "readiness"].includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let systemPrompt = mode === "crisis" ? CRISIS_INTAKE_PROMPT : READINESS_PROMPT;

    // For crisis mode, append data summary so the AI knows what info Harbor has
    if (mode === "crisis" && dataSummary) {
      systemPrompt = systemPrompt + "\n\n" + dataSummary;
    }

    const anthropicMessages = messages.map((msg) => ({
      role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
      content: msg.content,
    }));

    const anthropic = new Anthropic({
      apiKey: getAnthropicApiKey(),
    });

    log.info("Starting streaming response", { mode, messageCount: messages.length });

    // Create a streaming response using SSE
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = anthropic.messages.stream({
            model: AI_CONFIG.model,
            max_tokens: AI_CONFIG.maxTokens.chat,
            system: systemPrompt,
            messages: anthropicMessages,
            temperature: AI_CONFIG.temperature.conversation,
          });

          response.on("text", (text) => {
            // Send each text delta as an SSE event
            const data = JSON.stringify({ type: "delta", text });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          });

          // Wait for the stream to complete
          const finalMessage = await response.finalMessage();

          // Send the final message with usage info
          const doneData = JSON.stringify({
            type: "done",
            model: finalMessage.model,
            usage: finalMessage.usage,
          });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));

          controller.close();

          log.info("Stream complete", {
            inputTokens: finalMessage.usage.input_tokens,
            outputTokens: finalMessage.usage.output_tokens,
          });
        } catch (error) {
          log.errorWithStack("Stream error", error);
          const errorData = JSON.stringify({
            type: "error",
            message: error instanceof Error ? error.message : "Stream failed",
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    log.errorWithStack("Chat stream setup error", error);
    return new Response(
      JSON.stringify({ error: "Failed to start chat stream" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
