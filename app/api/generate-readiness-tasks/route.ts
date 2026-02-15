import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Answer, DOMAIN_QUESTIONS } from "@/lib/types/readiness";
import { Domain } from "@/components/DomainProgress";
import { getAnthropicApiKey } from "@/lib/utils/env";
import { AI_CONFIG, TASK_GENERATION_PROMPT } from "@/lib/config/prompts";
import { applyRateLimit, AI_EXTRACTION_LIMIT } from "@/lib/utils/rateLimit";

const anthropic = new Anthropic({
  apiKey: getAnthropicApiKey(),
});

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, "generate-readiness-tasks", AI_EXTRACTION_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { domain, answers, parentProfile } = body as {
      domain: Domain;
      answers: Answer[];
      parentProfile?: { name?: string; age?: number; state?: string };
    };

    console.log(`📋 Generating tasks for ${domain} domain with ${answers.length} answers`);

    // Get the questions for this domain
    const domainData = DOMAIN_QUESTIONS.find((d) => d.domain === domain);
    if (!domainData) {
      return NextResponse.json({ tasks: [], count: 0 });
    }

    // Build context for Claude
    const answerSummary = domainData.questions
      .map((q) => {
        const answer = answers.find((a) => a.questionId === q.id);
        if (!answer) return `Q: ${q.text}\nA: [Not answered]`;
        if (answer.isUncertain) return `Q: ${q.text}\nA: I don't know / Not certain`;
        return `Q: ${q.text}\nA: ${answer.selectedOption}`;
      })
      .join("\n\n");

    const contextInfo = parentProfile?.name
      ? `User is assessing readiness for ${parentProfile.name}${parentProfile.age ? ` (age ${parentProfile.age})` : ""}${parentProfile.state ? ` in ${parentProfile.state}` : ""}.`
      : "User is assessing care readiness for their parent.";

    const prompt = `${contextInfo}

Domain: ${domainData.title}

User's answers:
${answerSummary}

Generate actionable tasks for any gaps, uncertainties, or areas of concern. Return only the JSON array.`;

    // Call Claude to generate tasks
    const response = await anthropic.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens.extraction,
      system: TASK_GENERATION_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: AI_CONFIG.temperature.conversation,
    });

    const responseText = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("");

    console.log("🤖 Claude response:", responseText.substring(0, 200));

    // Parse the JSON response
    let tasks: Array<{ title: string; priority: string; domain: string; why: string; suggestedActions: string[] }> = [];
    try {
      // Try to extract JSON from the response (in case Claude adds markdown)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        tasks = JSON.parse(jsonMatch[0]);
      } else {
        tasks = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error("❌ Error parsing JSON:", parseError);
      console.error("Response text:", responseText);
      return NextResponse.json({ tasks: [], count: 0, error: "Failed to parse tasks" });
    }

    console.log(`✅ Generated ${tasks.length} tasks for ${domain} domain`);

    return NextResponse.json({
      tasks,
      count: tasks.length,
      domain,
    });
  } catch (error) {
    console.error("Error generating readiness tasks:", error);
    return NextResponse.json(
      { error: "Failed to generate tasks", tasks: [], count: 0 },
      { status: 500 }
    );
  }
}
