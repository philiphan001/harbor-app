import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mock Prisma (hoisted so vi.mock factory can reference it) ---
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    situation: { findMany: vi.fn() },
    globalAlert: { upsert: vi.fn(), findMany: vi.fn() },
    situationAlertStatus: {
      createMany: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));

// --- Mock fetchers ---
vi.mock("@/lib/agents/policyFetcher", () => ({
  fetchCMSPolicyDocuments: vi.fn(),
  fetchStateMedicaidDocuments: vi.fn(),
}));

vi.mock("@/lib/agents/newsFetcher", () => ({
  fetchAllElderCareNews: vi.fn(),
}));

vi.mock("@/lib/email/send", () => ({
  sendAlertEmail: vi.fn().mockResolvedValue(undefined),
}));

// --- Import after mocking ---
import {
  upsertGlobalAlerts,
  linkAlertsToSituations,
  getAlertsForSituation,
  getUnacknowledgedAlerts,
  getRecentAlertsForBriefing,
  acknowledgeAlert,
  alertsToDetections,
  type AlertRecord,
  type GlobalAlertInput,
} from "@/lib/db/alerts";

import { runAllAgents } from "@/lib/agents/runner";
import { fetchCMSPolicyDocuments, fetchStateMedicaidDocuments } from "@/lib/agents/policyFetcher";
import { fetchAllElderCareNews } from "@/lib/agents/newsFetcher";

beforeEach(() => {
  vi.clearAllMocks();
});

// =====================
// lib/db/alerts.ts tests
// =====================

describe("upsertGlobalAlerts", () => {
  it("returns empty array for empty input", async () => {
    const result = await upsertGlobalAlerts([]);
    expect(result).toEqual([]);
    expect(mockPrisma.globalAlert.upsert).not.toHaveBeenCalled();
  });

  it("calls prisma.globalAlert.upsert for each input", async () => {
    const inputs: GlobalAlertInput[] = [
      {
        agentType: "policy_monitor",
        severity: "informational",
        title: "Test Policy",
        message: "A test policy doc",
        stateCode: "ALL",
      },
      {
        agentType: "news_monitor",
        severity: "actionable",
        title: "Test News",
        message: "A test news item",
        sourceUrl: "https://example.com",
        stateCode: "FL",
      },
    ];

    mockPrisma.globalAlert.upsert.mockImplementation(({ create }) =>
      Promise.resolve({ id: `id-${create.title}`, ...create })
    );

    const result = await upsertGlobalAlerts(inputs);

    expect(result).toHaveLength(2);
    expect(mockPrisma.globalAlert.upsert).toHaveBeenCalledTimes(2);

    // Check first upsert uses correct unique constraint key
    const firstCall = mockPrisma.globalAlert.upsert.mock.calls[0][0];
    expect(firstCall.where.uq_global_alert_dedup).toEqual({
      title: "Test Policy",
      stateCode: "ALL",
      agentType: "policy_monitor",
    });
    expect(firstCall.update).toEqual({});
    expect(firstCall.create.stateCode).toBe("ALL");
  });

  it("defaults stateCode to ALL when not provided", async () => {
    const inputs: GlobalAlertInput[] = [
      {
        agentType: "policy_monitor",
        severity: "informational",
        title: "No State",
        message: "msg",
      },
    ];

    mockPrisma.globalAlert.upsert.mockResolvedValue({ id: "1", ...inputs[0], stateCode: "ALL" });

    await upsertGlobalAlerts(inputs);

    const call = mockPrisma.globalAlert.upsert.mock.calls[0][0];
    expect(call.where.uq_global_alert_dedup.stateCode).toBe("ALL");
    expect(call.create.stateCode).toBe("ALL");
  });
});

describe("linkAlertsToSituations", () => {
  it("returns 0 for empty inputs", async () => {
    expect(await linkAlertsToSituations([], ["sit1"])).toBe(0);
    expect(await linkAlertsToSituations(["alert1"], [])).toBe(0);
    expect(mockPrisma.situationAlertStatus.createMany).not.toHaveBeenCalled();
  });

  it("creates cross-product of alertIds x situationIds", async () => {
    mockPrisma.situationAlertStatus.createMany.mockResolvedValue({ count: 4 });

    const count = await linkAlertsToSituations(
      ["alert1", "alert2"],
      ["sit1", "sit2"]
    );

    expect(count).toBe(4);
    const call = mockPrisma.situationAlertStatus.createMany.mock.calls[0][0];
    expect(call.data).toHaveLength(4);
    expect(call.skipDuplicates).toBe(true);
    expect(call.data).toContainEqual({ situationId: "sit1", globalAlertId: "alert1" });
    expect(call.data).toContainEqual({ situationId: "sit2", globalAlertId: "alert2" });
  });
});

