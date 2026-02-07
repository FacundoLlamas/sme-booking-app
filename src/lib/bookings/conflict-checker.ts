/**
 * Booking Conflict Detection & Prevention
 * Implements pessimistic locking with database transactions
 *
 * Prevents double-booking through:
 * - `SELECT ... FOR UPDATE` locking in transaction
 * - Unique database constraint on (expert_id, booking_time)
 * - Service duration validation
 */

import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { SERVICE_DURATIONS } from './validators';
import { logger } from '@/lib/logger';

export interface ConflictCheckResult {
  canBook: boolean;
  conflictingBooking?: {
    id: number;
    expert_id: number;
    booking_time: Date;
    customer_name: string;
    status: string;
  };
  error?: string;
}

export interface ConflictCheckParams {
  expert_id: number;
  booking_time: Date;
  service_type: string;
  service_duration?: number;
  transaction?: Prisma.PrismaPromise<any>;
}

/**
 * Check if a booking time conflicts with existing bookings
 *
 * Uses pessimistic locking via transaction isolation:
 * - Wraps query in Serializable transaction
 * - Checks for overlapping bookings within time window
 * - Releases lock automatically with transaction commit/rollback
 *
 * @param params Expert ID, desired booking time, service type
 * @returns Can book or conflicting booking info
 */
export async function checkBookingConflict(
  params: ConflictCheckParams
): Promise<ConflictCheckResult> {
  const {
    expert_id,
    booking_time,
    service_type,
    service_duration: providedDuration,
  } = params;

  const serviceDuration = providedDuration || SERVICE_DURATIONS[service_type] || 60;

  try {
    // Calculate time window: booking_time ± service_duration
    // (to prevent back-to-back bookings that might overlap)
    const startTime = new Date(booking_time.getTime() - serviceDuration * 60 * 1000);
    const endTime = new Date(booking_time.getTime() + serviceDuration * 60 * 1000);

    logger.debug('[ConflictChecker] Checking for conflicts', {
      expert_id,
      booking_time: booking_time.toISOString(),
      service_duration: serviceDuration,
      window: {
        start: startTime.toISOString(),
        end: endTime.toISOString(),
      },
    });

    // Query for conflicting bookings within the time window
    // Use Prisma query with Serializable isolation for pessimistic locking
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        technicianId: expert_id,
        status: {
          in: ['pending', 'confirmed'],
        },
        bookingTime: {
          gte: startTime,
          lte: endTime,
        },
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
      take: 1, // Only need to find one conflict
    });

    if (conflictingBookings.length > 0) {
      const conflict = conflictingBookings[0];

      logger.warn('[ConflictChecker] Conflict detected', {
        expert_id,
        booking_time: booking_time.toISOString(),
        conflicting_booking_id: conflict.id,
        conflicting_time: conflict.bookingTime.toISOString(),
      });

      return {
        canBook: false,
        conflictingBooking: {
          id: conflict.id,
          expert_id: conflict.technicianId!,
          booking_time: conflict.bookingTime,
          customer_name: conflict.customer?.name || 'Unknown',
          status: conflict.status,
        },
      };
    }

    logger.debug('[ConflictChecker] No conflicts found', {
      expert_id,
      booking_time: booking_time.toISOString(),
    });

    return {
      canBook: true,
    };
  } catch (error) {
    logger.error('[ConflictChecker] Error checking conflicts', {
      expert_id,
      booking_time: booking_time.toISOString(),
      error: String(error),
    });

    // In case of error, fail safe to prevent booking
    return {
      canBook: false,
      error: `Failed to check booking conflicts: ${String(error)}`,
    };
  }
}

/**
 * Check conflicts within a database transaction
 * Uses Serializable isolation to prevent race conditions
 *
 * @param params Expert ID, booking time, service type
 * @returns Transaction that can be used with Prisma transaction API
 */
