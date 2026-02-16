// News & Alerts Monitor Agent
// Fetches eldercare-related news from Google News RSS
// No API key required — free public RSS feed

import { createLogger } from "@/lib/utils/logger";

const log = createLogger("NewsFetcher");

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
}

// Search queries tailored to eldercare monitoring
const DEFAULT_QUERIES = [
  "medicare medicaid policy changes",
  "elder care nursing home regulations",
  "senior medication recall FDA",
];

/**
 * Parse Google News RSS XML into NewsItem objects.
 * Uses simple regex parsing to avoid XML dependencies.
 */
function parseRSSItems(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const title = extractTag(itemXml, "title");
    const link = extractTag(itemXml, "link");
    const pubDate = extractTag(itemXml, "pubDate");
    const source = extractTag(itemXml, "source");
    const description = extractTag(itemXml, "description");

    if (title && link) {
      items.push({
        title: decodeHtmlEntities(title),
        link,
        pubDate: pubDate || new Date().toISOString(),
        source: source || "Unknown",
        description: decodeHtmlEntities(description || ""),
      });
    }
  }

  return items;
}

function extractTag(xml: string, tag: string): string | null {
  // Handle CDATA sections
  const cdataRegex = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`,
    "i"
  );
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  // Handle regular content
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = xml.match(regex);
  return m ? m[1].trim() : null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, ""); // Strip HTML tags
}

/**
 * Fetch news from Google News RSS for a given search query.
 * @param query Search query string
 * @param maxItems Max items to return (default 10)
 */
export async function fetchGoogleNewsRSS(
  query: string,
  maxItems = 10
): Promise<NewsItem[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;

  try {
    log.info("Fetching Google News RSS", { query });

    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Google News RSS returned ${response.status}`);
    }

    const xml = await response.text();
    const items = parseRSSItems(xml);

    log.info("Fetched news items", { query, count: items.length });
    return items.slice(0, maxItems);
  } catch (error) {
    log.errorWithStack("Failed to fetch Google News RSS", error);
    return [];
  }
}

/**
 * Fetch news across all default eldercare queries.
 * Deduplicates by link.
 */
export async function fetchAllElderCareNews(
  customQueries?: string[]
): Promise<NewsItem[]> {
  const queries = customQueries || DEFAULT_QUERIES;

  const allResults = await Promise.all(
    queries.map((q) => fetchGoogleNewsRSS(q, 10))
  );

  // Flatten and deduplicate by link
  const seen = new Set<string>();
  const unique: NewsItem[] = [];

  for (const items of allResults) {
    for (const item of items) {
      if (!seen.has(item.link)) {
        seen.add(item.link);
        unique.push(item);
      }
    }
  }

  // Sort by date (newest first)
  unique.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  log.info("Total unique news items", { count: unique.length });
  return unique;
}
