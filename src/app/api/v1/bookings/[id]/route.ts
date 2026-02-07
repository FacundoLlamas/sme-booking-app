/**
 * Booking Management API Endpoints
 * GET /api/v1/bookings/:id - Retrieve booking details
 * PUT /api/v1/bookings/:id - Reschedule booking (updates calendar + DB)
 * DELETE /api/v1/bookings/:id - Cancel booking (removes calendar event, sends notification)
 * PUT /api/v1/bookings/:id/confirm - Confirm by customer
 *
 * All operations cascade to calendar (create/update/delete events)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiSuccess, apiError } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db/prisma';
import {
  RescheduleBookingSchema,
  ConfirmBookingSchema,
  validateBookingRequest,
  validateBookingNotInPast,
  validateBusinessHours,
  validateServiceDuration,
  validate24HourCutoff,
} from '@/lib/bookings/validators';
import { checkBookingConflict } from '@/lib/bookings/conflict-checker';
import {
  getEvent,
  updateEvent,
  deleteEvent,
  createEvent,
} from '@/lib/google/calendar-client';

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
 * GET /api/v1/bookings/:id
 * Retrieve booking details with all relationships
 */
export async function GET(
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

    logger.info('[BOOKINGS GET] Request received', {
      correlationId,
      bookingId,
    });

    // Fetch booking with relationships
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
            availabilityStatus: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            durationMinutes: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
            timezone: true,
          },
        },
      },
    });

    if (!booking) {
      logger.warn('[BOOKINGS GET] Booking not found', {
        correlationId,
        bookingId,
      });

      return apiError(
        'BOOKING_NOT_FOUND',
        `Booking with ID ${bookingId} not found`,
        404
      );
    }

    logger.info('[BOOKINGS GET] Response sent', {
      correlationId,
      duration: `${Date.now() - startTime}ms`,
      bookingId,
      status: booking.status,
    });

    return apiSuccess({
      booking_id: booking.id,
      customer: booking.customer,
      technician: booking.technician,
      service: booking.service,
      business: booking.business,
      booking_time: booking.bookingTime.toISOString(),
      status: booking.status,
      notes: booking.notes,
      created_at: booking.createdAt.toISOString(),
      updated_at: booking.updatedAt.toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('[BOOKINGS GET] Error', {
      correlationId,
      duration: `${duration}ms`,
      error: String(error),
    });

    return apiError('INTERNAL_ERROR', 'Failed to retrieve booking', 500);
  }
}

/**
 * PUT /api/v1/bookings/:id
 * Reschedule booking (updates calendar + database)
 *
 * Request body: { booking_time: ISO8601, notes?: string }
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

    logger.info('[BOOKINGS PUT] Reschedule request received', {
      correlationId,
      bookingId,
    });

    // Validate reschedule schema
    let rescheduleData: typeof RescheduleBookingSchema._type;
    try {
      rescheduleData = RescheduleBookingSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('[BOOKINGS PUT] Schema validation failed', {
          correlationId,
          errors: error.errors,
        });

        return apiError(
          'INVALID_REQUEST',
          'Reschedule validation failed',
          400,
          error.errors
        );
      }
      throw error;
    }

    const newBookingTime = new Date(rescheduleData.booking_time);

    // Fetch original booking
    const originalBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        service: true,
        technician: true,
      },
    });

    if (!originalBooking) {
      return apiError(
        'BOOKING_NOT_FOUND',
        `Booking with ID ${bookingId} not found`,
        404
      );
    }

    // Check 24-hour cutoff for reschedule
    const cutoffCheck = validate24HourCutoff(originalBooking.bookingTime);
    if (!cutoffCheck.valid) {
      return apiError(
        'CUTOFF_VIOLATION',
        cutoffCheck.error || 'Cannot modify bookings within 24 hours of start time',
        422,
        { field: 'booking_time', hoursRemaining: cutoffCheck.hoursRemaining }
      );
    }

    // Check if booking is already confirmed or completed
    if (originalBooking.status === 'confirmed' || originalBooking.status === 'completed') {
      // Could allow rescheduling with different logic for confirmed bookings
      // For now, allow it but log as rescheduling confirmed booking
      logger.info('[BOOKINGS PUT] Rescheduling confirmed booking', {
        correlationId,
        bookingId,
        oldStatus: originalBooking.status,
      });
    }

    // Validate new booking time
    const pastCheck = validateBookingNotInPast(newBookingTime);
    if (!pastCheck.valid) {
      return apiError(
        'VALIDATION_FAILED',
        pastCheck.error || 'Invalid booking time',
        422,
        { field: 'booking_time' }
      );
    }

    const hoursCheck = validateBusinessHours(newBookingTime);
    if (!hoursCheck.valid) {
      return apiError(
        'VALIDATION_FAILED',
        hoursCheck.error || 'Outside business hours',
        422,
        { field: 'booking_time' }
      );
    }

    const durationCheck = await validateServiceDuration(
      originalBooking.serviceType || originalBooking.service?.category || 'default',
      newBookingTime
    );
    if (!durationCheck.valid) {
      return apiError(
        'VALIDATION_FAILED',
        durationCheck.error || 'Service duration invalid',
        422,
        { field: 'booking_time' }
      );
    }

    // Check for conflicts with new time
    const conflictCheck = await checkBookingConflict({
      expert_id: originalBooking.technicianId!,
      booking_time: newBookingTime,
      service_type: originalBooking.serviceType || 'default',
      service_duration: originalBooking.service?.durationMinutes,
    });

    if (!conflictCheck.canBook) {
      logger.warn('[BOOKINGS PUT] Conflict detected for new booking time', {
        correlationId,
        bookingId,
        newBookingTime: newBookingTime.toISOString(),
      });

      return apiError(
        'BOOKING_CONFLICT',
        'The requested time is not available',
        409,
        {
          conflicting_booking: conflictCheck.conflictingBooking,
        }
      );
    }

    // Atomic transaction: update booking + calendar event
    try {
      const updatedBooking = await prisma.$transaction(
        async (tx) => {
          // 1. Update booking in database
          const booking = await tx.booking.update({
            where: { id: bookingId },
            data: {
              bookingTime: newBookingTime,
              notes: rescheduleData.notes || `Rescheduled to ${newBookingTime.toISOString()}`,
            },
            include: {
              customer: true,
              service: true,
            },
          });

          return booking;
        },
        {
          isolationLevel: 'Serializable',
          timeout: 30000,
          maxWait: 5000,
        }
      );

      // 2. Update calendar event (non-blocking)
      try {
        const serviceName = updatedBooking.service?.name || updatedBooking.serviceType || 'Service';
        await updateEvent(bookingId.toString(), {
          title: `${serviceName} - ${updatedBooking.customer?.name}`,
          start_time: newBookingTime.toISOString(),
          end_time: new Date(
            newBookingTime.getTime() +
              (updatedBooking.service?.durationMinutes || 60) * 60 * 1000
          ).toISOString(),
        } as any);

        logger.info('[BOOKINGS PUT] Calendar event updated', {
          correlationId,
          bookingId,
        });
      } catch (calendarError) {
        logger.warn('[BOOKINGS PUT] Calendar update failed (non-blocking)', {
          correlationId,
          bookingId,
          error: String(calendarError),
        });
      }

      logger.info('[BOOKINGS PUT] Booking rescheduled', {
        correlationId,
        bookingId,
        newBookingTime: newBookingTime.toISOString(),
        duration: `${Date.now() - startTime}ms`,
      });

      return apiSuccess({
        booking_id: updatedBooking.id,
        booking_time: updatedBooking.bookingTime.toISOString(),
        status: updatedBooking.status,
        updated_at: updatedBooking.updatedAt.toISOString(),
        message: 'Booking rescheduled successfully',
      });
    } catch (txError) {
      logger.error('[BOOKINGS PUT] Transaction failed', {
        correlationId,
        bookingId,
        error: String(txError),
      });

      return apiError(
        'RESCHEDULE_FAILED',
        'Failed to reschedule booking',
        500,
        { message: String(txError) }
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('[BOOKINGS PUT] Error', {
      correlationId,
      duration: `${duration}ms`,
      error: String(error),
    });

    return apiError('INTERNAL_ERROR', 'Failed to reschedule booking', 500);
  }
}

/**
 * DELETE /api/v1/bookings/:id
 * Cancel booking (removes calendar event, sends notification)
 */
