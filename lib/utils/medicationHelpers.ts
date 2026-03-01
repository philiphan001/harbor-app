import { getAllTaskData } from "./taskData";
import type { MedicationList } from "@/lib/types/taskCapture";
import type { MedicationData } from "@/lib/ingestion/types";

export interface EnrichedMedication {
  name: string;
  dosage?: string;
  frequency?: string;
  purpose?: string;
  prescriber?: string;
  pharmacy?: string;
  rxNumber?: string;
  refillsRemaining?: number;
  expirationDate?: string;
  // Computed
  refillStatus: "ok" | "low" | "empty" | "unknown";
  daysUntilExpiration?: number;
  needsRefill: boolean;
}

/**
 * Merge medication data from multiple sources (basic task capture + rich ingestion),
 * deduplicate by name, and compute refill status.
 */
export function getEnrichedMedications(): EnrichedMedication[] {
  const taskData = getAllTaskData();
  const medsMap = new Map<string, EnrichedMedication>();

  // 1. Basic medication lists from save_medication_list
  const basicEntries = taskData.filter((d) => d.toolName === "save_medication_list");
  for (const entry of basicEntries) {
    const medList = entry.data as MedicationList;
    if (medList.medications) {
      for (const med of medList.medications) {
        const key = med.name.toLowerCase().trim();
        if (!medsMap.has(key)) {
          medsMap.set(key, {
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            purpose: med.purpose,
            refillStatus: "unknown",
            needsRefill: false,
          });
        }
      }
    }
  }

  // 2. Rich medication data from upload_medication / ingestion
  const richEntries = taskData.filter(
    (d) => d.toolName === "upload_medication" || (d.data && "type" in d.data && (d.data as { type: string }).type === "medication")
  );
  for (const entry of richEntries) {
    const medData = entry.data as MedicationData;
    if (medData.medications) {
      for (const med of medData.medications) {
        const key = med.name.toLowerCase().trim();
        const existing = medsMap.get(key);
        if (existing) {
          // Merge rich data into existing
          if (med.dosage) existing.dosage = med.dosage;
          if (med.frequency) existing.frequency = med.frequency;
          if (med.prescriber) existing.prescriber = med.prescriber;
          if (med.purpose) existing.purpose = med.purpose;
          if (med.pharmacy) existing.pharmacy = med.pharmacy;
          if (med.rxNumber) existing.rxNumber = med.rxNumber;
          if (med.refillsRemaining !== undefined) existing.refillsRemaining = med.refillsRemaining;
          if (med.expirationDate) existing.expirationDate = med.expirationDate;
        } else {
          medsMap.set(key, {
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            purpose: med.purpose,
            prescriber: med.prescriber,
            pharmacy: med.pharmacy,
            rxNumber: med.rxNumber,
            refillsRemaining: med.refillsRemaining,
            expirationDate: med.expirationDate,
            refillStatus: "unknown",
            needsRefill: false,
          });
        }
      }
    }
  }

  // 3. Compute statuses
  const now = new Date();
  for (const med of medsMap.values()) {
    // Refill status
    if (med.refillsRemaining !== undefined) {
      if (med.refillsRemaining === 0) {
        med.refillStatus = "empty";
        med.needsRefill = true;
      } else if (med.refillsRemaining <= 1) {
        med.refillStatus = "low";
        med.needsRefill = true;
      } else {
        med.refillStatus = "ok";
      }
    }

    // Expiration
    if (med.expirationDate) {
      const exp = new Date(med.expirationDate);
      med.daysUntilExpiration = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (med.daysUntilExpiration <= 0) {
        med.refillStatus = "empty";
        med.needsRefill = true;
      } else if (med.daysUntilExpiration <= 30 && med.refillStatus !== "empty") {
        med.refillStatus = "low";
        med.needsRefill = true;
      }
    }
  }

  return Array.from(medsMap.values());
}

/**
 * Get medications that need refills or are expiring.
 */
export function getMedicationsNeedingRefill(): EnrichedMedication[] {
  return getEnrichedMedications().filter((m) => m.needsRefill);
}
