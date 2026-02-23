// Agent Runner — Orchestrates all external and internal agents
// Called by /api/cron/agents on a schedule

import {
  fetchCMSPolicyDocuments,
  fetchStateMedicaidDocuments,
  type PolicyDocument,
} from "./policyFetcher";
import { fetchAllElderCareNews, type NewsItem } from "./newsFetcher";
import { createAlertsBatch, alertExistsRecently, type CreateAlertInput } from "@/lib/db/alerts";
import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/utils/logger";
import { sendAlertEmail } from "@/lib/email/send";

const log = createLogger("AgentRunner");

export interface AgentRunResult {
  agentType: string;
  fetched: number;
  newAlerts: number;
  skippedDuplicates: number;
  error?: string;
  /** The alerts that were actually created (for email notifications) */
  createdAlerts?: CreateAlertInput[];
}

export interface RunAllResult {
  results: AgentRunResult[];
  totalNewAlerts: number;
  duration: number;
}

/**
 * Run all external monitoring agents for all active situations.
 * This is the main entry point called by the cron job.
 */
export async function runAllAgents(): Promise<RunAllResult> {
  const startTime = Date.now();
  const results: AgentRunResult[] = [];

  try {
    // Get all situations with their parent state and creator email
    const situations = await prisma.situation.findMany({
      select: {
        id: true,
        elderName: true,
        elderLocation: true,
        createdBy: true,
        creator: {
          select: { email: true },
        },
      },
    });

    if (situations.length === 0) {
      log.info("No situations found, skipping agent run");
      return { results: [], totalNewAlerts: 0, duration: Date.now() - startTime };
    }

    // Run external fetchers (once globally, not per-situation)
    const [policyDocs, newsItems] = await Promise.all([
      fetchCMSPolicyDocuments(7, 20),
      fetchAllElderCareNews(),
    ]);

    // Process each situation
    for (const situation of situations) {
      const { state } = extractLocation(situation.elderLocation);

      // Fetch state-specific documents if we know the state
      let stateDocs: PolicyDocument[] = [];
      if (state) {
        stateDocs = await fetchStateMedicaidDocuments(state, 14, 10);
      }

      // Convert policy documents to alerts
      const policyResult = await processPolicyDocuments(
        situation.id,
        [...policyDocs, ...stateDocs]
      );
      results.push(policyResult);

      // Convert news items to alerts
      const newsResult = await processNewsItems(situation.id, newsItems);
      results.push(newsResult);

      // Send email notifications for urgent/actionable alerts (fire-and-forget)
      const userEmail = situation.creator?.email;
      if (userEmail) {
        const allNewAlerts = [
          ...(policyResult.createdAlerts || []),
          ...(newsResult.createdAlerts || []),
        ];
        for (const alert of allNewAlerts) {
          if (alert.severity === "urgent" || alert.severity === "actionable") {
            sendAlertEmail(userEmail, {
              elderName: situation.elderName || "Your parent",
              alertTitle: alert.title,
              alertMessage: alert.message,
              severity: alert.severity,
              sourceUrl: alert.sourceUrl,
              domain: alert.domain,
            }).catch(() => {}); // Fire and forget
          }
        }
      }
    }
  } catch (error) {
    log.errorWithStack("Agent runner failed", error);
    results.push({
      agentType: "runner",
      fetched: 0,
      newAlerts: 0,
      skippedDuplicates: 0,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const totalNewAlerts = results.reduce((sum, r) => sum + r.newAlerts, 0);
  const duration = Date.now() - startTime;

  log.info("Agent run complete", {
    totalNewAlerts,
    duration: `${duration}ms`,
    agentResults: results.length,
  });

  return { results, totalNewAlerts, duration };
}

/**
 * Convert Federal Register policy documents into alerts.
 */
async function processPolicyDocuments(
  situationId: string,
  docs: PolicyDocument[]
): Promise<AgentRunResult> {
  const result: AgentRunResult = {
    agentType: "policy_monitor",
    fetched: docs.length,
    newAlerts: 0,
    skippedDuplicates: 0,
  };

  const alertsToCreate: CreateAlertInput[] = [];

  for (const doc of docs) {
    // Deduplicate: skip if we already have an alert with this title
    const exists = await alertExistsRecently(situationId, doc.title, 14);
    if (exists) {
      result.skippedDuplicates++;
      continue;
    }

    // Determine severity based on document type
    const severity = getSeverityForDocType(doc.type);

    alertsToCreate.push({
      situationId,
      agentType: "policy_monitor",
      severity,
      title: doc.title,
      message: doc.abstract || `New ${doc.type} published on ${doc.publicationDate}.`,
      sourceUrl: doc.htmlUrl,
      dataSource: "Federal Register",
      domain: categorizePolicyDomain(doc.title, doc.abstract),
    });
  }

  if (alertsToCreate.length > 0) {
    await createAlertsBatch(alertsToCreate);
    result.newAlerts = alertsToCreate.length;
    result.createdAlerts = alertsToCreate;
  }

  return result;
}

/**
 * Convert Google News items into alerts.
 */
async function processNewsItems(
  situationId: string,
  items: NewsItem[]
): Promise<AgentRunResult> {
  const result: AgentRunResult = {
    agentType: "news_monitor",
    fetched: items.length,
    newAlerts: 0,
    skippedDuplicates: 0,
  };

  const alertsToCreate: CreateAlertInput[] = [];

  for (const item of items) {
    // Deduplicate
    const exists = await alertExistsRecently(situationId, item.title, 7);
    if (exists) {
      result.skippedDuplicates++;
      continue;
    }

    alertsToCreate.push({
      situationId,
      agentType: "news_monitor",
      severity: "informational",
      title: item.title,
      message: item.description || item.title,
      sourceUrl: item.link,
      dataSource: item.source || "Google News",
      domain: categorizeNewsDomain(item.title),
    });
  }

  // Cap at 15 news alerts per run to avoid flooding
  const capped = alertsToCreate.slice(0, 15);

  if (capped.length > 0) {
    await createAlertsBatch(capped);
    result.newAlerts = capped.length;
    result.createdAlerts = capped;
  }

  return result;
}

// --- Helpers ---

function extractLocation(elderLocation: unknown): { state: string | null; city: string | null; zip: string | null } {
  if (!elderLocation || typeof elderLocation !== "object") return { state: null, city: null, zip: null };
  const loc = elderLocation as Record<string, unknown>;
  return {
    state: typeof loc.state === "string" ? loc.state : null,
    city: typeof loc.city === "string" ? loc.city : null,
    zip: typeof loc.zip === "string" ? loc.zip : null,
  };
}

function getSeverityForDocType(
  docType: string
): "informational" | "actionable" | "urgent" {
  switch (docType) {
    case "Rule":
      return "actionable"; // Final rules = something changed
    case "Proposed Rule":
      return "informational"; // Proposed = FYI
    case "Notice":
      return "informational";
    default:
      return "informational";
  }
}

function categorizePolicyDomain(
  title: string,
  abstract: string | null
): string {
  const text = `${title} ${abstract || ""}`.toLowerCase();

  if (
    text.includes("medicaid") ||
    text.includes("spend-down") ||
    text.includes("asset") ||
    text.includes("premium") ||
    text.includes("financial")
  )
    return "financial";

  if (
    text.includes("nursing") ||
    text.includes("facility") ||
    text.includes("assisted living") ||
    text.includes("home health")
  )
    return "housing";

  if (
    text.includes("power of attorney") ||
    text.includes("advance directive") ||
    text.includes("legal")
  )
    return "legal";

  // Default to medical for Medicare/CMS documents
  return "medical";
}

function categorizeNewsDomain(title: string): string {
  const text = title.toLowerCase();

  if (text.includes("recall") || text.includes("fda") || text.includes("drug"))
    return "medical";
  if (text.includes("medicaid") || text.includes("cost") || text.includes("premium"))
    return "financial";
  if (text.includes("nursing home") || text.includes("assisted living"))
    return "housing";
  if (text.includes("law") || text.includes("regulation") || text.includes("legal"))
    return "legal";

  return "medical"; // default domain
}
