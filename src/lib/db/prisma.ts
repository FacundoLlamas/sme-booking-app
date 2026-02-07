/**
 * Singleton Prisma Client
 * 
 * Critical for connection pooling and resource management.
 * DO NOT create new PrismaClient() instances in route handlers.
 * Always import this singleton instead.
 * 
 * In Next.js development, the hot reload can cause connection issues.
 * We use the global object to ensure only one instance exists across reloads.
 */

import { PrismaClient } from '@prisma/client';

// Prevent multiple instances in development hot reload
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['warn', 'error'] 
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Register cleanup on app shutdown
 * This ensures proper connection cleanup when the app terminates
 */
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
