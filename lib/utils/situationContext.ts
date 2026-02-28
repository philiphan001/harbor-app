// Situation Context Storage - Converts parent profile to full situation context

import { SituationContext, createEmptySituationContext } from "@/lib/types/situationContext";
import { getParentProfile, getAllParentProfiles } from "./parentProfile";
import { getTaskDataForParent } from "./taskData";
import type { DoctorInfo, MedicationList, InsuranceInfo, LegalDocumentInfo } from "@/lib/types/taskCapture";

const SITUATION_CONTEXT_KEY = "harbor_situation_contexts";

/**
 * Build a situation context from parent profile and captured data
 * This is the bridge between user's captured data and the judgment agent
 */
export function getSituationContextFromProfile(parentId: string): SituationContext | null {
  const profile = getParentProfile(parentId);

  if (!profile) {
    return null;
  }

  // Start with empty context
  const context = createEmptySituationContext(
    profile.id,
    profile.name,
    profile.age || 75,
    profile.state || "Unknown"
  );

  // Populate from captured task data
  const taskData = getTaskDataForParent(profile.id);

  taskData.forEach((captured) => {
    const { toolName, data } = captured;

    // Map captured data to situation context
    switch (toolName) {
      case "save_doctor_info": {
        const doc = data as DoctorInfo;
        if (doc.specialty === "Primary Care" || !context.medical.primaryDoctor) {
          context.medical.primaryDoctor = {
            name: doc.name,
            phone: doc.phone,
            address: doc.address,
            specialty: doc.specialty,
          };
        } else {
          context.medical.specialists.push({
            name: doc.name,
            phone: doc.phone,
            address: doc.address,
            specialty: doc.specialty,
          });
        }
        break;
      }

      case "save_medication_list": {
        const medList = data as MedicationList;
        context.medical.medications = medList.medications || [];
        break;
      }

      case "save_insurance_info": {
        const ins = data as InsuranceInfo;
        context.medical.insurance = {
          provider: ins.provider || "",
          policyNumber: ins.policyNumber || "",
          groupNumber: ins.groupNumber,
          coverageType: "medicare", // Default for now
        };
        break;
      }

      case "save_legal_document_info": {
        const legal = data as LegalDocumentInfo;
        const legalStatus = (legal.status || "not_started") as "not_started" | "in_progress" | "completed";
        if (legal.documentType?.toLowerCase().includes("healthcare proxy")) {
          context.legal.healthcareProxy = {
            documentType: legal.documentType,
            status: legalStatus,
            agent: legal.agent,
            location: legal.location,
          };
        } else if (legal.documentType?.toLowerCase().includes("power of attorney")) {
          context.legal.powerOfAttorney = {
            documentType: legal.documentType,
            status: legalStatus,
            agent: legal.agent,
            location: legal.location,
          };
        }
        break;
      }

      default:
        // Store other data for future use
        break;
    }
  });

  context.lastUpdated = new Date().toISOString();

  return context;
}

/**
 * Save/update a situation context
 */
export function saveSituationContext(context: SituationContext): void {
  if (typeof window === "undefined") return;

  try {
    const existing = localStorage.getItem(SITUATION_CONTEXT_KEY);
    const contexts = existing ? JSON.parse(existing) : {};

    contexts[context.parentId] = context;

    localStorage.setItem(SITUATION_CONTEXT_KEY, JSON.stringify(contexts));
  } catch (error) {
    console.error("Error saving situation context:", error);
  }
}

/**
 * Get all situation contexts
 */
export function getAllSituationContexts(): Record<string, SituationContext> {
  if (typeof window === "undefined") return {};

  try {
    const stored = localStorage.getItem(SITUATION_CONTEXT_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Error loading situation contexts:", error);
    return {};
  }
}

export function clearSituationContexts(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SITUATION_CONTEXT_KEY);
}
