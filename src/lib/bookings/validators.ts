/**
 * Booking Validation & Edge Cases
 * Zod schemas and validation functions for booking API
 *
 * Handles:
 * - Email format validation
 * - Phone number validation
 * - Service type and expert availability checks
 * - Business hours validation
 * - Past booking prevention
 * - Edge case handling
 */

import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';

/**
 * Phone number validation - supports common international formats
 */
const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;

/**
 * Email validation
 */
const emailSchema = z.string().email('Invalid email format');

/**
 * Confirmation code validation - 8 alphanumeric characters
 */
const confirmationCodeRegex = /^[A-Z0-9]{8}$/;

/**
 * Create Booking Request Schema
 * Validates request payload for POST /api/v1/bookings
 */
export const CreateBookingSchema = z
  .object({
    customer_name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().regex(phoneRegex, 'Invalid phone number format'),
    email: emailSchema,
    address: z.string().min(5, 'Address is required'),
    service_type: z.string().min(1, 'Service type is required'),
    expert_id: z.number().int().positive('Expert ID must be positive'),
    booking_time: z.string().datetime('Invalid ISO 8601 datetime format'),
    notes: z.string().max(500, 'Notes must be under 500 characters').optional(),
  })
  .strict('Unknown properties not allowed');

export type CreateBookingRequest = z.infer<typeof CreateBookingSchema>;

/**
 * Booking Response Schema
 * Validates response payload for successful booking creation
 */
export const BookingResponseSchema = z.object({
  booking_id: z.number().int().positive(),
  confirmation_code: z.string().regex(confirmationCodeRegex),
  calendar_event_id: z.string().uuid().optional(),
  reminder_sent_at: z.string().datetime().optional(),
  status: z.enum(['pending', 'confirmed']),
  booking_time: z.string().datetime(),
  created_at: z.string().datetime(),
});

export type BookingResponse = z.infer<typeof BookingResponseSchema>;

/**
 * Reschedule Booking Request Schema
 * Validates request payload for PUT /api/v1/bookings/:id
 */
export const RescheduleBookingSchema = z.object({
  booking_time: z.string().datetime('Invalid ISO 8601 datetime format'),
  notes: z.string().max(500).optional(),
});

export type RescheduleBookingRequest = z.infer<typeof RescheduleBookingSchema>;

/**
 * Confirm Booking Request Schema
 * Validates confirmation by customer
 */
export const ConfirmBookingSchema = z.object({
  confirmation_code: z.string().regex(confirmationCodeRegex, 'Invalid confirmation code format'),
});

export type ConfirmBookingRequest = z.infer<typeof ConfirmBookingSchema>;

/**
 * Business hours configuration
 */
export const BUSINESS_HOURS = {
  start: 8, // 8 AM
  end: 17, // 5 PM
  timeZone: 'UTC',
};

/**
 * Service duration defaults (in minutes)
 */
export const SERVICE_DURATIONS: Record<string, number> = {
  plumbing: 90,
  electrical: 120,
  hvac: 120,
  'general-maintenance': 60,
  landscaping: 180,
  default: 60,
};

/**
 * Validate booking time is not in the past
 */
export function validateBookingNotInPast(bookingTime: Date): {
  valid: boolean;
  error?: string;
} {
  const now = new Date();
  const bufferMinutes = 30; // Minimum 30 minutes in future
  const minBookingTime = new Date(now.getTime() + bufferMinutes * 60 * 1000);

  if (bookingTime < minBookingTime) {
    return {
      valid: false,
      error: `Booking must be at least ${bufferMinutes} minutes in the future`,
    };
  }

  return { valid: true };
}

/**
 * Validate booking is within business hours
 */
export function validateBusinessHours(bookingTime: Date): {
  valid: boolean;
  error?: string;
} {
  const hour = bookingTime.getUTCHours();
  const dayOfWeek = bookingTime.getUTCDay();

  // Skip Sundays (0)
  if (dayOfWeek === 0) {
    return {
      valid: false,
      error: 'Bookings cannot be scheduled on Sundays',
    };
  }

  // Check business hours (8 AM - 5 PM UTC)
  if (hour < BUSINESS_HOURS.start || hour >= BUSINESS_HOURS.end) {
    return {
      valid: false,
      error: `Bookings must be between ${BUSINESS_HOURS.start}:00 and ${BUSINESS_HOURS.end}:00 UTC`,
    };
  }

  return { valid: true };
}

/**
 * Validate service type exists
 */
export async function validateServiceTypeExists(serviceType: string): Promise<{
  valid: boolean;
  error?: string;
  serviceId?: number;
}> {
  try {
    const service = await prisma.service.findFirst({
      where: {
        category: serviceType,
      },
    });

    if (!service) {
      return {
        valid: false,
        error: `Service type "${serviceType}" not found`,
      };
    }

    return {
      valid: true,
      serviceId: service.id,
    };
  } catch (error) {
    return {
      valid: false,
      error: `Failed to validate service type: ${String(error)}`,
    };
  }
}

/**
 * Validate expert is available
 * Check if expert exists and is currently available
 */
