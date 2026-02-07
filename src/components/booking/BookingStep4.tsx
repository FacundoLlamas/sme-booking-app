/**
 * Booking Step 4: Review & Submit
 * Displays booking summary for confirmation
 */

'use client';

import { UseFormReturn } from 'react-hook-form';
import { BookingFormData } from '@/types/booking';

interface BookingStep4Props {
  form: UseFormReturn<BookingFormData>;
  isLoading: boolean;
  isValid: boolean;
}

const SERVICE_DISPLAY_NAMES: Record<string, string> = {
  'plumbing': '🚰 Plumbing',
  'electrical': '⚡ Electrical',
  'hvac': '❄️ HVAC',
  'general-maintenance': '🔧 General Maintenance',
  'landscaping': '🌿 Landscaping'
};

export default function BookingStep4({ form, isLoading, isValid }: BookingStep4Props) {
  const { getValues, formState: { errors } } = form;
  const data = getValues();

  // Format date/time
  const bookingDate = data.booking_time ? new Date(data.booking_time) : null;
  const formattedDateTime = bookingDate
    ? new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(bookingDate)
    : 'Not selected';

  const serviceDisplay = SERVICE_DISPLAY_NAMES[data.service_type] || data.service_type;

  return (
    <div className="space-y-6">
      {/* Main Card */}
      <div className="border border-gray-200 rounded-lg p-6 dark:border-gray-700 dark:bg-gray-800/50">
        {/* Booking Summary */}
        <div className="space-y-4">
          {/* Customer Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
              Your Information
            </h3>
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="text-gray-600 dark:text-gray-400 w-24">Name:</span>
                <span className="font-medium text-gray-900 dark:text-white">{data.customer_name}</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-600 dark:text-gray-400 w-24">Email:</span>
                <span className="font-medium text-gray-900 dark:text-white">{data.email}</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-600 dark:text-gray-400 w-24">Phone:</span>
                <span className="font-medium text-gray-900 dark:text-white">{data.phone}</span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-600 dark:text-gray-400 w-24 flex-shrink-0">Address:</span>
                <span className="font-medium text-gray-900 dark:text-white">{data.address}</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t dark:border-gray-700" />

          {/* Service Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
              Service Details
            </h3>
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="text-gray-600 dark:text-gray-400 w-24">Service:</span>
                <span className="font-medium text-gray-900 dark:text-white text-lg">
                  {serviceDisplay}
                </span>
              </div>
              <div className="flex items-start">
                <span className="text-gray-600 dark:text-gray-400 w-24">Date & Time:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formattedDateTime}
                </span>
              </div>
              {data.notes && (
                <div className="flex items-start">
                  <span className="text-gray-600 dark:text-gray-400 w-24 flex-shrink-0">Notes:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{data.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t dark:border-gray-700" />

          {/* Notes Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
              Additional Notes
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {data.notes || 'No additional notes provided.'}
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Checklist */}
      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 dark:bg-sky-900/20 dark:border-sky-800">
        <h3 className="font-semibold text-sky-900 dark:text-sky-200 mb-3">Before confirming:</h3>
        <ul className="space-y-2 text-sm text-sky-800 dark:text-sky-300">
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Review all information above for accuracy</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>You will receive a confirmation email with booking details</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Reminders will be sent 24 hours and 2 hours before the appointment</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>You can reschedule or cancel up to 24 hours before the appointment</span>
          </li>
        </ul>
      </div>

      {/* Terms & Conditions */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <p>
          By confirming this booking, you agree to our terms and conditions. We will use your
          contact information to send appointment confirmations and reminders.
        </p>
      </div>

      {/* Error Messages */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">
            ⚠️ Please fix the errors in previous steps before confirming.
          </p>
        </div>
      )}

      {/* Submission Status */}
      {isLoading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
            🔄 Processing your booking...
          </p>
        </div>
      )}
    </div>
  );
}
