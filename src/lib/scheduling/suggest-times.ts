/**
 * Smart Scheduling - Suggest Time Slots
 * Provides 3-5 available appointment slots considering expert availability,
 * service duration, customer timezone, and urgency level
 */

import { AvailableExpert, getExpertAvailability } from '@/lib/availability/checker';

export interface SuggestedSlot {
  slot_id: string;
  date_time: Date;
  date_display: string; // e.g., "Tuesday, Feb 18 at 2:00 PM"
  expert_name: string;
  expert_id: string;
  duration_minutes: number;
  expertise_match: number; // 0-100
  formatted_time: string;
}

export interface SchedulingSuggestions {
  available_slots: SuggestedSlot[];
  earliest_slot: SuggestedSlot | null;
  recommended_slot: SuggestedSlot | null;
  note: string;
}

export interface ScheduleOptions {
  service_type: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  available_experts: AvailableExpert[];
  customer_timezone?: string;
  preferred_day_of_week?: number; // 0 = Sunday, 6 = Saturday
  preferred_time_range?: { start_hour: number; end_hour: number };
  max_suggestions: number; // Usually 3-5
}

/**
 * Generate 3-5 recommended time slots
 * Balances urgency with customer preferences
 */
export async function suggestAppointmentTimes(
  options: ScheduleOptions
): Promise<SchedulingSuggestions> {
  const {
    service_type,
    urgency,
    available_experts,
    customer_timezone = 'UTC',
    preferred_day_of_week,
    preferred_time_range,
    max_suggestions = 4,
  } = options;

  if (available_experts.length === 0) {
    return {
      available_slots: [],
      earliest_slot: null,
      recommended_slot: null,
      note: 'No experts are currently available for this service. We will add you to a waitlist.',
    };
  }

  const allSlots: SuggestedSlot[] = [];

  // Collect available slots from all experts
  for (const expert of available_experts.slice(0, 3)) {
    // Focus on top 3 experts
    for (const slot of expert.available_slots) {
      // Filter by preferences if provided
      if (preferred_day_of_week !== undefined) {
        const slotDayOfWeek = new Date(slot.start_time).getDay();
        if (slotDayOfWeek !== preferred_day_of_week) continue;
      }

      if (preferred_time_range) {
        const slotHour = new Date(slot.start_time).getHours();
        if (
          slotHour < preferred_time_range.start_hour ||
          slotHour > preferred_time_range.end_hour
        ) {
          continue;
        }
      }

      allSlots.push({
        slot_id: `${expert.expert_id}_${slot.start_time.getTime()}`,
        date_time: new Date(slot.start_time),
        date_display: formatDateDisplay(slot.start_time),
        expert_name: expert.expert_name,
        expert_id: expert.expert_id,
        duration_minutes: slot.duration_minutes,
        expertise_match: expert.expertise_match,
        formatted_time: formatTime(slot.start_time),
      });
    }
  }

  // Sort and prioritize based on urgency
  allSlots.sort((a, b) => {
    // For emergencies, prioritize earliest
    if (urgency === 'emergency') {
      return a.date_time.getTime() - b.date_time.getTime();
    }

    // For high urgency, prefer same-day or next-day slots
    const now = new Date();
    const aIsToday = isSameDay(a.date_time, now);
    const bIsToday = isSameDay(b.date_time, now);

    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;

    // Then sort by expertise match
    return b.expertise_match - a.expertise_match;
  });

  const selectedSlots = allSlots.slice(0, max_suggestions);
  const earliestSlot = selectedSlots[0] || null;

  // Recommend a balanced slot (not too far out, but reasonable timing)
  let recommendedSlot = selectedSlots[0];
  if (selectedSlots.length > 1) {
    // For non-emergency, recommend the 2nd-best option (balances ASAP vs reasonable timing)
    if (urgency !== 'emergency') {
      recommendedSlot = selectedSlots[Math.min(1, selectedSlots.length - 1)];
    }
  }

  const note = generateSchedulingNote(urgency, selectedSlots.length, service_type);

  return {
    available_slots: selectedSlots,
    earliest_slot: earliestSlot,
    recommended_slot: recommendedSlot || null,
    note,
  };
}

/**
 * Format a date for display (e.g., "Tuesday, Feb 18")
 */
