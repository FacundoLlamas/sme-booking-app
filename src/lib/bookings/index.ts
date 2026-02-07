/**
 * Bookings Module Exports
 * Central export point for all booking-related functionality
 */

// Confirmation Workflow (SMS/Email notifications)
export {
  confirmBooking,
  resendConfirmation,
  generateConfirmationCode,
  type ConfirmationWorkflowResult,
} from './confirmation-workflow';

// Validators (Zod schemas & validation functions)
export {
  // Zod Schemas
  CreateBookingSchema,
  BookingResponseSchema,
  RescheduleBookingSchema,
  ConfirmBookingSchema,
  type CreateBookingRequest,
  type BookingResponse,
  type RescheduleBookingRequest,
  type ConfirmBookingRequest,
  // Constants
  BUSINESS_HOURS,
  SERVICE_DURATIONS,
  // Validation Functions
  validateBookingNotInPast,
  validateBusinessHours,
  validateServiceTypeExists,
  validateExpertAvailable,
  validateServiceDuration,
  validateCustomerContact,
  validateConfirmationCode,
  validateBookingRequest,
} from './validators';

// Conflict Checker (Pessimistic locking & availability)
export {
  checkBookingConflict,
  checkConflictInTransaction,
  getExpertBookingsInWindow,
  findNextAvailableSlot,
  addBufferToBooking,
  validateExpertAvailabilityRange,
  type ConflictCheckResult,
  type ConflictCheckParams,
} from './conflict-checker';
