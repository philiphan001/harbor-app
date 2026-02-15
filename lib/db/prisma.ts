// Prisma client singleton for use in API routes and server-side code
// Note: Run `npx prisma generate` after `npx prisma db push` to generate the client

let prisma: any;

try {
  // Dynamic import — will fail until prisma generate has been run
  const { PrismaClient } = require("@/lib/generated/prisma");

  const globalForPrisma = globalThis as unknown as {
    prisma: InstanceType<typeof PrismaClient> | undefined;
  };

  prisma = globalForPrisma.prisma ?? new PrismaClient();

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
} catch {
  // Prisma client not yet generated — this is expected before first `npx prisma generate`
  console.warn("Prisma client not generated yet. Run: npx prisma db push && npx prisma generate");
  prisma = null;
}

export { prisma };
