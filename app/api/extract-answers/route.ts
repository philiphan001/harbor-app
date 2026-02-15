import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { DOMAIN_QUESTIONS } from "@/lib/types/readiness";
import { getAnthropicApiKey } from "@/lib/utils/env";

const anthropic = new Anthropic({
  apiKey: getAnthropicApiKey(),
});

const ANSWER_EXTRACTION_PROMPT = `You are an answer extraction agent for Harbor's Care Readiness Assessment.

Your job is to analyze a conversation and extract structured answers to specific assessment questions.

EXTRACTION RULES:
1. Match conversation responses to the specific questions provided
2. If the user clearly answered a question, extract their answer
3. If the user expressed uncertainty ("I don't know", "not sure", etc), mark as uncertain
4. If a question wasn't discussed yet, don't include it in results
5. Be lenient with matching - conversational responses may not use exact wording
6. Only extract answers you're confident about

OUTPUT FORMAT:
Return a JSON array of answers in this exact format:
[
  {
    "questionId": "med-1",
    "selectedOption": "Yes, regular visits" | null,
    "isUncertain": false,
    "confidence": "high" | "medium" | "low"
  }
]

- If user said "I don't know" or expressed uncertainty: selectedOption=null, isUncertain=true
- If user gave a clear answer: selectedOption="[the option that best matches]", isUncertain=false
- confidence: how sure you are this matches their intent

IMPORTANT:
- Return ONLY valid JSON, no markdown or explanations
- Only include questions that were actually discussed
- Match user's response to the closest predefined option
`;

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
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: ANSWER_EXTRACTION_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent extraction
    });

    const responseText = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("");

    console.log("🤖 Claude response:", responseText.substring(0, 200));

    // Parse the JSON response
    let answers: any[] = [];
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
