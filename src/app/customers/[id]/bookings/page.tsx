/**
 * Customer Booking History Page
 * Shows all bookings for a customer with filtering options
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BookingHistoryItem } from '@/types/booking';
import BookingsList from '@/components/booking/BookingsList';
import Link from 'next/link';

interface CustomerData {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export default function CustomerBookingsPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [bookings, setBookings] = useState<BookingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch customer details
        const customerRes = await fetch(`/api/v1/customers/${customerId}`);
        if (!customerRes.ok) throw new Error('Failed to load customer');
        const customerData = await customerRes.json();
        setCustomer(customerData.data);

        // Fetch bookings
        const bookingsRes = await fetch(`/api/v1/customers/${customerId}/bookings`);
        if (!bookingsRes.ok) throw new Error('Failed to load bookings');
        const bookingsData = await bookingsRes.json();

        // Transform bookings
        const transformedBookings = bookingsData.data.map((b: any) => ({
          id: b.booking_id || b.id,
          confirmationCode: b.confirmation_code,
          serviceType: b.service_type,
          bookingTime: new Date(b.booking_time),
          status: b.status,
          expert_name: b.expert_name,
          address: b.address
        }));

        setBookings(transformedBookings);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load data';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (customerId) fetchData();
  }, [customerId]);

  if (loading && !customer) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-spin inline-block">
            <svg className="w-12 h-12 text-sky-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your bookings...</p>
        </div>
      </main>
    );
  }

  if (error || !customer) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-medium flex items-center gap-2 mb-4"
            >
              ← Back
            </button>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {customer.name}'s Bookings
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {bookings.length} booking{bookings.length !== 1 ? 's' : ''} total
                </p>
              </div>
              <Link
                href="/bookings/new"
                className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors"
              >
                New Booking
              </Link>
            </div>
          </div>

          {/* Customer Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {customer.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white break-all">
                  {customer.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {customer.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Bookings List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <BookingsList bookings={bookings} isLoading={loading} />
          </div>
        </div>
      </div>
    </main>
  );
}