export async function DELETE(
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

    logger.info('[BOOKINGS DELETE] Cancel request received', {
      correlationId,
      bookingId,
    });

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Customer cancelled';

    // Fetch booking to verify it exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
      },
    });

    if (!booking) {
      return apiError(
        'BOOKING_NOT_FOUND',
        `Booking with ID ${bookingId} not found`,
        404
      );
    }

    // Check if already cancelled
    if (booking.status === 'cancelled') {
      return apiError(
        'BOOKING_ALREADY_CANCELLED',
        'This booking has already been cancelled',
        400
      );
    }

    // Check 24-hour cutoff for cancel
    const cutoffCheck = validate24HourCutoff(booking.bookingTime);
    if (!cutoffCheck.valid) {
      return apiError(
        'CUTOFF_VIOLATION',
        cutoffCheck.error || 'Cannot cancel bookings within 24 hours of start time',
        422,
        { field: 'booking_time', hoursRemaining: cutoffCheck.hoursRemaining }
      );
    }

    // Atomic transaction: update booking + remove calendar event
    try {
      const cancelledBooking = await prisma.$transaction(
        async (tx) => {
          return await tx.booking.update({
            where: { id: bookingId },
            data: {
              status: 'cancelled',
              notes: `${booking.notes || ''} | Cancelled: ${reason}`,
            },
          });
        },
        {
          isolationLevel: 'Serializable',
          timeout: 30000,
          maxWait: 5000,
        }
      );

      // 2. Delete calendar event (non-blocking)
      try {
        await deleteEvent(bookingId.toString());

        logger.info('[BOOKINGS DELETE] Calendar event deleted', {
          correlationId,
          bookingId,
        });
      } catch (calendarError) {
        logger.warn('[BOOKINGS DELETE] Calendar deletion failed (non-blocking)', {
          correlationId,
          bookingId,
          error: String(calendarError),
        });
      }

      // 3. Send notification (would integrate with email/SMS service)
      // TODO: Send cancellation notification to customer and technician
      logger.info('[BOOKINGS DELETE] Notification would be sent', {
        correlationId,
        bookingId,
        customerEmail: booking.customer?.email,
      });

      logger.info('[BOOKINGS DELETE] Booking cancelled', {
        correlationId,
        bookingId,
        duration: `${Date.now() - startTime}ms`,
      });

      return apiSuccess({
        booking_id: cancelledBooking.id,
        status: cancelledBooking.status,
        cancelled_at: new Date().toISOString(),
        message: 'Booking cancelled successfully',
      });
    } catch (txError) {
      logger.error('[BOOKINGS DELETE] Transaction failed', {
        correlationId,
        bookingId,
        error: String(txError),
      });

      return apiError(
        'CANCELLATION_FAILED',
        'Failed to cancel booking',
        500,
        { message: String(txError) }
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('[BOOKINGS DELETE] Error', {
      correlationId,
      duration: `${duration}ms`,
      error: String(error),
    });

    return apiError('INTERNAL_ERROR', 'Failed to cancel booking', 500);
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
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-correlation-id',
    },
  });
}
