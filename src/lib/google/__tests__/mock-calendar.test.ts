/**
 * Mock Calendar Tests
 * Tests for mock Google Calendar functionality
 */

import {
  generateMockAvailability,
  getAvailabilityForDate,
  createEvent,
  deleteEvent,
  updateEvent,
  getEvent,
  getAllEvents,
  getEventsForDate,
  clearAllEvents,
  resetAvailability,
  CalendarEvent,
  TimeSlot,
} from '../__mocks__/mock-calendar';

import {
  calculateAvailableSlots,
  isSlotAvailable,
  getBufferTimes,
} from '../availability';

describe('Mock Calendar', () => {
  beforeEach(() => {
    // Clear events before each test
    clearAllEvents();
  });

  describe('Availability Generation', () => {
    test('should generate slots for weekdays (9am-5pm)', () => {
      // Monday
      const slots = generateMockAvailability('2026-02-09');
      expect(slots.length).toBe(8); // 9am-5pm = 8 hours
      expect(slots[0].start_time).toContain('09:00:00');
      expect(slots[7].start_time).toContain('16:00:00');
    });

    test('should generate no slots for weekends', () => {
      // Saturday
      const saturdaySlots = generateMockAvailability('2026-02-07');
      expect(saturdaySlots.length).toBe(0);

      // Sunday
      const sundaySlots = generateMockAvailability('2026-02-08');
      expect(sundaySlots.length).toBe(0);
    });

    test('each slot should be 1 hour', () => {
      const slots = generateMockAvailability('2026-02-09');
      slots.forEach((slot) => {
        expect(slot.duration_minutes).toBe(60);
        const start = new Date(slot.start_time);
        const end = new Date(slot.end_time);
        const diffMinutes = (end.getTime() - start.getTime()) / 60000;
        expect(diffMinutes).toBe(60);
      });
    });

    test('should assign technician IDs', () => {
      const slots = generateMockAvailability('2026-02-09');
      slots.forEach((slot) => {
        expect(slot.technician_id).toMatch(/^tech_\d+$/);
      });
    });

    test('should retrieve availability for date', () => {
      const date = '2026-02-10';
      const slots = getAvailabilityForDate(date);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0].available).toBe(true);
    });
  });

  describe('Event Management', () => {
    test('should create event', () => {
      const event = createEvent({
        title: 'Test Booking',
        start_time: '2026-02-10T10:00:00Z',
        end_time: '2026-02-10T11:00:00Z',
        booking_id: 'booking_123',
        customer_name: 'John Doe',
        service_type: 'plumbing',
        status: 'scheduled',
      });

      expect(event.id).toBeDefined();
      expect(event.title).toBe('Test Booking');
      expect(event.status).toBe('scheduled');
    });

    test('should retrieve event by ID', () => {
      const created = createEvent({
        title: 'Test Event',
        start_time: '2026-02-10T14:00:00Z',
        end_time: '2026-02-10T15:00:00Z',
        status: 'scheduled',
      });

      const retrieved = getEvent(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.title).toBe('Test Event');
    });

    test('should update event', () => {
      const created = createEvent({
        title: 'Original Title',
        start_time: '2026-02-10T10:00:00Z',
        end_time: '2026-02-10T11:00:00Z',
        status: 'scheduled',
      });

      const updated = updateEvent(created.id, {
        title: 'Updated Title',
        status: 'completed',
      });

      expect(updated).not.toBeNull();
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.status).toBe('completed');
      expect(updated?.id).toBe(created.id);
    });

    test('should delete event', () => {
      const created = createEvent({
        title: 'To Delete',
        start_time: '2026-02-10T10:00:00Z',
        end_time: '2026-02-10T11:00:00Z',
        status: 'scheduled',
      });

      const deleted = deleteEvent(created.id);
      expect(deleted).toBe(true);

      const retrieved = getEvent(created.id);
      expect(retrieved).toBeNull();
    });

    test('should get events for a specific date', () => {
      createEvent({
        title: 'Event 1',
        start_time: '2026-02-10T10:00:00Z',
        end_time: '2026-02-10T11:00:00Z',
        status: 'scheduled',
      });

      createEvent({
        title: 'Event 2',
        start_time: '2026-02-10T14:00:00Z',
        end_time: '2026-02-10T15:00:00Z',
        status: 'scheduled',
      });

      createEvent({
        title: 'Event 3 - Different Day',
        start_time: '2026-02-11T10:00:00Z',
        end_time: '2026-02-11T11:00:00Z',
        status: 'scheduled',
      });

      const events = getEventsForDate('2026-02-10');
      expect(events.length).toBe(2);
      expect(events.every((e) => e.start_time.startsWith('2026-02-10'))).toBe(true);
    });
  });

  describe('Buffer Times', () => {
    test('should have different buffer times for different services', () => {
      const plumbingBuffer = getBufferTimes('plumbing');
      const hvacBuffer = getBufferTimes('hvac');
      const locksmithBuffer = getBufferTimes('locksmith');

      expect(plumbingBuffer.before_minutes).toBe(15);
      expect(plumbingBuffer.after_minutes).toBe(30);

      expect(hvacBuffer.before_minutes).toBe(30);
      expect(hvacBuffer.after_minutes).toBe(30);

      expect(locksmithBuffer.before_minutes).toBe(0);
      expect(locksmithBuffer.after_minutes).toBe(15);
    });

    test('should use default buffer for unknown service types', () => {
      const buffer = getBufferTimes('unknown_service');
      expect(buffer.before_minutes).toBe(15);
      expect(buffer.after_minutes).toBe(15);
    });
  });

  describe('Available Slots Calculation', () => {
    test('should return all slots when no events exist', () => {
      const calendarSlots = generateMockAvailability('2026-02-10');
      const existingEvents: CalendarEvent[] = [];

      const available = calculateAvailableSlots(
        calendarSlots,
        existingEvents,
        'plumbing'
      );

      expect(available.length).toBe(calendarSlots.length);
    });

    test('should exclude slots that conflict with events', () => {
      const calendarSlots = generateMockAvailability('2026-02-10');

      // Create an event at 10am
      const event = createEvent({
        title: 'Existing Booking',
        start_time: '2026-02-10T10:00:00Z',
        end_time: '2026-02-10T11:00:00Z',
        status: 'scheduled',
      });

      const existingEvents = [event];

      const available = calculateAvailableSlots(
        calendarSlots,
        existingEvents,
        'plumbing'
      );

      // Should have fewer slots due to conflict
      expect(available.length).toBeLessThan(calendarSlots.length);

      // 10am slot should not be available
      const tenAmSlot = available.find((s) => s.start_time.includes('T10:00:00'));
      expect(tenAmSlot).toBeUndefined();
    });

    test('should respect buffer times when calculating conflicts', () => {
      const calendarSlots = generateMockAvailability('2026-02-10');

      // Create an event at 10am
      createEvent({
        title: 'Event at 10am',
        start_time: '2026-02-10T10:00:00Z',
        end_time: '2026-02-10T11:00:00Z',
        status: 'scheduled',
      });

      const existingEvents = getEventsForDate('2026-02-10');

      // Plumbing has 15min before, 30min after buffer
      const available = calculateAvailableSlots(
        calendarSlots,
        existingEvents,
        'plumbing'
      );

      // 9am slot should be unavailable (15min before 10am)
      const nineAmSlot = available.find((s) => s.start_time.includes('T09:00:00'));
      expect(nineAmSlot).toBeUndefined();

      // 11am slot should be unavailable (30min after ends at 11am)
      const elevenAmSlot = available.find((s) => s.start_time.includes('T11:00:00'));
      expect(elevenAmSlot).toBeUndefined();

      // 12pm slot should be available (outside buffer)
      const twelveAmSlot = available.find((s) => s.start_time.includes('T12:00:00'));
      expect(twelveAmSlot).toBeDefined();
    });

    test('should not overlap bookings', () => {
      const calendarSlots = generateMockAvailability('2026-02-10');

      // Create two back-to-back events
      createEvent({
        title: 'Event 1',
        start_time: '2026-02-10T09:00:00Z',
        end_time: '2026-02-10T10:00:00Z',
        status: 'scheduled',
      });

      createEvent({
        title: 'Event 2',
        start_time: '2026-02-10T11:00:00Z',
        end_time: '2026-02-10T12:00:00Z',
        status: 'scheduled',
      });

      const existingEvents = getEventsForDate('2026-02-10');

      const available = calculateAvailableSlots(
        calendarSlots,
        existingEvents,
        'plumbing'
      );

      // Verify no available slot overlaps with events or their buffers
      for (const slot of available) {
        const slotStart = new Date(slot.start_time);
        const slotEnd = new Date(slot.end_time);

        for (const event of existingEvents) {
          const eventStart = new Date(event.start_time);
          const eventEnd = new Date(event.end_time);

          // Get buffer
          const buffer = getBufferTimes('plumbing');
          const bufferedEventStart = new Date(
            eventStart.getTime() - buffer.before_minutes * 60000
          );
          const bufferedEventEnd = new Date(
            eventEnd.getTime() + buffer.after_minutes * 60000
          );

          // Should not overlap
          const overlaps =
            slotStart < bufferedEventEnd && bufferedEventStart < slotEnd;
          expect(overlaps).toBe(false);
        }
      }
    });

    test('should ignore cancelled events', () => {
      const calendarSlots = generateMockAvailability('2026-02-10');

      // Create a cancelled event
      const event = createEvent({
        title: 'Cancelled Event',
        start_time: '2026-02-10T10:00:00Z',
        end_time: '2026-02-10T11:00:00Z',
        status: 'cancelled',
      });

      const existingEvents = [event];

      const available = calculateAvailableSlots(
        calendarSlots,
        existingEvents,
        'plumbing'
      );

      // Cancelled events should not block availability
      expect(available.length).toBe(calendarSlots.length);
    });
  });

  describe('Slot Availability Check', () => {
    test('should check if specific time slot is available', () => {
      const calendarSlots = generateMockAvailability('2026-02-10');

      // No events - should be available
      const available1 = isSlotAvailable(
        '2026-02-10T10:00:00Z',
        '2026-02-10T11:00:00Z',
        calendarSlots,
        [],
        'plumbing'
      );
      expect(available1).toBe(true);

      // Create event at that time
      createEvent({
        title: 'Blocking Event',
        start_time: '2026-02-10T10:00:00Z',
        end_time: '2026-02-10T11:00:00Z',
        status: 'scheduled',
      });

      const existingEvents = getEventsForDate('2026-02-10');

      // Now should be unavailable
      const available2 = isSlotAvailable(
        '2026-02-10T10:00:00Z',
        '2026-02-10T11:00:00Z',
        calendarSlots,
        existingEvents,
        'plumbing'
      );
      expect(available2).toBe(false);
    });
  });
});
