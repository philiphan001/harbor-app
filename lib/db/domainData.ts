// Database operations for domain-specific captured data
// Maps task capture tool names to the appropriate Prisma models

import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/utils/logger";
import { getSituationId } from "./profiles";
import {
  type SituationContext,
  type SituationSummaryExtras,
  createEmptySituationContext,
} from "@/lib/types/situationContext";

const log = createLogger("db/domainData");

// --- Save domain data by tool name ---

interface SaveDomainDataInput {
  parentId: string;
  toolName: string;
  taskTitle: string;
  data: Record<string, unknown>;
}

/**
 * Save captured data to the appropriate domain table based on toolName.
 */
export async function saveDomainData(input: SaveDomainDataInput): Promise<void> {
  const { parentId, toolName, taskTitle, data } = input;

  const situationId = await getSituationId(parentId);
  if (!situationId) {
    log.warn("No situation found for parent, skipping DB save", { parentId, toolName });
    return;
  }

  log.info("Saving domain data", { situationId, toolName, taskTitle });

  switch (toolName) {
    case "save_doctor_info":
      await saveProvider(situationId, data);
      break;
    case "save_medication_list":
      await saveMedications(situationId, data);
      break;
    case "save_insurance_info":
      await saveInsurance(situationId, data);
      break;
    case "save_legal_document_info":
      await saveLegalDocument(situationId, data);
      break;
    case "save_task_notes":
    case "manual_notes":
      // Notes don't map to a specific domain table — skip for now
      log.debug("Skipping notes save to DB", { toolName });
      break;
    default:
      // Upload-sourced data (upload_insurance_card, etc.)
      if (toolName.startsWith("upload_")) {
        await saveUploadData(situationId, toolName, data);
      } else {
        log.warn("Unknown tool name, skipping DB save", { toolName });
      }
      break;
  }
}

// --- Provider (Doctor Info) ---

async function saveProvider(
  situationId: string,
  data: Record<string, unknown>
): Promise<void> {
  const name = String(data.name || "Unknown Provider");

  await prisma.provider.upsert({
    where: {
      id: await findProviderIdByName(situationId, name),
    },
    update: {
      specialty: data.specialty ? String(data.specialty) : undefined,
      contactInfo: {
        phone: data.phone ? String(data.phone) : undefined,
        address: data.address ? String(data.address) : undefined,
      },
    },
    create: {
      situationId,
      name,
      specialty: data.specialty ? String(data.specialty) : undefined,
      contactInfo: {
        phone: data.phone ? String(data.phone) : undefined,
        address: data.address ? String(data.address) : undefined,
      },
    },
  });
}

async function findProviderIdByName(
  situationId: string,
  name: string
): Promise<string> {
  const existing = await prisma.provider.findFirst({
    where: { situationId, name },
  });
  return existing?.id ?? "no-match-will-create";
}

// --- Medications ---

async function saveMedications(
  situationId: string,
  data: Record<string, unknown>
): Promise<void> {
  const meds = (data.medications as Array<Record<string, unknown>>) || [];

  for (const med of meds) {
    const name = String(med.name || "Unknown Medication");

    // Upsert by name within situation
    const existing = await prisma.medication.findFirst({
      where: { situationId, name },
    });

    if (existing) {
      await prisma.medication.update({
        where: { id: existing.id },
        data: {
          dosage: med.dosage ? String(med.dosage) : existing.dosage,
          prescriber: med.prescriber ? String(med.prescriber) : existing.prescriber,
          purpose: med.purpose ? String(med.purpose) : existing.purpose,
        },
      });
    } else {
      await prisma.medication.create({
        data: {
          situationId,
          name,
          dosage: med.dosage ? String(med.dosage) : undefined,
          prescriber: med.prescriber ? String(med.prescriber) : undefined,
          purpose: med.purpose ? String(med.purpose) : undefined,
        },
      });
    }
  }
}

// --- Insurance → FinancialProfile ---

async function saveInsurance(
  situationId: string,
  data: Record<string, unknown>
): Promise<void> {
  const policy = {
    provider: data.provider ? String(data.provider) : undefined,
    policyNumber: data.policyNumber ? String(data.policyNumber) : undefined,
    groupNumber: data.groupNumber ? String(data.groupNumber) : undefined,
    phone: data.phone ? String(data.phone) : undefined,
  };

  await prisma.financialProfile.upsert({
    where: { situationId },
    update: {
      insurancePolicies: [policy],
    },
    create: {
      situationId,
      insurancePolicies: [policy],
    },
  });
}

// --- Legal Documents ---

