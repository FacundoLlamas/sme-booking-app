/**
 * GET /api/v1/availability
 * Get available time slots for a service type on a given date
 * 
 * Query Parameters:
 *   - service_type: string (required) - Service type (plumbing, electrical, etc.)
 *   - date: string (required) - Date in YYYY-MM-DD format
 *   - business_id: number (optional) - Business ID, defaults to 1 for testing
 *   - timezone: string (optional) - Customer timezone (IANA format), defaults to UTC
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { validateQuery } from '@/lib/validation';
import {
  getAvailability,
  getAvailabilityRange,
} from '@/lib/google/calendar-client';
import { AvailableSlot } from '@/lib/google/availability';

interface AvailabilitySlot {
  start: string;
  end: string;
  duration_minutes: number;
  expert_id?: string;
}

interface AvailabilityResponse {
  date: string;
  available_slots: AvailabilitySlot[];
  total_slots: number;
  message?: string;
}

/**
 * Validate availability request parameters
 */
function validateAvailabilityRequest(
  params: Record<string, string | undefined>
): { valid: boolean; error?: string } {
  const { service_type, date } = params;

  if (!service_type) {
    return { valid: false, error: 'service_type is required' };
  }

  if (!date) {
    return { valid: false, error: 'date is required' };
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return { valid: false, error: 'date must be in YYYY-MM-DD format' };
  }

  // Validate date is not in the past
  const requestedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (requestedDate < today) {
    return { valid: false, error: 'date cannot be in the past' };
  }

  // Validate date is not more than 30 days in the future
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);
  if (requestedDate > maxDate) {
    return { valid: false, error: 'date cannot be more than 30 days in the future' };
  }

  return { valid: true };
}

/**
 * Convert available slots to API response format
 */
function formatSlots(slots: AvailableSlot[]): AvailabilitySlot[] {
  return slots.map((slot) => ({
    start: slot.start_time,
    end: slot.end_time,
    duration_minutes: slot.duration_minutes,
    expert_id: slot.technician_id,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const serviceType = searchParams.get('service_type') || '';
    const date = searchParams.get('date') || '';
    const businessId = parseInt(searchParams.get('business_id') || '1');
    const timezone = searchParams.get('timezone') || 'UTC';
    const endDate = searchParams.get('end_date');

    // Validate request
    const validation = validateAvailabilityRequest({
      service_type: serviceType,
      date,
    });

    if (!validation.valid) {
      logger.warn(`[Availability API] Invalid request: ${validation.error}`);
      return NextResponse.json(
        {
          error: validation.error,
          message: 'Invalid request parameters',
        },
        { status: 400 }
      );
    }

    logger.info(
      `[Availability API] Request: service_type=${serviceType}, date=${date}, business_id=${businessId}, timezone=${timezone}`
    );

    // Get availability
    if (endDate) {
      // Range query
      const results = await getAvailabilityRange(
        businessId.toString(),
        serviceType,
        date,
        endDate
      );

      return NextResponse.json({
        results: results.map((r) => ({
          date: r.date,
          available_slots: formatSlots(r.available_slots),
          total_slots: r.total_slots,
        })),
        count: results.length,
        message: `Found availability for ${results.length} days`,
      });
    } else {
      // Single day query
      const result = await getAvailability(
        businessId.toString(),
        serviceType,
        date
      );

      const response: AvailabilityResponse = {
        date: result.date,
        available_slots: formatSlots(result.available_slots),
        total_slots: result.total_slots,
      };

      if (result.available_slots.length === 0) {
        response.message = `No available slots on ${date} for ${serviceType}`;
      } else {
        response.message = `Found ${result.available_slots.length} available slots`;
      }

      return NextResponse.json(response);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Availability API] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
