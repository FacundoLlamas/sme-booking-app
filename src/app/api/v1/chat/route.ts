/**
 * Chat Message API Endpoint
 * POST /api/v1/chat
 *
 * Conversational booking assistant powered by Claude tool use.
 * - Loads conversation history from database
 * - Sends full history + tools to Claude
 * - Executes tools server-side (check_availability, create_booking)
 * - Returns final text response to frontend
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiSuccess, apiError } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import {
  createConversationMessage,
  ConversationMessage,
  ContentBlock,
} from '@/lib/llm/client';
import { prisma } from '@/lib/db/prisma';
import { checkRateLimits } from '@/lib/middleware/rate-limit';
import { getEviosBookingSystemPrompt } from '@/lib/classification/system-prompt';
import { BOOKING_TOOLS, executeTool } from '@/lib/llm/tools';

function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

const ChatMessageRequestSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message is too long (max 2000 characters)'),
  customer_id: z.number().int().positive().optional(),
  session_id: z.string().optional(),
  business_id: z.number().int().positive().optional(),
});

const MAX_TOOL_ITERATIONS = 5;
const MAX_HISTORY_MESSAGES = 20;

/**
 * POST /api/v1/chat - Handle incoming chat message
 */
export async function POST(request: NextRequest) {
  const correlationId =
    request.headers.get('x-correlation-id') || generateId();
  const startTime = Date.now();

  try {
    const body = await request.json();
    const validated = ChatMessageRequestSchema.parse(body);

    // Rate limiting
    const rateLimitCheck = await checkRateLimits(
      request,
      validated.customer_id
    );
    if (!rateLimitCheck.allowed) {
      return rateLimitCheck.response!;
    }

    const sessionId =
      validated.session_id ||
      `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

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
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Save user message to DB
    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: validated.message,
      },
    });

    // Load conversation history
    const dbMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: MAX_HISTORY_MESSAGES,
    });

    const claudeMessages: ConversationMessage[] = dbMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    logger.info('[CHAT API] Processing message', {
      correlationId,
      conversationId: conversation.id,
      historyLength: claudeMessages.length,
    });

    // Run tool loop to get AI response
    let aiResponse: string;
    try {
      aiResponse = await runToolLoop(claudeMessages, correlationId);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : String(error);
      logger.error('[CHAT API] Tool loop failed', {
        correlationId,
        error: errorMsg,
      });
      aiResponse =
        "Sorry, I'm having trouble right now. You can book directly on our booking page, or try again in a moment.";
    }

    // Save assistant response to DB
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse,
      },
    });

    const duration = Date.now() - startTime;
    logger.info('[CHAT API] Response sent', {
      correlationId,
      duration: `${duration}ms`,
      conversationId: conversation.id,
    });

    return apiSuccess({
      id: assistantMessage.id,
      conversation_id: conversation.id,
      message_id: userMessage.id,
      response: aiResponse,
      timestamp: new Date().toISOString(),
    });
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

/**
 * Run the tool execution loop
 * Sends messages to Claude, executes any tool calls, repeats until text response
 */
async function runToolLoop(
  messages: ConversationMessage[],
  correlationId: string
): Promise<string> {
  let currentMessages = [...messages];
  let iterations = 0;

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++;

    const response = await createConversationMessage({
      messages: currentMessages,
      system: getEviosBookingSystemPrompt(),
      tools: BOOKING_TOOLS,
      maxTokens: 1024,
    });

    logger.info('[CHAT API] Claude response', {
      correlationId,
      stopReason: response.stop_reason,
      iteration: iterations,
      inputTokens: response.tokens.input,
      outputTokens: response.tokens.output,
    });

    // If end_turn, extract text and return
    if (
      response.stop_reason === 'end_turn' ||
      response.stop_reason === 'max_tokens'
    ) {
      const textBlock = response.content.find((b) => b.type === 'text');
      return (
        textBlock?.text ||
        "I'm here to help you book a service. What do you need?"
      );
    }

    // If tool_use, execute tools and loop
    if (response.stop_reason === 'tool_use') {
      // Add Claude's response (with tool_use blocks) to messages
      currentMessages.push({
        role: 'assistant',
        content: response.content,
      });

      // Execute each tool and collect results
      const toolResultBlocks: ContentBlock[] = [];

      for (const block of response.content) {
        if (block.type === 'tool_use' && block.name && block.id) {
          logger.info('[CHAT API] Executing tool', {
            correlationId,
            tool: block.name,
            input: block.input,
          });

          const { result, isError } = await executeTool(
            block.name,
            block.input || {}
          );

          toolResultBlocks.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result,
            is_error: isError,
          });
        }
      }

      // Add tool results as user message (Anthropic API spec)
      currentMessages.push({
        role: 'user',
        content: toolResultBlocks,
      });
    }
  }

  // Safety fallback
  logger.warn('[CHAT API] Max tool iterations reached', { correlationId });
  return "I ran into an issue. Could you try rephrasing your request?";
}
