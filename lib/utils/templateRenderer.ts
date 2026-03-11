import type { ParentProfile } from "./parentProfile";
import type { AgentDetection, AgentType } from "@/lib/types/agents";
import type { ScoredSignal } from "@/lib/ai/judgmentAgent";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TemplateVariables = Record<string, string | number | undefined>;

// ---------------------------------------------------------------------------
// Template Registry
// ---------------------------------------------------------------------------

export const TEMPLATES = {
  attribution: {
    standard:
      "Harbor detected this on {detection_date}.\nSource published: {source_publication_date}.\nFlagged because {match_reason}.",
    drugRecall:
      "This {recall_class} recall was published by the FDA on {source_publication_date}. Harbor matched it to {parent_name}'s profile on {detection_date} because {parent_name} takes {drug_name}. Reason for recall: {recall_reason}.",
    policyChange:
      "This {policy_type} was published by {issuing_agency} on {source_publication_date}. Harbor flagged it on {detection_date} because {match_reason}. {affected_program} changes may affect {parent_name}'s coverage in {parent_state}.",
    providerRating:
      "CMS updated {provider_name}'s record on {source_publication_date}. Harbor flagged this on {detection_date} because {match_reason}. Change: {rating_change}.",
    financialProjection:
      "Harbor's financial analysis (updated {detection_date}) projects that {parent_name} {projection_type}. Estimated timeline: {projected_date}. {match_reason}.",
    news: "This article was published by {news_source} on {source_publication_date}. Harbor flagged it on {detection_date} because {match_reason}.",
  },
  card: {
    drugRecall: {
      title: "FDA Recall Alert: {drug_name}",
      body: "The FDA has issued a {recall_class} recall affecting {drug_name}, which is on {parent_name}'s medication list. {recall_reason}.\n\nWhat to do: {recommended_action}",
      action: "Create Task: Review Medication",
    },
    policyChange: {
      title: "{affected_program} Policy Update: {policy_title}",
      body: "{policy_summary}\n\nEffective date: {effective_date}\nApplies to {parent_name} in {parent_state}: {action_needed}",
      action: "Create Task: Review Policy Change",
    },
    providerRating: {
      title: "Provider Update: {provider_name}",
      body: "{provider_name}'s quality record has changed: {rating_change}. Current rating: {current_rating}.\n\n{finding_summary}\n\nThis may affect {parent_name}'s care. Consider reviewing provider options if the rating decline is significant.",
      action: "Create Task: Review Provider",
    },
    financialProjection: {
      title: "Financial Alert: {projection_type}",
      body: "{projection_summary}\n\nEstimated timeline: {projected_date}.\n\nNext step: {recommended_action}",
      action: "Create Task: Financial Planning",
    },
    news: {
      title: "{care_domain} News: {news_headline}",
      body: "From {news_source}: {news_summary}\n\nThis may be relevant to {parent_name} because {match_reason}.",
      action: "Read Article",
    },
  },
  sparseProfile: {
    cardModifier:
      "This alert may be relevant to {parent_name}. Add {missing_profile_fields} to {parent_name}'s profile to get more accurate, personalized alerts.",
    briefingHeader:
      "This briefing is based on what we know so far: {parent_name} is {parent_age}, lives in {parent_state}, and has {known_insurance_type} coverage. The more details you add to {parent_name}'s profile, the more precise these alerts become.\n\nQuick wins: Adding {top_missing_field} would unlock {unlock_description}.",
    nudgeTitle: "Strengthen {parent_name}'s profile",
    nudgeBody:
      "{parent_name}'s profile is {profile_completeness_percent}% complete. Adding {top_missing_field} would unlock {unlock_description}.",
  },
} as const;

// ---------------------------------------------------------------------------
// Core Renderer
// ---------------------------------------------------------------------------

/**
 * Replaces `{variable_name}` placeholders with values from the variables
 * object. Missing variables silently resolve to empty string.
 */
