/**
 * Database Query Tests
 * Tests for query utility functions using in-memory SQLite
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import {
  setPrismaClient,
  getPrismaClient,
  createCustomer,
  getCustomer,
  getCustomerByPhone,
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  cancelBooking,
  checkConflict,
  getAvailability,
  getDatabaseStats,
} from '../queries';

// Test data
let testCustomer: any;
let testBusiness: any;
let testService: any;
let testPrisma: PrismaClient;

beforeAll(async () => {
  // Use in-memory SQLite for tests
  testPrisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file::memory:?cache=shared',
      },
    },
  });

  // Set the test instance globally
  setPrismaClient(testPrisma);

  // Initialize schema for in-memory database
  // Note: In a real setup, you'd run migrations here
  console.log('Setting up test database...');
});

beforeEach(async () => {
  // Clean up tables before each test
  await testPrisma.booking.deleteMany();
  await testPrisma.customer.deleteMany();
  await testPrisma.business.deleteMany();
  await testPrisma.service.deleteMany();
  await testPrisma.auditLog.deleteMany();

  // Create test fixtures
  testCustomer = await testPrisma.customer.create({
    data: {
      name: 'Test Customer',
      phone: '+1-555-TEST',
      email: 'test@example.com',
      address: '123 Test St',
    },
  });

  testBusiness = await testPrisma.business.create({
    data: {
      name: 'Test Business',
      ownerEmail: 'business@test.com',
      timezone: 'UTC',
      maxConcurrentBookings: 5,
    },
  });

  testService = await testPrisma.service.create({
    data: {
      name: 'Test Service',
      category: 'testing',
      durationMinutes: 60,
      isEmergency: false,
    },
  });
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

// ============================================================================
// CUSTOMER TESTS
// ============================================================================

describe('Customer Queries', () => {
  it('should create a new customer', async () => {
    const customer = await createCustomer({
      name: 'John Doe',
      phone: '+1-555-1234',
      email: 'john@example.com',
      address: '456 Main St',
    });

    expect(customer).toBeDefined();
    expect(customer.name).toBe('John Doe');
    expect(customer.phone).toBe('+1-555-1234');
    expect(customer.email).toBe('john@example.com');
  });

  it('should fail to create duplicate phone number', async () => {
    await createCustomer({
      name: 'First User',
      phone: '+1-555-DUPE',
    });

    await expect(
      createCustomer({
        name: 'Second User',
        phone: '+1-555-DUPE',
      })
    ).rejects.toThrow('already exists');
  });

  it('should retrieve customer by ID', async () => {
    const customer = await getCustomer(testCustomer.id);

    expect(customer).toBeDefined();
    expect(customer?.id).toBe(testCustomer.id);
    expect(customer?.name).toBe('Test Customer');
  });

  it('should retrieve customer by phone', async () => {
    const customer = await getCustomerByPhone('+1-555-TEST');

    expect(customer).toBeDefined();
    expect(customer?.phone).toBe('+1-555-TEST');
    expect(customer?.name).toBe('Test Customer');
  });

  it('should return null for non-existent customer', async () => {
    const customer = await getCustomer(99999);
    expect(customer).toBeNull();
  });
});

// ============================================================================
// BOOKING TESTS
// ============================================================================

describe('Booking Queries', () => {
  it('should create a new booking', async () => {
    const bookingTime = new Date('2025-03-15T10:00:00Z');

    const booking = await createBooking({
      customerId: testCustomer.id,
      businessId: testBusiness.id,
      serviceId: testService.id,
      bookingTime,
      notes: 'Test booking',
    });

    expect(booking).toBeDefined();
    expect(booking.customerId).toBe(testCustomer.id);
    expect(booking.businessId).toBe(testBusiness.id);
    expect(booking.serviceId).toBe(testService.id);
    expect(booking.serviceType).toBe('Test Service');
    expect(booking.status).toBe('pending');
    expect(booking.notes).toBe('Test booking');
  });

  it('should retrieve booking by ID', async () => {
    const created = await createBooking({
      customerId: testCustomer.id,
      businessId: testBusiness.id,
      serviceId: testService.id,
      bookingTime: new Date('2025-03-15T14:00:00Z'),
    });

    const booking = await getBooking(created.id);

    expect(booking).toBeDefined();
    expect(booking?.id).toBe(created.id);
    expect(booking?.customer).toBeDefined();
    expect(booking?.business).toBeDefined();
  });

  it('should update booking status', async () => {
    const created = await createBooking({
      customerId: testCustomer.id,
      businessId: testBusiness.id,
      serviceId: testService.id,
      bookingTime: new Date('2025-03-15T15:00:00Z'),
    });

    const updated = await updateBooking(created.id, {
      status: 'confirmed',
    });

    expect(updated.status).toBe('confirmed');
    expect(updated.id).toBe(created.id);
  });

  it('should cancel booking', async () => {
    const created = await createBooking({
      customerId: testCustomer.id,
      businessId: testBusiness.id,
      serviceId: testService.id,
      bookingTime: new Date('2025-03-15T16:00:00Z'),
    });

    const cancelled = await cancelBooking(created.id);

    expect(cancelled.status).toBe('cancelled');
  });

  it('should create audit log on booking creation', async () => {
    await createBooking({
      customerId: testCustomer.id,
      businessId: testBusiness.id,
      serviceId: testService.id,
      bookingTime: new Date('2025-03-15T17:00:00Z'),
    });

    const auditLogs = await testPrisma.auditLog.findMany({
      where: { tableName: 'bookings', action: 'INSERT' },
    });

    expect(auditLogs.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// BOOKING FILTER TESTS
// ============================================================================

describe('Booking Filters', () => {
  beforeEach(async () => {
    // Create multiple bookings with different statuses and dates
    await createBooking({
      customerId: testCustomer.id,
      businessId: testBusiness.id,
      serviceId: testService.id,
      bookingTime: new Date('2025-03-10T10:00:00Z'),
      status: 'pending',
    });

    await createBooking({
      customerId: testCustomer.id,
      businessId: testBusiness.id,
      serviceId: testService.id,
      bookingTime: new Date('2025-03-15T14:00:00Z'),
      status: 'confirmed',
    });

    await createBooking({
      customerId: testCustomer.id,
      businessId: testBusiness.id,
      serviceId: testService.id,
      bookingTime: new Date('2025-03-20T16:00:00Z'),
      status: 'completed',
    });
  });

  it('should filter bookings by status', async () => {
    const pendingBookings = await getBookings({ status: 'pending' });
    const confirmedBookings = await getBookings({ status: 'confirmed' });

    expect(pendingBookings.length).toBe(1);
    expect(confirmedBookings.length).toBe(1);
    expect(pendingBookings[0].status).toBe('pending');
    expect(confirmedBookings[0].status).toBe('confirmed');
  });

  it('should filter bookings by customer ID', async () => {
    const customerBookings = await getBookings({ customerId: testCustomer.id });

    expect(customerBookings.length).toBe(3);
    expect(customerBookings.every((b) => b.customerId === testCustomer.id)).toBe(true);
  });

  it('should filter bookings by date range', async () => {
    const bookings = await getBookings({
      startDate: new Date('2025-03-12T00:00:00Z'),
      endDate: new Date('2025-03-18T00:00:00Z'),
    });

    expect(bookings.length).toBe(1);
    expect(bookings[0].serviceType).toBe('Service 2');
  });

  it('should filter bookings by multiple criteria', async () => {
    const bookings = await getBookings({
      customerId: testCustomer.id,
      status: 'confirmed',
      startDate: new Date('2025-03-01T00:00:00Z'),
      endDate: new Date('2025-03-31T00:00:00Z'),
    });

    expect(bookings.length).toBe(1);
    expect(bookings[0].status).toBe('confirmed');
  });
});

// ============================================================================
// CONFLICT DETECTION TESTS
// ============================================================================

describe('Conflict Detection', () => {
  it('should detect booking conflicts', async () => {
    const bookingTime = new Date('2025-03-15T10:00:00Z');

    // Create first booking
    await createBooking({
      customerId: testCustomer.id,
      businessId: testBusiness.id,
      serviceId: testService.id,
      bookingTime,
    });

    // Check for conflict at same time
    const hasConflict = await checkConflict(bookingTime, 60, testBusiness.id);

    expect(hasConflict).toBe(true);
  });

  it('should not detect conflict for different time slots', async () => {
    await createBooking({
      customerId: testCustomer.id,
      businessId: testBusiness.id,
      serviceId: testService.id,
      bookingTime: new Date('2025-03-15T10:00:00Z'),
    });

    // Check 2 hours later
    const hasConflict = await checkConflict(
      new Date('2025-03-15T12:00:00Z'),
      60,
      testBusiness.id
    );

    expect(hasConflict).toBe(false);
  });

  it('should prevent creating conflicting bookings', async () => {
    const bookingTime = new Date('2025-03-15T14:00:00Z');

    await createBooking({
      customerId: testCustomer.id,
      businessId: testBusiness.id,
      serviceId: testService.id,
      bookingTime,
    });

    // Try to create overlapping booking
    await expect(
      createBooking({
        customerId: testCustomer.id,
        businessId: testBusiness.id,
        serviceId: testService.id,
        bookingTime,
      })
    ).rejects.toThrow('conflict');
  });
});

// ============================================================================
// AVAILABILITY TESTS
// ============================================================================

describe('Availability Queries', () => {
  beforeEach(async () => {
    // Create business settings
    await testPrisma.setting.createMany({
      data: [
        { businessId: testBusiness.id, key: 'working_hours_start', value: '09:00' },
        { businessId: testBusiness.id, key: 'working_hours_end', value: '17:00' },
      ],
    });
  });

  it('should return available time slots', async () => {
    const date = new Date('2025-03-15');
    const slots = await getAvailability(testBusiness.id, 'Test Service', date);

    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((slot) => slot.start instanceof Date)).toBe(true);
    expect(slots.every((slot) => slot.end instanceof Date)).toBe(true);
  });

  it('should mark occupied slots as unavailable', async () => {
    const date = new Date('2025-03-15');
    const bookingTime = new Date('2025-03-15T10:00:00Z');

    // Create a booking
    await createBooking({
      customerId: testCustomer.id,
      businessId: testBusiness.id,
      serviceId: testService.id,
      bookingTime,
      status: 'confirmed',
    });

    const slots = await getAvailability(testBusiness.id, 'Test Service', date);

    // Find the 10:00 slot
    const occupiedSlot = slots.find(
      (slot) => slot.start.getUTCHours() === bookingTime.getUTCHours()
    );

    expect(occupiedSlot?.available).toBe(false);
  });
});

// ============================================================================
// DATABASE STATS TESTS
// ============================================================================

describe('Database Statistics', () => {
  it('should return database statistics', async () => {
    const stats = await getDatabaseStats();

    expect(stats).toBeDefined();
    expect(stats.customers).toBeGreaterThanOrEqual(0);
    expect(stats.businesses).toBeGreaterThanOrEqual(0);
    expect(stats.bookings).toBeGreaterThanOrEqual(0);
    expect(stats.technicians).toBeGreaterThanOrEqual(0);
    expect(stats.services).toBeGreaterThanOrEqual(0);
  });
});
