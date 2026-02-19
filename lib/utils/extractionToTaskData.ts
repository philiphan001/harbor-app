// Bridge between document extraction results and the task data / care summary system.
// Converts ExtractedData from uploads into the same toolName + data shape
// that careSummary.ts expects (save_doctor_info, save_insurance_info, etc.)

import type { ExtractedData } from "@/lib/ingestion/types";
import type {
  DoctorInfo,
  MedicationList,
  InsuranceInfo,
  LegalDocumentInfo,
  TaskDataPayload,
} from "@/lib/types/taskCapture";
import { saveTaskData } from "./taskData";

interface NormalizedEntry {
  taskTitle: string;
  toolName: string;
  data: TaskDataPayload;
}

/**
 * Convert extraction data into normalized task data entries
 * that the care summary system can read.
 */
export function normalizeExtractionData(
  extractedData: ExtractedData,
  sourceFileName: string
): NormalizedEntry[] {
  const entries: NormalizedEntry[] = [];

  switch (extractedData.type) {
    case "insurance_card": {
      const ins: InsuranceInfo = {
        provider: extractedData.provider,
        policyNumber: extractedData.memberId,
        groupNumber: extractedData.groupNumber,
        phone: extractedData.customerServicePhone,
      };
      entries.push({
        taskTitle: `Insurance: ${extractedData.provider || sourceFileName}`,
        toolName: "save_insurance_info",
        data: ins,
      });
      break;
    }

    case "doctor_card": {
      const doc: DoctorInfo = {
        name: extractedData.name,
        phone: extractedData.phone || "",
        address: extractedData.address,
        specialty: extractedData.specialty,
      };
      entries.push({
        taskTitle: `Doctor: ${extractedData.name || sourceFileName}`,
        toolName: "save_doctor_info",
        data: doc,
      });
      break;
    }

    case "medication": {
      const meds: MedicationList = {
        medications: extractedData.medications.map((m) => ({
          name: m.name,
          dosage: m.dosage || "",
          frequency: m.frequency || "",
          purpose: m.purpose,
        })),
      };
      entries.push({
        taskTitle: "Medications",
        toolName: "save_medication_list",
        data: meds,
      });
      break;
    }

    case "legal_document": {
      const agent = extractedData.parties?.find(
        (p) => p.role.toLowerCase() === "agent" || p.role.toLowerCase() === "proxy"
      );
      const legal: LegalDocumentInfo = {
        documentType: extractedData.documentType,
        status: extractedData.status,
        agent: agent?.name,
        location: undefined,
        dateCompleted: extractedData.dateExecuted,
      };
      entries.push({
        taskTitle: `Legal: ${extractedData.documentType || extractedData.title || sourceFileName}`,
        toolName: "save_legal_document_info",
        data: legal,
      });
      break;
    }

    case "discharge_summary": {
      // Save medications from discharge as a medication list
      if (extractedData.medicationsAtDischarge && extractedData.medicationsAtDischarge.length > 0) {
        const dischargeMeds: MedicationList = {
          medications: extractedData.medicationsAtDischarge.map((m) => ({
            name: m.name,
            dosage: m.dosage || "",
            frequency: m.frequency || "",
            purpose: "At discharge",
          })),
        };
        entries.push({
          taskTitle: "Medications (Discharge)",
          toolName: "save_medication_list",
          data: dischargeMeds,
        });
      }

      // Save primary physician if present
      if (extractedData.primaryPhysician) {
        const doc: DoctorInfo = {
          name: extractedData.primaryPhysician,
          phone: "",
        };
        entries.push({
          taskTitle: `Doctor: ${extractedData.primaryPhysician}`,
          toolName: "save_doctor_info",
          data: doc,
        });
      }

      // Save the full discharge summary as notes
      const summaryParts: string[] = [];
      if (extractedData.facility) summaryParts.push(`Facility: ${extractedData.facility}`);
      if (extractedData.admitDate) summaryParts.push(`Admitted: ${extractedData.admitDate}`);
      if (extractedData.dischargeDate) summaryParts.push(`Discharged: ${extractedData.dischargeDate}`);
      if (extractedData.diagnoses?.length) summaryParts.push(`Diagnoses: ${extractedData.diagnoses.join(", ")}`);
      if (extractedData.followUpInstructions?.length) summaryParts.push(`Follow-up: ${extractedData.followUpInstructions.join("; ")}`);
      if (extractedData.restrictions?.length) summaryParts.push(`Restrictions: ${extractedData.restrictions.join("; ")}`);

      if (summaryParts.length > 0) {
        entries.push({
          taskTitle: `Discharge Summary — ${extractedData.facility || sourceFileName}`,
          toolName: "save_task_notes",
          data: { notes: summaryParts.join("\n"), complete: true },
        });
      }
      break;
    }

    case "lab_results": {
      const labParts: string[] = [];
      if (extractedData.facility) labParts.push(`Lab: ${extractedData.facility}`);
      if (extractedData.resultDate) labParts.push(`Date: ${extractedData.resultDate}`);
      if (extractedData.orderingPhysician) labParts.push(`Ordered by: ${extractedData.orderingPhysician}`);

      const flagged = extractedData.results.filter((r) => r.flag && r.flag !== "normal");
      if (flagged.length > 0) {
        labParts.push(`Flagged results: ${flagged.map((r) => `${r.testName}: ${r.value} ${r.unit || ""} (${r.flag})`).join("; ")}`);
      }

      entries.push({
        taskTitle: `Lab Results — ${extractedData.facility || sourceFileName}`,
        toolName: "save_task_notes",
        data: { notes: labParts.join("\n"), complete: true },
      });
      break;
    }

    case "bill_statement": {
      const billParts: string[] = [];
      if (extractedData.provider) billParts.push(`Provider: ${extractedData.provider}`);
      if (extractedData.serviceDate) billParts.push(`Service Date: ${extractedData.serviceDate}`);
      if (extractedData.amountDue) billParts.push(`Amount Due: ${extractedData.amountDue}`);
      if (extractedData.dueDate) billParts.push(`Due: ${extractedData.dueDate}`);
      if (extractedData.insurancePaid) billParts.push(`Insurance Paid: ${extractedData.insurancePaid}`);

      entries.push({
        taskTitle: `Bill — ${extractedData.provider || sourceFileName}`,
        toolName: "save_task_notes",
        data: { notes: billParts.join("\n") },
      });
      break;
    }

    case "other": {
      const parts: string[] = [];
      if (extractedData.summary) parts.push(extractedData.summary);
      if (extractedData.keyFacts?.length) parts.push(`Key facts: ${extractedData.keyFacts.join("; ")}`);

      entries.push({
        taskTitle: extractedData.title || sourceFileName,
        toolName: "save_task_notes",
        data: { notes: parts.join("\n") },
      });
      break;
    }
  }

  return entries;
}

/**
 * Save extraction data as normalized task data entries.
 * This bridges document uploads into the care summary system.
 */
export function saveExtractionAsTaskData(
  extractedData: ExtractedData,
  sourceFileName: string
): void {
  const entries = normalizeExtractionData(extractedData, sourceFileName);

  for (const entry of entries) {
    saveTaskData(entry.taskTitle, entry.toolName, entry.data);
  }

  console.log(
    `📄 Saved ${entries.length} task data entries from extraction of ${sourceFileName}`
  );
}
