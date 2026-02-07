/**
 * Google Calendar Client
 * Supports both real Google Calendar API and mock calendar
 */

import {
  getAvailabilityForDate,
  getAvailabilityRange as getMockAvailabilityRange,
  createEvent as createMockEvent,
  deleteEvent as deleteMockEvent,
  updateEvent as updateMockEvent,
  getEvent as getMockEvent,
  getEventsForDate,
  CalendarEvent,
  TimeSlot,
  DayAvailability,
} from './__mocks__/mock-calendar';

import {
  calculateAvailableSlots,
  findNextAvailableSlot,
  AvailableSlot,
} from './availability';

export interface BookingData {
  title: string;
  start_time: string;
  end_time: string;
  booking_id?: string;
  customer_name?: string;
  service_type?: string;
  technician_id?: string;
}

export interface GetAvailabilityParams {
  businessId: string;
  serviceType: string;
  date: string; // YYYY-MM-DD
}

export interface GetAvailabilityResult {
  date: string;
  available_slots: AvailableSlot[];
  total_slots: number;
}

/**
 * Check if we should use mock mode
 */
function shouldUseMock(): boolean {
  const mockMode = process.env.GOOGLE_CALENDAR_MOCK;
  return mockMode === 'true' || mockMode === '1' || !process.env.GOOGLE_CALENDAR_CREDENTIALS;
}

/**
 * Get availability for a specific date
 */
export async function getAvailability(
  businessId: string,
  serviceType: string,
  date: string
): Promise<GetAvailabilityResult> {
  const useMock = shouldUseMock();

  if (useMock) {
    return getAvailabilityMock(businessId, serviceType, date);
  } else {
    return getAvailabilityReal(businessId, serviceType, date);
  }
}

/**
 * Get availability using mock calendar
 */
async function getAvailabilityMock(
  businessId: string,
  serviceType: string,
  date: string
): Promise<GetAvailabilityResult> {
  // Get calendar slots for the date
  const calendarSlots = getAvailabilityForDate(date);

  // Get existing events for the date
  const existingEvents = getEventsForDate(date);

  // Calculate available slots (accounting for buffers)
  const availableSlots = calculateAvailableSlots(
    calendarSlots,
    existingEvents,
    serviceType
  );

  console.log(
    `[Calendar Mock] ${date}: ${availableSlots.length}/${calendarSlots.length} slots available for ${serviceType}`
  );

  return {
    date,
    available_slots: availableSlots,
    total_slots: calendarSlots.length,
  };
}

/**
 * Get availability using real Google Calendar API
 * This is a stub for future implementation
 */
async function getAvailabilityReal(
  businessId: string,
  serviceType: string,
  date: string
): Promise<GetAvailabilityResult> {
  throw new Error(
    'Real Google Calendar API not yet implemented. Install googleapis package and set GOOGLE_CALENDAR_CREDENTIALS.'
  );

  // TODO: Implement real Google Calendar API
  // const { google } = require('googleapis');
  // const calendar = google.calendar('v3');
  //
  // // Authenticate and fetch free/busy info
  // // Convert to our slot format
  // // Return available slots
}

/**
 * Get availability for a date range
 */
export async function getAvailabilityRange(
  businessId: string,
  serviceType: string,
  startDate: string,
  endDate: string
): Promise<GetAvailabilityResult[]> {
  const useMock = shouldUseMock();

  if (useMock) {
    const dayAvailabilities = getMockAvailabilityRange(startDate, endDate);
    const results: GetAvailabilityResult[] = [];

    for (const day of dayAvailabilities) {
      const existingEvents = getEventsForDate(day.date);
      const availableSlots = calculateAvailableSlots(
        day.slots,
        existingEvents,
        serviceType
      );

      results.push({
        date: day.date,
        available_slots: availableSlots,
        total_slots: day.slots.length,
      });
    }

    return results;
  } else {
    throw new Error('Real Google Calendar API not yet implemented.');
  }
}

/**
 * Create a calendar event
 */
export async function createEvent(
  bookingData: BookingData
): Promise<{ eventId: string; event: CalendarEvent }> {
  const useMock = shouldUseMock();

  if (useMock) {
    const event = createMockEvent({
      title: bookingData.title,
      start_time: bookingData.start_time,
      end_time: bookingData.end_time,
      booking_id: bookingData.booking_id,
      customer_name: bookingData.customer_name,
      service_type: bookingData.service_type,
      technician_id: bookingData.technician_id,
      status: 'scheduled',
    });

    return {
      eventId: event.id,
      event,
    };
  } else {
    throw new Error('Real Google Calendar API not yet implemented.');
    // TODO: Create event via Google Calendar API
  }
}

/**
 * Update a calendar event
 */
export async function updateEvent(
  eventId: string,
  updates: Partial<CalendarEvent>
): Promise<CalendarEvent | null> {
  const useMock = shouldUseMock();

  if (useMock) {
    return updateMockEvent(eventId, updates);
  } else {
    throw new Error('Real Google Calendar API not yet implemented.');
    // TODO: Update event via Google Calendar API
  }
}

/**
 * Delete a calendar event
 */
export async function deleteEvent(eventId: string): Promise<boolean> {
  const useMock = shouldUseMock();

  if (useMock) {
    return deleteMockEvent(eventId);
  } else {
    throw new Error('Real Google Calendar API not yet implemented.');
    // TODO: Delete event via Google Calendar API
  }
}

/**
 * Get a calendar event by ID
 */
export async function getEvent(eventId: string): Promise<CalendarEvent | null> {
  const useMock = shouldUseMock();

  if (useMock) {
    return getMockEvent(eventId);
  } else {
    throw new Error('Real Google Calendar API not yet implemented.');
    // TODO: Get event via Google Calendar API
  }
}

// Re-export types and utilities
export type { CalendarEvent, TimeSlot, AvailableSlot };
export {
  getAllEvents,
  getEventsForDate,
  clearAllEvents,
  resetAvailability,
  getCalendarStats,
} from './__mocks__/mock-calendar';