async function saveLegalDocument(
  situationId: string,
  data: Record<string, unknown>
): Promise<void> {
  const docType = String(data.documentType || "other");

  // Upsert by document type within situation
  const existing = await prisma.legalDocument.findFirst({
    where: { situationId, documentType: docType },
  });

  const docData = {
    documentType: docType,
    exists: true,
    status: data.status ? String(data.status) : "uploaded",
    holder: data.agent ? String(data.agent) : undefined,
    notes: data.location ? `Location: ${String(data.location)}` : undefined,
    dateExecuted: data.dateCompleted ? new Date(String(data.dateCompleted)) : undefined,
  };

  if (existing) {
    await prisma.legalDocument.update({
      where: { id: existing.id },
      data: docData,
    });
  } else {
    await prisma.legalDocument.create({
      data: { situationId, ...docData },
    });
  }
}

// --- Upload-sourced data ---

async function saveUploadData(
  situationId: string,
  toolName: string,
  data: Record<string, unknown>
): Promise<void> {
  const type = data.type as string | undefined;

  switch (type) {
    case "insurance_card":
      await saveInsurance(situationId, {
        provider: data.provider,
        policyNumber: data.memberId,
        groupNumber: data.groupNumber,
        phone: data.customerServicePhone,
      });
      break;

    case "medication":
      await saveMedications(situationId, data);
      break;

    case "doctor_card":
      await saveProvider(situationId, data);
      break;

    case "legal_document":
      await saveLegalDocument(situationId, data);
      break;

    default:
      log.debug("Upload data type not mapped to domain table", {
        toolName,
        type: type ?? "unknown",
      });
      break;
  }
}

// --- Get all domain data for a situation ---

export interface SituationDomainData {
  providers: Array<{
    id: string;
    name: string;
    specialty?: string | null;
    contactInfo: unknown;
  }>;
  medications: Array<{
    id: string;
    name: string;
    dosage?: string | null;
    prescriber?: string | null;
    purpose?: string | null;
  }>;
  insurance: unknown | null;
  legalDocuments: Array<{
    id: string;
    documentType: string;
    status: string;
    exists: boolean;
    holder?: string | null;
  }>;
}

/**
 * Build a full SituationContext from the database for a given situationId.
 * Used by the briefing pipeline to replace the hollow createEmptySituationContext.
 */
export interface SituationContextWithExtras {
  context: SituationContext;
  extras: SituationSummaryExtras;
}

