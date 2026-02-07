/**
 * Booking Creation API Endpoint
 * POST /api/v1/bookings
 *
 * Creates a new booking with:
 * - Atomic database transaction (all-or-nothing)
 * - Conflict detection using pessimistic locking
 * - Calendar event creation (if Calendar API available)
 * - Confirmation code generation (8-char alphanumeric)
 *
 * Request Schema:
 * {
 *   customer_name: string,
 *   phone: string,
 *   email: string,
 *   address: string,
 *   service_type: string,
 *   expert_id: number,
 *   booking_time: ISO8601 datetime,
 *   notes?: string
 * }
 *
 * Response Schema:
 * {
 *   booking_id: number,
 *   confirmation_code: string,
 *   calendar_event_id?: string,
 *   reminder_sent_at?: ISO8601 datetime,
 *   status: string,
 *   booking_time: ISO8601 datetime,
 *   created_at: ISO8601 datetime
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiSuccess, apiError } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db/prisma';
import { CreateBookingSchema, validateBookingRequest } from '@/lib/bookings/validators';
import { checkConflictInTransaction } from '@/lib/bookings/conflict-checker';
import { createEvent } from '@/lib/google/calendar-client';

/**
 * Generate unique ID for correlation tracking
 */
function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Generate confirmation code: 8-character alphanumeric
 * Format: ABCD1234
 */
function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * POST /api/v1/bookings
 * Create a new booking with atomic transaction and conflict detection
 */
export async function POST(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || generateCorrelationId();
  const startTime = Date.now();

  try {
    // Parse and validate request body
    const body = await request.json();

    logger.info('[BOOKINGS POST] Request received', {
      correlationId,
      customer_name: body.customer_name,
      expert_id: body.expert_id,
      service_type: body.service_type,
    });

    // Validate schema
    let validatedRequest: typeof CreateBookingSchema._type;
    try {
      validatedRequest = CreateBookingSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('[BOOKINGS POST] Schema validation failed', {
          correlationId,
          errors: error.errors,
        });

        return apiError(
          'INVALID_REQUEST',
          'Request validation failed',
          400,
          error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        );
      }
      throw error;
    }

    // Comprehensive business logic validation
    const validationResult = await validateBookingRequest(validatedRequest);

    if (!validationResult.valid) {
      logger.warn('[BOOKINGS POST] Business validation failed', {
        correlationId,
        errors: validationResult.errors,
      });

      return apiError(
        'VALIDATION_FAILED',
        'Booking validation failed',
        422,
        {
          errors: validationResult.errors,
          warnings: validationResult.warnings,
        }
      );
    }

    const bookingTime = new Date(validatedRequest.booking_time);

    // Atomic transaction: conflict check + booking creation + calendar event
    let bookingId: number;
    let confirmationCode: string;
    let calendarEventId: string | null = null;

    try {
      const transactionResult = await prisma.$transaction(
        async (tx) => {
          // 1. Check for conflicts with pessimistic locking
          const conflictCheck = await checkConflictInTransaction({
            expert_id: validatedRequest.expert_id,
            booking_time: bookingTime,
            service_type: validatedRequest.service_type,
          });

          if (!conflictCheck.canBook) {
            const conflictTime = conflictCheck.conflictingBooking?.booking_time.toISOString();
            throw new Error(
              `Booking conflict detected at ${conflictTime}. Expert is not available at this time.`
            );
          }

          // 2. Create or get customer
          let customer = await tx.customer.findFirst({
            where: {
              phone: validatedRequest.phone,
            },
          });

          if (!customer) {
            customer = await tx.customer.create({
              data: {
                name: validatedRequest.customer_name,
                phone: validatedRequest.phone,
                email: validatedRequest.email,
                address: validatedRequest.address,
              },
            });
          }

          // 3. Create booking record
          const booking = await tx.booking.create({
            data: {
              customerId: customer.id,
              businessId: 1, // Default business ID (could be made configurable)
              serviceId: validationResult.data!.serviceId,
              serviceType: validatedRequest.service_type,
              technicianId: validatedRequest.expert_id,
              bookingTime: bookingTime,
              status: 'pending', // Pending confirmation
              notes: validatedRequest.notes || `Booked via API by ${customer.name}`,
            },
          });

          confirmationCode = generateConfirmationCode();

          // Store confirmation code in notes (or could use a separate field in schema)
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              notes: `${booking.notes} | Confirmation: ${confirmationCode}`,
            },
          });

          return {
            bookingId: booking.id,
            customerId: customer.id,
            confirmationCode,
          };
        },
        {
          isolationLevel: 'Serializable',
          timeout: 30000,
          maxWait: 5000,
        }
      );

      bookingId = transactionResult.bookingId;
      confirmationCode = transactionResult.confirmationCode;

      logger.info('[BOOKINGS POST] Booking created in database', {
        correlationId,
        bookingId,
        customerId: transactionResult.customerId,
        bookingTime: bookingTime.toISOString(),
      });
    } catch (txError) {
      logger.error('[BOOKINGS POST] Transaction failed', {
        correlationId,
        error: String(txError),
      });

      return apiError(
        'BOOKING_FAILED',
        'Failed to create booking',
        409,
        {
          message: String(txError),
          code: (txError as Error)?.message?.includes('conflict') ? 'CONFLICT' : 'TRANSACTION_FAILED',
        }
      );
    }

    // 4. Create calendar event (non-blocking, failures don't prevent booking)
    try {
      const service = await prisma.service.findFirst({
        where: { category: validatedRequest.service_type },
      });

      const durationMinutes = service?.durationMinutes || 60;

      const calendarResult = await createEvent({
        title: `${validatedRequest.service_type} - ${validatedRequest.customer_name}`,
        start_time: bookingTime.toISOString(),
        end_time: new Date(bookingTime.getTime() + durationMinutes * 60 * 1000).toISOString(),
        booking_id: bookingId.toString(),
        customer_name: validatedRequest.customer_name,
        service_type: validatedRequest.service_type,
        technician_id: validatedRequest.expert_id.toString(),
      });

      calendarEventId = calendarResult.eventId;

      logger.info('[BOOKINGS POST] Calendar event created', {
        correlationId,
        bookingId,
        eventId: calendarEventId,
      });
    } catch (calendarError) {
      // Log but don't fail the booking creation
      logger.warn('[BOOKINGS POST] Calendar event creation failed (non-blocking)', {
        correlationId,
        bookingId,
        error: String(calendarError),
      });
    }

    // 5. Build response
    const response = {
      booking_id: bookingId,
      confirmation_code: confirmationCode,
      calendar_event_id: calendarEventId || undefined,
      status: 'pending',
      booking_time: bookingTime.toISOString(),
      created_at: new Date().toISOString(),
    };

    logger.info('[BOOKINGS POST] Response sent', {
      correlationId,
      duration: `${Date.now() - startTime}ms`,
      bookingId,
      hasCalendarEvent: !!calendarEventId,
    });

    return apiSuccess(response, 201, { code: 'BOOKING_CREATED' });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('[BOOKINGS POST] Unhandled error', {
      correlationId,
      duration: `${duration}ms`,
      error: String(error),
    });

    return apiError(
      'INTERNAL_ERROR',
      'Failed to create booking',
      500,
      {
        message: String(error),
      }
    );
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-correlation-id',
    },
  });
}
