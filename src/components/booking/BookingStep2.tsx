/**
 * Booking Step 2: Service Type Selection
 * Allows customer to select from available services
 */

'use client';

import { UseFormReturn } from 'react-hook-form';
import { BookingFormData } from '@/types/booking';

interface ServiceOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  estimatedDuration: string;
}

interface BookingStep2Props {
  form: UseFormReturn<BookingFormData>;
  isLoading: boolean;
}

const SERVICES: ServiceOption[] = [
  {
    id: 'plumbing',
    name: 'Plumbing',
    description: 'Repairs, leak fixes, and pipe work',
    icon: '🚰',
    estimatedDuration: '~90 min'
  },
  {
    id: 'electrical',
    name: 'Electrical',
    description: 'Wiring, outlet, and circuit repairs',
    icon: '⚡',
    estimatedDuration: '~2 hours'
  },
  {
    id: 'hvac',
    name: 'HVAC',
    description: 'Heating, cooling, and ventilation',
    icon: '❄️',
    estimatedDuration: '~2 hours'
  },
  {
    id: 'general-maintenance',
    name: 'General Maintenance',
    description: 'General repairs and maintenance',
    icon: '🔧',
    estimatedDuration: '~1 hour'
  },
  {
    id: 'landscaping',
    name: 'Landscaping',
    description: 'Lawn care and outdoor work',
    icon: '🌿',
    estimatedDuration: '~3 hours'
  }
];

export default function BookingStep2({ form, isLoading }: BookingStep2Props) {
  const { watch, setValue, formState: { errors } } = form;
  const selectedService = watch('service_type');

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          What service do you need? Select the type that best matches your request.
        </p>
      </div>

      {/* Service Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SERVICES.map(service => (
          <button
            key={service.id}
            type="button"
            onClick={() => setValue('service_type', service.id as BookingFormData['service_type'])}
            disabled={isLoading}
            className={`
              relative p-4 border-2 rounded-lg transition-all text-left
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                selectedService === service.id
                  ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 dark:border-sky-400'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
          >
            {/* Checkmark for Selected */}
            {selectedService === service.id && (
              <div className="absolute top-3 right-3">
                <div className="flex items-center justify-center w-5 h-5 bg-sky-500 rounded-full">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}

            {/* Service Icon and Info */}
            <div>
              <div className="text-3xl mb-2">{service.icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {service.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {service.description}
              </p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-500">
                {service.estimatedDuration}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Error Message */}
      {errors.service_type && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">
            Please select a service type
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          ℹ️ Estimated durations are approximations. Actual time may vary based on complexity.
        </p>
      </div>
    </div>
  );
}
