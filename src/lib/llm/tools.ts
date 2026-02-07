/**
 * Claude Tool Definitions and Server-Side Executor
 * Enables chat-driven booking via Claude's tool_use feature
 */

import { getAvailability } from '@/lib/google/calendar-client';
import { prisma } from '@/lib/db/prisma';
import {
  CreateBookingSchema,
  validateBookingRequest,
} from '@/lib/bookings/validators';
import { checkBookingConflict } from '@/lib/bookings/conflict-checker';
import { createEvent } from '@/lib/google/calendar-client';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email/send';
import { confirmationEmail } from '@/lib/email/templates';

/**
 * Tool definitions for Claude's tool_use feature
 */
export const BOOKING_TOOLS = [
  {
    name: 'check_availability',
    description:
      'Check available booking time slots for a service type on a given date. Returns available start times with expert IDs. Call this before offering times to the customer.',
    input_schema: {
      type: 'object' as const,
      properties: {
        service_type: {
          type: 'string',
          enum: [
            'plumbing',
            'electrical',
            'hvac',
            'general-maintenance',
            'landscaping',
          ],
          description: 'The type of service.',
        },
        date: {
          type: 'string',
          description:
            'Date in YYYY-MM-DD format. Must be today or future, within 30 days.',
        },
      },
      required: ['service_type', 'date'],
    },
  },
  {
    name: 'create_booking',
    description:
      'Create a booking after collecting ALL required info and receiving explicit customer confirmation. Do NOT call until customer says yes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        customer_name: {
          type: 'string',
          description: 'Full name (2-100 chars).',
        },
        email: {
          type: 'string',
          description: 'Email address.',
        },
        phone: {
          type: 'string',
          description: 'Phone number.',
        },
        address: {
          type: 'string',
          description: 'Service address (min 5 chars).',
        },
        service_type: {
          type: 'string',
          enum: [
            'plumbing',
            'electrical',
            'hvac',
            'general-maintenance',
            'landscaping',
          ],
          description: 'Service type.',
        },
        expert_id: {
          type: 'number',
          description: 'Expert/technician ID from availability results.',
        },
        booking_time: {
          type: 'string',
          description: 'ISO 8601 datetime from availability results.',
        },
        notes: {
          type: 'string',
          description: 'Optional notes (max 500 chars).',
        },
      },
      required: [
        'customer_name',
        'email',
        'phone',
        'address',
        'service_type',
        'expert_id',
        'booking_time',
      ],
    },
  },
];

/**
 * Execute a tool call and return the result
 */
export async function executeTool(
  toolName: string,
  toolInput: Record<string, any>
): Promise<{ result: string; isError: boolean }> {
  try {
    switch (toolName) {
      case 'check_availability':
        return await executeCheckAvailability(toolInput);
      case 'create_booking':
        return await executeCreateBooking(toolInput);
      default:
        return { result: `Unknown tool: ${toolName}`, isError: true };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`[TOOL] Error executing ${toolName}:`, { error: msg });
    return { result: `Tool error: ${msg}`, isError: true };
  }
}

/**
 * Convert technician_id string ("tech_1") to numeric expert_id
 */
function parseExpertId(technicianId?: string): number {
  if (!technicianId) return 1;
  const match = technicianId.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * Execute check_availability tool
 */
async function executeCheckAvailability(
  input: Record<string, any>
): Promise<{ result: string; isError: boolean }> {
  const { service_type, date } = input;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { result: 'Invalid date format. Use YYYY-MM-DD.', isError: true };
  }

  const requestedDate = new Date(date + 'T00:00:00Z');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (requestedDate < today) {
    return {
      result: 'Date is in the past. Choose today or a future date.',
      isError: true,
    };
  }

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);
  if (requestedDate > maxDate) {
    return {
      result: 'Date is more than 30 days away. Choose a closer date.',
      isError: true,
    };
  }

  const availability = await getAvailability('1', service_type, date);

  if (availability.available_slots.length === 0) {
    return {
      result: JSON.stringify({
        date,
        service_type,
        available_slots: [],
        message: `No available slots on ${date}.`,
      }),
      isError: false,
    };
  }

  const slots = availability.available_slots.map((slot) => ({
    start: slot.start_time,
    end: slot.end_time,
    duration_minutes: slot.duration_minutes,
    expert_id: parseExpertId(slot.technician_id),
  }));

  return {
    result: JSON.stringify({
      date,
      service_type,
      available_slots: slots,
      total_slots: slots.length,
    }),
    isError: false,
  };
}

