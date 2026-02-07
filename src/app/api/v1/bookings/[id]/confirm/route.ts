/**
 * Booking Confirmation API Endpoint
 * PUT /api/v1/bookings/:id/confirm
 *
 * Allows customer to confirm a pending booking using their confirmation code
 * Marks booking as "confirmed" in database
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiSuccess, apiError } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db/prisma';
import { ConfirmBookingSchema, validateConfirmationCode } from '@/lib/bookings/validators';

/**
 * Generate unique ID for correlation tracking
 */
function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Extract booking ID from path parameters
 */
function extractBookingId(params: { id: string }): number | null {
  const parsed = parseInt(params.id, 10);
  return isNaN(parsed) || parsed <= 0 ? null : parsed;
}

/**
 * PUT /api/v1/bookings/:id/confirm
 * Confirm booking by customer using confirmation code
 *
 * Request body: { confirmation_code: "ABCD1234" }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const correlationId = request.headers.get('x-correlation-id') || generateCorrelationId();
  const startTime = Date.now();

  try {
    const bookingId = extractBookingId(params);

    if (!bookingId) {
      return apiError(
        'INVALID_BOOKING_ID',
        'Booking ID must be a positive integer',
        400
      );
    }

    const body = await request.json();

    logger.info('[BOOKINGS CONFIRM] Request received', {
      correlationId,
      bookingId,
    });

    // Validate schema
    let confirmData: typeof ConfirmBookingSchema._type;
    try {
      confirmData = ConfirmBookingSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('[BOOKINGS CONFIRM] Schema validation failed', {
          correlationId,
          errors: error.errors,
        });

        return apiError(
          'INVALID_REQUEST',
          'Confirmation validation failed',
          400,
          error.errors
        );
      }
      throw error;
    }

    // Validate confirmation code format
    const codeFormatCheck = validateConfirmationCode(confirmData.confirmation_code);
    if (!codeFormatCheck.valid) {
      return apiError(
        'INVALID_CODE',
        codeFormatCheck.error || 'Invalid confirmation code format',
        400
      );
    }

    // Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        technician: true,
        service: true,
      },
    });

    if (!booking) {
      return apiError(
        'BOOKING_NOT_FOUND',
        `Booking with ID ${bookingId} not found`,
        404
      );
    }

    // Check if booking is already confirmed
    if (booking.status === 'confirmed') {
      logger.info('[BOOKINGS CONFIRM] Booking already confirmed', {
        correlationId,
        bookingId,
      });

      return apiSuccess({
        booking_id: booking.id,
        status: booking.status,
        message: 'Booking already confirmed',
        booking_time: booking.bookingTime.toISOString(),
      });
    }

    // Check if booking is cancelled
    if (booking.status === 'cancelled') {
      return apiError(
        'BOOKING_CANCELLED',
        'Cannot confirm a cancelled booking',
        400
      );
    }

    // Verify confirmation code
    // Extract confirmation code from notes field (stored during creation)
    const storedCode = booking.notes?.match(/Confirmation: ([A-Z0-9]{8})/)?.[1];

    if (!storedCode || storedCode !== confirmData.confirmation_code) {
      logger.warn('[BOOKINGS CONFIRM] Invalid confirmation code', {
        correlationId,
        bookingId,
        provided: confirmData.confirmation_code,
        matched: storedCode === confirmData.confirmation_code,
      });

      return apiError(
        'INVALID_CONFIRMATION_CODE',
        'The provided confirmation code does not match',
        401,
        { provided_code: confirmData.confirmation_code, valid: false }
      );
    }

    // Update booking status to confirmed
    try {
      const confirmedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'confirmed',
          notes: `${booking.notes} | Confirmed at ${new Date().toISOString()}`,
        },
        include: {
          customer: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
          technician: {
            select: {
              name: true,
            },
          },
          service: {
            select: {
              name: true,
              category: true,
              durationMinutes: true,
            },
          },
        },
      });

      // TODO: Send confirmation notification to customer and technician
      logger.info('[BOOKINGS CONFIRM] Confirmation notification would be sent', {
        correlationId,
        bookingId,
        customerEmail: confirmedBooking.customer?.email,
        technicianName: confirmedBooking.technician?.name,
      });

      logger.info('[BOOKINGS CONFIRM] Booking confirmed', {
        correlationId,
        bookingId,
        duration: `${Date.now() - startTime}ms`,
      });

      return apiSuccess({
        booking_id: confirmedBooking.id,
        status: confirmedBooking.status,
        customer_name: confirmedBooking.customer?.name,
        technician_name: confirmedBooking.technician?.name,
        service: confirmedBooking.service?.name,
        booking_time: confirmedBooking.bookingTime.toISOString(),
        confirmed_at: new Date().toISOString(),
        message: 'Booking confirmed successfully',
      });
    } catch (error) {
      logger.error('[BOOKINGS CONFIRM] Failed to update booking', {
        correlationId,
        bookingId,
        error: String(error),
      });

      return apiError(
        'CONFIRMATION_FAILED',
        'Failed to confirm booking',
        500,
        { message: String(error) }
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('[BOOKINGS CONFIRM] Error', {
      correlationId,
      duration: `${duration}ms`,
      error: String(error),
    });

    return apiError('INTERNAL_ERROR', 'Failed to confirm booking', 500);
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
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-correlation-id',
    },
  });
}

// Workaround: Need to import NextResponse for OPTIONS
import { NextResponse } from 'next/server';
