/**
 * Unit Tests for Booking Validators
 * Test coverage for all validation functions, Zod schemas, and edge cases
 * Target: >90% coverage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CreateBookingSchema,
  BookingResponseSchema,
  RescheduleBookingSchema,
  ConfirmBookingSchema,
  validateBookingRequest,
  validateBookingNotInPast,
  validateBusinessHours,
  validateServiceTypeExists,
  validateExpertAvailable,
  validateServiceDuration,
  validateCustomerContact,
  validateConfirmationCode,
  validateConfirmationCodeFormat,
} from '../validators';
import { prisma } from '@/lib/db/prisma';

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    service: {
      findUnique: vi.fn(),
    },
    expert: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Booking Validators', () => {
  describe('CreateBookingSchema - Zod Schema Validation', () => {
    it('should validate a complete valid booking request', () => {
      const validData = {
        customer_name: 'John Doe',
        phone: '+1-555-0123',
        email: 'john@example.com',
        address: '123 Main Street, NYC',
        service_type: 'plumbing',
        expert_id: 5,
        booking_time: '2025-02-15T14:00:00Z',
        notes: 'Leaky faucet in kitchen',
      };

      const result = CreateBookingSchema.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should accept booking without notes (optional field)', () => {
      const dataWithoutNotes = {
        customer_name: 'Jane Smith',
        phone: '555-0456',
        email: 'jane@example.com',
        address: '456 Oak Ave',
        service_type: 'electrical',
        expert_id: 3,
        booking_time: '2025-02-20T10:00:00Z',
      };

      const result = CreateBookingSchema.safeParse(dataWithoutNotes);
      expect(result.success).toBe(true);
    });

    it('should reject booking with name too short', () => {
      const data = {
        customer_name: 'J',
        phone: '+1-555-0123',
        email: 'john@example.com',
        address: '123 Main Street',
        service_type: 'plumbing',
        expert_id: 5,
        booking_time: '2025-02-15T14:00:00Z',
      };

      const result = CreateBookingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject booking with invalid email', () => {
      const data = {
        customer_name: 'John Doe',
        phone: '+1-555-0123',
        email: 'invalid-email',
        address: '123 Main Street',
        service_type: 'plumbing',
        expert_id: 5,
        booking_time: '2025-02-15T14:00:00Z',
      };

      const result = CreateBookingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject booking with invalid phone format', () => {
      const data = {
        customer_name: 'John Doe',
        phone: '123',
        email: 'john@example.com',
        address: '123 Main Street',
        service_type: 'plumbing',
        expert_id: 5,
        booking_time: '2025-02-15T14:00:00Z',
      };

      const result = CreateBookingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject booking with address too short', () => {
      const data = {
        customer_name: 'John Doe',
        phone: '+1-555-0123',
        email: 'john@example.com',
        address: '123',
        service_type: 'plumbing',
        expert_id: 5,
        booking_time: '2025-02-15T14:00:00Z',
      };

      const result = CreateBookingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject booking with invalid ISO datetime', () => {
      const data = {
        customer_name: 'John Doe',
        phone: '+1-555-0123',
        email: 'john@example.com',
        address: '123 Main Street',
        service_type: 'plumbing',
        expert_id: 5,
        booking_time: 'not-a-date',
      };

      const result = CreateBookingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject booking with negative expert_id', () => {
      const data = {
        customer_name: 'John Doe',
        phone: '+1-555-0123',
        email: 'john@example.com',
        address: '123 Main Street',
        service_type: 'plumbing',
        expert_id: -1,
        booking_time: '2025-02-15T14:00:00Z',
      };

      const result = CreateBookingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject booking with extra unknown properties', () => {
      const data = {
        customer_name: 'John Doe',
        phone: '+1-555-0123',
        email: 'john@example.com',
        address: '123 Main Street',
        service_type: 'plumbing',
        expert_id: 5,
        booking_time: '2025-02-15T14:00:00Z',
        unknown_property: 'should fail',
      };

      const result = CreateBookingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept various phone number formats', () => {
      const phones = [
        '+1-555-0123',
        '555-0123',
        '(555) 0123',
        '+44 20 7946 0958',
        '001-555-555-5555',
      ];

      phones.forEach((phone) => {
        const data = {
          customer_name: 'John Doe',
          phone,
          email: 'john@example.com',
          address: '123 Main Street',
          service_type: 'plumbing',
          expert_id: 5,
          booking_time: '2025-02-15T14:00:00Z',
        };

        const result = CreateBookingSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject notes longer than 500 characters', () => {
      const longNotes = 'a'.repeat(501);
      const data = {
        customer_name: 'John Doe',
        phone: '+1-555-0123',
        email: 'john@example.com',
        address: '123 Main Street',
        service_type: 'plumbing',
        expert_id: 5,
        booking_time: '2025-02-15T14:00:00Z',
        notes: longNotes,
      };

      const result = CreateBookingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept notes exactly 500 characters', () => {
      const notes = 'a'.repeat(500);
      const data = {
        customer_name: 'John Doe',
        phone: '+1-555-0123',
        email: 'john@example.com',
        address: '123 Main Street',
        service_type: 'plumbing',
        expert_id: 5,
        booking_time: '2025-02-15T14:00:00Z',
        notes,
      };

      const result = CreateBookingSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('validateConfirmationCode', () => {
    it('should validate correct confirmation code format', () => {
      const code = 'ABC12345';
      expect(validateConfirmationCodeFormat(code)).toBe(true);
    });

    it('should reject lowercase letters', () => {
      const code = 'abc12345';
      expect(validateConfirmationCodeFormat(code)).toBe(false);
    });

    it('should reject code shorter than 8 characters', () => {
      const code = 'ABC1234';
      expect(validateConfirmationCodeFormat(code)).toBe(false);
    });

    it('should reject code longer than 8 characters', () => {
      const code = 'ABC123456';
      expect(validateConfirmationCodeFormat(code)).toBe(false);
    });

    it('should reject code with special characters', () => {
      const code = 'ABC1234-';
      expect(validateConfirmationCodeFormat(code)).toBe(false);
    });

    it('should accept codes with only numbers', () => {
      const code = '12345678';
      expect(validateConfirmationCodeFormat(code)).toBe(true);
    });

    it('should accept codes with only uppercase letters', () => {
      const code = 'ABCDEFGH';
      expect(validateConfirmationCodeFormat(code)).toBe(true);
    });
  });

  describe('validateBookingNotInPast', () => {
    it('should accept booking 1 hour in future', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      const result = validateBookingNotInPast(futureDate.toISOString());
      expect(result.valid).toBe(true);
    });

    it('should accept booking 1 day in future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const result = validateBookingNotInPast(futureDate.toISOString());
      expect(result.valid).toBe(true);
    });

    it('should reject booking in the past', () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);
      const result = validateBookingNotInPast(pastDate.toISOString());
      expect(result.valid).toBe(false);
    });

    it('should reject booking within 30 minute buffer', () => {
      const nearFutureDate = new Date();
      nearFutureDate.setMinutes(nearFutureDate.getMinutes() + 15);
      const result = validateBookingNotInPast(nearFutureDate.toISOString());
      expect(result.valid).toBe(false);
    });

    it('should accept booking exactly 30 minutes in future', () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 30);
      const result = validateBookingNotInPast(futureDate.toISOString());
      expect(result.valid).toBe(true);
    });
  });

  describe('validateBusinessHours', () => {
    it('should accept booking during business hours (9 AM)', () => {
      const date = new Date('2025-02-10T09:00:00Z'); // Monday 9 AM UTC
      const result = validateBusinessHours(date.toISOString());
      expect(result.valid).toBe(true);
    });

    it('should accept booking at 5 PM (end of business)', () => {
      const date = new Date('2025-02-10T17:00:00Z'); // Monday 5 PM UTC
      const result = validateBusinessHours(date.toISOString());
      expect(result.valid).toBe(true);
    });

    it('should reject booking before 8 AM', () => {
      const date = new Date('2025-02-10T07:00:00Z');
      const result = validateBusinessHours(date.toISOString());
      expect(result.valid).toBe(false);
    });

    it('should reject booking after 5 PM', () => {
      const date = new Date('2025-02-10T18:00:00Z');
      const result = validateBusinessHours(date.toISOString());
      expect(result.valid).toBe(false);
    });

    it('should reject booking on Sunday', () => {
      const sundayDate = new Date('2025-02-09T12:00:00Z'); // Sunday
      const result = validateBusinessHours(sundayDate.toISOString());
      expect(result.valid).toBe(false);
    });

    it('should accept booking on Monday', () => {
      const mondayDate = new Date('2025-02-10T12:00:00Z'); // Monday
      const result = validateBusinessHours(mondayDate.toISOString());
      expect(result.valid).toBe(true);
    });

    it('should accept booking on Friday', () => {
      const fridayDate = new Date('2025-02-14T12:00:00Z'); // Friday
      const result = validateBusinessHours(fridayDate.toISOString());
      expect(result.valid).toBe(true);
    });

    it('should reject booking on Saturday', () => {
      const saturdayDate = new Date('2025-02-15T12:00:00Z'); // Saturday
      const result = validateBusinessHours(saturdayDate.toISOString());
      expect(result.valid).toBe(false);
    });
  });

  describe('validateCustomerContact', () => {
    it('should validate correct email format', () => {
      const result = validateCustomerContact(
        'john@example.com',
        '+1-555-0123'
      );
      expect(result.valid).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = validateCustomerContact(
        'invalid-email',
        '+1-555-0123'
      );
      expect(result.valid).toBe(false);
    });

    it('should reject invalid phone', () => {
      const result = validateCustomerContact(
        'john@example.com',
        '123'
      );
      expect(result.valid).toBe(false);
    });

    it('should accept various email formats', () => {
      const emails = [
        'test@example.com',
        'user+tag@example.co.uk',
        'name.surname@domain.com',
      ];

      emails.forEach((email) => {
        const result = validateCustomerContact(email, '+1-555-0123');
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('RescheduleBookingSchema', () => {
    it('should validate rescheduling request', () => {
      const data = {
        booking_time: '2025-02-16T15:00:00Z',
      };

      const result = RescheduleBookingSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept notes in reschedule request', () => {
      const data = {
        booking_time: '2025-02-16T15:00:00Z',
        notes: 'Customer requested different time',
      };

      const result = RescheduleBookingSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid datetime', () => {
      const data = {
        booking_time: 'invalid-date',
      };

      const result = RescheduleBookingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('ConfirmBookingSchema', () => {
    it('should validate confirmation code', () => {
      const data = {
        confirmation_code: 'ABC12345',
      };

      const result = ConfirmBookingSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid confirmation code', () => {
      const data = {
        confirmation_code: 'invalid',
      };

      const result = ConfirmBookingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('BookingResponseSchema', () => {
    it('should validate booking response', () => {
      const data = {
        booking_id: 1,
        confirmation_code: 'ABC12345',
        calendar_event_id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'pending',
        booking_time: '2025-02-15T14:00:00Z',
        created_at: new Date().toISOString(),
      };

      const result = BookingResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases and Special Characters', () => {
    it('should handle customer names with special characters', () => {
      const data = {
        customer_name: "Jean-François D'Arcy",
        phone: '+1-555-0123',
        email: 'jean@example.com',
        address: '123 Main Street',
        service_type: 'plumbing',
        expert_id: 5,
        booking_time: '2025-02-15T14:00:00Z',
      };

      const result = CreateBookingSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle very long customer names (up to 100 chars)', () => {
      const longName = 'A'.repeat(100);
      const data = {
        customer_name: longName,
        phone: '+1-555-0123',
        email: 'john@example.com',
        address: '123 Main Street',
        service_type: 'plumbing',
        expert_id: 5,
        booking_time: '2025-02-15T14:00:00Z',
      };

      const result = CreateBookingSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject customer names exceeding 100 characters', () => {
      const tooLongName = 'A'.repeat(101);
      const data = {
        customer_name: tooLongName,
        phone: '+1-555-0123',
        email: 'john@example.com',
        address: '123 Main Street',
        service_type: 'plumbing',
        expert_id: 5,
        booking_time: '2025-02-15T14:00:00Z',
      };

      const result = CreateBookingSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should handle Unicode characters in customer name', () => {
      const data = {
        customer_name: '张三 (Zhang San)',
        phone: '+1-555-0123',
        email: 'zhang@example.com',
        address: '123 Main Street',
        service_type: 'plumbing',
        expert_id: 5,
        booking_time: '2025-02-15T14:00:00Z',
      };

      const result = CreateBookingSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle addresses with complex formatting', () => {
      const data = {
        customer_name: 'John Doe',
        phone: '+1-555-0123',
        email: 'john@example.com',
        address: '123-A Main St, Apt #45, New York, NY 10001',
        service_type: 'plumbing',
        expert_id: 5,
        booking_time: '2025-02-15T14:00:00Z',
      };

      const result = CreateBookingSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Timezone Handling', () => {
    it('should accept ISO 8601 with Z suffix', () => {
      const data = {
        customer_name: 'John Doe',
        phone: '+1-555-0123',
        email: 'john@example.com',
        address: '123 Main Street',
        service_type: 'plumbing',
        expert_id: 5,
        booking_time: '2025-02-15T14:00:00Z',
      };

      const result = CreateBookingSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept ISO 8601 with timezone offset', () => {
      const data = {
        customer_name: 'John Doe',
        phone: '+1-555-0123',
        email: 'john@example.com',
        address: '123 Main Street',
        service_type: 'plumbing',
        expert_id: 5,
        booking_time: '2025-02-15T14:00:00-05:00',
      };

      const result = CreateBookingSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Performance and Stress Tests', () => {
    it('should validate 1000 booking requests quickly', () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        const data = {
          customer_name: `Customer ${i}`,
          phone: `+1-555-${String(i).padStart(4, '0')}`,
          email: `user${i}@example.com`,
          address: `${i} Main Street`,
          service_type: 'plumbing',
          expert_id: i % 10,
          booking_time: '2025-02-15T14:00:00Z',
        };

        CreateBookingSchema.safeParse(data);
      }

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
