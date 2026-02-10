import Anthropic from "@anthropic-ai/sdk";
import { Task } from "./claude";
import { getStateFormInfo, getRecommendedApproach } from "@/lib/data/stateHealthcareProxyForms";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export type HelpFlowType = "document_hunter" | "action_guide" | "script_generator";

interface TaskHelpContext {
  task: Task;
  userContext?: {
    parentState?: string;
    parentName?: string;
    familyComplexity?: "simple" | "moderate" | "complex";
  };
}

// System prompts for different help flows
const DOCUMENT_HUNTER_PROMPT = `You are Harbor's Document Hunter assistant. Your job is to help users find important documents and information they need.

CRITICAL GUIDELINES:
- Ask clarifying questions to understand what they're looking for
- Provide specific, practical suggestions for where to look
- Offer scripts for calling offices/agencies to request documents
- Be reassuring - most documents can be obtained even if lost
- Suggest alternatives if original documents are unavailable

Your tone is helpful, practical, and resourceful - like a research librarian who's seen it all.`;

const ACTION_GUIDE_PROMPT = `You are Harbor's Action Guide assistant. Your job is to break down complex tasks into simple, achievable steps.

CRITICAL GUIDELINES:
- Provide step-by-step instructions that are specific and actionable
- Anticipate obstacles and provide solutions
- Offer time estimates for each step
- Celebrate progress and encourage momentum
- Link to relevant resources when helpful

Your tone is encouraging, practical, and detail-oriented - like a project manager who wants you to succeed.`;

const SCRIPT_GENERATOR_PROMPT = `You are Harbor's Script Generator assistant. Your job is to help users have difficult conversations and make important phone calls.

CRITICAL GUIDELINES:
- Provide word-for-word scripts they can use or adapt
- Include multiple options (direct vs. gentle approach)
- Anticipate common objections and provide responses
- Help them practice what to say
- Reduce anxiety around difficult conversations

Your tone is empathetic, practical, and confidence-building - like a communications coach.`;

export async function getTaskHelp(
  context: TaskHelpContext,
  helpType: HelpFlowType,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<string> {
  const { task, userContext } = context;

  // Build context-aware system prompt
  let systemPrompt = "";
  switch (helpType) {
    case "document_hunter":
      systemPrompt = DOCUMENT_HUNTER_PROMPT;
      break;
    case "action_guide":
      systemPrompt = ACTION_GUIDE_PROMPT;
      break;
    case "script_generator":
      systemPrompt = SCRIPT_GENERATOR_PROMPT;
      break;
  }

  // Add task-specific context
  systemPrompt += `\n\nCURRENT TASK:\n${task.title}\n\nWHY IT MATTERS:\n${task.why}\n\nSUGGESTED ACTIONS:\n${task.suggestedActions.join("\n")}`;

  // Add state-specific guidance for healthcare proxy tasks
  if (task.domain === "legal" && task.title.toLowerCase().includes("healthcare proxy") && userContext?.parentState) {
    const stateInfo = getStateFormInfo(userContext.parentState);
    if (stateInfo) {
      const approach = getRecommendedApproach(
        userContext.parentState,
        userContext.familyComplexity
      );
      systemPrompt += `\n\nSTATE-SPECIFIC INFO:\nParent's state: ${stateInfo.state}\nForm available: ${stateInfo.formAvailability}\nRecommended approach: ${approach}\nForm name: ${stateInfo.form?.title || "N/A"}`;
    }
  }

  // If this is the first message, provide initial guidance
  if (conversationHistory.length === 0) {
    conversationHistory.push({
      role: "user",
      content: getInitialHelpPrompt(task, helpType, userContext)
    });
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: conversationHistory.map((msg) => ({
        role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
        content: msg.content,
      })),
      temperature: 0.7,
    });

    const messageText = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as any).text)
      .join("");

    return messageText;
  } catch (error) {
    console.error("Task help AI error:", error);
    throw new Error("Failed to get task help");
  }
}

function getInitialHelpPrompt(
  task: Task,
  helpType: HelpFlowType,
  userContext?: TaskHelpContext["userContext"]
): string {
  const parentName = userContext?.parentName || "your parent";

  switch (helpType) {
    case "document_hunter":
      if (task.title.toLowerCase().includes("healthcare proxy")) {
        return `I need help finding or getting a healthcare proxy for ${parentName}. Where should I start?`;
      } else if (task.title.toLowerCase().includes("medication")) {
        return `I need to get a complete medication list for ${parentName}. How do I do that?`;
      } else if (task.title.toLowerCase().includes("insurance")) {
        return `I need to find ${parentName}'s insurance information. Where should I look?`;
      } else {
        return `I need help with this task: ${task.title}. What information do I need to gather?`;
      }

    case "action_guide":
      if (task.title.toLowerCase().includes("healthcare proxy")) {
        return `I want to get a healthcare proxy in place for ${parentName}. Walk me through the exact steps.`;
      } else {
        return `I want to complete this task: ${task.title}. Give me a step-by-step action plan.`;
      }

    case "script_generator":
      if (task.title.toLowerCase().includes("conversation") || task.title.toLowerCase().includes("talk")) {
        return `I need to have a conversation with ${parentName} about ${task.title.toLowerCase()}. What should I say?`;
      } else if (task.title.toLowerCase().includes("call") || task.title.toLowerCase().includes("contact")) {
        return `I need to call about ${task.title.toLowerCase()}. What should I say on the phone?`;
      } else {
        return `I need help figuring out what to say to complete this task: ${task.title}`;
      }

    default:
      return `I need help with: ${task.title}`;
  }
}

