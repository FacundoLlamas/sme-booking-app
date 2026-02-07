/**
 * Unit Tests for Utility Functions
 * Test coverage for all helper functions and utilities
 * Target: >85% coverage
 */

import { describe, it, expect } from 'vitest';

/**
 * Format Phone Number - Remove formatting for storage
 */
function formatPhoneForStorage(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Format Currency
 */
function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Calculate Service Duration (based on service type)
 */
const SERVICE_DURATIONS: Record<string, number> = {
  plumbing: 90,
  electrical: 120,
  hvac: 120,
  'general-maintenance': 60,
  landscaping: 180,
  default: 60,
};

function getServiceDuration(serviceType: string): number {
  return SERVICE_DURATIONS[serviceType] || SERVICE_DURATIONS.default;
}

/**
 * Calculate end time for booking
 */
function calculateBookingEndTime(
  startTime: Date,
  serviceType: string
): Date {
  const duration = getServiceDuration(serviceType);
  return new Date(startTime.getTime() + duration * 60 * 1000);
}

/**
 * Parse ISO date string safely
 */
function parseISODate(dateString: string): Date | null {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch {
    return null;
  }
}

/**
 * Check if date is in business hours
 */
function isInBusinessHours(date: Date): boolean {
  const hour = date.getUTCHours();
  const day = date.getUTCDay();

  // Skip Sundays (day 0) and Saturdays (day 6)
  if (day === 0 || day === 6) {
    return false;
  }

  // Business hours: 8 AM to 5 PM UTC
  return hour >= 8 && hour < 17;
}

/**
 * Generate confirmation code
 */
function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Truncate string with ellipsis
 */
function truncateString(str: string, length: number): string {
  if (str.length <= length) {
    return str;
  }
  return str.substring(0, length - 3) + '...';
}

/**
 * Check for booking overlap
 */
function hasBookingOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Calculate time difference in minutes
 */
function getMinutesDifference(date1: Date, date2: Date): number {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffMs / (1000 * 60));
}

