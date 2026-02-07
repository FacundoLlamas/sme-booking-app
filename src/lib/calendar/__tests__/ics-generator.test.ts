/**
 * ICS Generator Tests
 * Tests calendar file generation and export functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateIcsContent, getIcsDataUrl } from '../ics-generator';
import { ConfirmationPageData } from '@/types/booking';

describe('ICS Generator', () => {
  let mockBooking: ConfirmationPageData;

  beforeEach(() => {
    mockBooking = {
      bookingId: 1,
      confirmationCode: 'ABC12345',
      customerName: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234567',
      address: '123 Main St, Springfield, IL 62701',
      serviceType: 'plumbing',
      bookingTime: new Date('2025-02-15T10:00:00Z'),
      notes: 'Please call before arrival',
      status: 'confirmed' as any,
      createdAt: new Date('2025-02-07T16:00:00Z')
    };
  });

  describe('generateIcsContent', () => {
    it('should generate valid ICS format', () => {
      const ics = generateIcsContent(mockBooking);

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('END:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('PRODID:-//SME Booking App//EN');
    });

    it('should include event details', () => {
      const ics = generateIcsContent(mockBooking);

      expect(ics).toContain(`SUMMARY:Plumbing - Confirmation: ${mockBooking.confirmationCode}`);
      expect(ics).toContain(`LOCATION:${mockBooking.address}`);
      expect(ics).toContain(`UID:booking-${mockBooking.bookingId}-${mockBooking.confirmationCode}@sme-booking-app`);
    });

    it('should include customer information in description', () => {
      const ics = generateIcsContent(mockBooking);

      expect(ics).toContain(mockBooking.customerName);
      expect(ics).toContain(mockBooking.email);
      expect(ics).toContain(mockBooking.phone);
    });

    it('should include notes in description', () => {
      const ics = generateIcsContent(mockBooking);

      expect(ics).toContain(mockBooking.notes!);
    });

    it('should handle bookings without notes', () => {
      const bookingNoNotes = { ...mockBooking, notes: undefined };
      const ics = generateIcsContent(bookingNoNotes);

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('END:VCALENDAR');
    });

    it('should include event alarms', () => {
      const ics = generateIcsContent(mockBooking);

      expect(ics).toContain('BEGIN:VALARM');
      expect(ics).toContain('END:VALARM');
      expect(ics).toContain('TRIGGER:-P1D'); // 24 hour alarm
      expect(ics).toContain('TRIGGER:-PT2H'); // 2 hour alarm
    });

    it('should include start and end times', () => {
      const ics = generateIcsContent(mockBooking);

      // Start time
      expect(ics).toContain('DTSTART:');
      // End time
      expect(ics).toContain('DTEND:');
    });

    it('should calculate correct end time based on service duration', () => {
      const ics = generateIcsContent(mockBooking);

      // Plumbing is 90 minutes, so end should be 1.5 hours after start
      const startMatch = ics.match(/DTSTART:(\d{8}T\d{6}Z)/);
      const endMatch = ics.match(/DTEND:(\d{8}T\d{6}Z)/);

      expect(startMatch).toBeTruthy();
      expect(endMatch).toBeTruthy();

      if (startMatch && endMatch) {
        const startTime = new Date(
          `${startMatch[1].slice(0, 4)}-${startMatch[1].slice(4, 6)}-${startMatch[1].slice(6, 8)}T${startMatch[1].slice(9, 11)}:${startMatch[1].slice(11, 13)}:${startMatch[1].slice(13, 15)}Z`
        );
        const endTime = new Date(
          `${endMatch[1].slice(0, 4)}-${endMatch[1].slice(4, 6)}-${endMatch[1].slice(6, 8)}T${endMatch[1].slice(9, 11)}:${endMatch[1].slice(11, 13)}:${endMatch[1].slice(13, 15)}Z`
        );

        const durationMs = endTime.getTime() - startTime.getTime();
        const durationMinutes = durationMs / (1000 * 60);

        expect(durationMinutes).toBe(90); // Plumbing duration
      }
    });

    it('should escape special characters in text fields', () => {
      const bookingWithSpecials = {
        ...mockBooking,
        customerName: 'John; Doe, Jr.',
        address: 'Apt 123\\4, "Main" St.'
      };

      const ics = generateIcsContent(bookingWithSpecials);

      // Escaped characters should be present
      expect(ics).toMatch(/John\\;/);
      expect(ics).toMatch(/Doe\\,/);
    });

    it('should mark event as confirmed', () => {
      const ics = generateIcsContent(mockBooking);

      expect(ics).toContain('STATUS:CONFIRMED');
    });

    it('should handle different service types', () => {
      const serviceTypes = [
        'plumbing',
        'electrical',
        'hvac',
        'general-maintenance',
        'landscaping'
      ];

      serviceTypes.forEach(serviceType => {
        const booking = { ...mockBooking, serviceType };
        const ics = generateIcsContent(booking);

        expect(ics).toContain('BEGIN:VCALENDAR');
        expect(ics).toContain('SUMMARY:');
      });
    });
  });

  describe('getIcsDataUrl', () => {
    it('should generate valid data URL', () => {
      const dataUrl = getIcsDataUrl(mockBooking);

      expect(dataUrl).toMatch(/^data:text\/calendar;charset=utf-8,/);
      expect(dataUrl).toContain('BEGIN%3AVCALENDAR');
    });

    it('should produce downloadable content', () => {
      const dataUrl = getIcsDataUrl(mockBooking);
      const decodedContent = decodeURIComponent(dataUrl.substring('data:text/calendar;charset=utf-8,'.length));

      expect(decodedContent).toContain('BEGIN:VCALENDAR');
      expect(decodedContent).toContain('END:VCALENDAR');
    });
  });

  describe('ICS Format Validation', () => {
    it('should be RFC 5545 compliant', () => {
      const ics = generateIcsContent(mockBooking);

      // Check required properties
      expect(ics).toMatch(/^BEGIN:VCALENDAR\r\n/m);
      expect(ics).toMatch(/VERSION:2.0/m);
      expect(ics).toMatch(/PRODID:/m);
      expect(ics).toMatch(/BEGIN:VEVENT/m);
      expect(ics).toMatch(/UID:/m);
      expect(ics).toMatch(/DTSTAMP:/m);
      expect(ics).toMatch(/DTSTART:/m);
      expect(ics).toMatch(/DTEND:/m);
      expect(ics).toMatch(/SUMMARY:/m);
      expect(ics).toMatch(/END:VEVENT/m);
      expect(ics).toMatch(/END:VCALENDAR$/m);
    });

    it('should use proper date-time format (YYYYMMDDTHHmmssZ)', () => {
      const ics = generateIcsContent(mockBooking);

      const dateTimeRegex = /\d{8}T\d{6}Z/;
      expect(ics).toMatch(dateTimeRegex);
    });

    it('should use CRLF line endings', () => {
      const ics = generateIcsContent(mockBooking);

      // Should use \r\n for proper RFC compliance
      expect(ics).toContain('\r\n');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long confirmation codes', () => {
      const booking = { ...mockBooking, confirmationCode: 'A'.repeat(100) };
      const ics = generateIcsContent(booking);

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('SUMMARY:');
    });

    it('should handle Unicode characters in names', () => {
      const booking = { ...mockBooking, customerName: 'José García' };
      const ics = generateIcsContent(booking);

      expect(ics).toContain('BEGIN:VCALENDAR');
    });

    it('should handle very long addresses', () => {
      const booking = {
        ...mockBooking,
        address: '123 Main Street, Suite 456, Building 789, City, State 12345, United States of America'
      };
      const ics = generateIcsContent(booking);

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('LOCATION:');
    });

    it('should handle empty notes', () => {
      const booking = { ...mockBooking, notes: '' };
      const ics = generateIcsContent(booking);

      expect(ics).toContain('BEGIN:VCALENDAR');
    });
  });
});