export async function validateExpertAvailable(expertId: number): Promise<{
  valid: boolean;
  error?: string;
  expert?: any;
}> {
  try {
    const expert = await prisma.technician.findUnique({
      where: { id: expertId },
    });

    if (!expert) {
      return {
        valid: false,
        error: `Expert with ID ${expertId} not found`,
      };
    }

    if (expert.availabilityStatus !== 'available') {
      return {
        valid: false,
        error: `Expert is currently ${expert.availabilityStatus}`,
      };
    }

    return {
      valid: true,
      expert,
    };
  } catch (error) {
    return {
      valid: false,
      error: `Failed to validate expert availability: ${String(error)}`,
    };
  }
}

/**
 * Validate service duration fits in available slot
 */
export async function validateServiceDuration(
  serviceType: string,
  bookingTime: Date,
  duration?: number
): Promise<{
  valid: boolean;
  error?: string;
  duration?: number;
}> {
  const serviceDuration = duration || SERVICE_DURATIONS[serviceType] || SERVICE_DURATIONS.default;

  // Check if booking + service duration doesn't exceed business hours
  const endTime = new Date(bookingTime.getTime() + serviceDuration * 60 * 1000);
  const endHour = endTime.getUTCHours();

  if (endHour > BUSINESS_HOURS.end) {
    return {
      valid: false,
      error: `Service duration (${serviceDuration} min) extends beyond business hours`,
    };
  }

  return {
    valid: true,
    duration: serviceDuration,
  };
}

/**
 * Validate customer contact information
 */
export function validateCustomerContact(email: string, phone: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    emailSchema.parse(email);
  } catch (error) {
    errors.push('Invalid email format');
  }

  if (!phoneRegex.test(phone)) {
    errors.push('Invalid phone number format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate confirmation code format
 */
export function validateConfirmationCode(code: string): {
  valid: boolean;
  error?: string;
} {
  if (!confirmationCodeRegex.test(code)) {
    return {
      valid: false,
      error: 'Invalid confirmation code format (must be 8 alphanumeric characters)',
    };
  }

  return { valid: true };
}

/**
 * Comprehensive booking validation
 * Runs all validations and returns detailed results
 */
export async function validateBookingRequest(
  request: CreateBookingRequest
): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
  data?: {
    serviceId: number;
    serviceDuration: number;
  };
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const bookingTime = new Date(request.booking_time);

  // 1. Validate booking time is not in past
  const pastCheck = validateBookingNotInPast(bookingTime);
  if (!pastCheck.valid) {
    errors.push(pastCheck.error || 'Booking in past');
  }

  // 2. Validate business hours
  const hoursCheck = validateBusinessHours(bookingTime);
  if (!hoursCheck.valid) {
    errors.push(hoursCheck.error || 'Outside business hours');
  }

  // 3. Validate customer contact
  const contactCheck = validateCustomerContact(request.email, request.phone);
  if (!contactCheck.valid) {
    errors.push(...contactCheck.errors);
  }

  // 4. Validate service type exists
  const serviceCheck = await validateServiceTypeExists(request.service_type);
  if (!serviceCheck.valid) {
    errors.push(serviceCheck.error || 'Invalid service type');
  }

  // 5. Validate expert is available (race condition possible)
  const expertCheck = await validateExpertAvailable(request.expert_id);
  if (!expertCheck.valid) {
    errors.push(expertCheck.error || 'Expert not available');
  }

  // 6. Validate service duration
  const durationCheck = await validateServiceDuration(request.service_type, bookingTime);
  if (!durationCheck.valid) {
    errors.push(durationCheck.error || 'Service duration invalid');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    data:
      serviceCheck.valid && durationCheck.valid
        ? {
            serviceId: serviceCheck.serviceId!,
            serviceDuration: durationCheck.duration!,
          }
        : undefined,
  };
}

/**
 * Validate 24-hour cutoff for reschedule/cancel operations
 * Prevents modifications within 24 hours of booking start time
 * 
 * @param bookingTime - The original booking start time
 * @returns Object with validation result, error message, and hours remaining
 * 
 * @example
 * ```typescript
 * const booking = await getBooking(id);
 * const cutoff = validate24HourCutoff(new Date(booking.bookingTime));
 * if (!cutoff.valid) {
 *   return apiError('CUTOFF_VIOLATION', cutoff.error, 422);
 * }
 * ```
 */
export function validate24HourCutoff(bookingTime: Date): {
  valid: boolean;
  error?: string;
  hoursRemaining?: number;
} {
  const now = new Date();
  const hoursUntilBooking = (bookingTime.getTime() - now.getTime()) / (60 * 60 * 1000);
  const CUTOFF_HOURS = 24;

  if (hoursUntilBooking < CUTOFF_HOURS) {
    return {
      valid: false,
      error: `Cannot modify bookings within ${CUTOFF_HOURS} hours of start time`,
      hoursRemaining: Math.round(hoursUntilBooking * 10) / 10, // Round to 1 decimal
    };
  }

  return {
    valid: true,
    hoursRemaining: Math.round(hoursUntilBooking * 10) / 10,
  };
}
