// Supabase Storage helpers for document file persistence
// Files are stored in the "documents" bucket

import { createClient } from "./server";
import { createLogger } from "@/lib/utils/logger";

const log = createLogger("supabase/storage");

const BUCKET = "documents";

/**
 * Upload a file to Supabase Storage.
 * Path: documents/{situationId}/{documentId}.{ext}
 *
 * Returns the storage path on success, null on failure.
 */
export async function uploadFile(
  situationId: string,
  documentId: string,
  fileBuffer: Buffer,
  fileType: string,
  fileName: string
): Promise<string | null> {
  try {
    const supabase = await createClient();

    // Determine file extension from MIME type
    const ext = getExtension(fileType, fileName);
    const storagePath = `${situationId}/${documentId}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: fileType,
        upsert: false,
      });

    if (error) {
      // If bucket doesn't exist, log helpful message
      if (error.message?.includes("not found") || error.message?.includes("Bucket")) {
        log.warn(
          'Storage bucket "documents" not found. Create it in Supabase Dashboard > Storage.',
          { error: error.message }
        );
      } else {
        log.errorWithStack("Failed to upload file to storage", error);
      }
      return null;
    }

    log.info("File uploaded to storage", { storagePath });
    return storagePath;
  } catch (error) {
    log.errorWithStack("Storage upload error", error);
    return null;
  }
}

/**
 * Get a signed URL for a stored file (valid for 1 hour).
 */
export async function getSignedUrl(
  storagePath: string,
  expiresIn = 3600
): Promise<string | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      log.errorWithStack("Failed to create signed URL", error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    log.errorWithStack("Signed URL error", error);
    return null;
  }
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(storagePath: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([storagePath]);

    if (error) {
      log.errorWithStack("Failed to delete file from storage", error);
      return false;
    }

    return true;
  } catch (error) {
    log.errorWithStack("Storage delete error", error);
    return false;
  }
}

function getExtension(mimeType: string, fileName: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
    "application/pdf": "pdf",
  };

  if (mimeToExt[mimeType]) return mimeToExt[mimeType];

  // Fall back to file extension
  const parts = fileName.split(".");
  if (parts.length > 1) return parts.pop()!.toLowerCase();

  return "bin";
}