describe("getAlertsForSituation", () => {
  it("maps SituationAlertStatus + GlobalAlert to AlertRecord", async () => {
    const now = new Date();
    mockPrisma.situationAlertStatus.findMany.mockResolvedValue([
      {
        id: "status-1",
        situationId: "sit-1",
        globalAlertId: "ga-1",
        acknowledged: false,
        acknowledgedBy: null,
        globalAlert: {
          id: "ga-1",
          agentType: "policy_monitor",
          severity: "actionable",
          title: "Medicare Update",
          message: "A new rule...",
          sourceUrl: "https://example.com/rule",
          dataSource: "Federal Register",
          domain: "medical",
          financialImpact: null,
          createdAt: now,
        },
      },
    ]);

    const result = await getAlertsForSituation("sit-1", 50);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "ga-1",
      situationId: "sit-1",
      agentType: "policy_monitor",
      severity: "actionable",
      title: "Medicare Update",
      message: "A new rule...",
      sourceUrl: "https://example.com/rule",
      dataSource: "Federal Register",
      domain: "medical",
      acknowledged: false,
      recommendedAction: null,
    });
  });

  it("returns empty array on error", async () => {
    mockPrisma.situationAlertStatus.findMany.mockRejectedValue(new Error("DB down"));
    const result = await getAlertsForSituation("sit-1");
    expect(result).toEqual([]);
  });
});

describe("getUnacknowledgedAlerts", () => {
  it("filters by acknowledged: false", async () => {
    mockPrisma.situationAlertStatus.findMany.mockResolvedValue([]);

    await getUnacknowledgedAlerts("sit-1");

    const call = mockPrisma.situationAlertStatus.findMany.mock.calls[0][0];
    expect(call.where).toEqual({ situationId: "sit-1", acknowledged: false });
  });
});

describe("acknowledgeAlert", () => {
  it("updates the correct join row", async () => {
    mockPrisma.situationAlertStatus.update.mockResolvedValue({});

    await acknowledgeAlert("ga-1", "sit-1", "user-1");

    const call = mockPrisma.situationAlertStatus.update.mock.calls[0][0];
    expect(call.where.uq_situation_alert).toEqual({
      situationId: "sit-1",
      globalAlertId: "ga-1",
    });
    expect(call.data.acknowledged).toBe(true);
    expect(call.data.acknowledgedBy).toBe("user-1");
    expect(call.data.acknowledgedAt).toBeInstanceOf(Date);
  });
});

describe("getRecentAlertsForBriefing", () => {
  it("filters by createdAt within days", async () => {
    mockPrisma.situationAlertStatus.findMany.mockResolvedValue([]);

    await getRecentAlertsForBriefing("sit-1", 7, 30);

    const call = mockPrisma.situationAlertStatus.findMany.mock.calls[0][0];
    expect(call.where.situationId).toBe("sit-1");
    expect(call.where.globalAlert.createdAt.gte).toBeInstanceOf(Date);
    expect(call.take).toBe(30);
  });
});

describe("alertsToDetections", () => {
  it("maps AlertRecord to AgentDetection", () => {
    const alerts: AlertRecord[] = [
      {
        id: "ga-1",
        situationId: "sit-1",
        agentType: "policy_monitor",
        severity: "urgent",
        title: "Urgent Policy",
        message: "Act now",
        recommendedAction: null,
        financialImpact: null,
        acknowledged: true,
        acknowledgedBy: "user-1",
        createdAt: new Date("2025-01-01"),
        sourceUrl: "https://example.com",
        dataSource: "Federal Register",
        domain: "financial",
      },
    ];

    const detections = alertsToDetections(alerts);

    expect(detections).toHaveLength(1);
    expect(detections[0]).toMatchObject({
      id: "ga-1",
      agentType: "policy_monitor",
      title: "Urgent Policy",
      relevanceScore: "high",
      domain: "financial",
      actionable: true,
      handled: true,
      sourceUrl: "https://example.com",
      dataSource: "Federal Register",
    });
  });

  it("defaults to medical domain for unknown domains", () => {
    const alerts: AlertRecord[] = [
      {
        id: "1",
        situationId: "s1",
        agentType: "news_monitor",
        severity: "informational",
        title: "T",
        message: "M",
        recommendedAction: null,
        financialImpact: null,
        acknowledged: false,
        acknowledgedBy: null,
        createdAt: new Date(),
        domain: "unknown_domain",
      },
    ];

    const detections = alertsToDetections(alerts);
    expect(detections[0].domain).toBe("medical");
  });
});

// =====================
// lib/agents/runner.ts tests
// =====================

