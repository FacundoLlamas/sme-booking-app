/**
 * Availability Checker for Finding Qualified Experts
 * Queries database for experts matching service requirements and urgency level
 * Uses enhanced fuzzy matching for skill matching
 */

import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '@/lib/db/queries';
import { calculateEnhancedSkillMatch } from './skill-matcher';

export interface AvailableExpert {
  expert_id: string;
  expert_name: string;
  available_slots: TimeSlot[];
  earliest_available: Date;
  expertise_match: number; // 0-100 (confidence in match)
  customer_rating?: number; // 0-5 stars
  is_emergency_capable: boolean;
}

export interface TimeSlot {
  slot_id: string;
  start_time: Date;
  end_time: Date;
  duration_minutes: number;
  is_available: boolean;
  expert_id: string;
}

export interface AvailabilityCheckOptions {
  service_type: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  business_id?: number;
  days_ahead: number; // Look ahead N days
  exclude_expert_ids?: string[];
  max_results: number; // Return top N experts
}

/**
 * Find available experts for a service request
 * Matches against skills, urgency level, and availability
 */
export async function findAvailableExperts(
  options: AvailabilityCheckOptions
): Promise<AvailableExpert[]> {
  const prisma = getPrismaClient();

  const {
    service_type,
    urgency,
    business_id,
    days_ahead = 7,
    exclude_expert_ids = [],
    max_results = 5,
  } = options;

  try {
    // Fetch all technicians for the business
    let technicians = await prisma.technician.findMany({
      where: {
        ...(business_id && { businessId: business_id }),
        availabilityStatus: 'available',
        ...(exclude_expert_ids.length > 0 && { id: { notIn: exclude_expert_ids.map(Number) } }),
      },
      include: {
        business: true,
      },
    });

    // Filter by skill match using enhanced fuzzy matching
    const candidates: {
      technician: typeof technicians[0];
      expertise_match: number;
    }[] = technicians
      .map((tech) => ({
        technician: tech,
        expertise_match: calculateEnhancedSkillMatch(tech.skills || '', service_type, urgency),
      }))
      .filter((c) => c.expertise_match > 30); // Minimum 30% match

    // Get available slots for each candidate
    const expertResults: AvailableExpert[] = [];

    for (const candidate of candidates) {
      const slots = await getExpertAvailability(
        candidate.technician.id,
        days_ahead,
        service_type
      );

      if (slots.length > 0) {
        const earliestSlot = slots[0];

        expertResults.push({
          expert_id: candidate.technician.id.toString(),
          expert_name: candidate.technician.name,
          available_slots: slots.slice(0, 5), // Return top 5 slots
          earliest_available: new Date(earliestSlot.start_time),
          expertise_match: candidate.expertise_match,
          is_emergency_capable: isEmergencyCapable(candidate.technician),
        });
      }
    }

    // Sort by expertise match and urgency capability
    expertResults.sort((a, b) => {
      // For emergencies, prioritize emergency-capable experts
      if (urgency === 'emergency') {
        if (a.is_emergency_capable !== b.is_emergency_capable) {
          return a.is_emergency_capable ? -1 : 1;
        }
      }

      // Then sort by expertise match
      return b.expertise_match - a.expertise_match;
    });

    return expertResults.slice(0, max_results);
  } catch (error) {
    console.error('Error finding available experts:', error);
    throw new Error(`Failed to find available experts: ${String(error)}`);
  }
}

/**
 * Check if expert is capable of emergency response
 */
function isEmergencyCapable(technician: any): boolean {
  // Experts with "emergency" or "24/7" in skills
  const skills = (technician.skills || '').toLowerCase();
  return skills.includes('emergency') || skills.includes('24/7') || skills.includes('urgent');
}

/**
 * Get availability for a specific expert
 * Combines their availability status with mock calendar
 */