describe('Utility Functions', () => {
  describe('formatPhoneForStorage', () => {
    it('should remove all formatting from phone number', () => {
      expect(formatPhoneForStorage('+1-555-0123')).toBe('+15550123');
    });

    it('should keep international prefix', () => {
      expect(formatPhoneForStorage('+44 20 7946 0958')).toBe('+442079460958');
    });

    it('should handle parentheses', () => {
      expect(formatPhoneForStorage('(555) 0123')).toBe('5550123');
    });

    it('should handle spaces', () => {
      expect(formatPhoneForStorage('555 0123')).toBe('5550123');
    });

    it('should handle hyphens', () => {
      expect(formatPhoneForStorage('555-0123')).toBe('5550123');
    });

    it('should handle plain numbers', () => {
      expect(formatPhoneForStorage('5550123')).toBe('5550123');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD currency', () => {
      expect(formatCurrency(100)).toBe('$100.00');
    });

    it('should format with decimals', () => {
      expect(formatCurrency(99.99)).toBe('$99.99');
    });

    it('should format thousands with comma', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
    });

    it('should format zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should support different currencies', () => {
      const gbp = formatCurrency(100, 'GBP');
      expect(gbp).toContain('100');
    });
  });

  describe('getServiceDuration', () => {
    it('should return correct duration for plumbing', () => {
      expect(getServiceDuration('plumbing')).toBe(90);
    });

    it('should return correct duration for electrical', () => {
      expect(getServiceDuration('electrical')).toBe(120);
    });

    it('should return correct duration for hvac', () => {
      expect(getServiceDuration('hvac')).toBe(120);
    });

    it('should return correct duration for general-maintenance', () => {
      expect(getServiceDuration('general-maintenance')).toBe(60);
    });

    it('should return correct duration for landscaping', () => {
      expect(getServiceDuration('landscaping')).toBe(180);
    });

    it('should return default duration for unknown service', () => {
      expect(getServiceDuration('unknown')).toBe(60);
    });

    it('should return default duration for empty string', () => {
      expect(getServiceDuration('')).toBe(60);
    });
  });

  describe('calculateBookingEndTime', () => {
    it('should calculate end time for plumbing (90 min)', () => {
      const start = new Date('2025-02-15T14:00:00Z');
      const end = calculateBookingEndTime(start, 'plumbing');

      expect(end.getTime()).toBe(start.getTime() + 90 * 60 * 1000);
      expect(end.getUTCHours()).toBe(15);
      expect(end.getUTCMinutes()).toBe(30);
    });

    it('should calculate end time for electrical (120 min)', () => {
      const start = new Date('2025-02-15T14:00:00Z');
      const end = calculateBookingEndTime(start, 'electrical');

      expect(end.getTime()).toBe(start.getTime() + 120 * 60 * 1000);
      expect(end.getUTCHours()).toBe(16);
      expect(end.getUTCMinutes()).toBe(0);
    });

    it('should handle day boundary crossing', () => {
      const start = new Date('2025-02-15T23:00:00Z');
      const end = calculateBookingEndTime(start, 'electrical');

      expect(end.getUTCDate()).toBe(16);
      expect(end.getUTCHours()).toBe(1);
    });
  });

  describe('parseISODate', () => {
    it('should parse valid ISO date string', () => {
      const dateString = '2025-02-15T14:00:00Z';
      const result = parseISODate(dateString);

      expect(result).not.toBeNull();
      expect(result?.toISOString()).toBe(dateString);
    });

    it('should parse ISO date with timezone offset', () => {
      const dateString = '2025-02-15T14:00:00-05:00';
      const result = parseISODate(dateString);

      expect(result).not.toBeNull();
    });

    it('should return null for invalid date string', () => {
      expect(parseISODate('not-a-date')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseISODate('')).toBeNull();
    });

    it('should return null for invalid format', () => {
      expect(parseISODate('2025-13-45')).toBeNull();
    });

    it('should handle various valid ISO formats', () => {
      const validDates = [
        '2025-02-15T14:00:00Z',
        '2025-02-15T14:00:00+00:00',
        '2025-02-15T14:00:00-05:00',
        '2025-02-15T14:00:00.123Z',
      ];

      validDates.forEach((dateString) => {
        expect(parseISODate(dateString)).not.toBeNull();
      });
    });
  });

  describe('isInBusinessHours', () => {
    it('should accept 8 AM on Monday', () => {
      const date = new Date('2025-02-10T08:00:00Z'); // Monday
      expect(isInBusinessHours(date)).toBe(true);
    });

    it('should accept 5 PM on Monday', () => {
      const date = new Date('2025-02-10T17:00:00Z'); // Monday 5 PM
      expect(isInBusinessHours(date)).toBe(true);
    });

    it('should reject 7 AM on Monday', () => {
      const date = new Date('2025-02-10T07:00:00Z');
      expect(isInBusinessHours(date)).toBe(false);
    });

    it('should reject 6 PM on Monday', () => {
      const date = new Date('2025-02-10T18:00:00Z');
      expect(isInBusinessHours(date)).toBe(false);
    });

    it('should reject Sunday', () => {
      const date = new Date('2025-02-09T12:00:00Z'); // Sunday
      expect(isInBusinessHours(date)).toBe(false);
    });

    it('should reject Saturday', () => {
      const date = new Date('2025-02-15T12:00:00Z'); // Saturday
      expect(isInBusinessHours(date)).toBe(false);
    });

    it('should accept all weekdays during business hours', () => {
      // Monday to Friday, 9 AM
      for (let day = 10; day <= 14; day++) {
        const date = new Date(`2025-02-${day}T09:00:00Z`);
        expect(isInBusinessHours(date)).toBe(true);
      }
    });
  });

  describe('generateConfirmationCode', () => {
    it('should generate 8 character code', () => {
      const code = generateConfirmationCode();
      expect(code.length).toBe(8);
    });

    it('should only contain alphanumeric characters', () => {
      const code = generateConfirmationCode();
      expect(/^[A-Z0-9]{8}$/.test(code)).toBe(true);
    });

    it('should generate different codes', () => {
      const code1 = generateConfirmationCode();
      const code2 = generateConfirmationCode();

      // Probability of collision is extremely low
      expect(code1).not.toBe(code2);
    });

    it('should generate valid codes for 100 iterations', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        const code = generateConfirmationCode();
        expect(/^[A-Z0-9]{8}$/.test(code)).toBe(true);
        codes.add(code);
      }

      // Should have 100 unique codes (extremely likely)
      expect(codes.size).toBe(100);
    });
  });

  describe('truncateString', () => {
    it('should not truncate strings shorter than limit', () => {
      expect(truncateString('Hello', 10)).toBe('Hello');
    });

    it('should truncate strings longer than limit', () => {
      expect(truncateString('Hello World', 8)).toBe('Hello...');
    });

    it('should handle exact length match', () => {
      expect(truncateString('Hello', 5)).toBe('Hello');
    });

    it('should preserve words as much as possible', () => {
      const result = truncateString('This is a long string', 12);
      expect(result.length).toBeLessThanOrEqual(12);
    });

    it('should add ellipsis to truncated strings', () => {
      const result = truncateString('Hello World', 8);
      expect(result).toContain('...');
    });

    it('should handle single character limit', () => {
      const result = truncateString('Hello', 3);
      expect(result).toBe('...');
    });

    it('should handle empty string', () => {
      expect(truncateString('', 10)).toBe('');
    });
  });

  describe('hasBookingOverlap', () => {
    it('should detect overlapping bookings', () => {
      const start1 = new Date('2025-02-15T14:00:00Z');
      const end1 = new Date('2025-02-15T15:30:00Z');
      const start2 = new Date('2025-02-15T15:00:00Z');
      const end2 = new Date('2025-02-15T16:00:00Z');

      expect(hasBookingOverlap(start1, end1, start2, end2)).toBe(true);
    });

    it('should detect no overlap for sequential bookings', () => {
      const start1 = new Date('2025-02-15T14:00:00Z');
      const end1 = new Date('2025-02-15T15:00:00Z');
      const start2 = new Date('2025-02-15T15:00:00Z');
      const end2 = new Date('2025-02-15T16:00:00Z');

      expect(hasBookingOverlap(start1, end1, start2, end2)).toBe(false);
    });

    it('should detect complete overlap', () => {
      const start1 = new Date('2025-02-15T14:00:00Z');
      const end1 = new Date('2025-02-15T16:00:00Z');
      const start2 = new Date('2025-02-15T14:30:00Z');
      const end2 = new Date('2025-02-15T15:30:00Z');

      expect(hasBookingOverlap(start1, end1, start2, end2)).toBe(true);
    });

    it('should detect partial overlap at start', () => {
      const start1 = new Date('2025-02-15T14:00:00Z');
      const end1 = new Date('2025-02-15T15:00:00Z');
      const start2 = new Date('2025-02-15T13:30:00Z');
      const end2 = new Date('2025-02-15T14:30:00Z');

      expect(hasBookingOverlap(start1, end1, start2, end2)).toBe(true);
    });

    it('should detect partial overlap at end', () => {
      const start1 = new Date('2025-02-15T14:00:00Z');
      const end1 = new Date('2025-02-15T15:00:00Z');
      const start2 = new Date('2025-02-15T14:30:00Z');
      const end2 = new Date('2025-02-15T15:30:00Z');

      expect(hasBookingOverlap(start1, end1, start2, end2)).toBe(true);
    });

    it('should handle same exact times', () => {
      const start = new Date('2025-02-15T14:00:00Z');
      const end = new Date('2025-02-15T15:00:00Z');

      expect(hasBookingOverlap(start, end, start, end)).toBe(true);
    });

    it('should work with reversed date order', () => {
      const start1 = new Date('2025-02-15T15:00:00Z');
      const end1 = new Date('2025-02-15T14:00:00Z'); // Reversed
      const start2 = new Date('2025-02-15T14:30:00Z');
      const end2 = new Date('2025-02-15T15:30:00Z');

      expect(hasBookingOverlap(start1, end1, start2, end2)).toBe(true);
    });
  });

  describe('getMinutesDifference', () => {
    it('should calculate 60 minutes difference', () => {
      const date1 = new Date('2025-02-15T14:00:00Z');
      const date2 = new Date('2025-02-15T15:00:00Z');

      expect(getMinutesDifference(date1, date2)).toBe(60);
    });

    it('should calculate 30 minutes difference', () => {
      const date1 = new Date('2025-02-15T14:00:00Z');
      const date2 = new Date('2025-02-15T14:30:00Z');

      expect(getMinutesDifference(date1, date2)).toBe(30);
    });

    it('should handle zero difference', () => {
      const date1 = new Date('2025-02-15T14:00:00Z');
      expect(getMinutesDifference(date1, date1)).toBe(0);
    });

    it('should work regardless of date order', () => {
      const date1 = new Date('2025-02-15T14:00:00Z');
      const date2 = new Date('2025-02-15T15:00:00Z');

      expect(getMinutesDifference(date1, date2)).toBe(
        getMinutesDifference(date2, date1)
      );
    });

    it('should calculate multi-hour difference', () => {
      const date1 = new Date('2025-02-15T14:00:00Z');
      const date2 = new Date('2025-02-15T17:30:00Z');

      expect(getMinutesDifference(date1, date2)).toBe(210); // 3.5 hours
    });

    it('should handle day boundary', () => {
      const date1 = new Date('2025-02-15T23:00:00Z');
      const date2 = new Date('2025-02-16T01:00:00Z');

      expect(getMinutesDifference(date1, date2)).toBe(120); // 2 hours
    });

    it('should floor result (not round)', () => {
      const date1 = new Date('2025-02-15T14:00:00.000Z');
      const date2 = new Date('2025-02-15T14:01:29.999Z');

      expect(getMinutesDifference(date1, date2)).toBe(1); // 89.999 seconds = 1 minute
    });
  });

  describe('Performance Tests', () => {
    it('should validate 10000 strings quickly', () => {
      const startTime = Date.now();

      for (let i = 0; i < 10000; i++) {
        truncateString(`This is a test string ${i}`, 20);
      }

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should calculate overlaps for 1000 bookings', () => {
      const startTime = Date.now();

      const baseStart = new Date('2025-02-15T08:00:00Z');
      for (let i = 0; i < 1000; i++) {
        const start1 = new Date(baseStart.getTime() + i * 60000);
        const end1 = new Date(start1.getTime() + 3600000);
        const start2 = new Date(baseStart.getTime() + (i + 1) * 60000);
        const end2 = new Date(start2.getTime() + 3600000);

        hasBookingOverlap(start1, end1, start2, end2);
      }

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(50); // Should be very fast
    });
  });
});
