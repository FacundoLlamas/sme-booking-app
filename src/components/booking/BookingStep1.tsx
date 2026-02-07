/**
 * Booking Step 1: Customer Details
 * Collects customer name, email, phone, and address
 */

'use client';

import { UseFormReturn } from 'react-hook-form';
import { BookingFormData } from '@/types/booking';

interface BookingStep1Props {
  form: UseFormReturn<BookingFormData>;
  isLoading: boolean;
}

export default function BookingStep1({ form, isLoading }: BookingStep1Props) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      {/* Name Field */}
      <div>
        <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Full Name
          <span className="text-red-500">*</span>
        </label>
        <input
          id="customer_name"
          type="text"
          placeholder="John Doe"
          disabled={isLoading}
          {...register('customer_name')}
          className={`
            w-full px-4 py-2 border rounded-lg font-normal transition-colors
            dark:bg-gray-800 dark:text-white dark:border-gray-700
            focus:outline-none focus:ring-2 focus:ring-sky-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              errors.customer_name
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }
          `}
        />
        {errors.customer_name && (
          <p className="mt-1 text-sm text-red-500">{errors.customer_name.message}</p>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email Address
          <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          placeholder="john@example.com"
          disabled={isLoading}
          {...register('email')}
          className={`
            w-full px-4 py-2 border rounded-lg font-normal transition-colors
            dark:bg-gray-800 dark:text-white dark:border-gray-700
            focus:outline-none focus:ring-2 focus:ring-sky-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              errors.email
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }
          `}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Phone Field */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Phone Number
          <span className="text-red-500">*</span>
        </label>
        <input
          id="phone"
          type="tel"
          placeholder="+1 (555) 123-4567"
          disabled={isLoading}
          {...register('phone')}
          className={`
            w-full px-4 py-2 border rounded-lg font-normal transition-colors
            dark:bg-gray-800 dark:text-white dark:border-gray-700
            focus:outline-none focus:ring-2 focus:ring-sky-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              errors.phone
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }
          `}
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Format: +1 5551234567 or (555) 123-4567
        </p>
      </div>

      {/* Address Field */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Service Address
          <span className="text-red-500">*</span>
        </label>
        <textarea
          id="address"
          placeholder="123 Main St, City, State 12345"
          disabled={isLoading}
          rows={3}
          {...register('address')}
          className={`
            w-full px-4 py-2 border rounded-lg font-normal transition-colors resize-none
            dark:bg-gray-800 dark:text-white dark:border-gray-700
            focus:outline-none focus:ring-2 focus:ring-sky-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              errors.address
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }
          `}
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Where should the service be performed?
        </p>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          ℹ️ We use this information to confirm your booking and send appointment reminders.
        </p>
      </div>
    </div>
  );
}
