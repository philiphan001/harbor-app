import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeValueStats } from "@/lib/utils/valueTracking";

vi.mock("@/lib/utils/agentStorage", () => ({
  getAllDetections: vi.fn(() => [
    { id: "d1", agentType: "drug_recall", handled: false, convertedToTask: true, relevanceScore: "high", domain: "medical", title: "Recall", description: "", runId: "r1", detectedAt: "2026-03-01", actionable: true },
    { id: "d2", agentType: "benefit_eligibility", handled: false, convertedToTask: false, relevanceScore: "high", domain: "financial", title: "Benefit", description: "", runId: "r2", detectedAt: "2026-03-02", actionable: true },
    { id: "d3", agentType: "benefit_eligibility", handled: true, convertedToTask: false, relevanceScore: "low", domain: "financial", title: "Low Benefit", description: "", runId: "r3", detectedAt: "2026-03-03", actionable: false },
  ]),
}));

vi.mock("@/lib/utils/taskStorage", () => ({
  getCompletedTasks: vi.fn(() => [
    { title: "Done 1", completedAt: "2026-03-05", priority: "high", domain: "medical", why: "", suggestedActions: [] },
    { title: "Done 2", completedAt: "2026-03-06", priority: "low", domain: "legal", why: "", suggestedActions: [] },
  ]),
}));

vi.mock("@/lib/utils/taskData", () => ({
  getAllTaskData: vi.fn(() => [
    { taskTitle: "Doc 1", toolName: "upload", data: {}, capturedAt: "2026-03-01", parentId: "p1" },
    { taskTitle: "Doc 2", toolName: "upload", data: {}, capturedAt: "2026-03-02", parentId: "p1" },
    { taskTitle: "Doc 3", toolName: "upload", data: {}, capturedAt: "2026-03-03", parentId: "p1" },
  ]),
}));

const store: Record<string, string> = {};
vi.stubGlobal("window", { ...globalThis.window });
vi.stubGlobal("localStorage", {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, val: string) => { store[key] = val; },
  removeItem: (key: string) => { delete store[key]; },
});

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
});

describe("computeValueStats", () => {
  it("counts total detections", () => {
    const stats = computeValueStats(new Date("2026-03-11"));
    expect(stats.totalDetections).toBe(3);
  });

  it("counts tasks converted from detections", () => {
    const stats = computeValueStats(new Date("2026-03-11"));
    expect(stats.tasksConverted).toBe(1);
  });

  it("counts completed tasks", () => {
    const stats = computeValueStats(new Date("2026-03-11"));
    expect(stats.tasksCompleted).toBe(2);
  });

  it("counts documents captured", () => {
    const stats = computeValueStats(new Date("2026-03-11"));
    expect(stats.documentsCaptured).toBe(3);
  });

  it("estimates savings from non-low benefit_eligibility detections", () => {
    const stats = computeValueStats(new Date("2026-03-11"));
    // Only d2 qualifies (high relevance benefit_eligibility); d3 is low
    expect(stats.estimatedSavings).toBe(2400);
  });

  it("counts unique active agent types", () => {
    const stats = computeValueStats(new Date("2026-03-11"));
    // drug_recall + benefit_eligibility = 2
    expect(stats.activeAgentCount).toBe(2);
  });

  it("tracks days since first use", () => {
    // First call sets first-use date
    const stats = computeValueStats(new Date("2026-03-11T12:00:00Z"));
    expect(stats.daysSinceFirstUse).toBe(0);

    // Subsequent call with later date — allow ±1 for timezone edge cases
    const later = computeValueStats(new Date("2026-03-21T12:00:00Z"));
    expect(later.daysSinceFirstUse).toBeGreaterThanOrEqual(9);
    expect(later.daysSinceFirstUse).toBeLessThanOrEqual(10);
  });
});