export async function buildSituationContextFromDb(
  situationId: string
): Promise<SituationContextWithExtras | null> {
  const situation = await prisma.situation.findUnique({
    where: { id: situationId },
  });

  if (!situation) {
    log.warn("Situation not found", { situationId });
    return null;
  }

  const loc = situation.elderLocation as { state?: string; city?: string; zip?: string } | null;

  const context = createEmptySituationContext(
    situation.elderName.toLowerCase().replace(/\s+/g, "-"),
    situation.elderName,
    situation.elderAge ?? 75,
    loc?.state ?? "Unknown"
  );

  // Set city/zip
  if (loc?.city) context.profile.city = loc.city;
  if (loc?.zip) context.profile.zip = loc.zip;

  // Set living arrangement
  if (situation.currentLivingSituation) {
    const validTypes = ["independent", "with_family", "assisted_living", "nursing_home", "other"] as const;
    const matched = validTypes.find((t) => t === situation.currentLivingSituation);
    if (matched) context.profile.livingArrangement = matched;
  }

  // Query domain data in parallel
  const [providers, medications, conditions, financialProfile, legalDocuments, housing, pendingTasks, readinessHistory] =
    await Promise.all([
      prisma.provider.findMany({ where: { situationId } }),
      prisma.medication.findMany({ where: { situationId } }),
      prisma.medicalCondition.findMany({ where: { situationId } }),
      prisma.financialProfile.findUnique({ where: { situationId } }),
      prisma.legalDocument.findMany({ where: { situationId } }),
      prisma.housingAssessment.findUnique({ where: { situationId } }),
      prisma.task.findMany({
        where: { situationId, status: { in: ["pending", "in_progress"] } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.readinessHistory.findMany({
        where: { situationId },
        orderBy: { recordedAt: "desc" },
        take: 1,
      }),
    ]);

  // --- Medical ---
  if (providers.length > 0) {
    const first = providers[0];
    const contact = first.contactInfo as { phone?: string; address?: string } | null;
    context.medical.primaryDoctor = {
      name: first.name,
      phone: contact?.phone ?? "",
      address: contact?.address,
      specialty: first.specialty ?? undefined,
    };
    context.medical.specialists = providers.slice(1).map((p) => {
      const c = p.contactInfo as { phone?: string; address?: string } | null;
      return {
        name: p.name,
        phone: c?.phone ?? "",
        address: c?.address,
        specialty: p.specialty ?? undefined,
      };
    });
  }

  context.medical.medications = medications.map((m) => ({
    name: m.name,
    dosage: m.dosage ?? "",
    frequency: "",
    purpose: m.purpose ?? undefined,
    prescribingDoctor: m.prescriber ?? undefined,
  }));

  context.medical.conditions = conditions.map((c) => c.name);

  // Insurance from financial profile
  if (financialProfile?.insurancePolicies) {
    const policies = financialProfile.insurancePolicies as Array<{
      provider?: string;
      policyNumber?: string;
      groupNumber?: string;
      phone?: string;
    }>;
    if (policies.length > 0) {
      const p = policies[0];
      context.medical.insurance = {
        provider: p.provider ?? "",
        policyNumber: p.policyNumber ?? "",
        groupNumber: p.groupNumber,
        phone: p.phone,
        coverageType: "medicare",
      };
    }
  }

  // --- Financial ---
  if (financialProfile) {
    const income = financialProfile.incomeSources as Array<{ monthlyAmount?: number }> | null;
    if (income && income.length > 0) {
      context.financial.monthlyIncome = income.reduce(
        (sum, s) => sum + (s.monthlyAmount ?? 0),
        0
      );
    }
    const assets = financialProfile.assets as { savings?: number; investments?: number; retirement?: number; homeEquity?: number; other?: number } | null;
    if (assets) {
      context.financial.assets =
        (assets.savings ?? 0) + (assets.investments ?? 0) + (assets.retirement ?? 0) + (assets.other ?? 0);
    }
    if (financialProfile.projectedRunwayMonths != null) {
      context.financial.spendDownProjection = {
        monthsRemaining: financialProfile.projectedRunwayMonths,
        projectedMedicaidDate: financialProfile.medicaidEligibleDate?.toISOString() ?? "",
        currentBurnRate: financialProfile.projectedMonthlyGap ? Number(financialProfile.projectedMonthlyGap) : 0,
        assumptions: "",
      };
    }
  }

  // --- Legal ---
  for (const doc of legalDocuments) {
    const mapped = {
      documentType: doc.documentType,
      status: (doc.status === "uploaded" || doc.status === "verified" ? "completed" : doc.status === "needs_update" ? "in_progress" : "not_started") as "completed" | "in_progress" | "not_started",
      agent: doc.holder ?? undefined,
      dateCompleted: doc.dateExecuted?.toISOString(),
      notes: doc.notes ?? undefined,
    };

    switch (doc.documentType) {
      case "healthcare_proxy":
        context.legal.healthcareProxy = mapped;
        break;
      case "poa":
        context.legal.powerOfAttorney = mapped;
        break;
      case "will":
        context.legal.will = mapped;
        break;
      case "dnr":
        context.legal.advanceDirective = mapped;
        break;
      default:
        context.legal.other.push(mapped);
    }
  }

  // --- Housing ---
  if (housing) {
    const validTypes = ["independent", "with_family", "assisted_living", "nursing_home", "continuing_care"] as const;
    const hType = validTypes.find((t) => t === housing.homeType);
    if (hType) context.housing.currentType = hType;

    const safetyItems = housing.safetyItems as Record<string, boolean> | null;
    if (safetyItems) {
      context.housing.safetyIssues = Object.entries(safetyItems)
        .filter(([, v]) => v === false)
        .map(([k]) => k);
    }
    if (housing.modificationItems.length > 0) {
      context.housing.modifications = housing.modificationItems;
    }
    context.housing.accessibilityNeeds = housing.riskLevel === "high" || housing.riskLevel === "critical"
      ? ["High risk - assessment needed"]
      : [];
  }

  // --- Caregiving gaps from pending tasks ---
  if (pendingTasks.length > 0) {
    context.caregiving.gaps = pendingTasks
      .filter((t) => t.priority === "high" || t.priority === "urgent")
      .map((t) => t.title);
  }

  context.lastUpdated = situation.updatedAt.toISOString();

  // Build extras for enriched summary
  const extras: SituationSummaryExtras = {};

  if (readinessHistory.length > 0) {
    extras.readinessScore = readinessHistory[0].score;
  }

  extras.pendingTaskCount = pendingTasks.length;

  const overdue = pendingTasks.filter(
    (t) => t.dueDate && t.dueDate < new Date()
  );
  if (overdue.length > 0) {
    extras.overdueTasks = overdue.map((t) => t.title);
  }

  return { context, extras };
}

export async function getDomainData(parentId: string): Promise<SituationDomainData | null> {
  const situationId = await getSituationId(parentId);
  if (!situationId) return null;

  const [providers, medications, financialProfile, legalDocuments] =
    await Promise.all([
      prisma.provider.findMany({ where: { situationId } }),
      prisma.medication.findMany({ where: { situationId } }),
      prisma.financialProfile.findUnique({ where: { situationId } }),
      prisma.legalDocument.findMany({ where: { situationId } }),
    ]);

  return {
    providers: providers.map((p) => ({
      id: p.id,
      name: p.name,
      specialty: p.specialty,
      contactInfo: p.contactInfo,
    })),
    medications: medications.map((m) => ({
      id: m.id,
      name: m.name,
      dosage: m.dosage,
      prescriber: m.prescriber,
      purpose: m.purpose,
    })),
    insurance: financialProfile?.insurancePolicies ?? null,
    legalDocuments: legalDocuments.map((l) => ({
      id: l.id,
      documentType: l.documentType,
      status: l.status,
      exists: l.exists,
      holder: l.holder,
    })),
  };
}
