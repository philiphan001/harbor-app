import { describe, it, expect } from "vitest";
import {
  renderTemplate,
  buildGlobalVariables,
  getTemplateForDetection,
  TEMPLATES,
} from "@/lib/utils/templateRenderer";
import type { ParentProfile } from "@/lib/utils/parentProfile";
import type { AgentDetection } from "@/lib/types/agents";
import type { ScoredSignal } from "@/lib/ai/judgmentAgent";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockProfile: ParentProfile = {
  id: "p1",
  name: "Margaret Johnson",
  age: 78,
  state: "FL",
  lastUpdated: "2026-03-01T00:00:00Z",
};

const mockDetection: AgentDetection = {
  id: "d1",
  agentType: "drug_recall",
  runId: "r1",
  detectedAt: "2026-03-08T14:30:00Z",
  title: "FDA Recall: Lisinopril",
  description: "Class II recall affecting Lisinopril 10mg tablets",
  relevanceScore: "high",
  domain: "medical",
  actionable: true,
  handled: false,
};

const mockScored: ScoredSignal = {
  ...mockDetection,
  relevanceScore: 92,
  reasoning: "Margaret takes Lisinopril 10mg daily",
  priority: "high",
  estimatedImpact: "Potential adverse reaction if continued",
  recommendedAction: "Contact prescribing physician",
  scoredAt: "2026-03-08T14:35:00Z",
};

// ---------------------------------------------------------------------------
// renderTemplate
// ---------------------------------------------------------------------------

describe("renderTemplate", () => {
  it("replaces simple variables", () => {
    expect(renderTemplate("Hello {name}", { name: "Alice" })).toBe(
      "Hello Alice",
    );
  });

  it("replaces multiple variables", () => {
    const result = renderTemplate("{greeting}, {name}! You are {age}.", {
      greeting: "Hi",
      name: "Bob",
      age: 42,
    });
    expect(result).toBe("Hi, Bob! You are 42.");
  });

  it("handles numeric values", () => {
    expect(renderTemplate("Score: {score}", { score: 85 })).toBe("Score: 85");
  });

  it("silently replaces missing variables with empty string", () => {
    expect(renderTemplate("Hello {name}", {})).toBe("Hello ");
  });

  it("silently replaces undefined variables with empty string", () => {
    expect(renderTemplate("Hello {name}", { name: undefined })).toBe(
      "Hello ",
    );
  });

  it("leaves non-placeholder curly braces alone", () => {
    // Only {word_chars} should be replaced — other patterns pass through
    expect(renderTemplate("JSON: {}", { name: "x" })).toBe("JSON: {}");
  });

  it("replaces the same variable used multiple times", () => {
    expect(
      renderTemplate("{name} and {name} again", { name: "Alice" }),
    ).toBe("Alice and Alice again");
  });

  it("handles template with no placeholders", () => {
    expect(renderTemplate("No variables here.", {})).toBe(
      "No variables here.",
    );
  });

  it("handles empty template string", () => {
    expect(renderTemplate("", { name: "Alice" })).toBe("");
  });

  describe("conditional blocks", () => {
    it("renders the 'if present' branch when variable exists", () => {
      const result = renderTemplate(
        '{status ? "Active" : "Inactive"}',
        { status: "yes" },
      );
      expect(result).toBe("Active");
    });

    it("renders the 'if absent' branch when variable is missing", () => {
      const result = renderTemplate(
        '{status ? "Active" : "Inactive"}',
        {},
      );
      expect(result).toBe("Inactive");
    });

    it("renders the 'if absent' branch when variable is empty string", () => {
      const result = renderTemplate(
        '{status ? "Active" : "Inactive"}',
        { status: "" },
      );
      expect(result).toBe("Inactive");
    });

    it("works alongside simple variable replacements", () => {
      const result = renderTemplate(
        'Hello {name}. {verified ? "Verified" : "Unverified"} account.',
        { name: "Alice", verified: "true" },
      );
      expect(result).toBe("Hello Alice. Verified account.");
    });
  });
});

// ---------------------------------------------------------------------------
// buildGlobalVariables
// ---------------------------------------------------------------------------

