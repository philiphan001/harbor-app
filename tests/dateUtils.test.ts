import { describe, it, expect } from "vitest";
import { getMonday, formatWeekOf } from "@/lib/utils/dateUtils";

describe("getMonday", () => {
  it("returns the same date when given a Monday", () => {
    // 2025-01-06 is a Monday
    const monday = new Date(2025, 0, 6);
    const result = getMonday(monday);
    expect(result.getDay()).toBe(1); // Monday
    expect(result.getDate()).toBe(6);
  });

  it("returns the previous Monday for a Wednesday", () => {
    // 2025-01-08 is a Wednesday
    const wednesday = new Date(2025, 0, 8);
    const result = getMonday(wednesday);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(6);
  });

  it("returns the previous Monday for a Sunday", () => {
    // 2025-01-12 is a Sunday
    const sunday = new Date(2025, 0, 12);
    const result = getMonday(sunday);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(6);
  });

  it("returns the previous Monday for a Saturday", () => {
    // 2025-01-11 is a Saturday
    const saturday = new Date(2025, 0, 11);
    const result = getMonday(saturday);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(6);
  });

  it("handles month boundaries", () => {
    // 2025-02-02 is a Sunday → Monday should be Jan 27
    const sunday = new Date(2025, 1, 2);
    const result = getMonday(sunday);
    expect(result.getDay()).toBe(1);
    expect(result.getMonth()).toBe(0); // January
    expect(result.getDate()).toBe(27);
  });
});

describe("formatWeekOf", () => {
  it("formats an ISO date string to readable week label", () => {
    const result = formatWeekOf("2025-01-06");
    expect(result).toMatch(/Week of/);
    expect(result).toMatch(/January/);
    expect(result).toMatch(/2025/);
  });

  it("formats a different date correctly", () => {
    const result = formatWeekOf("2025-06-15");
    expect(result).toMatch(/Week of/);
    expect(result).toMatch(/June/);
  });
});
