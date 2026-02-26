"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateParentProfile, type ParentProfile } from "@/lib/utils/parentProfile";

const BUCKET = "documents";
const MAX_SIZE_MB = 10;

async function convertToJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Conversion failed"))),
      "image/jpeg",
      0.92
    );
  });
}

interface ParentPhotoUploadProps {
  parentProfile: ParentProfile;
  onPhotoSaved: (url: string) => void;
  size?: "sm" | "md";
}

export default function ParentPhotoUpload({
  parentProfile,
  onPhotoSaved,
  size = "md",
}: ParentPhotoUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dim = size === "sm" ? "w-12 h-12" : "w-20 h-20";
  const textSize = size === "sm" ? "text-xl" : "text-3xl";

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large (max ${MAX_SIZE_MB}MB)`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const isHeic =
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif");

      let uploadBlob: Blob = file;
      if (isHeic) {
        try {
          uploadBlob = await convertToJpeg(file);
        } catch {
          // If HEIC conversion fails, upload original
          uploadBlob = file;
        }
      }

      const storagePath = `photos/${parentProfile.id}.jpg`;
      const supabase = createClient();

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, uploadBlob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

      const photoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      updateParentProfile({ photoUrl });
      onPhotoSaved(photoUrl);
    } catch (err) {
      console.error("Photo upload failed:", err);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className={`${dim} rounded-full overflow-hidden relative group cursor-pointer border-2 border-white/20 hover:border-white/40 transition-colors flex-shrink-0`}
      >
        {parentProfile.photoUrl ? (
          <img
            src={parentProfile.photoUrl}
            alt={parentProfile.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-white/10 flex items-center justify-center">
            <span className={`font-serif text-white ${textSize} font-semibold`}>
              {parentProfile.name?.charAt(0) || "?"}
            </span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <span className="text-white text-xs font-sans font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? "..." : "Edit"}
          </span>
        </div>

        {/* Loading spinner */}
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        onChange={handleFile}
        className="hidden"
      />

      {error && (
        <div className="mt-1 font-sans text-xs text-coral">{error}</div>
      )}
    </div>
  );
}