export async function getExpertAvailability(
  expert_id: number,
  days_ahead: number,
  service_type: string
): Promise<TimeSlot[]> {
  // In production, this would query the calendar system (Google Calendar API, etc.)
  // For now, we'll generate mock availability

  const slots: TimeSlot[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const SERVICE_DURATIONS: Record<string, number> = {
    plumbing: 90,
    electrical: 75,
    hvac: 150,
    painting: 360,
    locksmith: 60,
    glazier: 120,
    roofing: 240,
    cleaning: 180,
    pest_control: 90,
    appliance_repair: 120,
    garage_door: 90,
    handyman: 120,
  };

  const serviceDuration = SERVICE_DURATIONS[service_type.toLowerCase()] || 90;

  // Generate slots for the next N days
  for (let day = 0; day < days_ahead; day++) {
    const slotDate = new Date(today);
    slotDate.setDate(slotDate.getDate() + day);

    // Business hours: 8 AM to 5 PM
    // Skip Sundays
    if (slotDate.getDay() === 0) continue;

    // Generate 4 slots per day: 8-10, 10-12, 1-3, 3-5
    const businessHours = [8, 10, 13, 15];

    for (const hour of businessHours) {
      const slotStart = new Date(slotDate);
      slotStart.setHours(hour, 0, 0, 0);

      // Skip if time is in the past
      if (slotStart < new Date()) continue;

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + serviceDuration);

      // Randomly mark some as booked (30% chance)
      const isAvailable = Math.random() > 0.3;

      slots.push({
        slot_id: `${expert_id}_${slotStart.getTime()}`,
        start_time: slotStart,
        end_time: slotEnd,
        duration_minutes: serviceDuration,
        is_available: isAvailable,
        expert_id: expert_id.toString(),
      });
    }
  }

  // Return only available slots, sorted by time
  return slots
    .filter((slot) => slot.is_available)
    .sort((a, b) => a.start_time.getTime() - b.start_time.getTime());
}

/**
 * Check if a specific time slot is available
 */
export async function checkSlotAvailability(
  expert_id: number,
  slot_time: Date,
  duration_minutes: number
): Promise<boolean> {
  // In production, query calendar API
  // For mock, check if slot is in future and not on Sunday
  if (slot_time < new Date()) {
    return false;
  }

  if (slot_time.getDay() === 0) {
    return false;
  }

  const hour = slot_time.getHours();
  return hour >= 8 && hour < 17; // Business hours only
}

/**
 * Get business hours for a specific business
 */
export async function getBusinessHours(business_id: number): Promise<BusinessHours> {
  const prisma = getPrismaClient();

  try {
    const settings = await prisma.setting.findMany({
      where: { businessId: business_id },
    });

    const hoursSetting = settings.find((s) => s.key === 'working_hours')?.value;

    if (hoursSetting) {
      return JSON.parse(hoursSetting);
    }

    // Default business hours
    return {
      monday_start: 8,
      monday_end: 17,
      tuesday_start: 8,
      tuesday_end: 17,
      wednesday_start: 8,
      wednesday_end: 17,
      thursday_start: 8,
      thursday_end: 17,
      friday_start: 8,
      friday_end: 17,
      saturday_start: 9,
      saturday_end: 14,
      sunday_closed: true,
    };
  } catch (error) {
    console.error('Error getting business hours:', error);
    // Return defaults on error
    return {
      monday_start: 8,
      monday_end: 17,
      tuesday_start: 8,
      tuesday_end: 17,
      wednesday_start: 8,
      wednesday_end: 17,
      thursday_start: 8,
      thursday_end: 17,
      friday_start: 8,
      friday_end: 17,
      saturday_start: 9,
      saturday_end: 14,
      sunday_closed: true,
    };
  }
}

export interface BusinessHours {
  monday_start: number;
  monday_end: number;
  tuesday_start: number;
  tuesday_end: number;
  wednesday_start: number;
  wednesday_end: number;
  thursday_start: number;
  thursday_end: number;
  friday_start: number;
  friday_end: number;
  saturday_start: number;
  saturday_end: number;
  sunday_closed: boolean;
}

/**
 * Get summary of expert availability status
 */
export async function getAvailabilityStatus(
  business_id: number,
  service_type: string,
  urgency: 'low' | 'medium' | 'high' | 'emergency'
): Promise<{
  available_experts_count: number;
  average_wait_time_hours: number;
  has_emergency_capable: boolean;
  next_available_slot: Date | null;
}> {
  const experts = await findAvailableExperts({
    service_type,
    urgency,
    business_id,
    days_ahead: 7,
    max_results: 10,
  });

  if (experts.length === 0) {
    return {
      available_experts_count: 0,
      average_wait_time_hours: 0,
      has_emergency_capable: false,
      next_available_slot: null,
    };
  }

  const waitTimes = experts.map((e) => {
    const now = new Date();
    const hours = (e.earliest_available.getTime() - now.getTime()) / (1000 * 60 * 60);
    return Math.max(0, hours);
  });

  const avgWaitTime = waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length;

  return {
    available_experts_count: experts.length,
    average_wait_time_hours: parseFloat(avgWaitTime.toFixed(2)),
    has_emergency_capable: experts.some((e) => e.is_emergency_capable),
    next_available_slot: experts[0]?.earliest_available || null,
  };
}
