/**
 * Google Calendar Event Creation
 * Handles creation of calendar events for bookings
 */

import { PrismaClient } from '@prisma/client';
import {
  createEvent as createMockEvent,
  CalendarEvent,
} from './__mocks__/mock-calendar';
import { getValidAccessToken } from './token-manager';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

export interface CreateEventInput {
  businessId: number;
  bookingId: number;
  customerName: string;
  customerEmail?: string;
  serviceType: string;
  startTime: Date | string;
  endTime: Date | string;
  technicianId?: number;
  description?: string;
  notes?: string;
}

export interface CreateEventResult {
  eventId: string;
  calendarEventId?: string;
  htmlLink?: string;
  conferenceUrl?: string;
  success: boolean;
  error?: string;
}

/**
 * Create a calendar event for a booking
 */
export async function createCalendarEvent(
  input: CreateEventInput
): Promise<CreateEventResult> {
  try {
    const useMock = process.env.GOOGLE_CALENDAR_MOCK === 'true';

    if (useMock) {
      return createMockCalendarEvent(input);
    } else {
      return createRealCalendarEvent(input);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[CreateEvent] Failed to create calendar event:', error);
    return {
      eventId: '',
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Create event in mock calendar
 */
async function createMockCalendarEvent(
  input: CreateEventInput
): Promise<CreateEventResult> {
  try {
    const startDate = new Date(input.startTime);
    const endDate = new Date(input.endTime);

    // Create mock event
    const mockEvent = await createMockEvent({
      title: `${input.customerName} - ${input.serviceType}`,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      booking_id: input.bookingId.toString(),
      customer_name: input.customerName,
      service_type: input.serviceType,
      technician_id: input.technicianId?.toString(),
      status: 'scheduled',
    });

    // Update booking with calendar event ID
    await prisma.booking.update({
      where: { id: input.bookingId },
      data: { calendarEventId: mockEvent.id },
    });

    // Log sync event
    await prisma.calendarSyncLog.create({
      data: {
        businessId: input.businessId,
        eventId: mockEvent.id,
        bookingId: input.bookingId,
        action: 'created',
        status: 'synced',
      },
    });

    logger.info(
      `[CreateEvent] Mock event created for booking ${input.bookingId}: ${mockEvent.id}`
    );

    return {
      eventId: mockEvent.id,
      calendarEventId: mockEvent.id,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[CreateEvent] Failed to create mock event:', error);

    // Log failure in sync log
    await prisma.calendarSyncLog.create({
      data: {
        businessId: input.businessId,
        bookingId: input.bookingId,
        action: 'created',
        status: 'failed',
        details: JSON.stringify({ error: errorMessage }),
      },
    });

    return {
      eventId: '',
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Create event in real Google Calendar
 * Placeholder for real API implementation
 */
async function createRealCalendarEvent(
  input: CreateEventInput
): Promise<CreateEventResult> {
  try {
    // Check if we have valid credentials
    const accessToken = await getValidAccessToken(input.businessId);

    if (!accessToken) {
      const errorMessage =
        'No valid Google Calendar credentials. Please authenticate first.';
      logger.warn(`[CreateEvent] ${errorMessage}`);

      await prisma.calendarSyncLog.create({
        data: {
          businessId: input.businessId,
          bookingId: input.bookingId,
          action: 'created',
          status: 'failed',
          details: JSON.stringify({ error: errorMessage }),
        },
      });

      return {
        eventId: '',
        success: false,
        error: errorMessage,
      };
    }

    // TODO: Implement real Google Calendar API call
    // const response = await fetch(
    //   'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    //   {
    //     method: 'POST',
    //     headers: {
    //       Authorization: `Bearer ${accessToken}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       summary: `${input.customerName} - ${input.serviceType}`,
    //       description: input.description || input.notes,
    //       start: {
    //         dateTime: new Date(input.startTime).toISOString(),
    //         timeZone: businessTimezone,
    //       },
    //       end: {
    //         dateTime: new Date(input.endTime).toISOString(),
    //         timeZone: businessTimezone,
    //       },
    //       attendees: [
    //         {
    //           email: input.customerEmail,
    //           displayName: input.customerName,
    //           responseStatus: 'needsAction',
    //         },
    //       ],
    //       conferenceData: {
    //         createRequest: {
    //           requestId: `booking-${input.bookingId}`,
    //           conferenceSolutionKey: { type: 'hangoutsMeet' },
    //         },
    //       },
    //     }),
    //   }
    // );
    // const data = await response.json();
    // ...

    logger.warn('[CreateEvent] Real Google Calendar API not yet implemented');
    return {
      eventId: '',
      success: false,
      error: 'Real Google Calendar API not yet implemented',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[CreateEvent] Failed to create real calendar event:', error);

    await prisma.calendarSyncLog.create({
      data: {
        businessId: input.businessId,
        bookingId: input.bookingId,
        action: 'created',
        status: 'failed',
        details: JSON.stringify({ error: errorMessage }),
      },
    });

    return {
      eventId: '',
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(
  businessId: number,
  calendarEventId: string,
  updates: {
    startTime?: Date | string;
    endTime?: Date | string;
    title?: string;
    description?: string;
  }
): Promise<CreateEventResult> {
  try {
    const useMock = process.env.GOOGLE_CALENDAR_MOCK === 'true';

    if (useMock) {
      // For mock, we would update the in-memory event
      logger.info(`[CreateEvent] Mock event updated: ${calendarEventId}`);
      return {
        eventId: calendarEventId,
        success: true,
      };
    }

    logger.warn('[CreateEvent] Real Google Calendar API update not yet implemented');
    return {
      eventId: calendarEventId,
      success: false,
      error: 'Real Google Calendar API not yet implemented',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[CreateEvent] Failed to update calendar event:', error);
    return {
      eventId: calendarEventId,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  businessId: number,
  calendarEventId: string,
  bookingId?: number
): Promise<CreateEventResult> {
  try {
    const useMock = process.env.GOOGLE_CALENDAR_MOCK === 'true';

    if (useMock) {
      logger.info(`[CreateEvent] Mock event deleted: ${calendarEventId}`);

      if (bookingId) {
        await prisma.calendarSyncLog.create({
          data: {
            businessId,
            eventId: calendarEventId,
            bookingId,
            action: 'deleted',
            status: 'synced',
          },
        });
      }

      return {
        eventId: calendarEventId,
        success: true,
      };
    }

    logger.warn('[CreateEvent] Real Google Calendar API delete not yet implemented');
    return {
      eventId: calendarEventId,
      success: false,
      error: 'Real Google Calendar API not yet implemented',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[CreateEvent] Failed to delete calendar event:', error);
    return {
      eventId: calendarEventId,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get event details
 */
export async function getCalendarEvent(
  businessId: number,
  calendarEventId: string
): Promise<CalendarEvent | null> {
  try {
    const useMock = process.env.GOOGLE_CALENDAR_MOCK === 'true';

    if (useMock) {
      // For mock, we would retrieve from in-memory store
      logger.info(`[CreateEvent] Retrieving mock event: ${calendarEventId}`);
      // This would call mock calendar API in real implementation
      return null;
    }

    logger.warn('[CreateEvent] Real Google Calendar API get not yet implemented');
    return null;
  } catch (error) {
    logger.error('[CreateEvent] Failed to get calendar event:', error);
    return null;
  }
}
