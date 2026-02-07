/**
 * Chat Message API Endpoint
 * POST /api/v1/chat
 *
 * Handles customer chat messages for service booking assistance.
 * - Stores conversation and messages in database
 * - Classifies messages using LLM
 * - Returns structured response with service type, urgency, and next steps
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiSuccess, apiError } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { createMessage } from '@/lib/llm/client';
import { prisma } from '@/lib/db/prisma';
import { formatNextSteps } from '@/lib/response-generator/formatting';
import { checkRateLimits } from '@/lib/middleware/rate-limit';
import { getEvosChatSystemPrompt } from '@/lib/classification/system-prompt';

/**
 * Generate a unique ID (simple implementation without uuid package)
 */
function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Chat message request schema
 */
const ChatMessageRequestSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message is too long (max 2000 characters)'),
  customer_id: z.number().int().positive().optional(),
  session_id: z.string().optional(),
  business_id: z.number().int().positive().optional(),
});

type ChatMessageRequest = z.infer<typeof ChatMessageRequestSchema>;

/**
 * Response data structure
 */
interface ChatMessageResponse {
  id: number;
  conversation_id: number;
  message_id: number;
  response: string;
  service_type: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  confidence: number;
  next_steps: string[];
  timestamp: string;
}

/**
 * POST /api/v1/chat - Handle incoming chat message
 */
export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || generateId();
  const startTime = Date.now();

  try {
    // Parse and validate request body
    const body = await request.json();
    const validated = ChatMessageRequestSchema.parse(body);

    // Check rate limits (IP-based and customer_id-based)
    const rateLimitCheck = await checkRateLimits(request, validated.customer_id);
    if (!rateLimitCheck.allowed) {
      return rateLimitCheck.response!;
    }

    logger.info('[CHAT API] Incoming message', {
      correlationId,
      customerId: validated.customer_id,
      messageLength: validated.message.length,
      hasSession: !!validated.session_id,
    });

    // Generate session ID if not provided
    const sessionId = validated.session_id || `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Find or create conversation
    let conversation = await prisma.conversation.findUnique({
      where: { sessionId },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          sessionId,
          customerId: validated.customer_id || null,
          businessId: validated.business_id || null,
          status: 'active',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      });

      logger.info('[CHAT API] Created new conversation', {
        correlationId,
        conversationId: conversation.id,
        sessionId,
      });
    }

    // Save user message to database
    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: validated.message,
      },
    });

    logger.info('[CHAT API] Saved user message', {
      correlationId,
      messageId: userMessage.id,
      conversationId: conversation.id,
    });

    // Generate conversational response using Claude
    let aiResponse: string;
    let classification = {
      service_type: 'general',
      urgency: 'medium' as const,
      confidence: 0.5,
    };

    try {
      const llmResponse = await createMessage({
        prompt: validated.message,
        system: getEvosChatSystemPrompt(),
        maxTokens: 512,
      });
      aiResponse = llmResponse.content;

      logger.info('[CHAT API] LLM response generated', {
        correlationId,
        model: llmResponse.model,
        inputTokens: llmResponse.tokens.input,
        outputTokens: llmResponse.tokens.output,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('[CHAT API] LLM response failed', {
        correlationId,
        error: errorMsg,
      });

      // Fallback response with error info for debugging
      aiResponse = `Welcome to Evios HQ! I can help you with plumbing, electrical, HVAC, general maintenance, and landscaping services. How can I assist you today? [Debug: ${errorMsg}]`;
    }

    // Save assistant message to database
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse,
        classification: JSON.stringify(classification),
      },
    });

    logger.info('[CHAT API] Saved assistant message', {
      correlationId,
      messageId: assistantMessage.id,
    });

    // Generate next steps
    const nextSteps = formatNextSteps(
      classification.service_type,
      classification.urgency
    );

    // Return structured response
    const response: ChatMessageResponse = {
      id: assistantMessage.id,
      conversation_id: conversation.id,
      message_id: userMessage.id,
      response: aiResponse,
      service_type: classification.service_type,
      urgency: classification.urgency,
      confidence: classification.confidence,
      next_steps: nextSteps,
      timestamp: new Date().toISOString(),
    };

    const duration = Date.now() - startTime;
    logger.info('[CHAT API] Response sent', {
      correlationId,
      duration: `${duration}ms`,
      conversationId: conversation.id,
    });

    return apiSuccess(response);
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof z.ZodError) {
      logger.warn('[CHAT API] Validation error', {
        correlationId,
        duration: `${duration}ms`,
        errors: error.errors,
      });

      return apiError(
        'INVALID_REQUEST',
        'Invalid request parameters',
        400,
        error.errors
      );
    }

    if (error instanceof Error) {
      logger.error('[CHAT API] Error processing message', {
        correlationId,
        duration: `${duration}ms`,
        error: error.message,
      });

      return apiError('INTERNAL_ERROR', error.message, 500);
    }

    logger.error('[CHAT API] Unknown error', {
      correlationId,
      duration: `${duration}ms`,
    });

    return apiError('INTERNAL_ERROR', 'An unknown error occurred', 500);
  }
}
