"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DocumentUpload from "@/components/DocumentUpload";
import ExtractionReview from "@/components/ExtractionReview";
import { type ExtractionResult, type ExtractedData } from "@/lib/ingestion/types";
import { getParentProfile } from "@/lib/utils/parentProfile";
import { saveTaskData } from "@/lib/utils/taskData";
import { saveExtractionAsTaskData } from "@/lib/utils/extractionToTaskData";

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

    // Save raw extraction under upload_ toolName (for documents list)
    const toolName = `upload_${currentUpload.extraction.documentType}`;
    saveTaskData(
      `Uploaded: ${currentUpload.fileName}`,
      toolName,
      confirmedData
    );

    // Also normalize into care-summary-compatible task data entries
    // (save_doctor_info, save_insurance_info, save_medication_list, etc.)
    saveExtractionAsTaskData(confirmedData, currentUpload.fileName);

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
    <div className="min-h-screen flex flex-col max-w-[420px] mx-auto border-l border-r border-sandDark bg-warmWhite">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-ocean to-[#164F5C] px-7 pt-10 pb-8">
        <div className="absolute -top-[60px] -right-10 w-[200px] h-[200px] rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="relative">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 font-sans text-xs text-white/70 hover:text-white/90 transition-colors mb-3"
          >
            &larr; Dashboard
          </Link>
          <h1 className="font-serif text-[26px] font-semibold text-white tracking-tight">
            Upload Documents
          </h1>
          {parentProfile && (
            <div className="font-sans text-sm text-white/80 mt-1">
              For {parentProfile.name}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-4">
        {/* Intro */}
        {!currentUpload && confirmedUploads.length === 0 && (
          <div className="bg-white border border-sandDark rounded-[14px] px-5 py-4">
            <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-ocean mb-2">
              How It Works
            </div>
            <p className="font-sans text-sm text-slate leading-relaxed">
              Take a photo or upload a document — insurance card, medication list,
              discharge summary, or legal document — and Harbor will extract the key
              information automatically.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-coral/10 border border-coral/30 rounded-[14px] px-5 py-4">
            <p className="font-sans text-sm text-coral">{error}</p>
            <button
              onClick={() => setError(null)}
              className="font-sans text-xs text-coral/70 hover:underline mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Confirmed uploads */}
        {confirmedUploads.length > 0 && !currentUpload && (
          <div className="flex flex-col gap-2">
            <div className="font-sans text-xs font-semibold tracking-[1.5px] uppercase text-slateLight">
              Saved This Session
            </div>
            {confirmedUploads.map((u, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-sage/10 border border-sage/30 rounded-[14px] px-5 py-3"
              >
                <span className="text-sage text-lg">&#10003;</span>
                <div>
                  <p className="font-sans text-sm font-medium text-slate">
                    {u.fileName}
                  </p>
                  <p className="font-sans text-xs text-slateMid">{u.documentType}</p>
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
              className="font-sans text-sm text-ocean hover:underline"
            >
              View all saved information &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