/**
 * Execute create_booking tool
 */
async function executeCreateBooking(
  input: Record<string, any>
): Promise<{ result: string; isError: boolean }> {
  const parseResult = CreateBookingSchema.safeParse(input);
  if (!parseResult.success) {
    const errors = parseResult.error.errors.map(
      (e) => `${e.path.join('.')}: ${e.message}`
    );
    return {
      result: `Validation failed: ${errors.join('; ')}`,
      isError: true,
    };
  }

  const validated = parseResult.data;
  const bookingTime = new Date(validated.booking_time);

  const validationResult = await validateBookingRequest(validated);
  if (!validationResult.valid) {
    return {
      result: `Cannot book: ${validationResult.errors.join('; ')}`,
      isError: true,
    };
  }

  // Generate confirmation code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let confirmationCode = '';
  for (let i = 0; i < 8; i++) {
    confirmationCode += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  try {
    // Check for conflicts
    const conflictCheck = await checkBookingConflict({
      expert_id: validated.expert_id,
      booking_time: bookingTime,
      service_type: validated.service_type,
    });

    if (!conflictCheck.canBook) {
      return {
        result: 'That time slot is no longer available. Please choose a different time.',
        isError: true,
      };
    }

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: { phone: validated.phone },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: validated.customer_name,
          phone: validated.phone,
          email: validated.email,
          address: validated.address,
        },
      });
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        businessId: 1,
        serviceId: validationResult.data!.serviceId,
        serviceType: validated.service_type,
        technicianId: validated.expert_id,
        bookingTime: bookingTime,
        status: 'pending',
        notes: validated.notes || `Booked via chat`,
        confirmationCode: confirmationCode,
      },
    });

    // Create calendar event (non-blocking)
    try {
      const durationMinutes = validationResult.data!.serviceDuration || 60;
      await createEvent({
        title: `${validated.service_type} - ${validated.customer_name}`,
        start_time: bookingTime.toISOString(),
        end_time: new Date(
          bookingTime.getTime() + durationMinutes * 60 * 1000
        ).toISOString(),
        booking_id: booking.id.toString(),
        customer_name: validated.customer_name,
        service_type: validated.service_type,
        technician_id: validated.expert_id.toString(),
      });
    } catch (calendarErr) {
      logger.warn('[TOOL] Calendar event creation failed (non-blocking)', {
        error: String(calendarErr),
      });
    }

    // Send confirmation email (non-blocking)
    try {
      const emailHtml = confirmationEmail(
        validated.customer_name,
        confirmationCode,
        bookingTime.toLocaleDateString(),
        bookingTime.toLocaleTimeString(),
        process.env.BUSINESS_PHONE || '1-800-EVIOS',
        validated.service_type
      );
      await sendEmail(
        validated.email,
        `Booking Confirmed - Code: ${confirmationCode}`,
        emailHtml
      );
      logger.info('[TOOL] Confirmation email sent', { email: validated.email });
    } catch (emailErr) {
      logger.warn('[TOOL] Email send failed (non-blocking)', {
        error: String(emailErr),
      });
    }

    return {
      result: JSON.stringify({
        success: true,
        booking_id: booking.id,
        confirmation_code: confirmationCode,
        booking_time: bookingTime.toISOString(),
        service_type: validated.service_type,
        status: 'pending',
      }),
      isError: false,
    };
  } catch (txError) {
    return {
      result: `Booking failed: ${txError instanceof Error ? txError.message : String(txError)}`,
      isError: true,
    };
  }
}
