import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { DOMAIN_QUESTIONS } from "@/lib/types/readiness";
import { getAnthropicApiKey } from "@/lib/utils/env";
import { AI_CONFIG, ANSWER_EXTRACTION_PROMPT } from "@/lib/config/prompts";
import { applyRateLimit, AI_EXTRACTION_LIMIT } from "@/lib/utils/rateLimit";
import { createLogger } from "@/lib/utils/logger";
import { requireAuth } from "@/lib/supabase/auth";

const log = createLogger("api/extract-answers");

const anthropic = new Anthropic({
  apiKey: getAnthropicApiKey(),
});

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "extract-answers", AI_EXTRACTION_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { conversationHistory } = body as {
      conversationHistory: Array<{ role: string; content: string }>;
    };

    log.info("Extracting structured answers", { messageCount: conversationHistory.length });

    // Build the question catalog for Claude
    const questionCatalog = DOMAIN_QUESTIONS.map((domain) => {
      return `\n## ${domain.title}\n\n` + domain.questions.map((q) => {
        return `Question ID: ${q.id}
Question: ${q.text}
Options: ${q.options.join(" | ")}
Allows uncertainty: ${q.allowUncertainty ? "Yes" : "No"}`;
      }).join("\n\n");
    }).join("\n");

    const conversationText = conversationHistory
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n\n");

    const prompt = `Here are the assessment questions:

${questionCatalog}

---

Here is the conversation:

${conversationText}

---

Extract any answers the user has provided to the questions above. Return only the JSON array.`;

    // Call Claude to extract answers
    const response = await anthropic.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens.extraction,
      system: ANSWER_EXTRACTION_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: AI_CONFIG.temperature.extraction,
    });

    const responseText = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("");

    log.debug("Claude response received", { preview: responseText.substring(0, 200) });

    // Parse the JSON response
    let answers: Array<{ questionId: string; selectedOption: string | null; isUncertain: boolean; confidence: string }> = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        answers = JSON.parse(jsonMatch[0]);
      } else {
        answers = JSON.parse(responseText);
      }
    } catch (parseError) {
      log.error("Failed to parse JSON response", { error: String(parseError) });
      return NextResponse.json({ answers: [], count: 0, error: "Failed to parse answers" });
    }

    // Filter to only high/medium confidence answers
    const confidentAnswers = answers.filter(
      (a) => a.confidence === "high" || a.confidence === "medium"
    );

    log.info("Answers extracted", {
      confidentCount: confidentAnswers.length,
      totalCount: answers.length
    });

    return NextResponse.json({
      answers: confidentAnswers,
      count: confidentAnswers.length,
    });
  } catch (error) {
    log.errorWithStack("Failed to extract answers", error);
    return NextResponse.json(
      { error: "Failed to extract answers", answers: [], count: 0 },
      { status: 500 }
    );
  }
}
