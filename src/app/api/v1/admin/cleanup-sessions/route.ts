/**
 * Admin Cleanup Sessions Endpoint
 * DELETE /api/v1/admin/cleanup-sessions
 *
 * Removes expired conversations (older than 7 days).
 * Can be triggered manually or via cron job.
 *
 * Security: In production, add proper authentication/authorization.
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db/prisma';

/**
 * Generate a unique ID (simple implementation without uuid package)
 */
function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * DELETE /api/v1/admin/cleanup-sessions - Delete expired sessions
 */
export async function DELETE(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || generateId();
  const startTime = Date.now();

  try {
    logger.info('[CLEANUP SESSIONS] Starting cleanup job', {
      correlationId,
    });

    // Find all expired conversations
    const expiredConversations = await prisma.conversation.findMany({
      where: {
        expiresAt: {
          lt: new Date(), // Conversations where expiresAt is in the past
        },
      },
      select: { id: true, sessionId: true },
    });

    const count = expiredConversations.length;

    if (count === 0) {
      logger.info('[CLEANUP SESSIONS] No expired conversations found', {
        correlationId,
      });

      return apiSuccess({
        message: 'No expired conversations to clean up',
        deleted_count: 0,
        duration: `${Date.now() - startTime}ms`,
      });
    }

    // Delete expired conversations (cascades to messages via Prisma)
    const result = await prisma.conversation.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    logger.info('[CLEANUP SESSIONS] Cleanup completed', {
      correlationId,
      deleted_count: result.count,
      duration: `${Date.now() - startTime}ms`,
    });

    return apiSuccess({
      message: `Successfully cleaned up ${result.count} expired conversations`,
      deleted_count: result.count,
      duration: `${Date.now() - startTime}ms`,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('[CLEANUP SESSIONS] Error during cleanup', {
      correlationId,
      duration: `${duration}ms`,
      error: String(error),
    });

    return apiError('CLEANUP_FAILED', 'Failed to clean up expired sessions', 500);
  }
}
