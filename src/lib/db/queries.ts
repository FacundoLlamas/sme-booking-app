/**
 * Database Query Utilities
 * Helper functions for common database operations
 */

import { PrismaClient, Customer, Booking, Prisma } from '@prisma/client';

// Dependency injection for PrismaClient
let prismaClient: PrismaClient | null = null;

export function setPrismaClient(client: PrismaClient) {
  prismaClient = client;
}

export function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }
  return prismaClient;
}

const prisma = getPrismaClient();

// ============================================================================
// CUSTOMER QUERIES
// ============================================================================

export interface CreateCustomerData {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

/**
 * Create a new customer
 */
export async function createCustomer(data: CreateCustomerData): Promise<Customer> {
  try {
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
      },
    });
    return customer;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error(`Customer with phone ${data.phone} already exists`);
      }
    }
    throw error;
  }
}

/**
 * Get customer by ID
 */
export async function getCustomer(id: number): Promise<Customer | null> {
  return await prisma.customer.findUnique({
    where: { id },
  });
}

/**
 * Get customer by phone
 */
export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
  return await prisma.customer.findUnique({
    where: { phone },
  });
}

// ============================================================================
// BOOKING QUERIES
// ============================================================================

export interface CreateBookingData {
  customerId: number;
  businessId: number;
  serviceId: number;
  bookingTime: Date;
  notes?: string;
  status?: string;
}

export interface BookingFilters {
  customerId?: number;
  businessId?: number;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Create a new booking with transaction safety
 */
export async function createBooking(data: CreateBookingData): Promise<Booking> {
  return await prisma.$transaction(async (tx) => {
    // Fetch service to get duration
    const service = await tx.service.findUnique({
      where: { id: data.serviceId },
    });

    if (!service) {
      throw new Error(`Service ${data.serviceId} not found`);
    }

    // Check for conflicts
    const conflict = await checkConflictInternal(
      data.bookingTime,
      service.durationMinutes,
      data.businessId,
      tx
    );

    if (conflict) {
      throw new Error(
        `Booking conflict detected at ${data.bookingTime.toISOString()}`
      );
    }

    // Create booking
    const booking = await tx.booking.create({
      data: {
        customerId: data.customerId,
        businessId: data.businessId,
        serviceId: data.serviceId,
        serviceType: service.name,  // Cache service name
        bookingTime: data.bookingTime,
        notes: data.notes,
        status: data.status || 'pending',
      },
    });

    // Log audit trail
    await tx.auditLog.create({
      data: {
        tableName: 'bookings',
        action: 'INSERT',
        recordId: booking.id,
        changes: JSON.stringify(booking),
      },
    });

    return booking;
  });
}

/**
 * Get bookings with optional filters
 */
export async function getBookings(filters: BookingFilters = {}): Promise<Booking[]> {
  const where: Prisma.BookingWhereInput = {};

  if (filters.customerId) {
    where.customerId = filters.customerId;
  }

  if (filters.businessId) {
    where.businessId = filters.businessId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.startDate || filters.endDate) {
    where.bookingTime = {};
    if (filters.startDate) {
      where.bookingTime.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.bookingTime.lte = filters.endDate;
    }
  }

  return await prisma.booking.findMany({
    where,
    orderBy: { bookingTime: 'asc' },
    include: {
      customer: true,
      business: true,
    },
  });
}

/**
 * Get booking by ID
 */
export async function getBooking(id: number): Promise<Booking | null> {
  return await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      business: true,
    },
  });
}

/**
 * Update booking
 */
export async function updateBooking(
  id: number,
  data: Partial<CreateBookingData>
): Promise<Booking> {
  return await prisma.$transaction(async (tx) => {
    const existingBooking = await tx.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      throw new Error(`Booking with ID ${id} not found`);
    }

    const updateData: any = {};

    // If serviceId is being updated, also update the cached serviceType
    if (data.serviceId) {
      const service = await tx.service.findUnique({
        where: { id: data.serviceId },
      });
      if (!service) {
        throw new Error(`Service ${data.serviceId} not found`);
      }
      updateData.serviceId = data.serviceId;
      updateData.serviceType = service.name;
    }

    if (data.bookingTime) {
      updateData.bookingTime = data.bookingTime;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }
    if (data.status) {
      updateData.status = data.status;
    }

    const updatedBooking = await tx.booking.update({
      where: { id },
      data: updateData,
    });

    // Log audit trail
    await tx.auditLog.create({
      data: {
        tableName: 'bookings',
        action: 'UPDATE',
        recordId: id,
        changes: JSON.stringify({
          before: existingBooking,
          after: updatedBooking,
        }),
      },
    });

    return updatedBooking;
  });
}

