import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { DOMAIN_QUESTIONS } from "@/lib/types/readiness";
import { getAnthropicApiKey } from "@/lib/utils/env";
import { AI_CONFIG, ANSWER_EXTRACTION_PROMPT } from "@/lib/config/prompts";

const anthropic = new Anthropic({
  apiKey: getAnthropicApiKey(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationHistory } = body as {
      conversationHistory: Array<{ role: string; content: string }>;
    };

    console.log(`📋 Extracting structured answers from ${conversationHistory.length} messages`);

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

    console.log("🤖 Claude response:", responseText.substring(0, 200));

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
      console.error("❌ Error parsing JSON:", parseError);
      console.error("Response text:", responseText);
      return NextResponse.json({ answers: [], count: 0, error: "Failed to parse answers" });
    }

    // Filter to only high/medium confidence answers
    const confidentAnswers = answers.filter(
      (a) => a.confidence === "high" || a.confidence === "medium"
    );

    console.log(`✅ Extracted ${confidentAnswers.length} answers (${answers.length} total, filtered by confidence)`);

    return NextResponse.json({
      answers: confidentAnswers,
      count: confidentAnswers.length,
    });
  } catch (error) {
    console.error("Error extracting answers:", error);
    return NextResponse.json(
      { error: "Failed to extract answers", answers: [], count: 0 },
      { status: 500 }
    );
  }
}
