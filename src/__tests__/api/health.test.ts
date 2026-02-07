/**
 * Health & Ping API Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

describe('Health API', () => {
  describe('GET /api/health', () => {
    it('should return 200 with health status', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.status).toBe('ok');
      expect(data.data.timestamp).toBeDefined();
      expect(data.timestamp).toBeDefined();
    });

    it('should include system information', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      const data = await response.json();

      expect(data.data.uptime).toBeTypeOf('number');
      expect(data.data.environment).toBeDefined();
      expect(data.data.version).toBeDefined();
      expect(data.data.memory).toBeDefined();
      expect(data.data.memory.used).toBeTypeOf('number');
      expect(data.data.memory.total).toBeTypeOf('number');
    });

    it('should return valid JSON', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      const contentType = response.headers.get('content-type');

      expect(contentType).toContain('application/json');
    });
  });
});

describe('Ping API', () => {
  describe('GET /api/ping', () => {
    it('should return 200 with pong response', async () => {
      const response = await fetch(`${BASE_URL}/api/ping`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.pong).toBe(true);
      expect(data.data.timestamp).toBeDefined();
    });

    it('should have request-id header', async () => {
      const response = await fetch(`${BASE_URL}/api/ping`);
      const requestId = response.headers.get('x-request-id');

      expect(requestId).toBeDefined();
      expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should have response-time header', async () => {
      const response = await fetch(`${BASE_URL}/api/ping`);
      const responseTime = response.headers.get('x-response-time');

      expect(responseTime).toBeDefined();
      expect(responseTime).toMatch(/^\d+ms$/);
    });
  });
});

describe('Error Handling', () => {
  describe('GET /api/nonexistent', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await fetch(`${BASE_URL}/api/nonexistent`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/health', () => {
    it('should return 405 for unsupported methods', async () => {
      const response = await fetch(`${BASE_URL}/api/health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      // Next.js returns 405 for unsupported methods
      expect(response.status).toBe(405);
    });
  });
});

describe('CORS', () => {
  it('should include CORS headers', async () => {
    const response = await fetch(`${BASE_URL}/api/ping`);

    const corsOrigin = response.headers.get('access-control-allow-origin');
    expect(corsOrigin).toBeDefined();
  });

  it('should handle OPTIONS preflight requests', async () => {
    const response = await fetch(`${BASE_URL}/api/ping`, {
      method: 'OPTIONS',
    });

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-methods')).toBeDefined();
    expect(response.headers.get('access-control-allow-headers')).toBeDefined();
  });
});

describe('Rate Limiting', () => {
  it('should allow requests under rate limit', async () => {
    const requests = Array.from({ length: 5 }, () =>
      fetch(`${BASE_URL}/api/ping`)
    );

    const responses = await Promise.all(requests);
    
    for (const response of responses) {
      expect(response.status).toBe(200);
    }
  });

  // Note: This test is commented out to avoid rate limiting during regular test runs
  // Uncomment to test rate limiting behavior
  /*
  it('should return 429 when rate limit is exceeded', async () => {
    const requests = Array.from({ length: 150 }, () =>
      fetch(`${BASE_URL}/api/ping`)
    );

    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter(r => r.status === 429);

    expect(rateLimitedResponses.length).toBeGreaterThan(0);
    
    if (rateLimitedResponses.length > 0) {
      const retryAfter = rateLimitedResponses[0].headers.get('retry-after');
      expect(retryAfter).toBeDefined();
    }
  }, 30000); // 30 second timeout
  */
});
