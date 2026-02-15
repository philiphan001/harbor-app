import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Answer, DOMAIN_QUESTIONS } from "@/lib/types/readiness";
import { Domain } from "@/components/DomainProgress";
import { getAnthropicApiKey } from "@/lib/utils/env";

const anthropic = new Anthropic({
  apiKey: getAnthropicApiKey(),
});

const TASK_GENERATION_PROMPT = `You are a task generation agent for Harbor's Care Readiness Assessment.

Your job is to analyze a user's answers for a specific domain and generate actionable tasks for any gaps or areas marked as uncertain.

TASK GENERATION RULES:
1. ONLY create tasks for genuine gaps or areas of concern
2. If the user answered "I don't know" or "I'm not certain", create a task to help them find out
3. If they selected a concerning option (e.g., "No" to important questions, "Not suitable" for safety), create a task
4. DO NOT create tasks for things they have covered well (e.g., if they have a healthcare proxy, don't create a task for it)
5. Keep tasks specific and actionable
6. Prioritize realistically:
   - HIGH: Urgent legal/medical needs, safety concerns, immediate gaps
   - MEDIUM: Important but not urgent (planning, documentation, reviews)
   - LOW: Nice-to-have improvements
7. Provide 3-5 specific suggested actions per task

OUTPUT FORMAT:
Return a JSON array of tasks in this exact format:
[
  {
    "title": "Short, action-oriented title",
    "priority": "high" | "medium" | "low",
    "domain": "medical" | "financial" | "legal" | "housing" | "caregiving",
    "why": "Brief explanation of why this matters",
    "suggestedActions": [
      "Specific action 1",
      "Specific action 2",
      "Specific action 3"
    ]
  }
]

If no tasks are needed for this domain (everything is well-covered), return an empty array: []

IMPORTANT: Return ONLY valid JSON. No markdown, no explanations, just the JSON array.`;

export async function POST(request: NextRequest) {
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
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: TASK_GENERATION_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
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