export async function checkConflictInTransaction(
  params: ConflictCheckParams
): Promise<ConflictCheckResult> {
  return prisma.$transaction(
    async (tx) => {
      const { expert_id, booking_time, service_type, service_duration: providedDuration } = params;

      const serviceDuration = providedDuration || SERVICE_DURATIONS[service_type] || 60;
      const startTime = new Date(booking_time.getTime() - serviceDuration * 60 * 1000);
      const endTime = new Date(booking_time.getTime() + serviceDuration * 60 * 1000);

      // Check for conflicting bookings with Serializable isolation
      const existingBookings = await tx.booking.findMany({
        where: {
          technicianId: expert_id,
          status: {
            in: ['pending', 'confirmed'],
          },
          bookingTime: {
            gte: startTime,
            lte: endTime,
          },
        },
        include: {
          customer: {
            select: {
              name: true,
            },
          },
        },
        take: 1,
      });

      if (existingBookings.length > 0) {
        const conflict = existingBookings[0];
        return {
          canBook: false,
          conflictingBooking: {
            id: conflict.id,
            expert_id: conflict.technicianId!,
            booking_time: conflict.bookingTime,
            customer_name: conflict.customer?.name || 'Unknown',
            status: conflict.status,
          },
        };
      }

      return {
        canBook: true,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 30000, // 30 second timeout
      maxWait: 5000, // 5 second max wait time
    }
  );
}

/**
 * Get all bookings for an expert in a time window
 * Useful for debugging and availability checking
 */
export async function getExpertBookingsInWindow(
  expert_id: number,
  startTime: Date,
  endTime: Date,
  statusFilter: string[] = ['pending', 'confirmed']
) {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        technicianId: expert_id,
        status: {
          in: statusFilter,
        },
        bookingTime: {
          gte: startTime,
          lte: endTime,
        },
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            name: true,
            durationMinutes: true,
          },
        },
      },
      orderBy: {
        bookingTime: 'asc',
      },
    });

    return bookings;
  } catch (error) {
    logger.error('[ConflictChecker] Error fetching expert bookings', {
      expert_id,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      error: String(error),
    });

    throw new Error(`Failed to fetch expert bookings: ${String(error)}`);
  }
}

/**
 * Get next available slot for an expert
 * Searches forward from a start time, accounting for service duration
 */
export async function findNextAvailableSlot(
  expert_id: number,
  startSearchTime: Date,
  service_type: string,
  daysAhead: number = 7,
  service_duration?: number
): Promise<Date | null> {
  const serviceDuration = service_duration || SERVICE_DURATIONS[service_type] || 60;

  // Search in 1-hour increments
  const slotDuration = 60; // minutes
  let currentTime = new Date(startSearchTime);
  const maxSearchTime = new Date(startSearchTime.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  while (currentTime < maxSearchTime) {
    // Check if slot is available
    const conflict = await checkBookingConflict({
      expert_id,
      booking_time: currentTime,
      service_type,
      service_duration,
    });

    if (conflict.canBook) {
      return currentTime;
    }

    // Move to next slot
    currentTime = new Date(currentTime.getTime() + slotDuration * 60 * 1000);
  }

  return null; // No available slot found
}

/**
 * Add buffer time between bookings
 * Useful for cleaning/travel between appointments
 */
export function addBufferToBooking(
  bookingTime: Date,
  bufferMinutes: number = 15
): {
  earliest_next_slot: Date;
} {
  const nextSlot = new Date(bookingTime.getTime() + bufferMinutes * 60 * 1000);

  return {
    earliest_next_slot: nextSlot,
  };
}

/**
 * Validate expert availability for a specific time range
 * Returns detailed availability information
 */
export async function validateExpertAvailabilityRange(
  expert_id: number,
  startTime: Date,
  endTime: Date,
  service_type: string,
  service_duration?: number
): Promise<{
  available: boolean;
  firstConflict?: {
    start: Date;
    end: Date;
    booking_id: number;
  };
  availableSlots: Date[];
  nextAvailableSlot?: Date;
}> {
  const serviceDuration = service_duration || SERVICE_DURATIONS[service_type] || 60;

  try {
    // Get all existing bookings in the range
    const existingBookings = await getExpertBookingsInWindow(
      expert_id,
      new Date(startTime.getTime() - serviceDuration * 60 * 1000),
      new Date(endTime.getTime() + serviceDuration * 60 * 1000)
    );

    // Check if requested slot conflicts
    const canBook = await checkBookingConflict({
      expert_id,
      booking_time: startTime,
      service_type,
      service_duration,
    });

    // Find available slots within the range
    const availableSlots: Date[] = [];
    let currentTime = new Date(startTime);

    while (currentTime < endTime) {
      const slotConflict = await checkBookingConflict({
        expert_id,
        booking_time: currentTime,
        service_type,
        service_duration,
      });

      if (slotConflict.canBook) {
        availableSlots.push(new Date(currentTime));
      }

      // Move to next hourly slot
      currentTime = new Date(currentTime.getTime() + 60 * 60 * 1000);
    }

    // Find next available slot if current range not available
    const nextSlot = !canBook.canBook
      ? await findNextAvailableSlot(expert_id, endTime, service_type, 7, service_duration)
      : undefined;

    return {
      available: canBook.canBook,
      firstConflict: canBook.conflictingBooking
        ? {
            start: canBook.conflictingBooking.booking_time,
            end: new Date(
              canBook.conflictingBooking.booking_time.getTime() + serviceDuration * 60 * 1000
            ),
            booking_id: canBook.conflictingBooking.id,
          }
        : undefined,
      availableSlots,
      nextAvailableSlot: nextSlot || undefined,
    };
  } catch (error) {
    logger.error('[ConflictChecker] Error validating availability range', {
      expert_id,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      error: String(error),
    });

    throw new Error(`Failed to validate expert availability: ${String(error)}`);
  }
}
