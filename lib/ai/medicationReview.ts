import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicApiKey } from "@/lib/utils/env";
import { AI_CONFIG, MEDICATION_REVIEW_PROMPT } from "@/lib/config/prompts";
import type { EnrichedMedication } from "@/lib/utils/medicationHelpers";
import { createLogger } from "@/lib/utils/logger";

const log = createLogger("MedicationReview");

export interface MedicationFinding {
  severity: "high" | "medium" | "info";
  category: "interaction" | "sedation-fall-risk" | "duplicate-therapy" | "timing" | "other";
  title: string;
  description: string;
  medications: string[];
  questionForDoctor: string;
}

export interface MedicationReviewResult {
  findings: MedicationFinding[];
  summary: string;
  reviewedAt: string;
  medicationCount: number;
  disclaimer: string;
}

const DISCLAIMER =
  "This review is AI-generated and is NOT medical advice. It identifies potential topics to discuss with your doctor or pharmacist. It cannot account for your parent's full medical history, lab results, or individual circumstances. Always consult a healthcare professional before making any medication changes.";

export async function generateMedicationReview(
  medications: EnrichedMedication[],
  parentAge?: number,
  conditions?: string[]
): Promise<MedicationReviewResult> {
  const anthropic = new Anthropic({
    apiKey: getAnthropicApiKey(),
  });

  const medList = medications
    .map((m) => {
      const parts = [m.name];
      if (m.dosage) parts.push(`Dosage: ${m.dosage}`);
      if (m.frequency) parts.push(`Frequency: ${m.frequency}`);
      if (m.purpose) parts.push(`Purpose: ${m.purpose}`);
      return parts.join(" | ");
    })
    .join("\n");

  const userContent = [
    `MEDICATIONS (${medications.length}):`,
    medList,
    parentAge ? `\nPATIENT AGE: ${parentAge}` : "",
    conditions && conditions.length > 0 ? `\nKNOWN CONDITIONS: ${conditions.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  log.info("Starting medication review", { medicationCount: medications.length });

  try {
    const response = await anthropic.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens.chat,
      system: MEDICATION_REVIEW_PROMPT,
      messages: [{ role: "user", content: userContent }],
      temperature: AI_CONFIG.temperature.extraction,
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    // Parse JSON from response — handle markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
    const parsed = JSON.parse(jsonMatch[1]!.trim());

    log.info("Medication review complete", { findingCount: parsed.findings?.length ?? 0 });

    return {
      findings: (parsed.findings || []).sort((a: MedicationFinding, b: MedicationFinding) => {
        const severityOrder: Record<string, number> = { high: 0, medium: 1, info: 2 };
        return (severityOrder[a.severity] ?? 2) - (severityOrder[b.severity] ?? 2);
      }),
      summary: parsed.summary || "Review complete.",
      reviewedAt: new Date().toISOString(),
      medicationCount: medications.length,
      disclaimer: DISCLAIMER,
    };
  } catch (error) {
    log.errorWithStack("Medication review failed", error);
    throw new Error("Failed to generate medication review");
  }
}
