/**
 * MOCK GOOGLE CALENDAR - FOR LOCAL DEVELOPMENT ONLY
 *
 * ⚠️  IMPORTANT: Events are stored IN-MEMORY and will be lost on process restart.
 *
 * This is intentional for development. To enable file persistence:
 *   1. Set CALENDAR_PERSIST=true in .env
 *   2. Events will be saved to data/calendar-events.json
 *   3. Persisted across restarts
 *
 * In production, this will be replaced with real Google Calendar API.
 */

import * as fs from 'fs';
import * as path from 'path';
import { mockOrchestrator } from '@/lib/mock-orchestrator';

export interface TimeSlot {
  start_time: string; // ISO 8601 format
  end_time: string;
  duration_minutes: number;
  technician_id?: string;
  available: boolean;
  timezone?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  booking_id?: string;
  customer_name?: string;
  service_type?: string;
  technician_id?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  timezone?: string;
}

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  slots: TimeSlot[];
}

export interface CalendarData {
  availability: DayAvailability[];
  last_updated: string;
}

// Configuration
const PERSIST_EVENTS = process.env.CALENDAR_PERSIST === 'true';
const EVENTS_FILE = path.join(process.cwd(), 'data', 'calendar-events.json');

// In-memory event storage (lost on restart unless PERSIST_EVENTS=true)
const events: Map<string, CalendarEvent> = new Map();

// Load persisted events on startup if persistence is enabled
if (PERSIST_EVENTS) {
  try {
    loadPersistedEvents();
  } catch {
    // Ignore if filesystem is not available
  }
}

// Path to calendar mock data file
const CALENDAR_FILE_PATH = path.join(process.cwd(), 'data', 'calendar-mock.json');

// Service-specific buffer times (in minutes)
const SERVICE_BUFFER_TIMES: Record<string, number> = {
  plumbing: 15,
  electrical: 15,
  hvac: 30,
  painting: 30,
  locksmith: 10,
  glazier: 20,
  roofing: 30,
  cleaning: 15,
  pest_control: 15,
  appliance_repair: 20,
  garage_door: 15,
  handyman: 15,
};

/**
 * Load persisted events from file
 */
function loadPersistedEvents(): void {
  try {
    if (fs.existsSync(EVENTS_FILE)) {
      const content = fs.readFileSync(EVENTS_FILE, 'utf8');
      const persistedEvents = JSON.parse(content) as CalendarEvent[];
      persistedEvents.forEach((event) => {
        events.set(event.id, event);
      });
      console.log(`[Calendar Mock] Loaded ${persistedEvents.length} persisted events`);
    }
  } catch (error) {
    console.warn('[Calendar Mock] Could not load persisted events:', error);
  }
}

/**
 * Save events to file (if persistence enabled)
 */
function persistEvents(): void {
  if (!PERSIST_EVENTS) return;

  try {
    const dir = path.dirname(EVENTS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const eventsArray = Array.from(events.values());
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(eventsArray, null, 2), 'utf8');
  } catch (error) {
    console.warn('[Calendar Mock] Could not persist events:', error);
  }
}

/**
 * Ensure the data file exists
 * Silently fails on read-only filesystems (e.g., Vercel)
 */
function ensureCalendarFile(): void {
  try {
    const dir = path.dirname(CALENDAR_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(CALENDAR_FILE_PATH)) {
      const initialData: CalendarData = {
        availability: [],
        last_updated: new Date().toISOString(),
      };
      fs.writeFileSync(CALENDAR_FILE_PATH, JSON.stringify(initialData, null, 2), 'utf8');
    }
  } catch {
    // Ignore filesystem errors on read-only environments
  }
}

/**
 * Read calendar data from file
 */
