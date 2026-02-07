/**
 * E2E Tests for API Endpoints
 * Tests REST API endpoints directly using Playwright's request context
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Health Endpoints', () => {
  test('GET /api/health should return 200', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    expect(response.status()).toBe(200);
  });

  test('GET /api/ping should return 200', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/ping`);
    expect(response.status()).toBe(200);
  });

  test('GET /api/v1/health should return 200', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/health`);
    expect(response.status()).toBe(200);
  });
});

test.describe('GET /api/v1/bookings', () => {
  test('should return bookings list with default params', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/bookings`);
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('bookings');
    expect(json.data).toHaveProperty('total');
    expect(json.data).toHaveProperty('page');
    expect(json.data).toHaveProperty('limit');
    expect(Array.isArray(json.data.bookings)).toBe(true);
  });

  test('should respect limit parameter', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/bookings?limit=3`);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.bookings.length).toBeLessThanOrEqual(3);
    expect(json.data.limit).toBe(3);
  });

  test('should respect page parameter', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/bookings?page=0&limit=5`);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.page).toBe(0);
  });

  test('should filter by status', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/bookings?status=pending`);
    const json = await response.json();
    expect(json.success).toBe(true);
    // All returned bookings should have status "pending"
    for (const booking of json.data.bookings) {
      expect(booking.status).toBe('pending');
    }
  });

  test('should filter by search term', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/bookings?search=NonExistentName123`);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.bookings.length).toBe(0);
  });

  test('should return upcoming bookings when upcoming=true', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/bookings?upcoming=true`);
    const json = await response.json();
    expect(json.success).toBe(true);

    const now = new Date();
    for (const booking of json.data.bookings) {
      expect(new Date(booking.dateTime).getTime()).toBeGreaterThanOrEqual(now.getTime() - 60000);
    }
  });

  test('should return booking objects with expected fields', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/bookings?limit=1`);
    const json = await response.json();
    expect(json.success).toBe(true);

    if (json.data.bookings.length > 0) {
      const booking = json.data.bookings[0];
      expect(booking).toHaveProperty('id');
      expect(booking).toHaveProperty('customerName');
      expect(booking).toHaveProperty('service');
      expect(booking).toHaveProperty('dateTime');
      expect(booking).toHaveProperty('status');
    }
  });

  test('should cap limit at 100', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/bookings?limit=500`);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.limit).toBeLessThanOrEqual(100);
  });
});

test.describe('GET /api/v1/dashboard/stats', () => {
  test('should return dashboard stats', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/dashboard/stats`);
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('totalBookings');
    expect(json.data).toHaveProperty('activeCustomers');
    expect(json.data).toHaveProperty('completionRate');
    expect(json.data).toHaveProperty('pendingBookings');
  });

  test('should return numeric values', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/dashboard/stats`);
    const json = await response.json();

    expect(typeof json.data.totalBookings).toBe('number');
    expect(typeof json.data.activeCustomers).toBe('number');
    expect(typeof json.data.completionRate).toBe('number');
    expect(typeof json.data.pendingBookings).toBe('number');
  });

  test('should return non-negative values', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/dashboard/stats`);
    const json = await response.json();

    expect(json.data.totalBookings).toBeGreaterThanOrEqual(0);
    expect(json.data.activeCustomers).toBeGreaterThanOrEqual(0);
    expect(json.data.completionRate).toBeGreaterThanOrEqual(0);
    expect(json.data.completionRate).toBeLessThanOrEqual(100);
    expect(json.data.pendingBookings).toBeGreaterThanOrEqual(0);
  });

  test('pending bookings should be <= total bookings', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/dashboard/stats`);
    const json = await response.json();

    expect(json.data.pendingBookings).toBeLessThanOrEqual(json.data.totalBookings);
  });
});

test.describe('POST /api/v1/bookings - Validation', () => {
  test('should reject empty body', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/v1/bookings`, {
      data: {},
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('should reject invalid email', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/v1/bookings`, {
      data: {
        customer_name: 'Test User',
        email: 'not-an-email',
        phone: '555-0123',
        address: '123 Test Street',
        service_type: 'plumbing',
        expert_id: 1,
        booking_time: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('should reject missing required fields', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/v1/bookings`, {
      data: {
        customer_name: 'Test User',
        // missing email, phone, etc.
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
