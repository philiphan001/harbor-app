// Database operations for domain-specific captured data
// Maps task capture tool names to the appropriate Prisma models

import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/utils/logger";
import { getSituationId } from "./profiles";

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
