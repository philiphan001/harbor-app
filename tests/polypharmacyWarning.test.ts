import { describe, it, expect } from "vitest";
import { generatePolypharmacyNudge } from "@/lib/data/nudgeDefinitions";

describe("generatePolypharmacyNudge", () => {
  it("generates a warning nudge at 8+ medications", () => {
    const nudges = generatePolypharmacyNudge(8);
    expect(nudges).toHaveLength(1);
    expect(nudges[0].type).toBe("polypharmacy_warning");
    expect(nudges[0].description).toContain("8 medications");
    expect(nudges[0].description).toContain("2.5x fall risk");
  });

  it("generates a warning nudge at 12 medications", () => {
    const nudges = generatePolypharmacyNudge(12);
    expect(nudges).toHaveLength(1);
    expect(nudges[0].description).toContain("12 medications");
    expect(nudges[0].description).toContain("2.5x fall risk");
  });

  it("generates a notice nudge at 5-7 medications", () => {
    const nudges = generatePolypharmacyNudge(5);
    expect(nudges).toHaveLength(1);
    expect(nudges[0].type).toBe("polypharmacy_warning");
    expect(nudges[0].description).toContain("5 medications");
    expect(nudges[0].description).toContain("simplifying");
    expect(nudges[0].description).not.toContain("fall risk");
  });

  it("generates a notice nudge at 7 medications", () => {
    const nudges = generatePolypharmacyNudge(7);
    expect(nudges).toHaveLength(1);
    expect(nudges[0].description).toContain("7 medications");
  });

  it("returns empty array below 5 medications", () => {
    expect(generatePolypharmacyNudge(4)).toHaveLength(0);
    expect(generatePolypharmacyNudge(0)).toHaveLength(0);
    expect(generatePolypharmacyNudge(1)).toHaveLength(0);
  });

  it("returns correct NudgeDefinition fields", () => {
    const [nudge] = generatePolypharmacyNudge(10);
    expect(nudge.id).toBe("polypharmacy_warning");
    expect(nudge.domain).toBe("medical");
    expect(nudge.recurrence).toBe("once");
    expect(nudge.leadTimeDays).toBe(0);
    expect(nudge.icon).toBeDefined();
    expect(nudge.title).toBeDefined();
  });
});
