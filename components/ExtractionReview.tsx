"use client";

import { useState, useCallback } from "react";
import {
  type ExtractionResult,
  type ExtractedData,
  type InsuranceCardData,
  type MedicationData,
  type DoctorCardData,
  type LegalDocumentData,
  type DischargeSummaryData,
  type BillStatementData,
  type LabResultsData,
  type GenericDocumentData,
  getDocumentTypeLabel,
} from "@/lib/ingestion/types";

interface ExtractionReviewProps {
  uploadId: string;
  fileName: string;
  extraction: ExtractionResult;
  parentId: string;
  onConfirm: (confirmedData: ExtractedData) => void;
  onReject: () => void;
}

export default function ExtractionReview({
  uploadId,
  fileName,
  extraction,
  parentId,
  onConfirm,
  onReject,
}: ExtractionReviewProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editedJson, setEditedJson] = useState(
    JSON.stringify(extraction.data, null, 2)
  );

  const confidencePercent = Math.round(extraction.confidence * 100);
  const confidenceColor =
    confidencePercent >= 80
      ? "text-green-600"
      : confidencePercent >= 50
        ? "text-amber-600"
        : "text-red-600";

  const dismissError = useCallback(() => setErrorMsg(null), []);

  const handleConfirm = async () => {
    setIsConfirming(true);
    setErrorMsg(null);
    try {
      let dataToConfirm = extraction.data;

      if (editMode) {
        try {
          dataToConfirm = JSON.parse(editedJson);
        } catch {
          setErrorMsg("Invalid JSON. Please fix the formatting and try again.");
          setIsConfirming(false);
          return;
        }
      }

      // Call confirm API
      const response = await fetch("/api/upload/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadId,
          parentId,
          documentType: extraction.documentType,
          confirmedData: dataToConfirm,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to confirm");
      }

      onConfirm(dataToConfirm);
    } catch {
      setErrorMsg("Failed to save. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
        <div>
          <h3 className="font-medium text-slate-700">
            {getDocumentTypeLabel(extraction.documentType)}
          </h3>
          <p className="text-xs text-slate-400">{fileName}</p>
        </div>
        <div className={`text-sm font-medium ${confidenceColor}`}>
          {confidencePercent}% confidence
        </div>
      </div>

      {/* Extracted Data Display */}
      <div className="p-4">
        {extraction.confidence < 0.5 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            Low confidence extraction. Please review carefully and edit any incorrect fields.
          </div>
        )}

        {extraction.warnings && extraction.warnings.length > 0 && (
          <div className="mb-4 space-y-2">
            {extraction.warnings.map((warning, i) => (
              <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex gap-2">
                <span className="flex-shrink-0">&#9888;</span>
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}

        {editMode ? (
          <div className="space-y-3">
            <textarea
              value={editedJson}
              onChange={(e) => setEditedJson(e.target.value)}
              className="w-full h-64 font-mono text-xs p-3 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-ocean/30"
              spellCheck={false}
            />
            <button
              onClick={() => setEditMode(false)}
              className="text-sm text-ocean hover:underline"
            >
              Back to formatted view
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <DataDisplay data={extraction.data} />
            <button
              onClick={() => setEditMode(true)}
              className="text-sm text-ocean hover:underline"
            >
              Edit raw data
            </button>
          </div>
        )}
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="mx-4 mb-2 px-3 py-2 bg-coral/10 border border-coral/30 rounded-lg flex items-center justify-between">
          <span className="font-sans text-sm text-coral">{errorMsg}</span>
          <button onClick={dismissError} className="text-coral/60 hover:text-coral ml-2 text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Actions */}
      <div className="bg-gray-50 px-4 py-3 border-t flex gap-3">
        <button
          onClick={handleConfirm}
          disabled={isConfirming}
          className="flex-1 bg-ocean text-white py-2.5 px-4 rounded-lg font-medium hover:bg-ocean/90 transition-colors disabled:opacity-50"
        >
          {isConfirming ? "Saving..." : "Looks Good — Save"}
        </button>
        <button
          onClick={onReject}
          disabled={isConfirming}
          className="px-4 py-2.5 rounded-lg border border-gray-300 text-slate-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          Discard
        </button>
      </div>
    </div>
  );
}

// --- Formatted data display by type ---

function DataDisplay({ data }: { data: ExtractedData }) {
  switch (data.type) {
    case "insurance_card":
      return <InsuranceDisplay data={data} />;
    case "medication":
      return <MedicationDisplay data={data} />;
    case "doctor_card":
      return <DoctorDisplay data={data} />;
    case "legal_document":
      return <LegalDisplay data={data} />;
    case "discharge_summary":
      return <DischargeDisplay data={data} />;
    case "bill_statement":
      return <BillDisplay data={data} />;
    case "lab_results":
      return <LabDisplay data={data} />;
    case "other":
      return <GenericDisplay data={data} />;
    default:
      return <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>;
  }
}

function Field({ label, value }: { label: string; value: string | number | undefined | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-700 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-3 mb-1">{children}</h4>;
}

function InsuranceDisplay({ data }: { data: InsuranceCardData }) {
  return (
    <div>
      <Field label="Provider" value={data.provider} />
      <Field label="Plan" value={data.planName} />
      <Field label="Member ID" value={data.memberId} />
      <Field label="Group #" value={data.groupNumber} />
      <Field label="Phone" value={data.customerServicePhone} />
      <Field label="Effective" value={data.effectiveDate} />
      {data.rxBin && <SectionTitle>Pharmacy Benefits</SectionTitle>}
      <Field label="Rx BIN" value={data.rxBin} />
      <Field label="Rx PCN" value={data.rxPcn} />
      <Field label="Rx Group" value={data.rxGroup} />
      {data.copays && <SectionTitle>Copays</SectionTitle>}
      {data.copays && (
        <>
          <Field label="Primary Care" value={data.copays.primaryCare} />
          <Field label="Specialist" value={data.copays.specialist} />
          <Field label="ER" value={data.copays.emergencyRoom} />
          <Field label="Generic Rx" value={data.copays.genericRx} />
          <Field label="Brand Rx" value={data.copays.brandRx} />
        </>
      )}
    </div>
  );
}

function MedicationDisplay({ data }: { data: MedicationData }) {
  return (
    <div className="space-y-3">
      {data.medications.map((med, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-3">
          <p className="font-medium text-slate-700">{med.name}</p>
          <Field label="Dosage" value={med.dosage} />
          <Field label="Frequency" value={med.frequency} />
          <Field label="Prescriber" value={med.prescriber} />
          <Field label="Purpose" value={med.purpose} />
          <Field label="Pharmacy" value={med.pharmacy} />
          <Field label="Rx #" value={med.rxNumber} />
          <Field label="Refills" value={med.refillsRemaining} />
          <Field label="Expires" value={med.expirationDate} />
        </div>
      ))}
    </div>
  );
}

function DoctorDisplay({ data }: { data: DoctorCardData }) {
  return (
    <div>
      <Field label="Name" value={data.name} />
      <Field label="Specialty" value={data.specialty} />
      <Field label="Practice" value={data.practice} />
      <Field label="Phone" value={data.phone} />
      <Field label="Fax" value={data.fax} />
      <Field label="Address" value={data.address} />
      <Field label="Website" value={data.website} />
      <Field label="NPI" value={data.npi} />
    </div>
  );
}

function LegalDisplay({ data }: { data: LegalDocumentData }) {
  return (
    <div>
      <Field label="Document Type" value={data.documentType} />
      <Field label="Title" value={data.title} />
      <Field label="Date Executed" value={data.dateExecuted} />
      <Field label="State" value={data.state} />
      <Field label="Status" value={data.status} />
      {data.parties && data.parties.length > 0 && (
        <>
          <SectionTitle>Parties</SectionTitle>
          {data.parties.map((p, i) => (
            <Field key={i} label={p.role} value={p.name} />
          ))}
        </>
      )}
      {data.keyProvisions && data.keyProvisions.length > 0 && (
        <>
          <SectionTitle>Key Provisions</SectionTitle>
          <ul className="text-sm text-slate-600 list-disc pl-4 space-y-1">
            {data.keyProvisions.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function DischargeDisplay({ data }: { data: DischargeSummaryData }) {
  return (
    <div>
      <Field label="Facility" value={data.facility} />
      <Field label="Admitted" value={data.admitDate} />
      <Field label="Discharged" value={data.dischargeDate} />
      <Field label="Primary Doctor" value={data.primaryPhysician} />
      {data.diagnoses && data.diagnoses.length > 0 && (
        <>
          <SectionTitle>Diagnoses</SectionTitle>
          <ul className="text-sm text-slate-600 list-disc pl-4 space-y-1">
            {data.diagnoses.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </>
      )}
      {data.medicationsAtDischarge && data.medicationsAtDischarge.length > 0 && (
        <>
          <SectionTitle>Medications at Discharge</SectionTitle>
          {data.medicationsAtDischarge.map((med, i) => (
            <div key={i} className="bg-gray-50 rounded p-2 mb-1 text-sm">
              <span className="font-medium">{med.name}</span>
              {med.dosage && <span className="text-slate-500"> {med.dosage}</span>}
              {med.frequency && <span className="text-slate-500"> — {med.frequency}</span>}
            </div>
          ))}
        </>
      )}
      {data.followUpInstructions && data.followUpInstructions.length > 0 && (
        <>
          <SectionTitle>Follow-Up</SectionTitle>
          <ul className="text-sm text-slate-600 list-disc pl-4 space-y-1">
            {data.followUpInstructions.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </>
      )}
      {data.restrictions && data.restrictions.length > 0 && (
        <>
          <SectionTitle>Restrictions</SectionTitle>
          <ul className="text-sm text-slate-600 list-disc pl-4 space-y-1">
            {data.restrictions.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function BillDisplay({ data }: { data: BillStatementData }) {
  return (
    <div>
      <Field label="Provider" value={data.provider} />
      <Field label="Service Date" value={data.serviceDate} />
      <Field label="Total Amount" value={data.totalAmount} />
      <Field label="Insurance Paid" value={data.insurancePaid} />
      <Field label="Amount Due" value={data.amountDue} />
      <Field label="Due Date" value={data.dueDate} />
      <Field label="Account #" value={data.accountNumber} />
      {data.services && data.services.length > 0 && (
        <>
          <SectionTitle>Services</SectionTitle>
          {data.services.map((s, i) => (
            <div key={i} className="flex justify-between text-sm py-1">
              <span className="text-slate-600">{s.description}</span>
              <span className="font-medium">{s.amount}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function LabDisplay({ data }: { data: LabResultsData }) {
  return (
    <div>
      <Field label="Lab" value={data.facility} />
      <Field label="Order Date" value={data.orderDate} />
      <Field label="Result Date" value={data.resultDate} />
      <Field label="Ordering Doctor" value={data.orderingPhysician} />
      {data.results.length > 0 && (
        <>
          <SectionTitle>Results</SectionTitle>
          <div className="space-y-1">
            {data.results.map((r, i) => (
              <div
                key={i}
                className={`flex justify-between text-sm py-1.5 px-2 rounded ${
                  r.flag === "high" || r.flag === "critical"
                    ? "bg-red-50"
                    : r.flag === "low"
                      ? "bg-amber-50"
                      : ""
                }`}
              >
                <span className="text-slate-600">{r.testName}</span>
                <span className="font-medium">
                  {r.value}
                  {r.unit && <span className="text-slate-400 text-xs ml-1">{r.unit}</span>}
                  {r.flag && r.flag !== "normal" && (
                    <span
                      className={`ml-2 text-xs font-semibold ${
                        r.flag === "critical"
                          ? "text-red-700"
                          : r.flag === "high"
                            ? "text-red-600"
                            : "text-amber-600"
                      }`}
                    >
                      {r.flag.toUpperCase()}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function GenericDisplay({ data }: { data: GenericDocumentData }) {
  return (
    <div>
      <Field label="Title" value={data.title} />
      {data.summary && (
        <p className="text-sm text-slate-600 mt-2">{data.summary}</p>
      )}
      {data.keyFacts.length > 0 && (
        <>
          <SectionTitle>Key Facts</SectionTitle>
          <ul className="text-sm text-slate-600 list-disc pl-4 space-y-1">
            {data.keyFacts.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </>
      )}
      {data.actionItems && data.actionItems.length > 0 && (
        <>
          <SectionTitle>Action Items</SectionTitle>
          <ul className="text-sm text-slate-600 list-disc pl-4 space-y-1">
            {data.actionItems.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
