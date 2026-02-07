/**
 * Booking Edit Page
 * Allows customers to reschedule or cancel their booking
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AvailableTimeSlot } from '@/types/booking';

const RescheduleSchema = z.object({
  booking_time: z
    .string()
    .refine(val => !isNaN(Date.parse(val)), 'Invalid date/time')
    .refine(val => new Date(val) > new Date(), 'Booking must be in the future')
});

type RescheduleFormData = z.infer<typeof RescheduleSchema>;

interface BookingData {
  booking_id: number;
  confirmation_code: string;
  customer_name: string;
  service_type: string;
  booking_time: string;
  status: string;
  phone: string;
  email: string;
}

export default function BookingEditPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'reschedule' | 'cancel'>('view');
  const [slots, setSlots] = useState<AvailableTimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rescheduleForm = useForm<RescheduleFormData>({
    resolver: zodResolver(RescheduleSchema)
  });

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/v1/bookings/${bookingId}`);
        if (!response.ok) throw new Error('Failed to load booking');
        const result = await response.json();
        setBooking(result.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load booking';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) fetchBooking();
  }, [bookingId]);

  // Fetch available slots when in reschedule mode
  useEffect(() => {
    if (mode !== 'reschedule' || !booking) return;

    setSlotsLoading(true);
    fetch('/api/v1/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_type: booking.service_type,
        date_range: {
          start: new Date().toISOString().split('T')[0],
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.data && Array.isArray(data.data)) {
          const transformedSlots = data.data.map((slot: any) => ({
            time: new Date(slot.time),
            expert_id: slot.expert_id,
            expert_name: slot.expert_name,
            available: slot.available !== false
          }));
          setSlots(transformedSlots);
        }
      })
      .catch(err => {
        console.error('Error fetching slots:', err);
      })
      .finally(() => setSlotsLoading(false));
  }, [mode, booking]);

  // Handle reschedule submission
  const onRescheduleSubmit = async (data: RescheduleFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_time: data.booking_time
        })
      });

      if (!response.ok) throw new Error('Failed to reschedule booking');

      // Redirect to confirmation page
      router.push(`/bookings/${bookingId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reschedule';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel submission
  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/v1/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: cancelReason || 'Customer requested cancellation'
        })
      });

      if (!response.ok) throw new Error('Failed to cancel booking');

      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-spin inline-block">
            <svg className="w-12 h-12 text-sky-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading booking...</p>
        </div>
      </main>
    );
  }

  if (error || !booking) {
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

  const bookingDate = new Date(booking.booking_time);
  const canReschedule = bookingDate > new Date(Date.now() + 24 * 60 * 60 * 1000);
  const canCancel = bookingDate > new Date(Date.now() + 24 * 60 * 60 * 1000);

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-medium flex items-center gap-2 mb-4"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Manage Booking
            </h1>
          </div>

          {/* View Mode */}
          {mode === 'view' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              {/* Booking Details */}
              <div className="space-y-4 mb-8">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Confirmation Code</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {booking.confirmation_code}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Service Type</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {booking.service_type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Scheduled For</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {new Date(booking.booking_time).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <p className="text-lg font-semibold">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {canReschedule ? (
                  <button
                    onClick={() => setMode('reschedule')}
                    className="w-full px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Reschedule Booking
                  </button>
                ) : (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      Rescheduling is not available within 24 hours of the appointment.
                    </p>
                  </div>
                )}

                {canCancel ? (
                  <button
                    onClick={() => setMode('cancel')}
                    className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Cancel Booking
                  </button>
                ) : (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400">
                      Cancellations are not available within 24 hours of the appointment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reschedule Mode */}
          {mode === 'reschedule' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Reschedule Booking</h2>

              {slotsLoading && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-blue-700 dark:text-blue-400">Loading available times...</p>
                </div>
              )}

              {!slotsLoading && slots.length > 0 && (
                <form onSubmit={rescheduleForm.handleSubmit(onRescheduleSubmit)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Select New Time
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {slots.map((slot, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => rescheduleForm.setValue('booking_time', slot.time.toISOString())}
                          disabled={!slot.available}
                          className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                            slot.available
                              ? 'border-gray-200 dark:border-gray-700 hover:border-sky-500'
                              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {slot.time.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setMode('view')}
                      className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg disabled:opacity-50"
                    >
                      {isSubmitting ? 'Updating...' : 'Confirm Reschedule'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Cancel Mode */}
          {mode === 'cancel' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Cancel Booking</h2>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-700 dark:text-red-400">
                  ⚠️ Are you sure you want to cancel this booking? This action cannot be undone.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Cancellation (Optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="Help us improve by telling us why you're canceling..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setMode('view')}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Canceling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
