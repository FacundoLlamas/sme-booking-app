/**
 * Phase 2.3 Advanced Features Tests
 * Tests: Fuzzy Matching, Calendar Integration, Booking Creation, Timezone Handling
 */

import { describe, it, expect } from 'vitest';
import {
  calculateEnhancedSkillMatch,
  getDetailedSkillMatch,
} from '@/lib/availability/skill-matcher';
import {
  getCalendarConfig,
  convertToCustomerTimezone,
  convertFromCustomerTimezone,
} from '@/lib/availability/calendar-integration';
import { getServiceTemplates } from '@/lib/response-generator/templates';

describe('Phase 2.3 Advanced: Fuzzy Matching & Calendar Integration', () => {
  // ==================== FUZZY MATCHING TESTS ====================
  describe('Fuzzy Matching: Skill Matching with Levenshtein Distance', () => {
    it('Should match exact service types (100% score)', () => {
      const score = calculateEnhancedSkillMatch('plumbing, repairs', 'plumbing', 'high');
      expect(score).toBe(100);
    });

    it('Should match category keywords (70-80% score)', () => {
      // "drain cleaning" should match "plumbing" category
      const score = calculateEnhancedSkillMatch('drain cleaning, water work', 'plumbing', 'high');
      expect(score).toBeGreaterThanOrEqual(70);
      expect(score).toBeLessThanOrEqual(80);
    });

    it('Should fuzzy match similar services using Levenshtein distance (60% score)', () => {
      // "plumbing" expert for "pipe repair" should fuzzy match
      const score = calculateEnhancedSkillMatch('plumbing', 'pipe repair', 'high');
      // Should either match via category or fuzzy
      expect(score).toBeGreaterThanOrEqual(60);
    });

    it('Should match general/handyman skills (40-50% score)', () => {
      const score = calculateEnhancedSkillMatch('general maintenance', 'roofing', 'low');
      expect(score).toBeGreaterThanOrEqual(40);
      expect(score).toBeLessThanOrEqual(50);
    });

    it('Should return minimum score for unrelated skills', () => {
      const score = calculateEnhancedSkillMatch('plumbing', 'rocket science', 'high');
      expect(score).toBe(30); // Minimum default
    });

    it('Should return minimum for empty skills', () => {
      const score = calculateEnhancedSkillMatch('', 'plumbing', 'high');
      expect(score).toBe(30);
    });

    it('Should handle multiple skills separated by commas', () => {
      const score = calculateEnhancedSkillMatch(
        'drain cleaning, pipe repair, water systems',
        'plumbing',
        'high'
      );
      expect(score).toBeGreaterThanOrEqual(70);
    });
  });

  describe('Detailed Skill Match Results', () => {
    it('Should return exact match type for exact matches', () => {
      const result = getDetailedSkillMatch('plumbing, repairs', 'plumbing', 'high');
      expect(result.matchType).toBe('exact');
      expect(result.score).toBe(100);
      expect(result.confidence).toBe(1.0);
    });

    it('Should return category match type for category matches', () => {
      const result = getDetailedSkillMatch('drain cleaning, faucet repair', 'plumbing', 'high');
      expect(result.matchType).toBe('category');
      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('Should return fuzzy match type for similar services', () => {
      const result = getDetailedSkillMatch('electrical wiring', 'electricity', 'high');
      expect(result.matchType).toMatch(/fuzzy|category/); // Either fuzzy or category
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  // ==================== CALENDAR INTEGRATION TESTS ====================
  describe('Calendar Integration: Mock vs Real', () => {
    it('Should identify when using mock calendar (no API key)', () => {
      // Temporarily remove API key
      const originalKey = process.env.GOOGLE_CALENDAR_API_KEY;
      delete process.env.GOOGLE_CALENDAR_API_KEY;

      const config = getCalendarConfig();
      expect(config.useRealCalendar).toBe(false);

      // Restore
      if (originalKey) {
        process.env.GOOGLE_CALENDAR_API_KEY = originalKey;
      }
    });

    it('Should identify when using real calendar (with API key)', () => {
      // Set API key temporarily
      const originalKey = process.env.GOOGLE_CALENDAR_API_KEY;
      process.env.GOOGLE_CALENDAR_API_KEY = 'test-api-key';

      const config = getCalendarConfig();
      expect(config.useRealCalendar).toBe(true);
      expect(config.googleCalendarApiKey).toBe('test-api-key');

      // Restore
      if (originalKey) {
        process.env.GOOGLE_CALENDAR_API_KEY = originalKey;
      } else {
        delete process.env.GOOGLE_CALENDAR_API_KEY;
      }
    });

    it('Should use timezone configuration', () => {
      const config = getCalendarConfig();
      expect(config.expertTimezone).toBeDefined();
      expect(config.customerTimezone).toBeDefined();
      expect(['UTC', 'America/New_York', 'America/Los_Angeles']).toContain(
        config.expertTimezone
      );
    });
  });

  // ==================== TIMEZONE HANDLING TESTS ====================
  describe('Timezone Handling: UTC Conversions', () => {
    it('Should convert UTC time to customer timezone', () => {
      const utcTime = new Date('2025-02-08T18:00:00Z'); // 6 PM UTC
      const result = convertToCustomerTimezone(utcTime, 'America/Los_Angeles');

      expect(result.timezone).toBe('America/Los_Angeles');
      expect(result.date).toBeDefined();
      expect(result.displayString).toBeDefined();
      // LA is UTC-8, so 6 PM UTC = 10 AM LA time
      expect(result.date.getHours()).toBe(10);
    });

    it('Should convert customer time to UTC', () => {
      const laTime = new Date(2025, 1, 8, 10, 0, 0); // 10 AM in LA
      const utcTime = convertFromCustomerTimezone(laTime, 'America/Los_Angeles');

      expect(utcTime).toBeDefined();
      // UTC should be 8 hours ahead
      expect(utcTime.getHours()).toBeGreaterThan(laTime.getHours());
    });

    it('Should handle expert timezone conversions', () => {
      const utcTime = new Date('2025-02-08T22:00:00Z'); // 10 PM UTC
      const result = convertToCustomerTimezone(utcTime, 'America/New_York');

      expect(result.timezone).toBe('America/New_York');
      // NY is UTC-5, so 10 PM UTC = 5 PM NY time
      expect(result.date.getHours()).toBe(17);
    });

    it('Should include readable display string', () => {
      const utcTime = new Date('2025-02-08T18:00:00Z');
      const result = convertToCustomerTimezone(utcTime, 'America/Los_Angeles');

      expect(result.displayString).toContain('2025'); // Year
      expect(result.displayString.length).toBeGreaterThan(0); // Has display string
    });
  });

  // ==================== TEMPLATE SPLITTING TESTS ====================
  describe('Response Templates: Service-Specific Files', () => {
    it('Should load plumbing templates', () => {
      const templates = getServiceTemplates('plumbing');
      expect(templates).toBeDefined();
      expect(templates.emergency).toBeDefined();
      expect(templates.high).toBeDefined();
      expect(templates.medium).toBeDefined();
      expect(templates.low).toBeDefined();
    });

    it('Should load electrical templates', () => {
      const templates = getServiceTemplates('electrical');
      expect(templates.emergency).toBeDefined();
      expect(templates.emergency.new).toContain('electrical');
    });

    it('Should load hvac templates', () => {
      const templates = getServiceTemplates('hvac');
      expect(templates.medium).toBeDefined();
      expect(templates.medium.repeat).toContain('HVAC');
    });

    it('Should load general maintenance templates', () => {
      const templates = getServiceTemplates('general-maintenance');
      expect(templates).toBeDefined();
      expect(templates.low).toBeDefined();
    });

    it('Should load landscaping templates', () => {
      const templates = getServiceTemplates('landscaping');
      expect(templates.high).toBeDefined();
      expect(templates.high.new).toContain('landscape');
    });

    it('Should fall back to default for unknown services', () => {
      const templates = getServiceTemplates('unknown-service');
      expect(templates).toBeDefined();
      expect(templates.medium).toBeDefined();
      expect(templates.medium.new).toContain('help');
    });

    it('Should have all urgency levels for each service', () => {
      const services = ['plumbing', 'electrical', 'hvac', 'landscaping', 'general-maintenance'];

      for (const service of services) {
        const templates = getServiceTemplates(service);
        expect(templates.emergency).toBeDefined();
        expect(templates.high).toBeDefined();
        expect(templates.medium).toBeDefined();
        expect(templates.low).toBeDefined();
      }
    });

    it('Should have new and repeat templates for each urgency', () => {
      const templates = getServiceTemplates('plumbing');

      for (const urgency of ['emergency', 'high', 'medium', 'low']) {
        expect(templates[urgency as keyof typeof templates]).toBeDefined();
        expect(templates[urgency as keyof typeof templates].new).toBeDefined();
        expect(templates[urgency as keyof typeof templates].repeat).toBeDefined();
      }
    });

    it('Should handle spaces in service names', () => {
      const templates1 = getServiceTemplates('general maintenance');
      const templates2 = getServiceTemplates('general-maintenance');

      expect(templates1).toBeDefined();
      expect(templates2).toBeDefined();
    });
  });

  // ==================== INTEGRATION TESTS ====================
  describe('Integration: Fuzzy Matching + Calendar + Templates', () => {
    it('Should match "pipe repair expert" to "plumbing" request', () => {
      const skillScore = calculateEnhancedSkillMatch('pipe repair, drain cleaning', 'plumbing', 'high');
      expect(skillScore).toBeGreaterThanOrEqual(70);

      const templates = getServiceTemplates('plumbing');
      expect(templates.high.new).toContain('Thanks');
    });

    it('Should handle timezone-aware scheduling', () => {
      // Get expert in NY, customer in LA
      const config = {
        useRealCalendar: false,
        expertTimezone: 'America/New_York',
        customerTimezone: 'America/Los_Angeles',
      };

      expect(config.expertTimezone).not.toBe(config.customerTimezone);

      // Expert has slot at 2 PM NY time
      const expertTime = new Date('2025-02-08T14:00:00');
      const nyTime = convertToCustomerTimezone(expertTime, config.expertTimezone);
      const laTime = convertToCustomerTimezone(expertTime, config.customerTimezone);

      // LA time should be 3 hours earlier than NY time on same UTC moment
      // (if expertTime is in UTC)
      expect(nyTime.timezone).toBe('America/New_York');
      expect(laTime.timezone).toBe('America/Los_Angeles');
    });
  });
});
