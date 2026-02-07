/**
 * Streaming Chat API Endpoint
 * POST /api/v1/chat/stream
 *
 * Streams chat responses using Server-Sent Events (SSE).
 * Sends token chunks, metadata, and status updates as they arrive.
 * Handles client disconnects gracefully.
 *
 * Note: This is simulated streaming for MVP purposes. Real Claude API supports
 * streaming via AsyncIterator. The 10-50ms inter-token delay is for UX, not
 * actual LLM streaming. When integrated with real LLM, use:
 * `for await (const event of response) { ... }`
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { classifyServiceRequest } from '@/lib/llm/client';
import { prisma } from '@/lib/db/prisma';
import { formatStreamResponse } from '@/lib/response-generator/formatting';
import { checkRateLimits } from '@/lib/middleware/rate-limit';

/**
 * Generate a unique ID (simple implementation without uuid package)
 */
function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Chat message request schema for streaming
 */
const StreamChatRequestSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message is too long (max 2000 characters)'),
  customer_id: z.number().int().positive().optional(),
  session_id: z.string().optional(),
  business_id: z.number().int().positive().optional(),
});

type StreamChatRequest = z.infer<typeof StreamChatRequestSchema>;

/**
 * SSE Event types
 */
type SSEEventType = 'metadata' | 'message' | 'status' | 'error' | 'done';

interface SSEEvent {
  type: SSEEventType;
  data: any;
  timestamp?: string;
}

/**
 * Send an SSE event to the client
 */
function sendSSEEvent(stream: ReadableStreamDefaultController, event: SSEEvent) {
  const message = `data: ${JSON.stringify(event)}\n\n`;
  stream.enqueue(new TextEncoder().encode(message));
}

/**
 * POST /api/v1/chat/stream - Handle streaming chat requests
 */
export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || generateId();
  const startTime = Date.now();

  let conversation: any = null;
  let userMessage: any = null;
  let controller: ReadableStreamDefaultController;

  // Create SSE response stream
  const stream = new ReadableStream({
    async start(ctrl: ReadableStreamDefaultController) {
      controller = ctrl;

      try {
        // Parse and validate request
        const body = await request.json();
        const validated = StreamChatRequestSchema.parse(body);

        // Check rate limits (IP-based and customer_id-based)
        const rateLimitCheck = await checkRateLimits(request, validated.customer_id);
        if (!rateLimitCheck.allowed) {
          sendSSEEvent(controller, {
            type: 'error',
            data: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests. Please try again later.',
            },
          });
          controller.close();
          return;
        }

        logger.info('[CHAT STREAM] Starting stream', {
          correlationId,
          customerId: validated.customer_id,
          messageLength: validated.message.length,
        });

        // Send initial metadata event
        sendSSEEvent(controller, {
          type: 'metadata',
          data: {
            conversation_id: 'pending',
            message_id: 'pending',
            session_id: validated.session_id || `session_${Date.now()}`,
            timestamp: new Date().toISOString(),
          },
        });

        // Generate or find session
        const sessionId =
          validated.session_id ||
          `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Find or create conversation
        conversation = await prisma.conversation.findUnique({
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

          logger.info('[CHAT STREAM] Created conversation', {
            correlationId,
            conversationId: conversation.id,
          });
        }

        // Save user message
        userMessage = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: 'user',
            content: validated.message,
          },
        });

        // Update metadata with real IDs
        sendSSEEvent(controller, {
          type: 'metadata',
          data: {
            conversation_id: conversation.id,
            message_id: userMessage.id,
            session_id: sessionId,
            timestamp: new Date().toISOString(),
          },
        });

        // Send status: classification started
        sendSSEEvent(controller, {
          type: 'status',
          data: { status: 'classifying', message: 'Analyzing your request...' },
        });

        // Classify message
        let classification;
        try {
          classification = await classifyServiceRequest(validated.message);
        } catch (error) {
          logger.error('[CHAT STREAM] Classification failed', {
            correlationId,
            error: String(error),
          });

          classification = {
            service_type: 'general_maintenance',
            urgency: 'medium' as const,
            confidence: 0.3,
            reasoning: 'Could not classify',
            estimated_duration_minutes: 90,
          };
        }

        // Send classification metadata
        sendSSEEvent(controller, {
          type: 'metadata',
          data: {
            service_type: classification.service_type,
            urgency: classification.urgency,
            confidence: classification.confidence,
            duration_minutes: classification.estimated_duration_minutes,
          },
        });

        // Send status: generating response
        sendSSEEvent(controller, {
          type: 'status',
          data: { status: 'generating', message: 'Generating response...' },
        });

        // Generate and stream response chunks
        // IMPORTANT: This is simulated streaming with artificial delays for UX.
        // Real LLM integration would use: for await (const event of response) { ... }
        const response = formatStreamResponse({
          service_type: classification.service_type,
          urgency: classification.urgency as 'low' | 'medium' | 'high' | 'emergency',
          confidence: classification.confidence,
          estimated_duration_minutes: classification.estimated_duration_minutes,
        });
        
        const words = response.split(' ');

        for (let i = 0; i < words.length; i++) {
          // Check if client is still connected
          if (request.signal.aborted) {
            logger.info('[CHAT STREAM] Client disconnected', {
              correlationId,
              messagesProcessed: i,
            });
            break;
          }

          // Send word token
          sendSSEEvent(controller, {
            type: 'message',
            data: {
              token: words[i],
              index: i,
              total: words.length,
              percentage: ((i / words.length) * 100).toFixed(1),
            },
          });

          // Simulate streaming delay (10-50ms per token) - for UX only, not real LLM
          await new Promise((resolve) =>
            setTimeout(resolve, Math.random() * 40 + 10)
          );
        }

        // Save complete assistant message
        const assistantMessage = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: 'assistant',
            content: response,
            classification: JSON.stringify(classification),
          },
        });

        logger.info('[CHAT STREAM] Saved assistant message', {
          correlationId,
          messageId: assistantMessage.id,
          wordCount: words.length,
        });

        // Update conversation
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { classification: JSON.stringify(classification) },
        });

        // Send final status
        sendSSEEvent(controller, {
          type: 'status',
          data: {
            status: 'complete',
            message: 'Response complete',
            total_duration: `${Date.now() - startTime}ms`,
          },
        });

        // Send done event
        sendSSEEvent(controller, {
          type: 'done',
          data: {
            conversation_id: conversation.id,
            message_id: assistantMessage.id,
            tokens_sent: words.length,
          },
        });

        controller.close();
      } catch (error) {
        logger.error('[CHAT STREAM] Stream error', {
          correlationId,
          error: String(error),
        });

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        sendSSEEvent(controller, {
          type: 'error',
          data: {
            code: 'STREAM_ERROR',
            message: errorMessage,
          },
        });

        controller.close();
      }
    },
  });

  // Return SSE response
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in nginx/proxies
    },
  });
}