// Specialized help for healthcare proxy task
export async function getHealthcareProxyHelp(
  stateCode: string,
  familyComplexity: "simple" | "moderate" | "complex" = "simple"
): Promise<{
  education: string;
  options: Array<{
    name: string;
    difficulty: string;
    cost: string;
    time: string;
    bestFor: string;
    steps: string[];
    resources?: any[];
  }>;
  recommendation: string;
}> {
  const stateInfo = getStateFormInfo(stateCode);

  if (!stateInfo) {
    return {
      education: "We don't have specific information for your state yet, but we can help you find online services or attorneys.",
      options: [],
      recommendation: "We recommend using an online legal service like LegalZoom or Mama Bear Legal for your situation."
    };
  }

  const approach = getRecommendedApproach(stateCode, familyComplexity);

  // Build education section
  const education = `A ${stateInfo.terminology.toLowerCase()} is a legal document that lets someone make medical decisions for you if you can't speak for yourself.

**What it covers:**
- Surgery decisions if you're unconscious
- Treatment choices if you have dementia
- End-of-life care preferences

**What it does NOT cover:**
- Access to bank accounts (that's financial power of attorney)
- Taking away rights while you're capable
- Costing thousands of dollars (often free or under $100)

**Why it matters:**
Without this document, hospitals legally cannot discuss care with family members or follow their wishes. In an emergency, this can cause serious delays and stress.`;

  // Build options
  const options = [];

  // Option 1: State form (if available)
  if (stateInfo.formAvailability === "official") {
    options.push({
      name: "Free State Form",
      difficulty: "Easy",
      cost: "$0",
      time: stateInfo.estimatedCompletionTime,
      bestFor: "Healthy seniors with straightforward family situations",
      steps: [
        `Download the ${stateInfo.form?.title} from the state website`,
        ...stateInfo.instructions.fillOut,
        ...stateInfo.instructions.witnesses,
        ...stateInfo.instructions.distribution
      ],
      resources: [
        {
          type: "official_form",
          url: stateInfo.form?.officialSourceUrl,
          name: stateInfo.form?.title
        }
      ]
    });
  }

  // Option 2: Online service
  options.push({
    name: "Online Legal Service",
    difficulty: "Moderate",
    cost: "$50-150",
    time: "1-2 hours",
    bestFor: "Most families - good balance of ease and thoroughness",
    steps: [
      "Choose a vetted online service (see recommendations)",
      "Answer guided questions about your situation",
      "Review and approve generated documents",
      "Sign via video notary (if required)",
      "Download and distribute completed forms"
    ],
    resources: stateInfo.onlineServiceRecommendations
  });

  // Option 3: Attorney
  options.push({
    name: "Elder Law Attorney",
    difficulty: "Complex",
    cost: "$300-800",
    time: "1-2 weeks",
    bestFor: "Complex family dynamics, significant assets, or comprehensive estate planning",
    steps: [
      "Find a board-certified elder law attorney",
      "Schedule initial consultation (often free)",
      "Discuss your specific situation and needs",
      "Attorney drafts customized documents",
      "Review and sign documents",
      "Attorney files and distributes as needed"
    ]
  });

  // Build recommendation
  let recommendation = "";
  if (approach === "state_form") {
    recommendation = `For your situation in ${stateInfo.state}, I recommend starting with the free state form. It's simple (only ${stateInfo.form?.pageCount} pages), legally valid, and can be completed in about ${stateInfo.estimatedCompletionTime}.`;
  } else if (approach === "online_service") {
    recommendation = `For your situation in ${stateInfo.state}, I recommend using an online legal service. ${stateInfo.onlineServiceRecommendations[0]?.name} is highly rated and includes ${stateInfo.onlineServiceRecommendations[0]?.features.join(", ")}.`;
  } else {
    recommendation = `Given the complexity of your situation, I recommend consulting with an elder law attorney. They can ensure everything is done correctly and handle any special circumstances.`;
  }

  return {
    education,
    options,
    recommendation
  };
}
