"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getParentProfile, getActiveParentId, updateParentProfile, type ParentProfile } from "@/lib/utils/parentProfile";
import { getAllTaskData, hydrateTaskDataFromDb, saveTaskData, removeTaskData, TaskData } from "@/lib/utils/taskData";
import type { DoctorInfo, MedicationList, MedicationEntry, InsuranceInfo, LegalDocumentInfo, TaskDataPayload } from "@/lib/types/taskCapture";

const DOMAIN_STYLES: Record<string, { label: string; color: string }> = {
  medical: { label: "Medical", color: "#D4725C" },
  legal: { label: "Legal", color: "#6B8F71" },
  financial: { label: "Financial", color: "#1B6B7D" },
  other: { label: "Other", color: "#4A6274" },
};

export default function ProfilePage() {
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [taskData, setTaskData] = useState<TaskData[]>([]);
  const [editingLocation, setEditingLocation] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [zipInput, setZipInput] = useState("");

  useEffect(() => {
    const profile = getParentProfile();
    setParentProfile(profile);
    setCityInput(profile?.city || "");
    setZipInput(profile?.zip || "");
    setTaskData(getAllTaskData());

    // Hydrate from DB if available (merges into localStorage, then re-read)
    const parentId = getActiveParentId();
    if (parentId) {
      hydrateTaskDataFromDb(parentId).then((hydrated) => {
        if (hydrated) {
          setTaskData(getAllTaskData());
        }
      });
    }
  }, []);

  const saveLocation = useCallback(() => {
    updateParentProfile({ city: cityInput.trim() || undefined, zip: zipInput.trim() || undefined });
    setParentProfile(getParentProfile());
    setEditingLocation(false);
  }, [cityInput, zipInput]);

  const handleSave = useCallback((taskTitle: string, toolName: string, updatedData: TaskDataPayload) => {
    saveTaskData(taskTitle, toolName, updatedData);
    setTaskData(getAllTaskData());
  }, []);

  const handleDelete = useCallback((taskTitle: string) => {
    removeTaskData(taskTitle);
    setTaskData(getAllTaskData());
  }, []);

  // Sort chronologically, newest first
  const sortedData = [...taskData].sort(
    (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
  );

  return (
    <div className="min-h-screen bg-warmWhite">
      {/* Header */}
      <div className="bg-ocean px-5 py-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative max-w-[420px] mx-auto">
          <Link
            href="/dashboard"
            className="font-sans text-sm text-white/80 hover:text-white inline-block mb-4"
          >
            &larr; Dashboard
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <span className="font-serif text-white text-xl font-semibold">
                {parentProfile?.name?.charAt(0) || "?"}
              </span>
            </div>
            <div>
              <h1 className="font-serif text-3xl font-semibold text-white">
                {parentProfile?.name || "Parent"}&apos;s Profile
              </h1>
              {parentProfile?.age && (
                <p className="font-sans text-sm text-white/80">
                  Age {parentProfile.age}
                  {parentProfile.city && ` • ${parentProfile.city}`}
                  {parentProfile.state && `${parentProfile.city ? ", " : " • "}${parentProfile.state}`}
                  {parentProfile.zip && ` ${parentProfile.zip}`}
                </p>
              )}
            </div>
          </div>

          {editingLocation ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                placeholder="City"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                className="bg-white/20 text-white placeholder-white/50 rounded-lg px-3 py-1.5 font-sans text-sm w-28 focus:outline-none focus:ring-1 focus:ring-white/40"
              />
              <input
                type="text"
                placeholder="ZIP"
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                className="bg-white/20 text-white placeholder-white/50 rounded-lg px-3 py-1.5 font-sans text-sm w-20 focus:outline-none focus:ring-1 focus:ring-white/40"
                maxLength={10}
              />
              <button
                onClick={saveLocation}
                className="bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-1.5 font-sans text-sm font-semibold transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditingLocation(false)}
                className="text-white/60 hover:text-white font-sans text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="font-serif text-base text-white/80 leading-relaxed italic">
                All important information in one place
              </p>
              <button
                onClick={() => setEditingLocation(true)}
                className="text-white/50 hover:text-white text-xs font-sans transition-colors whitespace-nowrap"
              >
                Edit location
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[420px] mx-auto px-5 py-6">
        {sortedData.length === 0 ? (
          <div className="bg-white rounded-xl border border-sandDark px-6 py-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <div className="font-serif text-xl font-semibold text-slate mb-2">
              No information yet
            </div>
            <div className="font-sans text-sm text-slateMid leading-relaxed mb-6">
              As you complete tasks and add information through &ldquo;Tell Harbor,&rdquo;
              everything will be organized here.
            </div>
            <Link href="/tasks">
              <button className="bg-ocean text-white rounded-xl px-6 py-3 font-sans text-sm font-semibold hover:bg-oceanMid transition-colors">
                View Tasks
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedData.map((item, index) => (
              <DataCard
                key={`${item.taskTitle}-${index}`}
                data={item}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DataCard({
  data,
  onSave,
  onDelete,
}: {
  data: TaskData;
  onSave: (taskTitle: string, toolName: string, updatedData: TaskDataPayload) => void;
  onDelete: (taskTitle: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<TaskDataPayload>(data.data);

  const domain = getDomainFromToolName(data.toolName);
  const style = DOMAIN_STYLES[domain] || DOMAIN_STYLES.other;

  const handleSave = () => {
    onSave(data.taskTitle, data.toolName, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(data.data);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(data.taskTitle);
  };

  return (
    <div className="bg-white rounded-xl border border-sandDark overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 text-left hover:bg-sand/30 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="font-sans text-base font-semibold text-slate">
                {data.taskTitle}
              </div>
              <span
                className="font-sans text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${style.color}15`, color: style.color }}
              >
                {style.label}
              </span>
            </div>
            <div className="font-sans text-xs text-slateMid">
              Added {new Date(data.capturedAt).toLocaleDateString()}
            </div>
          </div>
          <div
            className="text-xl transition-transform"
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▼
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-sand">
          {isEditing ? (
            <div className="mt-3 space-y-3">
              {renderEditFields(data.toolName, editData, setEditData)}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  className="bg-ocean text-white rounded-lg px-4 py-2 font-sans text-sm font-semibold hover:bg-oceanMid transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-sand text-slateMid rounded-lg px-4 py-2 font-sans text-sm font-semibold hover:bg-sandDark transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {renderDataFields(data.toolName, data.data, style.color)}
              <div className="flex gap-2 pt-2 border-t border-sand">
                <button
                  onClick={() => {
                    setEditData(data.data);
                    setIsEditing(true);
                  }}
                  className="font-sans text-sm font-semibold text-ocean hover:text-oceanMid transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="font-sans text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EditInput({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide mb-1 block">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full border border-sandDark rounded-lg px-3 py-2 font-sans text-sm text-slate focus:outline-none focus:ring-1 focus:ring-ocean"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-sandDark rounded-lg px-3 py-2 font-sans text-sm text-slate focus:outline-none focus:ring-1 focus:ring-ocean"
        />
      )}
    </div>
  );
}

function renderEditFields(
  toolName: string,
  data: TaskDataPayload,
  setData: (data: TaskDataPayload) => void
) {
  const update = (field: string, value: string) => {
    setData({ ...data, [field]: value });
  };

  if (toolName === "save_doctor_info") {
    const doc = data as DoctorInfo;
    return (
      <>
        <EditInput label="Doctor Name" value={doc.name || ""} onChange={(v) => update("name", v)} />
        <EditInput label="Phone" value={doc.phone || ""} onChange={(v) => update("phone", v)} />
        <EditInput label="Address" value={doc.address || ""} onChange={(v) => update("address", v)} />
        <EditInput label="Specialty" value={doc.specialty || ""} onChange={(v) => update("specialty", v)} />
      </>
    );
  }

  if (toolName === "save_medication_list") {
    const medList = data as MedicationList;
    const meds = medList.medications || [];

    const updateMed = (index: number, field: keyof MedicationEntry, value: string) => {
      const updated = meds.map((m, i) => (i === index ? { ...m, [field]: value } : m));
      setData({ ...data, medications: updated });
    };

    const addMed = () => {
      setData({ ...data, medications: [...meds, { name: "", dosage: "", frequency: "", purpose: "" }] });
    };

    const removeMed = (index: number) => {
      setData({ ...data, medications: meds.filter((_, i) => i !== index) });
    };

    return (
      <div className="space-y-3">
        <div className="font-sans text-sm font-semibold text-slateMid uppercase tracking-wide">
          Medications
        </div>
        {meds.map((med: MedicationEntry, i: number) => (
          <div key={i} className="p-3 rounded-lg bg-sand/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs font-semibold text-slateMid">
                Medication {i + 1}
              </span>
              <button
                onClick={() => removeMed(i)}
                className="font-sans text-xs text-red-500 hover:text-red-600"
              >
                Remove
              </button>
            </div>
            <EditInput label="Name" value={med.name || ""} onChange={(v) => updateMed(i, "name", v)} />
            <EditInput label="Dosage" value={med.dosage || ""} onChange={(v) => updateMed(i, "dosage", v)} />
            <EditInput label="Frequency" value={med.frequency || ""} onChange={(v) => updateMed(i, "frequency", v)} />
            <EditInput label="Purpose" value={med.purpose || ""} onChange={(v) => updateMed(i, "purpose", v)} />
          </div>
        ))}
        <button
          onClick={addMed}
          className="font-sans text-sm font-semibold text-ocean hover:text-oceanMid transition-colors"
        >
          + Add Medication
        </button>
      </div>
    );
  }

  if (toolName === "save_insurance_info") {
    const ins = data as InsuranceInfo;
    return (
      <>
        <EditInput label="Provider" value={ins.provider || ""} onChange={(v) => update("provider", v)} />
        <EditInput label="Policy Number" value={ins.policyNumber || ""} onChange={(v) => update("policyNumber", v)} />
        <EditInput label="Group Number" value={ins.groupNumber || ""} onChange={(v) => update("groupNumber", v)} />
        <EditInput label="Phone" value={ins.phone || ""} onChange={(v) => update("phone", v)} />
      </>
    );
  }

  if (toolName === "save_legal_document_info") {
    const legal = data as LegalDocumentInfo;
    return (
      <>
        <EditInput label="Document Type" value={legal.documentType || ""} onChange={(v) => update("documentType", v)} />
        <EditInput label="Status" value={legal.status || ""} onChange={(v) => update("status", v)} />
        <EditInput label="Agent/Proxy" value={legal.agent || ""} onChange={(v) => update("agent", v)} />
        <EditInput label="Location" value={legal.location || ""} onChange={(v) => update("location", v)} />
        <EditInput label="Date Completed" value={legal.dateCompleted || ""} onChange={(v) => update("dateCompleted", v)} />
      </>
    );
  }

  if (toolName === "save_task_notes" || toolName === "manual_notes") {
    const notes = data as { notes: string };
    return (
      <EditInput
        label="Notes"
        value={notes.notes || ""}
        onChange={(v) => setData({ ...data, notes: v })}
        multiline
      />
    );
  }

  // Fallback: JSON textarea
  return (
    <div>
      <label className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide mb-1 block">
        Data (JSON)
      </label>
      <textarea
        value={JSON.stringify(data, null, 2)}
        onChange={(e) => {
          try {
            setData(JSON.parse(e.target.value));
          } catch {
            // ignore invalid JSON while typing
          }
        }}
        rows={8}
        className="w-full border border-sandDark rounded-lg px-3 py-2 font-mono text-sm text-slate focus:outline-none focus:ring-1 focus:ring-ocean"
      />
    </div>
  );
}

function renderDataFields(toolName: string, data: TaskDataPayload, color: string) {
  if (toolName === "save_doctor_info") {
    const doc = data as DoctorInfo;
    return (
      <>
        <DataField label="Doctor Name" value={doc.name} color={color} />
        <DataField label="Phone" value={doc.phone} color={color} />
        {doc.address && <DataField label="Address" value={doc.address} color={color} />}
        {doc.specialty && <DataField label="Specialty" value={doc.specialty} color={color} />}
      </>
    );
  }

  if (toolName === "save_medication_list") {
    const medList = data as MedicationList;
    return (
      <div className="space-y-3">
        <div className="font-sans text-sm font-semibold text-slateMid uppercase tracking-wide">
          Medications
        </div>
        {medList.medications.map((med: MedicationEntry, i: number) => (
          <div
            key={i}
            className="p-3 rounded-lg"
            style={{ backgroundColor: `${color}10` }}
          >
            <div className="font-sans text-sm font-semibold text-slate mb-1">
              {med.name} - {med.dosage}
            </div>
            <div className="font-sans text-sm text-slateMid">
              {med.frequency}
              {med.purpose && ` • ${med.purpose}`}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (toolName === "save_insurance_info") {
    const ins = data as InsuranceInfo;
    return (
      <>
        <DataField label="Provider" value={ins.provider} color={color} />
        <DataField label="Policy Number" value={ins.policyNumber} color={color} />
        {ins.groupNumber && <DataField label="Group Number" value={ins.groupNumber} color={color} />}
        {ins.phone && <DataField label="Phone" value={ins.phone} color={color} />}
      </>
    );
  }

  if (toolName === "save_legal_document_info") {
    const legal = data as LegalDocumentInfo;
    return (
      <>
        <DataField label="Document Type" value={legal.documentType} color={color} />
        <DataField label="Status" value={legal.status} color={color} />
        {legal.agent && <DataField label="Agent/Proxy" value={legal.agent} color={color} />}
        {legal.location && <DataField label="Location" value={legal.location} color={color} />}
        {legal.dateCompleted && <DataField label="Date Completed" value={legal.dateCompleted} color={color} />}
      </>
    );
  }

  if (toolName === "save_task_notes" || toolName === "manual_notes") {
    const notes = data as { notes: string };
    return <DataField label="Notes" value={notes.notes} color={color} multiline />;
  }

  // Generic fallback
  return (
    <pre className="font-sans text-sm text-slate whitespace-pre-wrap">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function DataField({
  label,
  value,
  color,
  multiline = false,
}: {
  label: string;
  value: string;
  color: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <div className="font-sans text-xs font-semibold text-slateMid uppercase tracking-wide mb-1">
        {label}
      </div>
      <div
        className={`font-sans text-sm text-slate ${multiline ? "whitespace-pre-wrap" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function getDomainFromToolName(toolName: string): string {
  if (
    toolName.includes("doctor") ||
    toolName.includes("medication") ||
    toolName.includes("insurance")
  ) {
    return "medical";
  }
  if (toolName.includes("legal") || toolName.includes("document")) {
    return "legal";
  }
  if (toolName.includes("financial")) {
    return "financial";
  }
  return "other";
}