describe("buildGlobalVariables", () => {
  it("extracts profile fields", () => {
    const vars = buildGlobalVariables(mockProfile);
    expect(vars.parent_name).toBe("Margaret");
    expect(vars.parent_full_name).toBe("Margaret Johnson");
    expect(vars.parent_state).toBe("FL");
    expect(vars.parent_age).toBe(78);
  });

  it("handles null profile gracefully", () => {
    const vars = buildGlobalVariables(null);
    expect(vars.parent_name).toBeUndefined();
    expect(vars.parent_full_name).toBeUndefined();
    expect(vars.parent_state).toBeUndefined();
    expect(vars.parent_age).toBeUndefined();
  });

  it("formats detection_date as readable string", () => {
    const vars = buildGlobalVariables(mockProfile, mockDetection);
    expect(vars.detection_date).toBe("March 8, 2026");
  });

  it("sets care_domain from detection", () => {
    const vars = buildGlobalVariables(mockProfile, mockDetection);
    expect(vars.care_domain).toBe("medical");
  });

  it("sets caregiver_name as undefined (not yet available)", () => {
    const vars = buildGlobalVariables(mockProfile);
    expect(vars.caregiver_name).toBeUndefined();
  });

  it("sets source_publication_date as undefined (not yet available)", () => {
    const vars = buildGlobalVariables(mockProfile, mockDetection);
    expect(vars.source_publication_date).toBeUndefined();
  });

  it("populates scored signal fields", () => {
    const vars = buildGlobalVariables(mockProfile, mockDetection, mockScored);
    expect(vars.match_reason).toBe("Margaret takes Lisinopril 10mg daily");
    expect(vars.relevance_score).toBe(92);
    expect(vars.estimated_impact).toBe(
      "Potential adverse reaction if continued",
    );
    expect(vars.recommended_action).toBe("Contact prescribing physician");
  });

  describe("signal_tier derivation", () => {
    it("returns 'urgent' for score >= 85", () => {
      const vars = buildGlobalVariables(
        mockProfile,
        mockDetection,
        { ...mockScored, relevanceScore: 85 },
      );
      expect(vars.signal_tier).toBe("urgent");
    });

    it("returns 'important' for score >= 70 and < 85", () => {
      const vars = buildGlobalVariables(
        mockProfile,
        mockDetection,
        { ...mockScored, relevanceScore: 70 },
      );
      expect(vars.signal_tier).toBe("important");
    });

    it("returns 'recommended' for score < 70", () => {
      const vars = buildGlobalVariables(
        mockProfile,
        mockDetection,
        { ...mockScored, relevanceScore: 50 },
      );
      expect(vars.signal_tier).toBe("recommended");
    });

    it("is undefined when no scored signal", () => {
      const vars = buildGlobalVariables(mockProfile, mockDetection);
      expect(vars.signal_tier).toBeUndefined();
    });
  });

  it("merges detection.metadata when present", () => {
    const detectionWithMeta = {
      ...mockDetection,
      metadata: { drug_name: "Lisinopril", recall_class: "Class II" },
    };
    const vars = buildGlobalVariables(mockProfile, detectionWithMeta as any);
    expect(vars.drug_name).toBe("Lisinopril");
    expect(vars.recall_class).toBe("Class II");
  });
});

// ---------------------------------------------------------------------------
// getTemplateForDetection
// ---------------------------------------------------------------------------

describe("getTemplateForDetection", () => {
  it("returns drug recall templates for drug_recall agent", () => {
    const templates = getTemplateForDetection("drug_recall");
    expect(templates.attribution).toBe(TEMPLATES.attribution.drugRecall);
    expect(templates.title).toBe(TEMPLATES.card.drugRecall.title);
    expect(templates.body).toBe(TEMPLATES.card.drugRecall.body);
    expect(templates.action).toBe("Create Task: Review Medication");
  });

  it("returns policy change templates for policy_monitor agent", () => {
    const templates = getTemplateForDetection("policy_monitor");
    expect(templates.attribution).toBe(TEMPLATES.attribution.policyChange);
    expect(templates.title).toBe(TEMPLATES.card.policyChange.title);
    expect(templates.action).toBe("Create Task: Review Policy Change");
  });

  it("returns provider rating templates for provider_monitor agent", () => {
    const templates = getTemplateForDetection("provider_monitor");
    expect(templates.attribution).toBe(TEMPLATES.attribution.providerRating);
    expect(templates.title).toBe(TEMPLATES.card.providerRating.title);
    expect(templates.action).toBe("Create Task: Review Provider");
  });

  it("returns financial projection templates for financial_monitor agent", () => {
    const templates = getTemplateForDetection("financial_monitor");
    expect(templates.attribution).toBe(
      TEMPLATES.attribution.financialProjection,
    );
    expect(templates.title).toBe(TEMPLATES.card.financialProjection.title);
    expect(templates.action).toBe("Create Task: Financial Planning");
  });

  it("returns news templates for news_monitor agent", () => {
    const templates = getTemplateForDetection("news_monitor");
    expect(templates.attribution).toBe(TEMPLATES.attribution.news);
    expect(templates.title).toBe(TEMPLATES.card.news.title);
    expect(templates.action).toBe("Read Article");
  });

  it("falls back to standard attribution for unknown agent types", () => {
    const templates = getTemplateForDetection("calendar_reminder");
    expect(templates.attribution).toBe(TEMPLATES.attribution.standard);
    expect(templates.title).toBe("{title}");
    expect(templates.body).toBe("{description}");
    expect(templates.action).toBe("View Details");
  });
});

// ---------------------------------------------------------------------------
// Integration: end-to-end rendering
// ---------------------------------------------------------------------------

describe("end-to-end rendering", () => {
  it("renders a standard attribution line with global variables", () => {
    const vars = buildGlobalVariables(mockProfile, mockDetection, mockScored);
    const result = renderTemplate(TEMPLATES.attribution.standard, vars);

    expect(result).toContain("Harbor detected this on March 8, 2026");
    expect(result).toContain(
      "Flagged because Margaret takes Lisinopril 10mg daily",
    );
    // source_publication_date is not available → empty
    expect(result).toContain("Source published: .");
  });

  it("renders a drug recall card title with agent-specific metadata", () => {
    const vars = {
      ...buildGlobalVariables(mockProfile, mockDetection, mockScored),
      drug_name: "Lisinopril",
      recall_class: "Class II",
    };
    const templates = getTemplateForDetection("drug_recall");
    const title = renderTemplate(templates.title, vars);

    expect(title).toBe("FDA Recall Alert: Lisinopril");
  });

  it("renders a sparse profile nudge", () => {
    const vars = buildGlobalVariables(mockProfile);
    const result = renderTemplate(TEMPLATES.sparseProfile.nudgeTitle, vars);
    expect(result).toBe("Strengthen Margaret's profile");
  });

  it("degrades gracefully with minimal data", () => {
    const vars = buildGlobalVariables(null);
    const result = renderTemplate(TEMPLATES.attribution.standard, vars);
    // All variables resolve to empty string — no {broken_placeholders}
    expect(result).not.toMatch(/\{[a-z_]+\}/);
    expect(result).toContain("Harbor detected this on");
  });
});
