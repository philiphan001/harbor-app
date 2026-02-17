// GET /api/documents — Fetch all documents for the authenticated user
// Returns documents across all situations owned by the user

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/utils/logger";

const log = createLogger("api/documents");

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    // Find all situations for this user
    const situations = await prisma.situation.findMany({
      where: { createdBy: auth.user.id },
      select: { id: true },
    });

    const situationIds = situations.map((s) => s.id);

    if (situationIds.length === 0) {
      // No situations — check for documents uploaded by this user directly
      const orphanedDocs = await prisma.document.findMany({
        where: { uploadedBy: auth.user.id },
        orderBy: { uploadedAt: "desc" },
        take: 50,
      });

      return NextResponse.json({ documents: orphanedDocs });
    }

    // Fetch documents across all situations
    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { situationId: { in: situationIds } },
          { uploadedBy: auth.user.id },
        ],
      },
      orderBy: { uploadedAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ documents });
  } catch (error) {
    log.errorWithStack("Failed to fetch documents", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
