/**
 * Booking Service
 * Handles creation, retrieval, and management of bookings
 */

import { getPrismaClient } from './queries';
import { SelectedSlot } from '@/lib/conversation/state-machine';

export interface CreateBookingInput {
  customerId: number;
  businessId: number;
  serviceId: number;
  serviceType: string;
  technicianId: number;
  bookingTime: Date;
  notes?: string;
}

export interface BookingConfirmation {
  id: number;
  customerId: number;
  bookingTime: Date;
  status: string;
  confirmationToken: string;
}

/**
 * Create a new booking in the database
 * Called when customer confirms their appointment
 */
export async function createBooking(
  input: CreateBookingInput
): Promise<BookingConfirmation> {
  const prisma = getPrismaClient();

  try {
    const booking = await prisma.booking.create({
      data: {
        customerId: input.customerId,
        businessId: input.businessId,
        serviceId: input.serviceId,
        serviceType: input.serviceType,
        technicianId: input.technicianId,
        bookingTime: input.bookingTime,
        status: 'confirmed',
        notes: input.notes || 'Booked via AI conversation',
      },
    });

    // Generate confirmation token
    const confirmationToken = generateConfirmationToken(booking.id);

    return {
      id: booking.id,
      customerId: booking.customerId,
      bookingTime: booking.bookingTime,
      status: 'confirmed',
      confirmationToken,
    };
  } catch (error) {
    console.error('Error creating booking:', error);
    throw new Error(`Failed to create booking: ${String(error)}`);
  }
}

/**
 * Get booking by ID
 */
export async function getBookingById(bookingId: number) {
  const prisma = getPrismaClient();

  try {
    return await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        technician: true,
        service: true,
        business: true,
      },
    });
  } catch (error) {
    console.error('Error retrieving booking:', error);
    throw new Error(`Failed to retrieve booking: ${String(error)}`);
  }
}

/**
 * Get all bookings for a customer
 */
export async function getCustomerBookings(customerId: number) {
  const prisma = getPrismaClient();

  try {
    return await prisma.booking.findMany({
      where: { customerId },
      include: {
        technician: true,
        service: true,
        business: true,
      },
      orderBy: {
        bookingTime: 'desc',
      },
    });
  } catch (error) {
    console.error('Error retrieving customer bookings:', error);
    throw new Error(`Failed to retrieve bookings: ${String(error)}`);
  }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: number, reason?: string) {
  const prisma = getPrismaClient();

  try {
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled by customer',
      },
    });

    return booking;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw new Error(`Failed to cancel booking: ${String(error)}`);
  }
}

/**
 * Reschedule a booking
 */
export async function rescheduleBooking(
  bookingId: number,
  newBookingTime: Date,
  reason?: string
) {
  const prisma = getPrismaClient();

  try {
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingTime: newBookingTime,
        notes: reason ? `Rescheduled: ${reason}` : 'Rescheduled by customer',
      },
    });

    return booking;
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    throw new Error(`Failed to reschedule booking: ${String(error)}`);
  }
}

/**
 * Generate a confirmation token for a booking
 */
function generateConfirmationToken(bookingId: number): string {
  const timestamp = Date.now();
  const token = Buffer.from(`booking-${bookingId}-${timestamp}`).toString('base64');
  return token;
}

/**
 * Verify a confirmation token
 */
export function verifyConfirmationToken(token: string, bookingId: number): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    return decoded.startsWith(`booking-${bookingId}-`);
  } catch {
    return false;
  }
}

/**
 * Get upcoming bookings for a technician
 */
export async function getTechnicianUpcomingBookings(
  technicianId: number,
  daysAhead: number = 7
) {
  const prisma = getPrismaClient();

  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return await prisma.booking.findMany({
      where: {
        technicianId,
        bookingTime: {
          gte: today,
          lte: futureDate,
        },
        status: 'confirmed',
      },
      include: {
        customer: true,
        service: true,
      },
      orderBy: {
        bookingTime: 'asc',
      },
    });
  } catch (error) {
    console.error('Error retrieving technician bookings:', error);
    throw new Error(`Failed to retrieve bookings: ${String(error)}`);
  }
}
