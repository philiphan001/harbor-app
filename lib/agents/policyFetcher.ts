// Policy Monitor Agent
// Fetches CMS/Medicare/Medicaid policy documents from the Federal Register API
// No API key required — free public API

import { createLogger } from "@/lib/utils/logger";

const log = createLogger("PolicyFetcher");

const FEDERAL_REGISTER_API =
  "https://www.federalregister.gov/api/v1/documents.json";

export interface PolicyDocument {
  title: string;
  abstract: string | null;
  documentNumber: string;
  type: string; // Rule, Proposed Rule, Notice
  publicationDate: string;
  htmlUrl: string;
  pdfUrl: string | null;
  agencies: string[];
}

interface FederalRegisterResponse {
  count: number;
  results: Array<{
    title: string;
    abstract: string | null;
    document_number: string;
    type: string;
    publication_date: string;
    html_url: string;
    pdf_url: string | null;
    agencies: Array<{ name: string }>;
  }>;
}

/**
 * Fetch recent CMS policy documents from the Federal Register.
 * @param daysBack How many days of history to fetch (default 7)
 * @param perPage Max results (default 20)
 */
export async function fetchCMSPolicyDocuments(
  daysBack = 7,
  perPage = 20
): Promise<PolicyDocument[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  const startStr = startDate.toISOString().split("T")[0];

  const params = new URLSearchParams({
    "conditions[agencies][]": "centers-for-medicare-medicaid-services",
    "conditions[publication_date][gte]": startStr,
    per_page: String(perPage),
    order: "newest",
  });

  const url = `${FEDERAL_REGISTER_API}?${params}`;

  try {
    log.info("Fetching CMS policy documents", { url, daysBack });

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Federal Register API returned ${response.status}`);
    }

    const data: FederalRegisterResponse = await response.json();

    const documents: PolicyDocument[] = data.results.map((doc) => ({
      title: doc.title,
      abstract: doc.abstract,
      documentNumber: doc.document_number,
      type: doc.type,
      publicationDate: doc.publication_date,
      htmlUrl: doc.html_url,
      pdfUrl: doc.pdf_url,
      agencies: doc.agencies.map((a) => a.name),
    }));

    log.info("Fetched CMS documents", { count: documents.length });
    return documents;
  } catch (error) {
    log.errorWithStack("Failed to fetch CMS policy documents", error);
    return [];
  }
}

/**
 * Fetch state-specific Medicaid documents from the Federal Register.
 * Searches for documents mentioning the state name.
 */
export async function fetchStateMedicaidDocuments(
  state: string,
  daysBack = 14,
  perPage = 10
): Promise<PolicyDocument[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  const startStr = startDate.toISOString().split("T")[0];

  // State code to name mapping (top states)
  const stateNames: Record<string, string> = {
    CA: "California",
    TX: "Texas",
    FL: "Florida",
    NY: "New York",
    PA: "Pennsylvania",
    IL: "Illinois",
    OH: "Ohio",
    GA: "Georgia",
    NC: "North Carolina",
    MI: "Michigan",
  };

  const stateName = stateNames[state] || state;

  const params = new URLSearchParams({
    "conditions[agencies][]": "centers-for-medicare-medicaid-services",
    "conditions[term]": `Medicaid ${stateName}`,
    "conditions[publication_date][gte]": startStr,
    per_page: String(perPage),
    order: "newest",
  });

  const url = `${FEDERAL_REGISTER_API}?${params}`;

  try {
    log.info("Fetching state Medicaid documents", { state: stateName, url });

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Federal Register API returned ${response.status}`);
    }

    const data: FederalRegisterResponse = await response.json();

    return data.results.map((doc) => ({
      title: doc.title,
      abstract: doc.abstract,
      documentNumber: doc.document_number,
      type: doc.type,
      publicationDate: doc.publication_date,
      htmlUrl: doc.html_url,
      pdfUrl: doc.pdf_url,
      agencies: doc.agencies.map((a) => a.name),
    }));
  } catch (error) {
    log.errorWithStack("Failed to fetch state Medicaid documents", error);
    return [];
  }
}
