/**
 * Vitest Setup File
 * Runs before all tests
 */

import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  // Reset mocks, clear timers, etc.
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Global test timeout
const GLOBAL_TIMEOUT = 10000; // 10 seconds

export { GLOBAL_TIMEOUT };
