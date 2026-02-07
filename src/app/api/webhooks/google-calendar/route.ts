/**
 * POST /api/webhooks/google-calendar
 * Webhook receiver for Google Calendar push notifications
 * 
 * Handles:
 * - Event creation/deletion in external calendar
 * - Conflict detection
 * - Booking status updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { deleteEvent } from '@/lib/google/__mocks__/mock-calendar';

const prisma = new PrismaClient();

interface CalendarWebhookPayload {
  businessId: number;
  resourceId: string; // Google Calendar resource ID
  resourceState: string; // 'exists', 'notExists'
  channelId: string;
  channelExpiration?: string;
  message?: string;
  eventId?: string;
  action?: 'created' | 'updated' | 'deleted'; // Custom field for mock
}

/**
 * Validate webhook signature (HMAC)
 * Google Calendar uses X-Goog-Channel-Token header
 */
function validateWebhookSignature(
  request: NextRequest,
  payload: string
): boolean {
  // In real Google Calendar webhooks, we would validate the HMAC signature
  // For now, we'll accept all webhooks (should be locked down by network/auth in production)
  
  const token = request.headers.get('x-goog-channel-token');
  const signature = request.headers.get('x-goog-channel-id');

  if (!token || !signature) {
    logger.warn('[Calendar Webhook] Missing webhook headers');
    return true; // Accept for now in mock mode
  }

  // TODO: Implement real HMAC validation
  // const expectedSignature = crypto
  //   .createHmac('sha256', process.env.GOOGLE_CALENDAR_WEBHOOK_SECRET || '')
  //   .update(payload)
  //   .digest('hex');
  // return signature === expectedSignature;

  return true;
}

/**
 * Handle event deleted externally
 */
async function handleEventDeleted(
  businessId: number,
  eventId: string
): Promise<void> {
  try {
    // Find booking with this calendar event ID
    const booking = await prisma.booking.findFirst({
      where: {
        businessId,
        calendarEventId: eventId,
      },
    });

    if (!booking) {
      logger.warn(
        `[Calendar Webhook] Event not found in bookings: ${eventId}`
      );
      return;
    }

    // Cancel the booking
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'cancelled',
        notes: `Cancelled due to external calendar deletion on ${new Date().toISOString()}`,
      },
    });

    // Log sync event
    await prisma.calendarSyncLog.create({
      data: {
        businessId,
        eventId,
        bookingId: booking.id,
        action: 'deleted',
        status: 'synced',
        details: JSON.stringify({
          reason: 'Event deleted in external calendar',
          customer_name: booking.notes,
        }),
      },
    });

    // TODO: Send notification to customer
    // await sendCustomerNotification(booking.customerId, {
    //   title: 'Appointment Cancelled',
    //   message: 'Your appointment was cancelled.',
    // });

    logger.info(
      `[Calendar Webhook] Booking ${booking.id} cancelled due to event deletion: ${eventId}`
    );
  } catch (error) {
    logger.error('[Calendar Webhook] Failed to handle event deletion:', error);
    throw error;
  }
}

/**
 * Handle conflict detection
 * When an event is created/updated that conflicts with an existing booking
 */
async function handleConflict(
  businessId: number,
  eventId: string,
  conflictingBookingId: number
): Promise<void> {
  try {
    // Log conflict in sync log
    await prisma.calendarSyncLog.create({
      data: {
        businessId,
        eventId,
        bookingId: conflictingBookingId,
        action: 'created', // or 'updated'
        status: 'conflict',
        details: JSON.stringify({
          reason: 'Event conflicts with existing booking',
          externalEventId: eventId,
        }),
      },
    });

    // Update booking status to conflict
    await prisma.booking.update({
      where: { id: conflictingBookingId },
      data: {
        status: 'conflict_detected',
        notes: `Conflict with external calendar event ${eventId}`,
      },
    });

    logger.warn(
      `[Calendar Webhook] Conflict detected for booking ${conflictingBookingId} and event ${eventId}`
    );

    // TODO: Notify admin of conflict
    // await sendAdminNotification({
    //   title: 'Calendar Conflict',
    //   message: `Conflict between booking ${conflictingBookingId} and external event ${eventId}`,
    //   severity: 'warning',
    // });
  } catch (error) {
    logger.error('[Calendar Webhook] Failed to handle conflict:', error);
    throw error;
  }
}

/**
 * Process webhook payload
 */
async function processWebhook(payload: CalendarWebhookPayload): Promise<void> {
  try {
    const { businessId, resourceId, resourceState, action, eventId } = payload;

    logger.info(
      `[Calendar Webhook] Processing: action=${action}, businessId=${businessId}, eventId=${eventId}`
    );

    // Handle different webhook actions
    if (action === 'deleted' && eventId) {
      await handleEventDeleted(businessId, eventId);
    } else if (action === 'created' && eventId) {
      // Could check for conflicts here
      logger.info(`[Calendar Webhook] Event created: ${eventId}`);

      await prisma.calendarSyncLog.create({
        data: {
          businessId,
          eventId,
          action: 'created',
          status: 'synced',
        },
      });
    } else if (action === 'updated' && eventId) {
      logger.info(`[Calendar Webhook] Event updated: ${eventId}`);

      await prisma.calendarSyncLog.create({
        data: {
          businessId,
          eventId,
          action: 'updated',
          status: 'synced',
        },
      });
    }

    // Log webhook receipt
    logger.debug(
      `[Calendar Webhook] Processed successfully for business ${businessId}`
    );
  } catch (error) {
    logger.error('[Calendar Webhook] Error processing webhook:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Read request body
    const body = await request.text();

    // Validate signature
    if (!validateWebhookSignature(request, body)) {
      logger.warn('[Calendar Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse payload
    let payload: CalendarWebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch {
      logger.warn('[Calendar Webhook] Invalid JSON payload');
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    // Validate payload
    if (!payload.businessId) {
      logger.warn('[Calendar Webhook] Missing businessId');
      return NextResponse.json(
        { error: 'Missing businessId' },
        { status: 400 }
      );
    }

    // Process webhook asynchronously
    processWebhook(payload).catch((error) => {
      logger.error('[Calendar Webhook] Failed to process webhook:', error);
    });

    // Return 202 Accepted immediately
    return NextResponse.json(
      { success: true, message: 'Webhook received' },
      { status: 202 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Calendar Webhook] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Health check for webhook endpoint
 */
export async function GET(_request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Google Calendar webhook endpoint is ready',
    endpoint: '/api/webhooks/google-calendar',
  });
}
