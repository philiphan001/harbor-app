// Situation Context Service - storage and management of parent's complete situation

import { SituationContext, createEmptySituationContext } from "@/lib/types/situationContext";

const STORAGE_KEY = "harbor_situation_contexts";

// ==================== Core CRUD Operations ====================

export function getSituationContext(parentId: string): SituationContext | null {
  if (typeof window === "undefined") return null;

  try {
    const allContexts = getAllContexts();
    return allContexts.find((ctx) => ctx.parentId === parentId) || null;
  } catch (error) {
    console.error("Error reading situation context:", error);
    return null;
  }
}

export function saveSituationContext(context: SituationContext): void {
  if (typeof window === "undefined") return;

  try {
    const allContexts = getAllContexts();
    const existingIndex = allContexts.findIndex((ctx) => ctx.parentId === context.parentId);

    // Update timestamp
    context.lastUpdated = new Date().toISOString();

    if (existingIndex >= 0) {
      allContexts[existingIndex] = context;
    } else {
      allContexts.push(context);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allContexts));
    console.log("💾 Saved situation context for parent:", context.parentId);
  } catch (error) {
    console.error("Error saving situation context:", error);
  }
}

export function getAllContexts(): SituationContext[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading all contexts:", error);
    return [];
  }
}

export function deleteSituationContext(parentId: string): void {
  if (typeof window === "undefined") return;

  try {
    const allContexts = getAllContexts();
    const filtered = allContexts.filter((ctx) => ctx.parentId !== parentId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log("🗑️ Deleted situation context for parent:", parentId);
  } catch (error) {
    console.error("Error deleting situation context:", error);
  }
}

// ==================== Initialization ====================

export function initializeSituationContext(
  parentId: string,
  name: string,
  age: number,
  state: string
): SituationContext {
  const existingContext = getSituationContext(parentId);
  if (existingContext) {
    console.log("⚠️ Context already exists for parent:", parentId);
    return existingContext;
  }

  const newContext = createEmptySituationContext(parentId, name, age, state);
  saveSituationContext(newContext);
  console.log("✅ Initialized new situation context for:", name);
  return newContext;
}

// ==================== Domain-Specific Updates ====================

export function updateProfile(
  parentId: string,
  updates: Partial<SituationContext["profile"]>
): void {
  const context = getSituationContext(parentId);
  if (!context) {
    console.error("Context not found for parent:", parentId);
    return;
  }

  context.profile = { ...context.profile, ...updates };
  saveSituationContext(context);
}

export function updateMedical(
  parentId: string,
  updates: Partial<SituationContext["medical"]>
): void {
  const context = getSituationContext(parentId);
  if (!context) {
    console.error("Context not found for parent:", parentId);
    return;
  }

  context.medical = { ...context.medical, ...updates };
  saveSituationContext(context);
}

export function updateFinancial(
  parentId: string,
  updates: Partial<SituationContext["financial"]>
): void {
  const context = getSituationContext(parentId);
  if (!context) {
    console.error("Context not found for parent:", parentId);
    return;
  }

  context.financial = { ...context.financial, ...updates };
  saveSituationContext(context);
}

export function updateLegal(
  parentId: string,
  updates: Partial<SituationContext["legal"]>
): void {
  const context = getSituationContext(parentId);
  if (!context) {
    console.error("Context not found for parent:", parentId);
    return;
  }

  context.legal = { ...context.legal, ...updates };
  saveSituationContext(context);
}

export function updateHousing(
  parentId: string,
  updates: Partial<SituationContext["housing"]>
): void {
  const context = getSituationContext(parentId);
  if (!context) {
    console.error("Context not found for parent:", parentId);
    return;
  }

  context.housing = { ...context.housing, ...updates };
  saveSituationContext(context);
}

export function updateFamily(
  parentId: string,
  updates: Partial<SituationContext["family"]>
): void {
  const context = getSituationContext(parentId);
  if (!context) {
    console.error("Context not found for parent:", parentId);
    return;
  }

  context.family = { ...context.family, ...updates };
  saveSituationContext(context);
}

export function updateCaregiving(
  parentId: string,
  updates: Partial<SituationContext["caregiving"]>
): void {
  const context = getSituationContext(parentId);
  if (!context) {
    console.error("Context not found for parent:", parentId);
    return;
  }

  context.caregiving = { ...context.caregiving, ...updates };
  saveSituationContext(context);
}

// ==================== Array Item Management ====================

export function addMedication(parentId: string, medication: SituationContext["medical"]["medications"][0]): void {
  const context = getSituationContext(parentId);
  if (!context) return;

  context.medical.medications.push(medication);
  saveSituationContext(context);
}

export function removeMedication(parentId: string, medicationName: string): void {
  const context = getSituationContext(parentId);
  if (!context) return;

  context.medical.medications = context.medical.medications.filter(
    (med) => med.name !== medicationName
  );
  saveSituationContext(context);
}

export function addSpecialist(parentId: string, doctor: SituationContext["medical"]["specialists"][0]): void {
  const context = getSituationContext(parentId);
  if (!context) return;

  context.medical.specialists.push(doctor);
  saveSituationContext(context);
}

export function addCaregivingSupport(
  parentId: string,
  support: SituationContext["caregiving"]["currentSupport"][0]
): void {
  const context = getSituationContext(parentId);
  if (!context) return;

  context.caregiving.currentSupport.push(support);
  saveSituationContext(context);
}

export function addFamilyMember(
  parentId: string,
  member: SituationContext["family"]["otherChildren"][0],
  role: "child" | "spouse" | "other" = "other"
): void {
  const context = getSituationContext(parentId);
  if (!context) return;

  if (role === "child") {
    context.family.otherChildren.push(member);
  } else if (role === "spouse") {
    context.family.spouse = member;
  } else {
    context.family.otherFamily.push(member);
  }
  saveSituationContext(context);
}

// ==================== Migration from Existing Data ====================

export function migrateFromParentProfile(parentProfile: { id?: string; name?: string; age?: number; state?: string }): string {
  // Generate parentId from name (or use existing if available)
  const parentId = parentProfile.id || `parent_${Date.now()}`;

  const existingContext = getSituationContext(parentId);
  if (existingContext) {
    console.log("⚠️ Context already exists, skipping migration");
    return parentId;
  }

  const newContext = initializeSituationContext(
    parentId,
    parentProfile.name || "Parent",
    parentProfile.age || 75,
    parentProfile.state || "Unknown"
  );

  console.log("✅ Migrated parent profile to situation context");
  return parentId;
}

export function migrateFromTaskData(parentId: string, taskData: Array<{ toolName: string; data: Record<string, unknown> }>): void {
  const context = getSituationContext(parentId);
  if (!context) {
    console.error("Context not found for parent:", parentId);
    return;
  }

  for (const item of taskData) {
    const { toolName, data } = item;

    // Migrate based on tool name
    if (toolName === "save_doctor_info") {
      const doc = data as unknown as { name: string; phone: string; address?: string; specialty?: string };
      if (doc.specialty) {
        addSpecialist(parentId, doc);
      } else {
        context.medical.primaryDoctor = doc;
      }
    } else if (toolName === "save_medication_list") {
      const medData = data as unknown as { medications: SituationContext["medical"]["medications"] };
      context.medical.medications = medData.medications;
    } else if (toolName === "save_insurance_info") {
      const ins = data as unknown as { provider: string; policyNumber: string; groupNumber?: string; phone?: string };
      context.medical.insurance = {
        provider: ins.provider,
        policyNumber: ins.policyNumber,
        groupNumber: ins.groupNumber,
        phone: ins.phone,
        coverageType: "medicare", // default
      };
    } else if (toolName === "save_legal_document_info") {
      const rawLegal = data as unknown as { documentType: string; status: string; agent?: string; location?: string; dateExpires?: string };
      const legal = {
        ...rawLegal,
        status: (rawLegal.status || "not_started") as "not_started" | "in_progress" | "completed",
      };
      if (legal.documentType.toLowerCase().includes("healthcare")) {
        context.legal.healthcareProxy = legal;
      } else if (legal.documentType.toLowerCase().includes("power")) {
        context.legal.powerOfAttorney = legal;
      } else if (legal.documentType.toLowerCase().includes("will")) {
        context.legal.will = legal;
      } else {
        context.legal.other.push(legal);
      }
    }
  }

  saveSituationContext(context);
  console.log("✅ Migrated task data to situation context");
}
