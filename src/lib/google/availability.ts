/**
 * Availability Calculation
 * Calculates available slots based on calendar, buffer times, and existing bookings
 */

import { TimeSlot, CalendarEvent } from './__mocks__/mock-calendar';

export interface BufferConfig {
  before_minutes: number;
  after_minutes: number;
}

export interface AvailableSlot {
  start_time: string;
  end_time: string;
  duration_minutes: number;
  technician_id?: string;
}

/**
 * Get buffer times based on service type
 */
export function getBufferTimes(serviceType: string): BufferConfig {
  const buffers: Record<string, BufferConfig> = {
    plumbing: { before_minutes: 15, after_minutes: 30 },
    electrical: { before_minutes: 15, after_minutes: 30 },
    hvac: { before_minutes: 30, after_minutes: 30 },
    roofing: { before_minutes: 30, after_minutes: 45 },
    painting: { before_minutes: 15, after_minutes: 30 },
    locksmith: { before_minutes: 0, after_minutes: 15 },
    glazier: { before_minutes: 15, after_minutes: 30 },
    cleaning: { before_minutes: 15, after_minutes: 15 },
    pest_control: { before_minutes: 15, after_minutes: 30 },
    appliance_repair: { before_minutes: 15, after_minutes: 30 },
    garage_door: { before_minutes: 15, after_minutes: 30 },
    handyman: { before_minutes: 15, after_minutes: 15 },
  };

  return buffers[serviceType] || { before_minutes: 15, after_minutes: 15 };
}

/**
 * Check if two time ranges overlap
 */
function timeRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Check if a slot conflicts with any existing events
 */
function slotConflictsWithEvents(
  slot: TimeSlot,
  events: CalendarEvent[],
  buffer: BufferConfig
): boolean {
  const slotStart = new Date(slot.start_time);
  const slotEnd = new Date(slot.end_time);

  // Add buffer times
  const bufferedStart = new Date(slotStart.getTime() - buffer.before_minutes * 60000);
  const bufferedEnd = new Date(slotEnd.getTime() + buffer.after_minutes * 60000);

  for (const event of events) {
    if (event.status === 'cancelled') {
      continue;
    }

    const eventStart = new Date(event.start_time);
    const eventEnd = new Date(event.end_time);

    // Check if technician matches (if specified)
    if (slot.technician_id && event.technician_id) {
      if (slot.technician_id !== event.technician_id) {
        continue; // Different technicians, no conflict
      }
    }

    if (timeRangesOverlap(bufferedStart, bufferedEnd, eventStart, eventEnd)) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate available slots for a date
 */
export function calculateAvailableSlots(
  calendarSlots: TimeSlot[],
  existingEvents: CalendarEvent[],
  serviceType: string = 'general_maintenance'
): AvailableSlot[] {
  const buffer = getBufferTimes(serviceType);
  const availableSlots: AvailableSlot[] = [];

  for (const slot of calendarSlots) {
    // Skip if slot is already marked as unavailable
    if (!slot.available) {
      continue;
    }

    // Check if slot conflicts with any existing events (including buffer)
    if (slotConflictsWithEvents(slot, existingEvents, buffer)) {
      continue;
    }

    // Slot is available
    availableSlots.push({
      start_time: slot.start_time,
      end_time: slot.end_time,
      duration_minutes: slot.duration_minutes,
      technician_id: slot.technician_id,
    });
  }

  return availableSlots;
}

/**
 * Find the next available slot after a given date/time
 */
export function findNextAvailableSlot(
  allSlotsByDate: Map<string, TimeSlot[]>,
  eventsMap: Map<string, CalendarEvent[]>,
  serviceType: string = 'general_maintenance',
  afterDateTime?: string
): AvailableSlot | null {
  const afterDate = afterDateTime ? new Date(afterDateTime) : new Date();

  // Sort dates
  const sortedDates = Array.from(allSlotsByDate.keys()).sort();

  for (const date of sortedDates) {
    const slots = allSlotsByDate.get(date) || [];
    const events = eventsMap.get(date) || [];

    const availableSlots = calculateAvailableSlots(slots, events, serviceType);

    for (const slot of availableSlots) {
      const slotStart = new Date(slot.start_time);
      if (slotStart >= afterDate) {
        return slot;
      }
    }
  }

  return null;
}

/**
 * Group available slots by date
 */
export function groupSlotsByDate(
  slots: AvailableSlot[]
): Map<string, AvailableSlot[]> {
  const grouped = new Map<string, AvailableSlot[]>();

  for (const slot of slots) {
    const date = slot.start_time.split('T')[0];
    const existing = grouped.get(date) || [];
    existing.push(slot);
    grouped.set(date, existing);
  }

  return grouped;
}

/**
 * Get slot by start time
 */
export function findSlotByStartTime(
  slots: AvailableSlot[],
  startTime: string
): AvailableSlot | null {
  return slots.find((s) => s.start_time === startTime) || null;
}

/**
 * Check if a specific time slot is available
 */
export function isSlotAvailable(
  requestedStart: string,
  requestedEnd: string,
  calendarSlots: TimeSlot[],
  existingEvents: CalendarEvent[],
  serviceType: string = 'general_maintenance',
  technicianId?: string
): boolean {
  const requestedSlot: TimeSlot = {
    start_time: requestedStart,
    end_time: requestedEnd,
    duration_minutes: (new Date(requestedEnd).getTime() - new Date(requestedStart).getTime()) / 60000,
    technician_id: technicianId,
    available: true,
  };

  const buffer = getBufferTimes(serviceType);
  return !slotConflictsWithEvents(requestedSlot, existingEvents, buffer);
}