describe("runAllAgents", () => {
  const mockFetchCMS = vi.mocked(fetchCMSPolicyDocuments);
  const mockFetchState = vi.mocked(fetchStateMedicaidDocuments);
  const mockFetchNews = vi.mocked(fetchAllElderCareNews);

  it("returns early with no results when no situations exist", async () => {
    mockPrisma.situation.findMany.mockResolvedValue([]);

    const result = await runAllAgents();

    expect(result.results).toEqual([]);
    expect(result.totalNewAlerts).toBe(0);
    expect(mockFetchCMS).not.toHaveBeenCalled();
  });

  it("fetches state docs once per unique state, not per situation", async () => {
    // Two situations in FL, one in CA
    mockPrisma.situation.findMany.mockResolvedValue([
      { id: "s1", elderName: "Mom", elderLocation: { state: "FL" }, createdBy: "u1", creator: { email: "a@b.com" } },
      { id: "s2", elderName: "Dad", elderLocation: { state: "FL" }, createdBy: "u2", creator: { email: "c@d.com" } },
      { id: "s3", elderName: "Aunt", elderLocation: { state: "CA" }, createdBy: "u3", creator: { email: "e@f.com" } },
    ]);

    mockFetchCMS.mockResolvedValue([]);
    mockFetchNews.mockResolvedValue([]);
    mockFetchState.mockResolvedValue([]);

    // Mock upsertGlobalAlerts to return empty (no alerts to link)
    mockPrisma.globalAlert.upsert.mockResolvedValue({ id: "ga-1", stateCode: "ALL" });

    await runAllAgents();

    // State docs fetched exactly 2 times: once for FL, once for CA
    expect(mockFetchState).toHaveBeenCalledTimes(2);
    const stateArgs = mockFetchState.mock.calls.map((c) => c[0]);
    expect(stateArgs).toContain("FL");
    expect(stateArgs).toContain("CA");
  });

  it("links global alerts to all situations and state alerts to matching situations only", async () => {
    mockPrisma.situation.findMany.mockResolvedValue([
      { id: "s1", elderName: "Mom", elderLocation: { state: "FL" }, createdBy: "u1", creator: { email: "a@b.com" } },
      { id: "s2", elderName: "Dad", elderLocation: { state: "CA" }, createdBy: "u2", creator: { email: "c@d.com" } },
    ]);

    mockFetchCMS.mockResolvedValue([
      { title: "Federal Rule", abstract: "About medicare", documentNumber: "1", type: "Rule", publicationDate: "2025-01-01", htmlUrl: "https://fed.gov/1", pdfUrl: null, agencies: ["CMS"] },
    ]);
    mockFetchNews.mockResolvedValue([]);
    mockFetchState.mockResolvedValue([
      { title: "FL Medicaid Update", abstract: "FL specific", documentNumber: "2", type: "Notice", publicationDate: "2025-01-01", htmlUrl: "https://state.gov/2", pdfUrl: null, agencies: ["FL DSHS"] },
    ]);

    // Mock upsert to return distinct objects based on input
    let upsertCounter = 0;
    mockPrisma.globalAlert.upsert.mockImplementation(({ create }) => {
      upsertCounter++;
      return Promise.resolve({ id: `ga-${upsertCounter}`, ...create });
    });

    mockPrisma.situationAlertStatus.createMany.mockResolvedValue({ count: 0 });

    await runAllAgents();

    // createMany should be called multiple times:
    // 1. Global alerts (stateCode=ALL) → all situations [s1, s2]
    // 2. FL state alerts → only FL situations [s1]
    // 3. CA state alerts → only CA situations [s2] (but CA had same docs as FL mock, so also called)
    const createManyCalls = mockPrisma.situationAlertStatus.createMany.mock.calls;
    expect(createManyCalls.length).toBeGreaterThanOrEqual(2);

    // First call should be for global alerts → both situations
    const globalCall = createManyCalls[0][0];
    const globalSitIds = globalCall.data.map((d: { situationId: string }) => d.situationId);
    expect(globalSitIds).toContain("s1");
    expect(globalSitIds).toContain("s2");
  });

  it("caps news alerts at 15", async () => {
    mockPrisma.situation.findMany.mockResolvedValue([
      { id: "s1", elderName: "Mom", elderLocation: {}, createdBy: "u1", creator: { email: "a@b.com" } },
    ]);

    mockFetchCMS.mockResolvedValue([]);
    mockFetchState.mockResolvedValue([]);

    // Return 20 news items
    const newsItems = Array.from({ length: 20 }, (_, i) => ({
      title: `News ${i}`,
      link: `https://news.com/${i}`,
      pubDate: "2025-01-01",
      source: "Test",
      description: `Description ${i}`,
    }));
    mockFetchNews.mockResolvedValue(newsItems);

    mockPrisma.globalAlert.upsert.mockImplementation(({ create }) =>
      Promise.resolve({ id: `ga-${create.title}`, ...create })
    );
    mockPrisma.situationAlertStatus.createMany.mockResolvedValue({ count: 0 });

    const result = await runAllAgents();

    // Should only upsert 15 news alerts (capped)
    expect(mockPrisma.globalAlert.upsert).toHaveBeenCalledTimes(15);

    const newsResult = result.results.find((r) => r.agentType === "news_monitor");
    expect(newsResult?.newAlerts).toBe(15);
    expect(newsResult?.skippedDuplicates).toBe(5); // 20 fetched - 15 created
  });
});
