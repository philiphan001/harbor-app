"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getParentProfile } from "@/lib/utils/parentProfile";
import { getAllTaskData, TaskData } from "@/lib/utils/taskData";

export default function ProfilePage() {
  const [parentProfile, setParentProfile] = useState<any>(null);
  const [taskData, setTaskData] = useState<TaskData[]>([]);

  useEffect(() => {
    setParentProfile(getParentProfile());
    setTaskData(getAllTaskData());
  }, []);

  // Group data by domain
  const groupedData = taskData.reduce((acc, item) => {
    const domain = getDomainFromToolName(item.toolName);
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(item);
    return acc;
  }, {} as Record<string, TaskData[]>);

  return (
    <div className="min-h-screen bg-warmWhite">
      {/* Header */}
      <div className="bg-ocean px-5 py-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative max-w-[420px] mx-auto">
          <Link
            href="/"
            className="font-sans text-sm text-white/80 hover:text-white inline-block mb-4"
          >
            ← Home
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <span className="font-serif text-white text-xl font-semibold">
                {parentProfile?.name?.charAt(0) || "?"}
              </span>
            </div>
            <div>
              <h1 className="font-serif text-3xl font-semibold text-white">
                {parentProfile?.name || "Parent"}'s Profile
              </h1>
              {parentProfile?.age && (
                <p className="font-sans text-sm text-white/80">
                  Age {parentProfile.age}
                  {parentProfile.state && ` • ${parentProfile.state}`}
                </p>
              )}
            </div>
          </div>

          <p className="font-serif text-base text-white/80 leading-relaxed italic">
            All important information in one place
          </p>
        </div>
      </div>

      <div className="max-w-[420px] mx-auto px-5 py-6">
        {taskData.length === 0 ? (
          // Empty state
          <div className="bg-white rounded-xl border border-sandDark px-6 py-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <div className="font-serif text-xl font-semibold text-slate mb-2">
              No information yet
            </div>
            <div className="font-sans text-sm text-slateMid leading-relaxed mb-6">
              As you complete tasks and add information through "Tell Harbor,"
              everything will be organized here.
            </div>
            <Link href="/tasks">
              <button className="bg-ocean text-white rounded-xl px-6 py-3 font-sans text-sm font-semibold hover:bg-oceanMid transition-colors">
                View Tasks
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Medical Information */}
            {groupedData.medical && groupedData.medical.length > 0 && (
              <Section
                title="Medical Information"
                icon="♥"
                color="#D4725C"
                items={groupedData.medical}
              />
            )}

            {/* Legal Information */}
            {groupedData.legal && groupedData.legal.length > 0 && (
              <Section
                title="Legal Documents"
                icon="◉"
                color="#6B8F71"
                items={groupedData.legal}
              />
            )}

            {/* Financial Information */}
            {groupedData.financial && groupedData.financial.length > 0 && (
              <Section
                title="Financial Information"
                icon="◈"
                color="#1B6B7D"
                items={groupedData.financial}
              />
            )}

            {/* Other Information */}
            {groupedData.other && groupedData.other.length > 0 && (
              <Section
                title="Other Information"
                icon="📝"
                color="#4A6274"
                items={groupedData.other}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  color,
  items,
}: {
  title: string;
  icon: string;
  color: string;
  items: TaskData[];
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
          style={{
            backgroundColor: `${color}15`,
            color: color,
          }}
        >
          {icon}
        </div>
        <div className="font-sans text-lg font-semibold text-slate">{title}</div>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <DataCard key={index} data={item} color={color} />
        ))}
      </div>
    </div>
  );
}

function DataCard({ data, color }: { data: TaskData; color: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-sandDark overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 text-left hover:bg-sand/30 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="font-sans text-base font-semibold text-slate mb-1">
              {data.taskTitle}
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
          <div className="mt-3 space-y-3">
            {renderDataFields(data.toolName, data.data, color)}
          </div>
        </div>
      )}
    </div>
  );
}

function renderDataFields(toolName: string, data: any, color: string) {
  if (toolName === "save_doctor_info") {
    return (
      <>
        <DataField label="Doctor Name" value={data.name} color={color} />
        <DataField label="Phone" value={data.phone} color={color} />
        {data.address && <DataField label="Address" value={data.address} color={color} />}
        {data.specialty && <DataField label="Specialty" value={data.specialty} color={color} />}
      </>
    );
  }

  if (toolName === "save_medication_list") {
    return (
      <div className="space-y-3">
        <div className="font-sans text-sm font-semibold text-slateMid uppercase tracking-wide">
          Medications
        </div>
        {data.medications.map((med: any, i: number) => (
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
    return (
      <>
        <DataField label="Provider" value={data.provider} color={color} />
        <DataField label="Policy Number" value={data.policyNumber} color={color} />
        {data.groupNumber && <DataField label="Group Number" value={data.groupNumber} color={color} />}
        {data.phone && <DataField label="Phone" value={data.phone} color={color} />}
      </>
    );
  }

  if (toolName === "save_legal_document_info") {
    return (
      <>
        <DataField label="Document Type" value={data.documentType} color={color} />
        <DataField label="Status" value={data.status} color={color} />
        {data.agent && <DataField label="Agent/Proxy" value={data.agent} color={color} />}
        {data.location && <DataField label="Location" value={data.location} color={color} />}
        {data.dateCompleted && <DataField label="Date Completed" value={data.dateCompleted} color={color} />}
      </>
    );
  }

  if (toolName === "save_task_notes" || toolName === "manual_notes") {
    return <DataField label="Notes" value={data.notes} color={color} multiline />;
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