function readCalendarData(): CalendarData {
  try {
    ensureCalendarFile();
    const content = fs.readFileSync(CALENDAR_FILE_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('[Calendar Mock] Could not read calendar file:', error);
    return {
      availability: [],
      last_updated: new Date().toISOString(),
    };
  }
}

/**
 * Write calendar data to file
 */
function writeCalendarData(data: CalendarData): void {
  ensureCalendarFile();
  data.last_updated = new Date().toISOString();
  fs.writeFileSync(CALENDAR_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Generate mock availability for a specific date
 * Default: 9am-5pm, Mon-Fri, 1-hour slots
 * Respects business timezone for slot generation
 */
export function generateMockAvailability(
  date: string,
  businessTimezone: string = 'UTC',
  serviceType?: string
): TimeSlot[] {
  const parsedDate = new Date(date);
  const dayOfWeek = parsedDate.getUTCDay(); // 0 = Sunday, 6 = Saturday

  // Weekend: no availability
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return [];
  }

  const slots: TimeSlot[] = [];
  const startHour = 9; // 9 AM
  const endHour = 17; // 5 PM
  const slotDuration = 60; // 1 hour in minutes

  // Get buffer time for service
  const bufferTime = SERVICE_BUFFER_TIMES[serviceType || ''] || 15;

  // Generate slots for business hours
  // Note: For simplicity, we're using UTC. In production, proper timezone
  // conversion would be handled by a library like date-fns-tz
  for (let hour = startHour; hour < endHour; hour++) {
    const slotStart = new Date(date);
    slotStart.setUTCHours(hour, 0, 0, 0);

    const slotEnd = new Date(slotStart);
    slotEnd.setUTCMinutes(slotStart.getUTCMinutes() + slotDuration);

    slots.push({
      start_time: slotStart.toISOString(),
      end_time: slotEnd.toISOString(),
      duration_minutes: slotDuration,
      technician_id: `tech_${Math.floor(Math.random() * 3) + 1}`,
      available: true,
      timezone: businessTimezone,
    });
  }

  return slots;
}

/**
 * Get availability for a specific date
 */
export function getAvailabilityForDate(
  date: string,
  businessTimezone: string = 'UTC',
  serviceType?: string
): TimeSlot[] {
  const data = readCalendarData();

  // Find existing availability for this date
  const existing = data.availability.find((a) => a.date === date);
  if (existing) {
    // Add timezone info to existing slots if not present
    return existing.slots.map((slot) => ({
      ...slot,
      timezone: slot.timezone || businessTimezone,
    }));
  }

  // Generate new availability
  const slots = generateMockAvailability(date, businessTimezone, serviceType);

  // Save to file (may fail on read-only filesystems like Vercel)
  try {
    data.availability.push({
      date,
      slots,
    });
    writeCalendarData(data);
  } catch {
    // Ignore write errors - slots are still returned from memory
  }

  return slots;
}

/**
 * Get availability for a date range
 */
export function getAvailabilityRange(
  startDate: string,
  endDate: string,
  businessTimezone: string = 'UTC',
  serviceType?: string
): DayAvailability[] {
  const result: DayAvailability[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const slots = getAvailabilityForDate(dateStr, businessTimezone, serviceType);
    if (slots.length > 0) {
      result.push({
        date: dateStr,
        slots,
      });
    }
  }

  return result;
}

/**
 * Create a calendar event
 */
export async function createEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
  return mockOrchestrator.withOrchestratedMock('calendar', async () => {
    const id = `event_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const newEvent: CalendarEvent = {
      id,
      ...event,
    };

    events.set(id, newEvent);
    persistEvents(); // Save if persistence enabled

    console.log(`[Calendar Mock] Event created: ${id} - ${event.title} at ${event.start_time}`);

    return newEvent;
  });
}

/**
 * Get an event by ID
 */
export function getEvent(eventId: string): CalendarEvent | null {
  return events.get(eventId) || null;
}

/**
 * Update an event
 */
export async function updateEvent(
  eventId: string,
  updates: Partial<CalendarEvent>
): Promise<CalendarEvent | null> {
  return mockOrchestrator.withOrchestratedMock('calendar', async () => {
    const event = events.get(eventId);
    if (!event) {
      console.warn(`[Calendar Mock] Event not found: ${eventId}`);
      return null;
    }

    const updatedEvent = {
      ...event,
      ...updates,
      id: eventId, // Ensure ID doesn't change
    };

    events.set(eventId, updatedEvent);
    persistEvents(); // Save if persistence enabled

    console.log(`[Calendar Mock] Event updated: ${eventId}`);

    return updatedEvent;
  });
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string): Promise<boolean> {
  return mockOrchestrator.withOrchestratedMock('calendar', async () => {
    const existed = events.has(eventId);
    if (existed) {
      events.delete(eventId);
      persistEvents(); // Save if persistence enabled
      console.log(`[Calendar Mock] Event deleted: ${eventId}`);
    } else {
      console.warn(`[Calendar Mock] Event not found for deletion: ${eventId}`);
    }
    return existed;
  });
}

/**
 * Get all events (for testing)
 */
export function getAllEvents(): CalendarEvent[] {
  return Array.from(events.values());
}

/**
 * Get events for a specific date
 */
export function getEventsForDate(date: string): CalendarEvent[] {
  const dateStr = date.split('T')[0]; // Get YYYY-MM-DD part
  return Array.from(events.values()).filter((event) => {
    const eventDate = event.start_time.split('T')[0];
    return eventDate === dateStr && event.status !== 'cancelled';
  });
}

/**
 * Clear all events (for testing)
 */
export function clearAllEvents(): void {
  events.clear();
  persistEvents(); // Clear persisted file too
  console.log('[Calendar Mock] All events cleared');
}

/**
 * Reset availability data (for testing)
 */
export function resetAvailability(): void {
  const data: CalendarData = {
    availability: [],
    last_updated: new Date().toISOString(),
  };
  writeCalendarData(data);
  console.log('[Calendar Mock] Availability reset');
}

/**
 * Get calendar statistics
 */
export function getCalendarStats(): {
  totalEvents: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  availableDays: number;
  persistenceEnabled: boolean;
} {
  const allEvents = Array.from(events.values());
  const data = readCalendarData();

  return {
    totalEvents: allEvents.length,
    scheduled: allEvents.filter((e) => e.status === 'scheduled').length,
    completed: allEvents.filter((e) => e.status === 'completed').length,
    cancelled: allEvents.filter((e) => e.status === 'cancelled').length,
    availableDays: data.availability.length,
    persistenceEnabled: PERSIST_EVENTS,
  };
}
