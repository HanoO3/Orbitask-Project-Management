import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () =>
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

export const prisma =
  globalForPrisma.prisma && (globalForPrisma.prisma as { chatMessage?: unknown }).chatMessage
    ? globalForPrisma.prisma
    : (globalForPrisma.prisma = createPrismaClient());

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;