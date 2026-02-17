"use client";

import { useState, useRef, useCallback } from "react";
import {
  type DocumentType,
  type ExtractionResult,
  MAX_FILE_SIZE_BYTES,
  SUPPORTED_FILE_TYPES,
  getDocumentTypeLabel,
  isSupportedFileType,
} from "@/lib/ingestion/types";
import { createClient } from "@/lib/supabase/client";

interface DocumentUploadProps {
  parentId: string;
  onExtractionComplete: (result: {
    uploadId: string;
    fileName: string;
    extraction: ExtractionResult;
  }) => void;
  onError?: (error: string) => void;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string; icon: string }[] = [
  { value: "insurance_card", label: "Insurance Card", icon: "\uD83E\uDEAA" },
  { value: "medication", label: "Medication / Pill Bottle", icon: "\uD83D\uDC8A" },
  { value: "discharge_summary", label: "Discharge Papers", icon: "\uD83C\uDFE5" },
  { value: "legal_document", label: "Legal Document", icon: "\uD83D\uDCDC" },
  { value: "doctor_card", label: "Doctor's Card", icon: "\uD83D\uDC68\u200D\u2695\uFE0F" },
  { value: "bill_statement", label: "Bill / Statement", icon: "\uD83E\uDDFE" },
  { value: "lab_results", label: "Lab Results", icon: "\uD83D\uDD2C" },
  { value: "other", label: "Other (auto-detect)", icon: "\uD83D\uDCCE" },
];

const BUCKET = "documents";

/** Resolve MIME type, handling iOS Safari HEIC edge cases */
function resolveFileType(file: File): string {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "heic" || ext === "heif") return "image/heic";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "pdf") return "application/pdf";
  if (ext === "webp") return "image/webp";
  return file.type || "application/octet-stream";
}

/** Check if a file type is HEIC/HEIF */
function isHeic(fileType: string): boolean {
  return fileType === "image/heic" || fileType === "image/heif";
}

/**
 * Convert an image file to JPEG using Canvas.
 * Works in browsers that support HEIC rendering (Safari/iOS).
 * Returns the original file if conversion fails (server will handle it).
 */
async function convertToJpeg(file: File): Promise<{ blob: Blob; converted: boolean }> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas context");
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const jpegBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
        "image/jpeg",
        0.92
      );
    });

    return { blob: jpegBlob, converted: true };
  } catch {
    // Browser can't render HEIC (Chrome/Firefox) — return original, server will convert
    return { blob: file, converted: false };
  }
}

export default function DocumentUpload({
  parentId,
  onExtractionComplete,
  onError,
}: DocumentUploadProps) {
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (file: File) => {
      const effectiveType = resolveFileType(file);

      // Validate type
      if (!isSupportedFileType(effectiveType)) {
        onError?.(`Unsupported file type: ${effectiveType || "unknown"}. Please upload an image (JPEG, PNG, WebP, HEIC) or PDF.`);
        return;
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const maxMB = MAX_FILE_SIZE_BYTES / (1024 * 1024);
        onError?.(`File too large (max ${maxMB}MB)`);
        return;
      }

      setSelectedFile(file);

      // Generate preview for images
      if (effectiveType.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    },
    [onError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      let fileType = resolveFileType(selectedFile);
      let uploadBlob: Blob = selectedFile;
      let uploadExt = selectedFile.name.split(".").pop()?.toLowerCase() || "bin";

      // Convert HEIC/HEIF to JPEG before uploading (Claude Vision can't process HEIC)
      if (isHeic(fileType)) {
        setUploadProgress("Converting image...");
        const { blob, converted } = await convertToJpeg(selectedFile);
        if (converted) {
          uploadBlob = blob;
          fileType = "image/jpeg";
          uploadExt = "jpg";
        }
        // If not converted, upload as-is — server-side sharp will handle it
      }

      // Step 1: Upload directly to Supabase Storage from the browser
      setUploadProgress("Uploading file...");

      const supabase = createClient();
      const fileId = crypto.randomUUID();
      // Use a temp path; the extract API will create the DB record with situationId
      const storagePath = `uploads/${fileId}.${uploadExt}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, uploadBlob, {
          contentType: fileType,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(
          uploadError.message?.includes("not found") || uploadError.message?.includes("Bucket")
            ? 'Storage bucket "documents" not configured. Please contact support.'
            : `Upload failed: ${uploadError.message}`
        );
      }

      // Step 2: Call extraction API with the storage path (no file body — lightweight JSON)
      setUploadProgress("Analyzing document...");

      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storagePath,
          fileName: selectedFile.name,
          fileType,
          fileSizeBytes: uploadBlob.size,
          documentType: selectedType || undefined,
          parentId,
        }),
      });

      if (!response.ok) {
        let errorMessage = `Extraction failed (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.details || errorData.error || errorMessage;
        } catch {
          // Non-JSON response
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      setUploadProgress("Done!");

      onExtractionComplete({
        uploadId: result.uploadId,
        fileName: result.fileName,
        extraction: result.extraction,
      });

      // Reset state
      setSelectedFile(null);
      setPreview(null);
      setSelectedType(null);
      setUploadProgress("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      onError?.(message);
      setUploadProgress("");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploadProgress("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Document Type Picker */}
      {!selectedFile && (
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">
            What are you uploading?
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {DOCUMENT_TYPES.map((dt) => (
              <button
                key={dt.value}
                onClick={() => setSelectedType(dt.value)}
                className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-colors ${
                  selectedType === dt.value
                    ? "border-ocean bg-ocean/5 text-ocean"
                    : "border-gray-200 hover:border-ocean/30 text-slate-600"
                }`}
              >
                <span className="text-lg">{dt.icon}</span>
                <span>{dt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Drop Zone / File Input */}
      {!selectedFile && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            isDragging
              ? "border-ocean bg-ocean/5"
              : "border-gray-300 hover:border-ocean/50"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={SUPPORTED_FILE_TYPES.join(",")}
            onChange={handleInputChange}
            className="hidden"
            capture="environment"
          />

          <div className="space-y-2">
            <div className="text-4xl">{"\uD83D\uDCC4"}</div>
            <p className="text-slate-600 font-medium">
              Drop a file here, or tap to choose
            </p>
            <p className="text-sm text-slate-400">
              Photos (JPEG, PNG, WebP, HEIC) or PDFs up to 10MB
            </p>
          </div>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <div className="border rounded-xl p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-lg border"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                  {"\uD83D\uDCC4"}
                </div>
              )}
              <div>
                <p className="font-medium text-slate-700 text-sm">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-400">
                  {(selectedFile.size / 1024).toFixed(0)} KB
                  {selectedType && ` \u00B7 ${getDocumentTypeLabel(selectedType)}`}
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              disabled={isUploading}
              className="text-slate-400 hover:text-slate-600 text-sm"
            >
              Remove
            </button>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="flex items-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-ocean border-t-transparent rounded-full" />
              <p className="text-sm text-ocean">{uploadProgress}</p>
            </div>
          )}

          {/* Upload Button */}
          {!isUploading && (
            <button
              onClick={handleUpload}
              className="w-full bg-ocean text-white py-3 px-4 rounded-lg font-medium hover:bg-ocean/90 transition-colors"
            >
              Extract Information
            </button>
          )}
        </div>
      )}
    </div>
  );
}
