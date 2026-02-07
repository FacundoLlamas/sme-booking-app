/**
 * Conversation Detail API Endpoint
 * GET /api/v1/conversations/[id] - Retrieve specific conversation with full history
 *
 * Returns conversation details with configurable message context window.
 * Supports pagination of messages.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiSuccess, apiError, paginationMeta } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db/prisma';

/**
 * Generate a unique ID (simple implementation without uuid package)
 */
function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Get conversation detail request schema
 */
const GetConversationDetailSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  context_window: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(10),
});

type GetConversationDetailRequest = z.infer<typeof GetConversationDetailSchema>;

/**
 * Message with classification
 */
interface MessageDetail {
  id: number;
  role: string;
  content: string;
  tokens?: number | null;
  classification?: any | null;
  created_at: string;
}

/**
 * Conversation detail response
 */
interface ConversationDetail {
  id: number;
  session_id: string;
  customer_id: number | null;
  business_id: number | null;
  status: string;
  context: string | null;
  classification: any | null;
  total_messages: number;
  messages: MessageDetail[];
  created_at: string;
  updated_at: string;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * GET /api/v1/conversations/[id] - Get conversation details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const correlationId = request.headers.get('x-correlation-id') || generateId();
  const startTime = Date.now();

  try {
    const conversationId = parseInt(params.id);

    if (isNaN(conversationId)) {
      return apiError('INVALID_ID', 'Conversation ID must be a number', 400);
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = GetConversationDetailSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      context_window: searchParams.get('context_window'),
    });

    logger.info('[CONVERSATION DETAIL GET] Request received', {
      correlationId,
      conversationId,
      page: queryParams.page,
      limit: queryParams.limit,
      contextWindow: queryParams.context_window,
    });

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      logger.warn('[CONVERSATION DETAIL GET] Not found', {
        correlationId,
        conversationId,
      });

      return apiError('NOT_FOUND', 'Conversation not found', 404);
    }

    // Check if conversation has expired
    if (conversation.expiresAt && new Date() > conversation.expiresAt) {
      logger.warn('[CONVERSATION DETAIL GET] Conversation expired', {
        correlationId,
        conversationId,
        expiresAt: conversation.expiresAt,
      });

      return apiError('NOT_FOUND', 'Conversation has expired', 404);
    }

    // Get total message count
    const totalMessages = await prisma.message.count({
      where: { conversationId },
    });

    // Get paginated messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      skip: (queryParams.page - 1) * queryParams.limit,
      take: queryParams.limit,
    });

    // Transform messages to DTOs
    const messageDetails: MessageDetail[] = messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      tokens: msg.tokens,
      classification: msg.classification ? JSON.parse(msg.classification) : null,
      created_at: msg.createdAt.toISOString(),
    }));

    // Get last N messages for context window (for display purposes)
    const contextMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: queryParams.context_window,
    });

    const responseData: ConversationDetail = {
      id: conversation.id,
      session_id: conversation.sessionId,
      customer_id: conversation.customerId,
      business_id: conversation.businessId,
      status: conversation.status,
      context: conversation.context,
      classification: conversation.classification
        ? JSON.parse(conversation.classification)
        : null,
      total_messages: totalMessages,
      messages: messageDetails,
      created_at: conversation.createdAt.toISOString(),
      updated_at: conversation.updatedAt.toISOString(),
      meta: {
        page: queryParams.page,
        limit: queryParams.limit,
        total: totalMessages,
        totalPages: Math.ceil(totalMessages / queryParams.limit),
        hasNext: queryParams.page * queryParams.limit < totalMessages,
        hasPrev: queryParams.page > 1,
      },
    };

    const duration = Date.now() - startTime;
    logger.info('[CONVERSATION DETAIL GET] Response sent', {
      correlationId,
      duration: `${duration}ms`,
      conversationId,
      messageCount: messageDetails.length,
      totalMessages,
    });

    return apiSuccess(responseData);
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof z.ZodError) {
      logger.warn('[CONVERSATION DETAIL GET] Validation error', {
        correlationId,
        duration: `${duration}ms`,
        errors: error.errors,
      });

      return apiError(
        'INVALID_REQUEST',
        'Invalid query parameters',
        400,
        error.errors
      );
    }

    logger.error('[CONVERSATION DETAIL GET] Error', {
      correlationId,
      duration: `${duration}ms`,
      error: String(error),
    });

    return apiError('INTERNAL_ERROR', 'Failed to retrieve conversation', 500);
  }
}

/**
 * PATCH /api/v1/conversations/[id] - Update conversation status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const correlationId = request.headers.get('x-correlation-id') || generateId();
  const startTime = Date.now();

  try {
    const conversationId = parseInt(params.id);

    if (isNaN(conversationId)) {
      return apiError('INVALID_ID', 'Conversation ID must be a number', 400);
    }

    const body = await request.json();
    const updateSchema = z.object({
      status: z.enum(['active', 'closed', 'archived']).optional(),
      context: z.string().optional(),
    });

    const validated = updateSchema.parse(body);

    logger.info('[CONVERSATION PATCH] Request received', {
      correlationId,
      conversationId,
      status: validated.status,
    });

    // Check conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return apiError('NOT_FOUND', 'Conversation not found', 404);
    }

    // Update conversation
    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: validated.status || conversation.status,
        context: validated.context !== undefined ? validated.context : conversation.context,
      },
    });

    logger.info('[CONVERSATION PATCH] Updated', {
      correlationId,
      conversationId,
      newStatus: updated.status,
      duration: `${Date.now() - startTime}ms`,
    });

    return apiSuccess({
      id: updated.id,
      session_id: updated.sessionId,
      status: updated.status,
      updated_at: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof z.ZodError) {
      logger.warn('[CONVERSATION PATCH] Validation error', {
        correlationId,
        duration: `${duration}ms`,
        errors: error.errors,
      });

      return apiError(
        'INVALID_REQUEST',
        'Invalid request body',
        400,
        error.errors
      );
    }

    logger.error('[CONVERSATION PATCH] Error', {
      correlationId,
      duration: `${duration}ms`,
      error: String(error),
    });

    return apiError('INTERNAL_ERROR', 'Failed to update conversation', 500);
  }
}