function formatDateDisplay(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format a time for display (e.g., "2:00 PM")
 */
function formatTime(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  return date.toLocaleTimeString('en-US', options);
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Generate a contextual note about the scheduling
 */
function generateSchedulingNote(
  urgency: string,
  slot_count: number,
  service_type: string
): string {
  if (slot_count === 0) {
    return `No ${service_type} experts are currently available. We'll add you to our waitlist and notify you as soon as someone has an opening.`;
  }

  switch (urgency) {
    case 'emergency':
      return `We have ${slot_count} expert${slot_count > 1 ? 's' : ''} ready for immediate dispatch. The earliest slot shown is our fastest response.`;

    case 'high':
      return `These are our fastest available times for ${service_type}. We recommend the first option for quickest service.`;

    case 'medium':
      return `Here are some good times for your ${service_type} appointment. Choose what works best for your schedule.`;

    case 'low':
      return `Feel free to pick any time that's convenient. We're flexible and can often accommodate short notice requests.`;

    default:
      return `Here are the available times for your appointment.`;
  }
}

/**
 * Format a suggested slot for display
 */
export function formatSuggestedSlot(slot: SuggestedSlot): string {
  return `${slot.date_display} at ${slot.formatted_time} with ${slot.expert_name} (${slot.duration_minutes} min)`;
}

/**
 * Generate a message presenting the slot options
 */
export function generateSlotMessage(suggestions: SchedulingSuggestions): string {
  if (suggestions.available_slots.length === 0) {
    return suggestions.note;
  }

  let message = `Great! Here are available appointment times:\n\n`;

  suggestions.available_slots.forEach((slot, index) => {
    const indicator = index === 0 ? '⚡' : index === 1 ? '✓' : '•';
    const format = slot.date_display.includes('Today')
      ? `${indicator} **${slot.formatted_time}** (${slot.expert_name})`
      : `${indicator} ${slot.date_display} at ${slot.formatted_time} (${slot.expert_name})`;

    message += `${format}\n`;
  });

  message += `\n${suggestions.note}`;

  return message;
}

/**
 * Parse customer preference from text
 * E.g., "morning", "afternoon", "tomorrow", "wednesday"
 */
export function parseSchedulingPreference(
  preference_text: string
): { preferred_hour?: number; preferred_day?: number } {
  const text = preference_text.toLowerCase();

  // Parse time preference
  let preferred_hour: number | undefined;

  if (text.includes('morning')) preferred_hour = 9;
  else if (text.includes('afternoon')) preferred_hour = 14;
  else if (text.includes('evening')) preferred_hour = 17;
  else if (text.includes('early')) preferred_hour = 8;
  else if (text.includes('late')) preferred_hour = 16;

  // Parse day preference
  let preferred_day: number | undefined;

  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  for (const [day, dayNum] of Object.entries(dayMap)) {
    if (text.includes(day)) {
      preferred_day = dayNum;
      break;
    }
  }

  // Check for relative dates
  if (text.includes('today')) {
    preferred_day = new Date().getDay();
  } else if (text.includes('tomorrow')) {
    preferred_day = (new Date().getDay() + 1) % 7;
  } else if (text.includes('next week')) {
    preferred_day = (new Date().getDay() + 7) % 7;
  }

  return { preferred_hour, preferred_day };
}

/**
 * Calculate availability confidence score (0-100)
 * Higher score = more confident we can serve them soon
 */
export function calculateAvailabilityConfidence(
  suggestions: SchedulingSuggestions,
  urgency: string
): number {
  if (suggestions.available_slots.length === 0) return 0;

  let confidence = 50; // Base score for any availability

  // Bonus points for multiple options
  if (suggestions.available_slots.length >= 3) confidence += 20;
  if (suggestions.available_slots.length >= 5) confidence += 10;

  // Bonus for expert quality match
  const avgMatch = suggestions.available_slots.reduce((sum, slot) => sum + slot.expertise_match, 0) /
    suggestions.available_slots.length;
  if (avgMatch >= 80) confidence += 15;

  // Bonus for quick response time
  if (suggestions.earliest_slot) {
    const now = new Date();
    const hoursUntilSlot =
      (suggestions.earliest_slot.date_time.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (urgency === 'emergency' && hoursUntilSlot < 2) confidence += 25;
    else if (urgency === 'high' && hoursUntilSlot < 24) confidence += 20;
    else if (urgency === 'medium' && hoursUntilSlot < 48) confidence += 10;
  }

  return Math.min(100, confidence);
}

/**
 * Group slots by date for display
 */
export function groupSlotsByDate(
  slots: SuggestedSlot[]
): { date: string; slots: SuggestedSlot[] }[] {
  const groups: Map<string, SuggestedSlot[]> = new Map();

  slots.forEach((slot) => {
    const dateKey = slot.date_display;
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(slot);
  });

  return Array.from(groups.entries()).map(([date, slots]) => ({
    date,
    slots: slots.sort((a, b) => a.date_time.getTime() - b.date_time.getTime()),
  }));
}
