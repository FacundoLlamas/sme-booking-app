/**
 * Performance Testing with k6
 * Load test the booking API endpoints
 * 
 * Run with:
 * k6 run performance/booking-api.k6.js
 * 
 * For cloud testing:
 * k6 cloud performance/booking-api.k6.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const bookingCreateDuration = new Trend('booking_create_duration');
const bookingGetDuration = new Trend('booking_get_duration');
const bookingUpdateDuration = new Trend('booking_update_duration');
const bookingDeleteDuration = new Trend('booking_delete_duration');
const availabilityDuration = new Trend('availability_duration');
const errorRate = new Rate('errors');
const successRate = new Rate('success');
const throughput = new Counter('http_reqs');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up
    { duration: '2m', target: 100 }, // Stay at 100 concurrent users
    { duration: '30s', target: 0 }, // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% under 500ms, 99% under 1s
    'http_req_failed': ['rate<0.01'], // Error rate < 1%
    'booking_create_duration': ['p(95)<500'],
    'availability_duration': ['p(95)<300'],
  },
  ext: {
    loadimpact: {
      projectID: 0, // Replace with your project ID for cloud
      name: 'Booking API Load Test',
    },
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;

// Sample data for requests
const sampleBookingData = {
  customer_name: 'Test Customer',
  phone: '+1-555-0123',
  email: 'test@example.com',
  address: '123 Test Street',
  service_type: 'plumbing',
  expert_id: 1,
  booking_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  notes: 'Test booking from k6',
};

// Helper function to generate random booking time
function getRandomBookingTime() {
  const daysAhead = Math.floor(Math.random() * 30) + 1; // 1-30 days ahead
  const hoursAhead = Math.floor(Math.random() * 8) + 9; // 9 AM - 5 PM

  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hoursAhead, 0, 0, 0);

  return date.toISOString();
}

// Helper function to generate random confirmation code
function generateConfirmationCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function () {
  // Test 1: Get Availability
  group('GET /availability', () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const getAvailabilityResponse = http.get(
      `${API_BASE}/availability?service_type=plumbing&date=${today}`
    );

    const availabilitySuccess = check(getAvailabilityResponse, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
      'has available_slots': (r) => r.body.includes('available_slots'),
    });

    availabilityDuration.add(getAvailabilityResponse.timings.duration);
    successRate.add(availabilitySuccess);
    errorRate.add(!availabilitySuccess);

    sleep(1);
  });

  // Test 2: Create Booking
  group('POST /bookings', () => {
    const bookingPayload = {
      ...sampleBookingData,
      booking_time: getRandomBookingTime(),
      email: `user${Math.random().toString(36).substr(2, 9)}@example.com`,
    };

    const createBookingResponse = http.post(
      `${API_BASE}/bookings`,
      JSON.stringify(bookingPayload),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const createSuccess = check(createBookingResponse, {
      'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      'response time < 500ms': (r) => r.timings.duration < 500,
      'has booking_id': (r) => r.body.includes('booking_id'),
      'has confirmation_code': (r) => r.body.includes('confirmation_code'),
    });

    bookingCreateDuration.add(createBookingResponse.timings.duration);
    successRate.add(createSuccess);
    errorRate.add(!createSuccess);

    // Extract booking ID from response for next tests
    let bookingId = null;
    if (createBookingResponse.status === 200 || createBookingResponse.status === 201) {
      try {
        const responseBody = JSON.parse(createBookingResponse.body);
        bookingId = responseBody.data?.booking_id || responseBody.booking_id;
      } catch (e) {
        // Response parsing failed
      }
    }

    sleep(1);

    // Test 3: Get Booking (if creation succeeded)
    if (bookingId) {
      group('GET /bookings/:id', () => {
        const getBookingResponse = http.get(`${API_BASE}/bookings/${bookingId}`);

        const getSuccess = check(getBookingResponse, {
          'status is 200': (r) => r.status === 200,
          'response time < 300ms': (r) => r.timings.duration < 300,
          'has booking details': (r) => r.body.includes('booking_id'),
        });

        bookingGetDuration.add(getBookingResponse.timings.duration);
        successRate.add(getSuccess);
        errorRate.add(!getSuccess);

        sleep(1);
      });

      // Test 4: Update/Reschedule Booking
      group('PUT /bookings/:id', () => {
        const updatePayload = {
          booking_time: getRandomBookingTime(),
          notes: 'Rescheduled by load test',
        };

        const updateBookingResponse = http.put(
          `${API_BASE}/bookings/${bookingId}`,
          JSON.stringify(updatePayload),
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const updateSuccess = check(updateBookingResponse, {
          'status is 200': (r) => r.status === 200,
          'response time < 500ms': (r) => r.timings.duration < 500,
          'booking updated': (r) => r.body.includes('updated') || r.status === 200,
        });

        bookingUpdateDuration.add(updateBookingResponse.timings.duration);
        successRate.add(updateSuccess);
        errorRate.add(!updateSuccess);

        sleep(1);
      });

      // Test 5: Confirm Booking
      group('PUT /bookings/:id/confirm', () => {
        const confirmPayload = {
          confirmation_code: generateConfirmationCode(),
        };

        const confirmResponse = http.put(
          `${API_BASE}/bookings/${bookingId}/confirm`,
          JSON.stringify(confirmPayload),
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        // Note: This might fail if code doesn't match, which is expected
        const confirmCheck = check(confirmResponse, {
          'response time < 500ms': (r) => r.timings.duration < 500,
          'status is 200 or 400': (r) => r.status === 200 || r.status === 400,
        });

        successRate.add(confirmCheck);
        errorRate.add(!confirmCheck);

        sleep(1);
      });

      // Test 6: Delete/Cancel Booking
      group('DELETE /bookings/:id', () => {
        const cancelPayload = {
          reason: 'Test cancellation',
        };

        const deleteBookingResponse = http.del(
          `${API_BASE}/bookings/${bookingId}`,
          JSON.stringify(cancelPayload),
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const deleteSuccess = check(deleteBookingResponse, {
          'status is 200 or 204': (r) => r.status === 200 || r.status === 204,
          'response time < 500ms': (r) => r.timings.duration < 500,
        });

        bookingDeleteDuration.add(deleteBookingResponse.timings.duration);
        successRate.add(deleteSuccess);
        errorRate.add(!deleteSuccess);

        sleep(1);
      });
    }
  });

  // Test 7: Get Health Check
  group('GET /health', () => {
    const healthResponse = http.get(`${BASE_URL}/api/v1/health`);

    check(healthResponse, {
      'status is 200': (r) => r.status === 200,
      'response time < 100ms': (r) => r.timings.duration < 100,
    });

    sleep(1);
  });
}

/**
 * Performance Test Scenarios:
 *
 * VU (Virtual User) Profiles:
 * - Ramp up: 0 → 10 VUs over 30 seconds
 * - Load: 100 VUs for 2 minutes (main test)
 * - Ramp down: 100 → 0 VUs over 30 seconds
 *
 * Total Duration: ~3 minutes
 * Total Requests: ~300-400 (depends on scenario)
 *
 * Expected Results:
 * - Response time p95: < 500ms
 * - Response time p99: < 1000ms
 * - Error rate: < 1%
 * - Throughput: > 100 req/s
 *
 * Success Metrics:
 * ✅ p95 latency < 500ms
 * ✅ p99 latency < 1000ms
 * ✅ Error rate < 1%
 * ✅ Availability/GET < 300ms
 * ✅ Booking create/update < 500ms
 * ✅ No cascading failures
 */
