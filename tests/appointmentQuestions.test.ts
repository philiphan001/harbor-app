import { describe, it, expect } from "vitest";
import { generateContextualQuestions } from "@/lib/utils/appointmentQuestions";

describe("generateContextualQuestions", () => {
  it("generates polypharmacy question at 8+ medications", () => {
    const meds = Array.from({ length: 8 }, (_, i) => ({ name: `Med${i}` }));
    const questions = generateContextualQuestions(meds, [], null);
    const poly = questions.find((q) => q.id === "poly_simplify");
    expect(poly).toBeDefined();
    expect(poly!.question).toContain("8 medications");
  });

  it("generates moderate polypharmacy question at 5-7 medications", () => {
    const meds = Array.from({ length: 6 }, (_, i) => ({ name: `Med${i}` }));
    const questions = generateContextualQuestions(meds, [], null);
    const poly = questions.find((q) => q.id === "poly_review");
    expect(poly).toBeDefined();
    expect(poly!.question).toContain("6 medications");
  });

  it("does not generate polypharmacy question below 5 medications", () => {
    const meds = Array.from({ length: 3 }, (_, i) => ({ name: `Med${i}` }));
    const questions = generateContextualQuestions(meds, [], null);
    expect(questions.find((q) => q.id.startsWith("poly_"))).toBeUndefined();
  });

  it("detects sedating medications", () => {
    const meds = [{ name: "Gabapentin 300mg" }, { name: "Metformin 500mg" }];
    const questions = generateContextualQuestions(meds, [], null);
    expect(questions.find((q) => q.id === "sedation_fall")).toBeDefined();
  });

  it("does not flag non-sedating medications", () => {
    const meds = [{ name: "Metformin 500mg" }, { name: "Lisinopril 10mg" }];
    const questions = generateContextualQuestions(meds, [], null);
    expect(questions.find((q) => q.id === "sedation_fall")).toBeUndefined();
  });

  it("generates age-based questions for age >= 80", () => {
    const questions = generateContextualQuestions([], [], { age: 82 });
    expect(questions.find((q) => q.id === "age_bone")).toBeDefined();
    expect(questions.find((q) => q.id === "age_fall")).toBeDefined();
    expect(questions.find((q) => q.id === "age_cognitive")).toBeDefined();
  });

  it("generates cognitive screening for age >= 65", () => {
    const questions = generateContextualQuestions([], [], { age: 68 });
    expect(questions.find((q) => q.id === "age_cognitive")).toBeDefined();
    expect(questions.find((q) => q.id === "age_bone")).toBeUndefined();
  });

  it("maps conditions to questions", () => {
    const questions = generateContextualQuestions([], ["Type 2 Diabetes"], null);
    expect(questions.find((q) => q.id === "diabetes_a1c")).toBeDefined();
    expect(questions.find((q) => q.id === "diabetes_feet")).toBeDefined();
  });

  it("maps heart failure condition", () => {
    const questions = generateContextualQuestions([], ["Congestive Heart Failure"], null);
    expect(questions.find((q) => q.id === "hf_weight")).toBeDefined();
  });

  it("maps COPD condition", () => {
    const questions = generateContextualQuestions([], ["COPD"], null);
    expect(questions.find((q) => q.id === "copd_action")).toBeDefined();
  });

  it("generates event-based questions", () => {
    const questions = generateContextualQuestions([], [], null, ["hospitalization", "fall"]);
    expect(questions.find((q) => q.id === "event_hospital")).toBeDefined();
    expect(questions.find((q) => q.id === "event_fall")).toBeDefined();
  });

  it("deduplicates by question ID", () => {
    // Fall-related questions from both age and events should not duplicate
    const questions = generateContextualQuestions([], [], { age: 85 }, ["fall"]);
    const fallIds = questions.filter((q) => q.id === "age_fall");
    expect(fallIds).toHaveLength(1);
  });

  it("handles empty data gracefully", () => {
    const questions = generateContextualQuestions([], [], null);
    expect(questions).toEqual([]);
  });

  it("handles null profile gracefully", () => {
    const questions = generateContextualQuestions([], [], null, []);
    expect(Array.isArray(questions)).toBe(true);
  });
});
