/**
 * Booking Type Definitions
 * Shared types for booking forms, API, and UI components
 */

import { z } from 'zod';

/**
 * Booking Status Enum
 */
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  RESCHEDULED = 'rescheduled'
}

/**
 * Service Type Enum
 */
export enum ServiceType {
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  HVAC = 'hvac',
  GENERAL_MAINTENANCE = 'general-maintenance',
  LANDSCAPING = 'landscaping'
}

/**
 * Zod Schemas for Form Validation
 */

// Step 1: Customer Details
export const CustomerDetailsSchema = z.object({
  customer_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .regex(/^\+?1?\d{9,15}$/, 'Invalid phone number'),
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(255, 'Address must be less than 255 characters')
});

export type CustomerDetails = z.infer<typeof CustomerDetailsSchema>;

// Step 2: Service Type
export const ServiceSelectionSchema = z.object({
  service_type: z
    .enum(['plumbing', 'electrical', 'hvac', 'general-maintenance', 'landscaping'])
    .refine(val => val in ServiceType, 'Invalid service type')
});

export type ServiceSelection = z.infer<typeof ServiceSelectionSchema>;

// Step 3: Time Slot
export const TimeSlotSchema = z.object({
  booking_time: z
    .string()
    .refine(val => !isNaN(Date.parse(val)), 'Invalid date/time')
    .refine(val => new Date(val) > new Date(), 'Booking must be in the future')
});

export type TimeSlot = z.infer<typeof TimeSlotSchema>;

// Step 4: Review & Notes
export const ReviewSchema = z.object({
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional()
});

export type Review = z.infer<typeof ReviewSchema>;

// Complete Booking Form
export const BookingFormSchema = CustomerDetailsSchema
  .merge(ServiceSelectionSchema)
  .merge(TimeSlotSchema)
  .merge(ReviewSchema);

export type BookingFormData = z.infer<typeof BookingFormSchema>;

/**
 * API Request/Response Types
 */

export interface CreateBookingRequest {
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  service_type: string;
  booking_time: string; // ISO 8601
  notes?: string;
  expert_id?: number;
}

export interface BookingResponse {
  booking_id: number;
  confirmation_code: string;
  status: string;
  booking_time: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  service_type: string;
  notes?: string;
  calendar_event_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ConfirmationPageData {
  bookingId: number;
  confirmationCode: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  serviceType: string;
  bookingTime: Date;
  notes?: string;
  status: BookingStatus;
  createdAt: Date;
}

/**
 * Available Time Slot
 */
export interface AvailableTimeSlot {
  time: Date;
  expert_id: number;
  expert_name: string;
  available: boolean;
}

/**
 * Customer Booking History Item
 */
export interface BookingHistoryItem {
  id: number;
  confirmationCode: string;
  serviceType: string;
  bookingTime: Date;
  status: BookingStatus;
  expert_name?: string;
  address: string;
}

/**
 * Booking Filter Options
 */
export enum BookingFilter {
  UPCOMING = 'upcoming',
  PAST = 'past',
  CANCELLED = 'cancelled'
}
