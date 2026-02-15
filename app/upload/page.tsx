"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DocumentUpload from "@/components/DocumentUpload";
import ExtractionReview from "@/components/ExtractionReview";
import { type ExtractionResult, type ExtractedData } from "@/lib/ingestion/types";
import { getParentProfile } from "@/lib/utils/parentProfile";
import { saveTaskData } from "@/lib/utils/taskData";

interface CompletedUpload {
  uploadId: string;
  fileName: string;
  extraction: ExtractionResult;
}

export default function UploadPage() {
  const router = useRouter();
  const parentProfile = getParentProfile();
  const parentId = parentProfile?.id || "default";

  const [currentUpload, setCurrentUpload] = useState<CompletedUpload | null>(null);
  const [confirmedUploads, setConfirmedUploads] = useState<
    Array<{ fileName: string; documentType: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  const handleExtractionComplete = (result: {
    uploadId: string;
    fileName: string;
    extraction: ExtractionResult;
  }) => {
    setError(null);
    setCurrentUpload(result);
  };

  const handleConfirm = (confirmedData: ExtractedData) => {
    if (!currentUpload) return;

    // Save to localStorage (same system as task data capture)
    const domainMap: Record<string, string> = {
      insurance_card: "financial",
      medication: "medical",
      doctor_card: "medical",
      discharge_summary: "medical",
      legal_document: "legal",
      bill_statement: "financial",
      lab_results: "medical",
      other: "other",
    };

    const domain = domainMap[currentUpload.extraction.documentType] || "other";
    const toolName = `upload_${currentUpload.extraction.documentType}`;

    saveTaskData(
      `Uploaded: ${currentUpload.fileName}`,
      toolName,
      confirmedData
    );

    setConfirmedUploads((prev) => [
      ...prev,
      {
        fileName: currentUpload.fileName,
        documentType: currentUpload.extraction.documentType,
      },
    ]);
    setCurrentUpload(null);
  };

  const handleReject = () => {
    setCurrentUpload(null);
  };

  const handleError = (message: string) => {
    setError(message);
  };

  return (
    <div className="min-h-screen bg-sand">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-slate-500 hover:text-slate-700"
          >
            &larr; Back
          </button>
          <h1 className="font-serif text-lg text-slate-800">Upload Documents</h1>
          <div className="w-12" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Intro */}
        {!currentUpload && confirmedUploads.length === 0 && (
          <div className="text-center space-y-2">
            <p className="text-slate-600">
              Take a photo or upload a document and Harbor will extract the key
              information automatically.
            </p>
            {parentProfile && (
              <p className="text-sm text-slate-400">
                Uploading for {parentProfile.name}
              </p>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-500 hover:underline mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Confirmed uploads */}
        {confirmedUploads.length > 0 && !currentUpload && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-500">
              Saved this session
            </h3>
            {confirmedUploads.map((u, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <span className="text-green-600 text-lg">&#10003;</span>
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {u.fileName}
                  </p>
                  <p className="text-xs text-slate-400">{u.documentType}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload or Review */}
        {currentUpload ? (
          <ExtractionReview
            uploadId={currentUpload.uploadId}
            fileName={currentUpload.fileName}
            extraction={currentUpload.extraction}
            parentId={parentId}
            onConfirm={handleConfirm}
            onReject={handleReject}
          />
        ) : (
          <DocumentUpload
            parentId={parentId}
            onExtractionComplete={handleExtractionComplete}
            onError={handleError}
          />
        )}

        {/* View saved data link */}
        {confirmedUploads.length > 0 && !currentUpload && (
          <div className="text-center pt-2">
            <button
              onClick={() => router.push("/profile")}
              className="text-ocean hover:underline text-sm"
            >
              View all saved information &rarr;
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