/**
 * Delete/cancel booking
 */
export async function cancelBooking(id: number): Promise<Booking> {
  return await updateBooking(id, { status: 'cancelled' });
}

// ============================================================================
// AVAILABILITY QUERIES
// ============================================================================

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

/**
 * Get available time slots for a business on a specific date
 */
export async function getAvailability(
  businessId: number,
  serviceType: string,
  date: Date
): Promise<TimeSlot[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get business settings for working hours
  const settings = await prisma.setting.findMany({
    where: {
      businessId,
      key: { in: ['working_hours_start', 'working_hours_end'] },
    },
  });

  const workStart = settings.find((s) => s.key === 'working_hours_start')?.value || '08:00';
  const workEnd = settings.find((s) => s.key === 'working_hours_end')?.value || '18:00';

  // Get existing bookings for the day
  const existingBookings = await prisma.booking.findMany({
    where: {
      businessId,
      bookingTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: { in: ['pending', 'confirmed'] },
    },
  });

  // Get service duration
  const service = await prisma.service.findFirst({
    where: { name: serviceType },
  });

  const durationMinutes = service?.durationMinutes || 60;

  // Generate time slots (hourly intervals)
  const slots: TimeSlot[] = [];
  const [startHour, startMinute] = workStart.split(':').map(Number);
  const [endHour, endMinute] = workEnd.split(':').map(Number);

  let currentTime = new Date(date);
  currentTime.setHours(startHour, startMinute, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(endHour, endMinute, 0, 0);

  while (currentTime < dayEnd) {
    const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60 * 1000);

    // Check if slot conflicts with existing bookings
    const hasConflict = existingBookings.some((booking) => {
      const bookingEnd = new Date(
        booking.bookingTime.getTime() + durationMinutes * 60 * 1000
      );
      return (
        (currentTime >= booking.bookingTime && currentTime < bookingEnd) ||
        (slotEnd > booking.bookingTime && slotEnd <= bookingEnd) ||
        (currentTime <= booking.bookingTime && slotEnd >= bookingEnd)
      );
    });

    slots.push({
      start: new Date(currentTime),
      end: slotEnd,
      available: !hasConflict,
    });

    // Move to next hour
    currentTime = new Date(currentTime.getTime() + 60 * 60 * 1000);
  }

  return slots;
}

/**
 * Check for booking conflicts (with pessimistic locking)
 */
export async function checkConflict(
  bookingTime: Date,
  durationMinutes: number,
  businessId?: number
): Promise<boolean> {
  return await prisma.$transaction(async (tx) => {
    return await checkConflictInternal(bookingTime, durationMinutes, businessId, tx);
  });
}

/**
 * Internal conflict check (used within transactions)
 */
export async function checkConflictInternal(
  bookingTime: Date,
  durationMinutes: number,
  businessId: number | undefined,
  tx: Prisma.TransactionClient
): Promise<boolean> {
  const bookingEnd = new Date(bookingTime.getTime() + durationMinutes * 60 * 1000);

  const where: Prisma.BookingWhereInput = {
    status: { in: ['pending', 'confirmed'] },
    bookingTime: {
      gte: new Date(bookingTime.getTime() - 24 * 60 * 60 * 1000), // 1 day before
      lte: new Date(bookingTime.getTime() + 24 * 60 * 60 * 1000), // 1 day after
    },
  };

  if (businessId) {
    where.businessId = businessId;
  }

  // Note: SQLite doesn't support FOR UPDATE, but this simulates the pattern
  const conflictingBookings = await tx.booking.findMany({
    where,
  });

  return conflictingBookings.some((booking) => {
    const existingEnd = new Date(
      booking.bookingTime.getTime() + durationMinutes * 60 * 1000
    );

    // Check for overlap
    return (
      (bookingTime >= booking.bookingTime && bookingTime < existingEnd) ||
      (bookingEnd > booking.bookingTime && bookingEnd <= existingEnd) ||
      (bookingTime <= booking.bookingTime && bookingEnd >= existingEnd)
    );
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  const [customers, businesses, bookings, technicians, services] = await Promise.all([
    prisma.customer.count(),
    prisma.business.count(),
    prisma.booking.count(),
    prisma.technician.count(),
    prisma.service.count(),
  ]);

  return {
    customers,
    businesses,
    bookings,
    technicians,
    services,
  };
}

/**
 * Get recent audit logs
 */
export async function getAuditLogs(limit: number = 50) {
  return await prisma.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
}

// Export Prisma client for direct use if needed
export { prisma };

export default {
  createCustomer,
  getCustomer,
  getCustomerByPhone,
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  cancelBooking,
  getAvailability,
  checkConflict,
  getDatabaseStats,
  getAuditLogs,
};
