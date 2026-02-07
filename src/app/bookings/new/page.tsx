/**
 * New Booking Page
 * Entry point for the booking flow
 */

'use client';

import { useRouter } from 'next/navigation';
import BookingForm from '@/components/booking/BookingForm';

export default function NewBookingPage() {
  const router = useRouter();

  const handleBookingSuccess = (bookingId: number, confirmationCode: string) => {
    // Redirect to confirmation page
    router.push(`/bookings/${bookingId}?code=${confirmationCode}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Book a Service
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Schedule your appointment in just a few minutes
          </p>
        </div>

        {/* Booking Form */}
        <BookingForm onSuccess={handleBookingSuccess} />
      </div>
    </main>
  );
}
