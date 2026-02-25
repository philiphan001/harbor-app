import Anthropic from "@anthropic-ai/sdk";
import { Task } from "./claude";
import { getStateFormInfo, getRecommendedApproach } from "@/lib/data/stateHealthcareProxyForms";
import { getPoaFormInfo, getPoaRecommendedApproach } from "@/lib/data/statePoaForms";
import { getAnthropicApiKey } from "@/lib/utils/env";
import {
  AI_CONFIG,
  DOCUMENT_HUNTER_PROMPT,
  ACTION_GUIDE_PROMPT,
  SCRIPT_GENERATOR_PROMPT,
} from "@/lib/config/prompts";
import { createLogger } from "@/lib/utils/logger";

const log = createLogger("TaskHelp");

const anthropic = new Anthropic({
  apiKey: getAnthropicApiKey(),
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

  // Add state-specific guidance for financial POA tasks
  if (task.domain === "legal" && isFinancialPoaTask(task.title) && userContext?.parentState) {
    const poaInfo = getPoaFormInfo(userContext.parentState);
    if (poaInfo) {
      const approach = getPoaRecommendedApproach(
        userContext.parentState,
        userContext.familyComplexity
      );
      systemPrompt += `\n\nSTATE-SPECIFIC POA INFO:\nParent's state: ${poaInfo.state}\nPOA type: ${poaInfo.poaType}\nForm available: ${poaInfo.formAvailability}\nRecommended approach: ${approach}\nForm name: ${poaInfo.form?.title || "N/A"}\nNotary required: ${poaInfo.requirements.notaryRequired}\nWitnesses needed: ${poaInfo.requirements.witnessCount}`;
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
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens.taskHelp,
      system: systemPrompt,
      messages: conversationHistory.map((msg) => ({
        role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
        content: msg.content,
      })),
      temperature: AI_CONFIG.temperature.conversation,
    });

    const messageText = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("");

    return messageText;
  } catch (error) {
    log.errorWithStack("Failed to get task help", error);
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

// Check if a task title refers to a financial POA (not healthcare)
function isFinancialPoaTask(title: string): boolean {
  const t = title.toLowerCase();
  const hasPoaKeyword = t.includes("power of attorney") || t.includes("poa");
  const isHealthcare =
    t.includes("healthcare power") ||
    t.includes("health care power") ||
    t.includes("medical power") ||
    t.includes("healthcare poa") ||
    t.includes("health care poa");
  return hasPoaKeyword && !isHealthcare;
}

// Specialized help for financial POA task
export async function getPoaHelp(
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
    resources?: Array<{ type?: string; url?: string; name?: string; features?: string[] }>;
  }>;
  recommendation: string;
}> {
  const poaInfo = getPoaFormInfo(stateCode);

  if (!poaInfo) {
    return {
      education: "We don't have specific POA information for your state yet, but we can help you find online services or attorneys.",
      options: [],
      recommendation: "We recommend using an online legal service like LegalZoom or Mama Bear Legal for your situation.",
    };
  }

  const approach = getPoaRecommendedApproach(stateCode, familyComplexity);

  const education = `A ${poaInfo.terminology.toLowerCase()} is a legal document that lets someone manage financial affairs on behalf of another person.

**What it covers:**
- Managing bank accounts and paying bills
- Handling real estate transactions
- Filing taxes and managing investments
- Dealing with insurance companies and government benefits

**What it does NOT cover:**
- Making medical decisions (that's a healthcare proxy/advance directive)
- Acting against the principal's wishes while they're capable
- Changing a will or trust

**Why it matters:**
Without a financial POA, if your parent becomes incapacitated, you'd need to go through expensive and time-consuming guardianship/conservatorship proceedings in court to manage their finances.`;

  const options = [];

  if (poaInfo.formAvailability === "official") {
    options.push({
      name: "State Form",
      difficulty: "Easy",
      cost: "$0 (+ notary fee ~$15-50)",
      time: poaInfo.estimatedCompletionTime,
      bestFor: "Straightforward situations with standard financial needs",
      steps: [
        `Download the ${poaInfo.form?.title} form`,
        ...poaInfo.instructions.fillOut,
        ...poaInfo.instructions.witnesses,
        ...poaInfo.instructions.distribution,
      ],
      resources: [
        {
          type: "official_form",
          url: poaInfo.form?.officialSourceUrl,
          name: poaInfo.form?.title,
        },
      ],
    });
  }

  options.push({
    name: "Online Legal Service",
    difficulty: "Moderate",
    cost: "$75-150",
    time: "1-2 hours",
    bestFor: "Most families — guided process with notary coordination",
    steps: [
      "Choose a vetted online service (see recommendations)",
      "Answer guided questions about your situation",
      "Review and approve generated documents",
      "Sign via video notary (if required)",
      "Download and distribute completed forms",
    ],
    resources: poaInfo.onlineServiceRecommendations,
  });

  options.push({
    name: "Elder Law Attorney",
    difficulty: "Complex",
    cost: "$300-1,000",
    time: "1-2 weeks",
    bestFor: "Complex assets, blended families, or business interests",
    steps: [
      "Find a board-certified elder law attorney",
      "Schedule initial consultation",
      "Discuss specific financial situation and needs",
      "Attorney drafts customized POA",
      "Review and sign documents",
      "Attorney helps with distribution to institutions",
    ],
  });

  let recommendation = "";
  if (approach === "state_form") {
    recommendation = `For your situation in ${poaInfo.state}, the state form is a good option. It's ${poaInfo.form?.pageCount} pages and takes about ${poaInfo.estimatedCompletionTime}. You'll need a notary${poaInfo.requirements.witnessCount > 0 ? ` and ${poaInfo.requirements.witnessCount} witness${poaInfo.requirements.witnessCount > 1 ? "es" : ""}` : ""}.`;
  } else if (approach === "online_service") {
    recommendation = `For your situation in ${poaInfo.state}, we recommend using an online legal service. ${poaInfo.onlineServiceRecommendations[0]?.name} is highly rated and includes ${poaInfo.onlineServiceRecommendations[0]?.features.join(", ")}.`;
  } else {
    recommendation = `Given the complexity of your situation, we recommend consulting with an elder law attorney who can ensure the POA covers all your specific needs.`;
  }

  return { education, options, recommendation };
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
    resources?: Array<{ type?: string; url?: string; name?: string; features?: string[] }>;
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
