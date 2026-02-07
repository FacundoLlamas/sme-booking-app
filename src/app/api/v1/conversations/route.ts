/**
 * Conversation History API Endpoint
 * GET /api/v1/conversations - Retrieve conversations with pagination
 * POST /api/v1/conversations - Create new conversation with context
 *
 * Manages conversation history and context windows for chat sessions.
 * Supports pagination and filters by customer, business, or status.
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
 * Get conversations request schema
 */
const GetConversationsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  customer_id: z.coerce.number().int().positive().optional(),
  business_id: z.coerce.number().int().positive().optional(),
  status: z.enum(['active', 'closed', 'archived']).optional(),
  session_id: z.string().optional(),
});

/**
 * Create conversation request schema
 */
const CreateConversationSchema = z.object({
  session_id: z.string().optional(),
  customer_id: z.number().int().positive().optional(),
  business_id: z.number().int().positive().optional(),
  initial_context: z.string().optional(),
});

type GetConversationsRequest = z.infer<typeof GetConversationsSchema>;
type CreateConversationRequest = z.infer<typeof CreateConversationSchema>;

/**
 * Conversation response DTO
 */
interface ConversationDTO {
  id: number;
  session_id: string;
  customer_id: number | null;
  business_id: number | null;
  status: string;
  message_count: number;
  last_message: string | null;
  last_message_time: string | null;
  classification: any | null;
  created_at: string;
  updated_at: string;
}

/**
 * Message response DTO
 */
interface MessageDTO {
  id: number;
  role: string;
  content: string;
  classification: any | null;
  created_at: string;
}

/**
 * GET /api/v1/conversations - List conversations
 */
export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || generateId();
  const startTime = Date.now();

  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = GetConversationsSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      customer_id: searchParams.get('customer_id'),
      business_id: searchParams.get('business_id'),
      status: searchParams.get('status'),
      session_id: searchParams.get('session_id'),
    });

    logger.info('[CONVERSATIONS GET] Request received', {
      correlationId,
      page: params.page,
      limit: params.limit,
      hasFilters: !!(params.customer_id || params.business_id || params.status),
    });

    // Build where clause for filters
    const where: any = {};
    if (params.customer_id) where.customerId = params.customer_id;
    if (params.business_id) where.businessId = params.business_id;
    if (params.status) where.status = params.status;
    if (params.session_id) where.sessionId = params.session_id;

    // Add filter to exclude expired conversations
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } },
    ];

    // Get total count
    const total = await prisma.conversation.count({ where });

    // Get paginated conversations
    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get only the latest message
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });

    // Transform to DTOs
    const conversationDTOs: ConversationDTO[] = conversations.map((conv) => ({
      id: conv.id,
      session_id: conv.sessionId,
      customer_id: conv.customerId,
      business_id: conv.businessId,
      status: conv.status,
      message_count: 0, // We'll populate this next
      last_message: conv.messages[0]?.content || null,
      last_message_time: conv.messages[0]?.createdAt.toISOString() || null,
      classification: conv.classification ? JSON.parse(conv.classification) : null,
      created_at: conv.createdAt.toISOString(),
      updated_at: conv.updatedAt.toISOString(),
    }));

    // Get message counts for each conversation
    const messageCounts = await Promise.all(
      conversations.map((conv) =>
        prisma.message.count({ where: { conversationId: conv.id } })
      )
    );

    messageCounts.forEach((count, index) => {
      conversationDTOs[index].message_count = count;
    });

    logger.info('[CONVERSATIONS GET] Response sent', {
      correlationId,
      duration: `${Date.now() - startTime}ms`,
      count: conversationDTOs.length,
      total,
    });

    return apiSuccess(conversationDTOs, {
      ...paginationMeta(params.page, params.limit, total),
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof z.ZodError) {
      logger.warn('[CONVERSATIONS GET] Validation error', {
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

    logger.error('[CONVERSATIONS GET] Error', {
      correlationId,
      duration: `${duration}ms`,
      error: String(error),
    });

    return apiError('INTERNAL_ERROR', 'Failed to retrieve conversations', 500);
  }
}

/**
 * POST /api/v1/conversations - Create new conversation or get by session_id
 */
export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || generateId();
  const startTime = Date.now();

  try {
    const body = await request.json();
    const validated = CreateConversationSchema.parse(body);

    logger.info('[CONVERSATIONS POST] Request received', {
      correlationId,
      hasSessionId: !!validated.session_id,
      customerId: validated.customer_id,
    });

    // If session_id provided, return existing or create new
    const sessionId =
      validated.session_id ||
      `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    let conversation = await prisma.conversation.findUnique({
      where: { sessionId },
    });

    if (conversation) {
      logger.info('[CONVERSATIONS POST] Found existing conversation', {
        correlationId,
        conversationId: conversation.id,
        sessionId,
      });
    } else {
      conversation = await prisma.conversation.create({
        data: {
          sessionId,
          customerId: validated.customer_id || null,
          businessId: validated.business_id || null,
          status: 'active',
          context: validated.initial_context || null,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      });

      logger.info('[CONVERSATIONS POST] Created new conversation', {
        correlationId,
        conversationId: conversation.id,
        sessionId,
      });
    }

    // Fetch full conversation with messages (last 10)
    const fullConversation = await prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!fullConversation) {
      throw new Error('Conversation not found after creation');
    }

    // Reverse messages to get chronological order (oldest first)
    const messages: MessageDTO[] = fullConversation.messages
      .reverse()
      .map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        classification: msg.classification ? JSON.parse(msg.classification) : null,
        created_at: msg.createdAt.toISOString(),
      }));

    // Count total messages
    const totalMessages = await prisma.message.count({
      where: { conversationId: fullConversation.id },
    });

    const conversationDTO: ConversationDTO & { messages: MessageDTO[] } = {
      id: fullConversation.id,
      session_id: fullConversation.sessionId,
      customer_id: fullConversation.customerId,
      business_id: fullConversation.businessId,
      status: fullConversation.status,
      message_count: totalMessages,
      last_message: messages[messages.length - 1]?.content || null,
      last_message_time: messages[messages.length - 1]?.created_at || null,
      classification: fullConversation.classification
        ? JSON.parse(fullConversation.classification)
        : null,
      created_at: fullConversation.createdAt.toISOString(),
      updated_at: fullConversation.updatedAt.toISOString(),
      messages,
    };

    logger.info('[CONVERSATIONS POST] Response sent', {
      correlationId,
      duration: `${Date.now() - startTime}ms`,
      conversationId: conversation.id,
      messageCount: messages.length,
    });

    return apiSuccess(conversationDTO, {
      page: 1,
      limit: 10,
      total: totalMessages,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof z.ZodError) {
      logger.warn('[CONVERSATIONS POST] Validation error', {
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

    logger.error('[CONVERSATIONS POST] Error', {
      correlationId,
      duration: `${duration}ms`,
      error: String(error),
    });

    return apiError('INTERNAL_ERROR', 'Failed to create/retrieve conversation', 500);
  }
}
