/**
 * Google Calendar Module Exports
 */

export {
  getAvailability,
  getAvailabilityRange,
  createEvent,
  updateEvent,
  deleteEvent,
  getEvent,
  getAllEvents,
  getEventsForDate,
  clearAllEvents,
  resetAvailability,
  getCalendarStats,
} from './calendar-client';
export {
  calculateAvailableSlots,
  findNextAvailableSlot,
  getBufferTimes,
  isSlotAvailable,
} from './availability';
export type {
  BookingData,
  GetAvailabilityParams,
  GetAvailabilityResult,
  CalendarEvent,
  TimeSlot,
  AvailableSlot,
} from './calendar-client';
