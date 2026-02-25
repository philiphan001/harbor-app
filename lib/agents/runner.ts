// Agent Runner — Orchestrates all external and internal agents
// Called by /api/cron/agents on a schedule

import {
  fetchCMSPolicyDocuments,
  fetchStateMedicaidDocuments,
  type PolicyDocument,
} from "./policyFetcher";
import { fetchAllElderCareNews, type NewsItem } from "./newsFetcher";
import { upsertGlobalAlerts, linkAlertsToSituations, type GlobalAlertInput } from "@/lib/db/alerts";
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
}

export interface RunAllResult {
  results: AgentRunResult[];
  totalNewAlerts: number;
  duration: number;
}

/**
 * Run all external monitoring agents for all active situations.
 * Fetches data once globally, upserts GlobalAlerts, then links to matching situations.
 */
export async function runAllAgents(): Promise<RunAllResult> {
  const startTime = Date.now();
  const results: AgentRunResult[] = [];

  try {
    // Get all situations with their location and creator email
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

    // Collect unique state codes and map each state to its situations
    const stateToSituations = new Map<string, typeof situations>();
    const globalSituationIds: string[] = [];

    for (const situation of situations) {
      const { state } = extractLocation(situation.elderLocation);
      globalSituationIds.push(situation.id);

      if (state) {
        const existing = stateToSituations.get(state) || [];
        existing.push(situation);
        stateToSituations.set(state, existing);
      }
    }

    // 1. Fetch global data once
    const [policyDocs, newsItems] = await Promise.all([
      fetchCMSPolicyDocuments(7, 20),
      fetchAllElderCareNews(),
    ]);

    // 2. Fetch state-specific docs once per unique state
    const stateDocsMap = new Map<string, PolicyDocument[]>();
    await Promise.all(
      Array.from(stateToSituations.keys()).map(async (state) => {
        const docs = await fetchStateMedicaidDocuments(state, 14, 10);
        stateDocsMap.set(state, docs);
      })
    );

    // 3. Build GlobalAlert inputs for policy documents (global)
    const policyAlertInputs: GlobalAlertInput[] = policyDocs.map((doc) => ({
      agentType: "policy_monitor",
      severity: getSeverityForDocType(doc.type),
      title: doc.title,
      message: doc.abstract || `New ${doc.type} published on ${doc.publicationDate}.`,
      sourceUrl: doc.htmlUrl,
      dataSource: "Federal Register",
      domain: categorizePolicyDomain(doc.title, doc.abstract),
      stateCode: "ALL",
    }));

    // 4. Build GlobalAlert inputs for state-specific docs
    const stateAlertInputs: GlobalAlertInput[] = [];
    for (const [state, docs] of stateDocsMap) {
      for (const doc of docs) {
        stateAlertInputs.push({
          agentType: "policy_monitor",
          severity: getSeverityForDocType(doc.type),
          title: doc.title,
          message: doc.abstract || `New ${doc.type} published on ${doc.publicationDate}.`,
          sourceUrl: doc.htmlUrl,
          dataSource: `State Medicaid (${state})`,
          domain: categorizePolicyDomain(doc.title, doc.abstract),
          stateCode: state,
        });
      }
    }

    // 5. Build GlobalAlert inputs for news items (cap at 15)
    const newsAlertInputs: GlobalAlertInput[] = newsItems.slice(0, 15).map((item) => ({
      agentType: "news_monitor",
      severity: "informational" as const,
      title: item.title,
      message: item.description || item.title,
      sourceUrl: item.link,
      dataSource: item.source || "Google News",
      domain: categorizeNewsDomain(item.title),
      stateCode: "ALL",
    }));

    // 6. Upsert all GlobalAlerts
    const allInputs = [...policyAlertInputs, ...stateAlertInputs, ...newsAlertInputs];
    const globalAlerts = await upsertGlobalAlerts(allInputs);

    // 7. Link alerts to matching situations
    // Global alerts (stateCode=ALL) → all situations
    const globalAlertIds = globalAlerts
      .filter((a) => a.stateCode === "ALL")
      .map((a) => a.id);

    let totalLinked = 0;

    if (globalAlertIds.length > 0) {
      totalLinked += await linkAlertsToSituations(globalAlertIds, globalSituationIds);
    }

    // State-specific alerts → only situations in that state
    for (const [state, stateSituations] of stateToSituations) {
      const stateAlertIds = globalAlerts
        .filter((a) => a.stateCode === state)
        .map((a) => a.id);

      if (stateAlertIds.length > 0) {
        totalLinked += await linkAlertsToSituations(
          stateAlertIds,
          stateSituations.map((s) => s.id)
        );
      }
    }

    // Build results summary
    results.push({
      agentType: "policy_monitor",
      fetched: policyDocs.length + stateAlertInputs.length,
      newAlerts: policyAlertInputs.length + stateAlertInputs.length,
      skippedDuplicates: 0, // Upsert handles dedup transparently
    });

    results.push({
      agentType: "news_monitor",
      fetched: newsItems.length,
      newAlerts: newsAlertInputs.length,
      skippedDuplicates: Math.max(0, newsItems.length - newsAlertInputs.length),
    });

    // 8. Send email notifications for urgent/actionable new alerts
    const urgentAlerts = globalAlerts.filter(
      (a) => a.severity === "urgent" || a.severity === "actionable"
    );

    if (urgentAlerts.length > 0) {
      for (const situation of situations) {
        const userEmail = situation.creator?.email;
        if (!userEmail) continue;

        const { state } = extractLocation(situation.elderLocation);
        const relevantAlerts = urgentAlerts.filter(
          (a) => a.stateCode === "ALL" || a.stateCode === state
        );

        for (const alert of relevantAlerts) {
          sendAlertEmail(userEmail, {
            elderName: situation.elderName || "Your parent",
            alertTitle: alert.title,
            alertMessage: alert.message,
            severity: alert.severity as "informational" | "actionable" | "urgent",
            sourceUrl: alert.sourceUrl ?? undefined,
            domain: alert.domain ?? undefined,
          }).catch(() => {}); // Fire and forget
        }
      }
    }

    log.info("Agent run linking complete", {
      globalAlerts: globalAlerts.length,
      totalLinked,
      uniqueStates: stateToSituations.size,
    });
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
      return "actionable";
    case "Proposed Rule":
      return "informational";
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

  return "medical";
}
