// DB layer for Document records (uploaded files + extraction data)

import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma";
import { createLogger } from "@/lib/utils/logger";

const log = createLogger("db/documents");

export interface CreateDocumentInput {
  situationId: string;
  name: string;
  fileType: string;
  fileSizeBytes: number;
  documentType?: string;
  storagePath: string;
  extractedData?: Record<string, unknown>;
  confidence?: number;
  extractionModel?: string;
  uploadedBy: string;
}

/**
 * Create a new Document record after file upload + extraction.
 */
export async function createDocument(input: CreateDocumentInput) {
  try {
    const document = await prisma.document.create({
      data: {
        situationId: input.situationId,
        name: input.name,
        fileType: input.fileType,
        fileSizeBytes: input.fileSizeBytes,
        documentType: input.documentType,
        storagePath: input.storagePath,
        status: input.extractedData ? "extracted" : "uploaded",
        extractedData: input.extractedData
          ? (input.extractedData as Prisma.InputJsonValue)
          : undefined,
        confidence: input.confidence,
        extractionModel: input.extractionModel,
        uploadedBy: input.uploadedBy,
      },
    });

    log.info("Document record created", {
      id: document.id,
      name: document.name,
      status: document.status,
    });

    return document;
  } catch (error) {
    log.errorWithStack("Failed to create document", error);
    throw error;
  }
}

/**
 * Update a Document record after user confirms extracted data.
 */
export async function confirmDocument(
  documentId: string,
  confirmedData: Record<string, unknown>
) {
  try {
    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "confirmed",
        confirmedData: confirmedData as Prisma.InputJsonValue,
        confirmedAt: new Date(),
      },
    });

    log.info("Document confirmed", { id: documentId });
    return document;
  } catch (error) {
    log.errorWithStack("Failed to confirm document", error);
    throw error;
  }
}

/**
 * Mark a document as failed.
 */
export async function failDocument(documentId: string, errorMessage: string) {
  try {
    return await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "failed",
        errorMessage,
      },
    });
  } catch (error) {
    log.errorWithStack("Failed to mark document as failed", error);
    throw error;
  }
}

/**
 * Get all documents for a situation.
 */
export async function getDocumentsForSituation(
  situationId: string,
  limit = 50
) {
  try {
    return await prisma.document.findMany({
      where: { situationId },
      orderBy: { uploadedAt: "desc" },
      take: limit,
    });
  } catch (error) {
    log.errorWithStack("Failed to get documents", error);
    return [];
  }
}

/**
 * Get a single document by ID.
 */
export async function getDocument(documentId: string) {
  try {
    return await prisma.document.findUnique({
      where: { id: documentId },
    });
  } catch (error) {
    log.errorWithStack("Failed to get document", error);
    return null;
  }
}
