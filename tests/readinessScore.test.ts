import { describe, it, expect, vi, beforeEach } from "vitest";
import { getReadinessColor, getReadinessLabel } from "@/lib/utils/readinessScore";

// We test the pure utility functions directly. calculateReadinessScore depends
// on localStorage and other modules, so we test it via integration below.

describe("getReadinessColor", () => {
  it("returns coral for critical scores (< 30)", () => {
    expect(getReadinessColor(0)).toBe("coral");
    expect(getReadinessColor(15)).toBe("coral");
    expect(getReadinessColor(29)).toBe("coral");
  });

  it("returns amber for needs-attention scores (30-59)", () => {
    expect(getReadinessColor(30)).toBe("amber");
    expect(getReadinessColor(45)).toBe("amber");
    expect(getReadinessColor(59)).toBe("amber");
  });

  it("returns ocean for prepared scores (60-84)", () => {
    expect(getReadinessColor(60)).toBe("ocean");
    expect(getReadinessColor(75)).toBe("ocean");
    expect(getReadinessColor(84)).toBe("ocean");
  });

  it("returns sage for well-prepared scores (>= 85)", () => {
    expect(getReadinessColor(85)).toBe("sage");
    expect(getReadinessColor(100)).toBe("sage");
  });
});

describe("getReadinessLabel", () => {
  it("returns Critical Gaps for scores < 30", () => {
    expect(getReadinessLabel(0)).toBe("Critical Gaps");
    expect(getReadinessLabel(29)).toBe("Critical Gaps");
  });

  it("returns Needs Attention for scores 30-59", () => {
    expect(getReadinessLabel(30)).toBe("Needs Attention");
    expect(getReadinessLabel(59)).toBe("Needs Attention");
  });

  it("returns Prepared for scores 60-84", () => {
    expect(getReadinessLabel(60)).toBe("Prepared");
    expect(getReadinessLabel(84)).toBe("Prepared");
  });

  it("returns Well Prepared for scores >= 85", () => {
    expect(getReadinessLabel(85)).toBe("Well Prepared");
    expect(getReadinessLabel(100)).toBe("Well Prepared");
  });
});

describe("calculateReadinessScore (integration)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns score 0 with critical status when no profile exists", async () => {
    // Dynamic import so localStorage state is fresh
    const { calculateReadinessScore } = await import("@/lib/utils/readinessScore");
    const result = calculateReadinessScore();

    expect(result.overall).toBe(0);
    expect(result.status).toBe("critical");
    expect(result.criticalGaps).toContain("No parent profile created");
    expect(result.domains.medical).toBe(0);
    expect(result.domains.legal).toBe(0);
    expect(result.domains.financial).toBe(0);
    expect(result.domains.housing).toBe(0);
  });

  it("detects critical gaps when profile exists but no data captured", async () => {
    // Set up a minimal parent profile
    localStorage.setItem(
      "harbor_parent_profiles",
      JSON.stringify([{ id: "test-parent", name: "Test Parent", lastUpdated: new Date().toISOString() }])
    );
    localStorage.setItem("harbor_active_parent_id", "test-parent");

    const { calculateReadinessScore } = await import("@/lib/utils/readinessScore");
    const result = calculateReadinessScore();

    expect(result.overall).toBe(0);
    expect(result.status).toBe("critical");
    expect(result.criticalGaps.length).toBeGreaterThan(0);
    expect(result.criticalGaps).toContain("Primary care doctor contact");
    expect(result.criticalGaps).toContain("Current medications list");
  });

  it("increases medical score when doctor info is saved", async () => {
    localStorage.setItem(
      "harbor_parent_profiles",
      JSON.stringify([{ id: "test-parent", name: "Test Parent", lastUpdated: new Date().toISOString() }])
    );
    localStorage.setItem("harbor_active_parent_id", "test-parent");
    localStorage.setItem(
      "harbor_task_data",
      JSON.stringify([
        {
          taskTitle: "Get doctor info",
          toolName: "save_doctor_info",
          data: { name: "Dr. Smith", phone: "555-1234" },
          capturedAt: new Date().toISOString(),
          parentId: "test-parent",
        },
      ])
    );

    const { calculateReadinessScore } = await import("@/lib/utils/readinessScore");
    const result = calculateReadinessScore();

    expect(result.domains.medical).toBe(25); // 25 for doctor info
    expect(result.criticalGaps).not.toContain("Primary care doctor contact");
  });

  it("caps critical gaps at 5", async () => {
    localStorage.setItem(
      "harbor_parent_profiles",
      JSON.stringify([{ id: "test-parent", name: "Test Parent", lastUpdated: new Date().toISOString() }])
    );
    localStorage.setItem("harbor_active_parent_id", "test-parent");

    const { calculateReadinessScore } = await import("@/lib/utils/readinessScore");
    const result = calculateReadinessScore();

    expect(result.criticalGaps.length).toBeLessThanOrEqual(5);
  });
});
