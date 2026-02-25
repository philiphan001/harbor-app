// Default recurring tasks that can be seeded for a care plan
import type { Task } from "@/lib/ai/claude";

export interface RecurringTaskTemplate {
  title: string;
  priority: "high" | "medium" | "low";
  domain: "medical" | "legal" | "financial" | "housing" | "caregiving" | "social";
  why: string;
  suggestedActions: string[];
  frequency: "monthly" | "quarterly" | "semi-annual" | "annual";
}

export const DEFAULT_RECURRING_TASKS: RecurringTaskTemplate[] = [
  {
    title: "Review medication list",
    priority: "medium",
    domain: "medical",
    why: "Medications change frequently — keeping the list current prevents dangerous interactions and ensures accurate information for doctors.",
    suggestedActions: [
      "Compare current medications against what's in Harbor",
      "Check for any new prescriptions or discontinued medications",
      "Note any dosage changes",
      "Update Harbor with any changes",
      "Bring updated list to next doctor appointment",
    ],
    frequency: "quarterly",
  },
  {
    title: "Review insurance coverage",
    priority: "low",
    domain: "financial",
    why: "Insurance plans change annually — reviewing coverage helps avoid unexpected costs and ensures your parent has the right coverage.",
    suggestedActions: [
      "Check if plan premiums or copays have changed",
      "Verify current doctors are still in-network",
      "Review any new coverage options during open enrollment",
      "Update Harbor with any changes to policy number or provider",
    ],
    frequency: "annual",
  },
  {
    title: "Review advance directive",
    priority: "low",
    domain: "legal",
    why: "Life circumstances change — reviewing the advance directive ensures it still reflects your parent's wishes.",
    suggestedActions: [
      "Review the current advance directive with your parent",
      "Check if the named healthcare agent is still appropriate",
      "Discuss any changes in health wishes",
      "Update the document if needed and redistribute copies",
    ],
    frequency: "annual",
  },
  {
    title: "Review POA document",
    priority: "low",
    domain: "legal",
    why: "Financial situations evolve — ensuring the POA is current and the named agent is still appropriate protects your parent's interests.",
    suggestedActions: [
      "Verify the named agent is still willing and able to serve",
      "Check if any new financial accounts need to be covered",
      "Ensure banks still have the current POA on file",
      "Update the document if needed",
    ],
    frequency: "annual",
  },
  {
    title: "Check in on care plan",
    priority: "medium",
    domain: "caregiving",
    why: "Regular check-ins help catch emerging issues before they become crises and ensure the care plan matches current needs.",
    suggestedActions: [
      "Review your parent's current health status and any changes",
      "Check if current living arrangement still works",
      "Assess whether support needs have increased",
      "Update Harbor with any new information",
      "Discuss any concerns with family members or care providers",
    ],
    frequency: "semi-annual",
  },
];

export function createRecurringTask(template: RecurringTaskTemplate): Task {
  const now = new Date();
  const nextDueDate = calculateInitialDueDate(template.frequency, now);

  return {
    title: template.title,
    priority: template.priority,
    domain: template.domain,
    why: template.why,
    suggestedActions: template.suggestedActions,
    recurrence: {
      frequency: template.frequency,
      nextDueDate,
    },
  };
}

function calculateInitialDueDate(
  frequency: "monthly" | "quarterly" | "semi-annual" | "annual",
  from: Date
): string {
  const d = new Date(from);
  switch (frequency) {
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "semi-annual":
      d.setMonth(d.getMonth() + 6);
      break;
    case "annual":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.toISOString().split("T")[0];
}