export function renderTemplate(
  template: string,
  variables: TemplateVariables,
): string {
  // 1. Handle conditional blocks: {var ? "text if present" : "text if absent"}
  const withConditionals = template.replace(
    /\{(\w+)\s*\?\s*"([^"]*)"\s*:\s*"([^"]*)"\}/g,
    (_match, varName: string, ifPresent: string, ifAbsent: string) => {
      const value = variables[varName];
      return value !== undefined && value !== "" ? ifPresent : ifAbsent;
    },
  );

  // 2. Replace simple {variable_name} placeholders
  return withConditionals.replace(/\{(\w+)\}/g, (_match, varName: string) => {
    const value = variables[varName];
    if (value === undefined || value === null) return "";
    return String(value);
  });
}

// ---------------------------------------------------------------------------
// Global Variable Builder
// ---------------------------------------------------------------------------

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function deriveSignalTier(score: number): "urgent" | "important" | "recommended" {
  if (score >= 85) return "urgent";
  if (score >= 70) return "important";
  return "recommended";
}

/**
 * Assembles the global variables table from the template library doc.
 * All args are optional — missing fields resolve to undefined (which
 * renderTemplate treats as empty string).
 */
export function buildGlobalVariables(
  profile: ParentProfile | null,
  detection?: AgentDetection,
  scored?: ScoredSignal,
): TemplateVariables {
  const firstName = profile?.name?.split(" ")[0];

  const vars: TemplateVariables = {
    // Profile
    parent_name: firstName,
    parent_full_name: profile?.name,
    parent_state: profile?.state,
    parent_age: profile?.age,
    caregiver_name: undefined, // no user profile name field yet

    // Detection metadata
    detection_date: detection?.detectedAt
      ? formatDate(detection.detectedAt)
      : undefined,
    source_publication_date: undefined, // not yet available
    care_domain: detection?.domain,

    // Scored signal
    match_reason: scored?.reasoning,
    relevance_score: scored?.relevanceScore,
    signal_tier: scored?.relevanceScore
      ? deriveSignalTier(scored.relevanceScore)
      : undefined,
    estimated_impact: scored?.estimatedImpact,
    recommended_action: scored?.recommendedAction,
  };

  // Merge detection.metadata if present (future agent-specific fields)
  if (detection && "metadata" in detection && detection.metadata) {
    Object.assign(vars, detection.metadata as Record<string, string>);
  }

  return vars;
}

// ---------------------------------------------------------------------------
// Template Lookup
// ---------------------------------------------------------------------------

const AGENT_TYPE_TO_CARD_KEY: Record<string, keyof typeof TEMPLATES.card> = {
  drug_recall: "drugRecall",
  policy_monitor: "policyChange",
  provider_monitor: "providerRating",
  financial_monitor: "financialProjection",
  news_monitor: "news",
};

const AGENT_TYPE_TO_ATTR_KEY: Record<
  string,
  keyof typeof TEMPLATES.attribution
> = {
  drug_recall: "drugRecall",
  policy_monitor: "policyChange",
  provider_monitor: "providerRating",
  financial_monitor: "financialProjection",
  news_monitor: "news",
};

/**
 * Maps an agent type to the appropriate template set.
 * Falls back to standard attribution for unknown agent types.
 */
export function getTemplateForDetection(agentType: AgentType): {
  attribution: string;
  title: string;
  body: string;
  action: string;
} {
  const cardKey = AGENT_TYPE_TO_CARD_KEY[agentType];
  const attrKey = AGENT_TYPE_TO_ATTR_KEY[agentType];

  if (cardKey && attrKey) {
    const card = TEMPLATES.card[cardKey];
    return {
      attribution: TEMPLATES.attribution[attrKey],
      title: card.title,
      body: card.body,
      action: card.action,
    };
  }

  // Fallback for internal/unknown agent types
  return {
    attribution: TEMPLATES.attribution.standard,
    title: "{title}",
    body: "{description}",
    action: "View Details",
  };
}
