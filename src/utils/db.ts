import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "stdout", level: "info" },
      { emit: "stdout", level: "warn" },
      { emit: "stdout", level: "error" },
    ],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

prisma.$on("query", (e: any) => {
  logger.info(`Query: ${e.query}`);
  logger.info(`Params: ${e.params}`);
  logger.info(`Duration: ${e.duration}ms`);
});

async function connectDB() {
  try {
    await prisma.$connect();
    logger.info("Database connected successfully");
  } catch (error) {
    logger.error("Database connection error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

export { prisma, connectDB };
