/**
 * Booking Confirmation Page
 * Displays confirmation details and provides booking actions
 */

'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ConfirmationPageData } from '@/types/booking';
import ConfirmationCard from '@/components/booking/ConfirmationCard';

export default function BookingConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingId = params.id as string;
  const [booking, setBooking] = useState<ConfirmationPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/v1/bookings/${bookingId}`);
        if (!response.ok) {
          throw new Error('Failed to load booking details');
        }

        const result = await response.json();
        const bookingData = result.data;

        setBooking({
          bookingId: bookingData.booking_id || bookingData.id,
          confirmationCode: bookingData.confirmation_code,
          customerName: bookingData.customer_name,
          email: bookingData.email,
          phone: bookingData.phone,
          address: bookingData.address,
          serviceType: bookingData.service_type,
          bookingTime: new Date(bookingData.booking_time),
          notes: bookingData.notes,
          status: bookingData.status,
          createdAt: new Date(bookingData.created_at)
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load booking';
        setError(message);
        console.error('Error fetching booking:', err);
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const handleReturnToChat = () => {
    // Return to chat or home page
    router.push('/');
  };

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-spin inline-block">
              <svg className="w-12 h-12 text-sky-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your booking...</p>
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error || !booking) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Could Not Load Booking
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error || 'The booking could not be found'}
              </p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Success state
  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4">
        <ConfirmationCard
          booking={booking}
          onReturnToChat={handleReturnToChat}
        />
      </div>
    </main>
  );
}
