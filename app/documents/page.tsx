"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getDocumentTypeLabel, type DocumentType } from "@/lib/ingestion/types";

interface DocumentRecord {
  id: string;
  name: string;
  fileType: string | null;
  fileSizeBytes: number | null;
  documentType: string | null;
  status: string;
  extractedData: Record<string, unknown> | null;
  confidence: number | null;
  uploadedAt: string;
  confirmedAt: string | null;
}

const DOC_TYPE_ICONS: Record<string, string> = {
  insurance_card: "\uD83E\uDEAA",
  medication: "\uD83D\uDC8A",
  discharge_summary: "\uD83C\uDFE5",
  legal_document: "\uD83D\uDCDC",
  doctor_card: "\uD83D\uDC68\u200D\u2695\uFE0F",
  bill_statement: "\uD83E\uDDFE",
  lab_results: "\uD83D\uDD2C",
  other: "\uD83D\uDCCE",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  uploaded: { label: "Uploaded", color: "text-slate-500 bg-slate-100" },
  processing: { label: "Processing", color: "text-amber-700 bg-amber-50" },
  extracted: { label: "Extracted", color: "text-ocean bg-ocean/10" },
  confirmed: { label: "Confirmed", color: "text-green-700 bg-green-50" },
  failed: { label: "Failed", color: "text-red-700 bg-red-50" },
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Render extracted data as readable key-value pairs */
function ExtractedDataView({ data }: { data: Record<string, unknown> }) {
  const type = data.type as string | undefined;

  // Filter out internal fields
  const entries = Object.entries(data).filter(
    ([key]) => !["type", "rawResponse"].includes(key)
  );

  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => {
        if (value === null || value === undefined || value === "") return null;

        const label = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (s) => s.toUpperCase())
          .replace(/_/g, " ");

        // Array values (medications, results, etc.)
        if (Array.isArray(value)) {
          return (
            <div key={key} className="space-y-1">
              <div className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {label}
              </div>
              {value.map((item, i) => (
                <div key={i} className="bg-sand/50 rounded-lg p-3 text-sm">
                  {typeof item === "object" && item !== null ? (
                    <div className="space-y-1">
                      {Object.entries(item)
                        .filter(([, v]) => v !== null && v !== undefined && v !== "")
                        .map(([k, v]) => (
                          <div key={k} className="flex gap-2">
                            <span className="text-slate-400 text-xs min-w-[80px]">
                              {k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}:
                            </span>
                            <span className="text-slate-700 text-xs">{String(v)}</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <span className="text-slate-700">{String(item)}</span>
                  )}
                </div>
              ))}
            </div>
          );
        }

        // Object values (copays, etc.)
        if (typeof value === "object" && value !== null) {
          return (
            <div key={key} className="space-y-1">
              <div className="font-sans text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {label}
              </div>
              <div className="bg-sand/50 rounded-lg p-3 space-y-1">
                {Object.entries(value)
                  .filter(([, v]) => v !== null && v !== undefined && v !== "")
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-slate-400">
                        {k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                      </span>
                      <span className="text-slate-700 font-medium">{String(v)}</span>
                    </div>
                  ))}
              </div>
            </div>
          );
        }

        // Simple values
        return (
          <div key={key} className="flex justify-between items-baseline py-1 border-b border-sand last:border-0">
            <span className="font-sans text-xs text-slate-400">{label}</span>
            <span className="font-sans text-sm text-slate-700 font-medium text-right max-w-[60%]">
              {String(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const response = await fetch("/api/documents");
        if (!response.ok) throw new Error("Failed to fetch documents");
        const data = await response.json();
        setDocuments(data.documents || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load documents");
      } finally {
        setIsLoading(false);
      }
    }
    fetchDocuments();
  }, []);

  return (
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="bg-gradient-to-br from-ocean to-[#164F5C] px-7 pt-10 pb-6">
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={() => router.back()}
            className="text-white/70 hover:text-white text-sm"
          >
            &larr; Back
          </button>
        </div>
        <h1 className="font-serif text-[24px] font-semibold text-white tracking-tight">
          Your Documents
        </h1>
        <p className="font-sans text-sm text-white/70 mt-1">
          {documents.length} {documents.length === 1 ? "document" : "documents"} uploaded
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-6 space-y-4">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!isLoading && !error && documents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">{"\uD83D\uDCC4"}</div>
            <h3 className="font-serif text-lg text-slate-700 mb-2">No documents yet</h3>
            <p className="font-sans text-sm text-slate-400 mb-6 max-w-[260px] mx-auto">
              Upload insurance cards, prescriptions, or other documents to get started.
            </p>
            <Link
              href="/upload"
              className="inline-block bg-ocean text-white font-sans text-sm font-semibold px-6 py-3 rounded-xl hover:bg-ocean/90 transition-colors"
            >
              Upload a Document
            </Link>
          </div>
        )}

        {!isLoading && documents.map((doc) => {
          const isExpanded = expandedId === doc.id;
          const icon = DOC_TYPE_ICONS[doc.documentType || "other"] || "\uD83D\uDCCE";
          const statusInfo = STATUS_LABELS[doc.status] || STATUS_LABELS.uploaded;
          const typeLabel = doc.documentType
            ? getDocumentTypeLabel(doc.documentType as DocumentType)
            : "Document";

          return (
            <div key={doc.id} className="bg-white rounded-xl border border-sand overflow-hidden">
              {/* Summary row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-sand/30 transition-colors"
              >
                <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center text-xl shrink-0">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-sans text-sm font-medium text-slate-700 truncate">
                    {doc.name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-sans text-xs text-slate-400">{typeLabel}</span>
                    <span className="text-slate-300">&middot;</span>
                    <span className="font-sans text-xs text-slate-400">
                      {formatDate(doc.uploadedAt)}
                    </span>
                    {doc.fileSizeBytes && (
                      <>
                        <span className="text-slate-300">&middot;</span>
                        <span className="font-sans text-xs text-slate-400">
                          {formatFileSize(doc.fileSizeBytes)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                  <span className={`text-slate-400 text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                    &#9660;
                  </span>
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-sand px-4 py-4">
                  {doc.confidence !== null && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="font-sans text-xs text-slate-400">Confidence:</div>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            doc.confidence >= 0.8 ? "bg-green-500" : doc.confidence >= 0.5 ? "bg-amber-500" : "bg-red-400"
                          }`}
                          style={{ width: `${(doc.confidence * 100).toFixed(0)}%` }}
                        />
                      </div>
                      <div className="font-sans text-xs font-medium text-slate-600">
                        {(doc.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  )}

                  {doc.extractedData ? (
                    <ExtractedDataView data={doc.extractedData} />
                  ) : (
                    <p className="font-sans text-sm text-slate-400 italic">
                      No extracted data available
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Upload more button */}
        {!isLoading && documents.length > 0 && (
          <div className="pt-2">
            <Link
              href="/upload"
              className="block w-full bg-ocean text-white text-center font-sans text-sm font-semibold py-3 px-4 rounded-xl hover:bg-ocean/90 transition-colors"
            >
              Upload Another Document
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
