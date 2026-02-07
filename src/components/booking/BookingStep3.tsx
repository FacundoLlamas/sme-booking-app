/**
 * Booking Step 3: Time Slot Selection
 * Fetches available time slots and allows selection
 */

'use client';

import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { BookingFormData, AvailableTimeSlot } from '@/types/booking';

interface BookingStep3Props {
  form: UseFormReturn<BookingFormData>;
  isLoading: boolean;
}

export default function BookingStep3({ form, isLoading }: BookingStep3Props) {
  const { watch, setValue, formState: { errors } } = form;
  const [slots, setSlots] = useState<AvailableTimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const selectedTime = watch('booking_time');
  const serviceType = watch('service_type');

  // Fetch available slots when service type changes
  useEffect(() => {
    if (!serviceType) return;

    setSlotsLoading(true);
    setSlotsError(null);

    fetch('/api/v1/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_type: serviceType,
        date_range: {
          start: new Date().toISOString().split('T')[0],
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.data && Array.isArray(data.data)) {
          // Transform slots
          const transformedSlots = data.data.map((slot: any) => ({
            time: new Date(slot.time),
            expert_id: slot.expert_id,
            expert_name: slot.expert_name,
            available: slot.available !== false
          }));
          setSlots(transformedSlots);
        }
      })
      .catch(error => {
        setSlotsError('Failed to load available times. Please try again.');
        console.error('Error fetching slots:', error);
      })
      .finally(() => setSlotsLoading(false));
  }, [serviceType]);

  // Get unique dates from slots
  const uniqueDates = Array.from(
    new Map(
      slots.map(slot => [
        slot.time.toISOString().split('T')[0],
        slot.time
      ])
    ).values()
  ).sort((a, b) => a.getTime() - b.getTime());

  // Get slots for selected date
  const slotsForDate = selectedDate
    ? slots.filter(slot => slot.time.toISOString().split('T')[0] === selectedDate)
    : [];

  // Format time display
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  // Format date display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {slotsLoading && (
        <div className="p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
          <p className="text-sm text-blue-700 dark:text-blue-400">⏳ Loading available times...</p>
        </div>
      )}

      {slotsError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{slotsError}</p>
        </div>
      )}

      {!slotsLoading && !slotsError && slots.length === 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            No available slots for the selected service. Please try another service type.
          </p>
        </div>
      )}

      {!slotsLoading && slots.length > 0 && (
        <>
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Date
              <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {uniqueDates.map(date => {
                const dateStr = date.toISOString().split('T')[0];
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDate(dateStr)}
                    disabled={isLoading || slotsLoading}
                    className={`
                      p-3 border rounded-lg text-center transition-all text-sm
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${
                        selectedDate === dateStr
                          ? 'border-sky-500 bg-sky-50 text-sky-900 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-400'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <div className="font-medium">{formatDate(dateStr)}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slot Selection */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Time
                <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {slotsForDate.map((slot, idx) => {
                  const slotTime = slot.time.toISOString();
                  const isSelected = selectedTime === slotTime;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setValue('booking_time', slotTime)}
                      disabled={!slot.available || isLoading || slotsLoading}
                      className={`
                        p-3 border rounded-lg text-center transition-all text-sm font-medium
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${
                          isSelected
                            ? 'border-sky-500 bg-sky-50 text-sky-900 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-400'
                            : !slot.available
                            ? 'border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      <div>{formatTime(slot.time)}</div>
                      {!slot.available && (
                        <div className="text-xs text-gray-400">Booked</div>
                      )}
                      {slot.expert_name && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          with {slot.expert_name}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errors.booking_time && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400">
                Please select a date and time
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              ℹ️ Times are shown in your local timezone. You'll receive a confirmation and reminder.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
