/**
 * Calendar Integration Module
 * Supports both mock availability (no API key) and real Google Calendar API
 * 
 * Configuration:
 * - GOOGLE_CALENDAR_API_KEY: If set, uses real Google Calendar API
 * - If not set, uses mock availability generator (no external API calls)
 * 
 * Timezone handling:
 * - Customer and expert timezones can differ
 * - All times stored in UTC, converted for display
 */

import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { getExpertAvailability } from './checker';

export interface CalendarSlot {
  slot_id: string;
  start_time: Date;
  end_time: Date;
  duration_minutes: number;
  is_available: boolean;
  expert_id: string;
  timezone: string; // Expert's timezone
}

export interface CalendarConfig {
  useRealCalendar: boolean;
  googleCalendarApiKey?: string;
  expertTimezone: string; // e.g., 'America/New_York'
  customerTimezone: string; // e.g., 'America/Los_Angeles'
}

/**
 * Get availability calendar configuration
 */
export function getCalendarConfig(): CalendarConfig {
  const useRealCalendar = !!process.env.GOOGLE_CALENDAR_API_KEY;
  const expertTimezone = process.env.EXPERT_TIMEZONE || 'UTC';
  const customerTimezone = process.env.CUSTOMER_TIMEZONE || 'UTC';

  return {
    useRealCalendar,
    googleCalendarApiKey: process.env.GOOGLE_CALENDAR_API_KEY,
    expertTimezone,
    customerTimezone,
  };
}

/**
 * Convert a UTC time to customer's local timezone
 */
export function convertToCustomerTimezone(
  utcTime: Date,
  customerTimezone: string
): {
  date: Date;
  timezone: string;
  displayString: string;
} {
  const zonedTime = toZonedTime(utcTime, customerTimezone);
  return {
    date: zonedTime,
    timezone: customerTimezone,
    displayString: zonedTime.toLocaleString(),
  };
}

/**
 * Convert a customer's local time to UTC
 */
export function convertFromCustomerTimezone(
  localTime: Date,
  customerTimezone: string
): Date {
  return fromZonedTime(localTime, customerTimezone);
}

/**
 * Convert expert's local time to UTC
 */
export function convertToUtcFromExpertTimezone(
  localTime: Date,
  expertTimezone: string
): Date {
  return fromZonedTime(localTime, expertTimezone);
}

/**
 * Get available slots - uses mock or real calendar based on configuration
 */
export async function getAvailableSlots(
  expert_id: number,
  days_ahead: number,
  service_type: string,
  config?: CalendarConfig
): Promise<CalendarSlot[]> {
  const calendarConfig = config || getCalendarConfig();

  if (calendarConfig.useRealCalendar && calendarConfig.googleCalendarApiKey) {
    // Use real Google Calendar API
    return getRealCalendarSlots(expert_id, days_ahead, service_type, calendarConfig);
  } else {
    // Use mock availability
    return getMockAvailabilitySlots(expert_id, days_ahead, service_type, calendarConfig);
  }
}

/**
 * Get mock availability slots (no external API calls needed)
 * This is used when GOOGLE_CALENDAR_API_KEY is not set
 */
async function getMockAvailabilitySlots(
  expert_id: number,
  days_ahead: number,
  service_type: string,
  config: CalendarConfig
): Promise<CalendarSlot[]> {
  // Delegate to existing mock availability generator
  const mockSlots = await getExpertAvailability(expert_id, days_ahead, service_type);

  // Add timezone information to slots
  return mockSlots.map((slot) => ({
    ...slot,
    timezone: config.expertTimezone,
  }));
}

/**
 * Get real Google Calendar slots
 * Hook for future integration with Google Calendar API
 * 
 * Implementation requirements:
 * - Authenticate with Google Calendar API using GOOGLE_CALENDAR_API_KEY
 * - Query expert's calendar for free slots
 * - Respect expert's working hours and time zone
 * - Handle calendar errors gracefully (fall back to mock)
 */
async function getRealCalendarSlots(
  expert_id: number,
  days_ahead: number,
  service_type: string,
  config: CalendarConfig
): Promise<CalendarSlot[]> {
  try {
    // TODO: Implement real Google Calendar API integration
    // This would:
    // 1. Authenticate using config.googleCalendarApiKey
    // 2. Query expert's calendar
    // 3. Find free slots for the given duration
    // 4. Respect expert's working hours
    // 5. Handle timezone conversions
    // 6. Return available slots

    console.log(
      'Real Google Calendar API integration not yet implemented. Falling back to mock availability.'
    );

    // Fall back to mock for now
    return getMockAvailabilitySlots(expert_id, days_ahead, service_type, config);
  } catch (error) {
    console.error('Error fetching real calendar slots, falling back to mock:', error);
    // Graceful fallback to mock
    return getMockAvailabilitySlots(expert_id, days_ahead, service_type, config);
  }
}

/**
 * Suggest available times for a customer in their timezone
 */
export async function suggestTimesInCustomerTimezone(
  expert_id: number,
  days_ahead: number,
  service_type: string,
  config?: CalendarConfig
): Promise<
  Array<{
    slot_id: string;
    utc_time: Date;
    customer_local_time: Date;
    customer_display: string;
    duration_minutes: number;
  }>
> {
  const calendarConfig = config || getCalendarConfig();
  const slots = await getAvailableSlots(expert_id, days_ahead, service_type, calendarConfig);

  return slots.map((slot) => {
    const customerTime = convertToCustomerTimezone(slot.start_time, calendarConfig.customerTimezone);
    return {
      slot_id: slot.slot_id,
      utc_time: slot.start_time,
      customer_local_time: customerTime.date,
      customer_display: customerTime.displayString,
      duration_minutes: slot.duration_minutes,
    };
  });
}
