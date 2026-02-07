'use client';

import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsData {
  businessName: string;
  businessEmail: string;
  timezone: string;
  maxConcurrentBookings: number;
  services: string[];
  bufferTimeBetweenBookings: number;
  workingHoursStart: string;
  workingHoursEnd: string;
}

interface SettingsFormProps {
  onSave: (data: SettingsData) => void;
}

/**
 * Business settings form component
 * Allows updating business configuration with real-time validation
 *
 * @param onSave - Callback when settings are saved
 */
export function SettingsForm({ onSave }: SettingsFormProps) {
  const [formData, setFormData] = useState<SettingsData>({
    businessName: 'Evios HQ Demo',
    businessEmail: 'contact@evioshq.com',
    timezone: 'America/New_York',
    maxConcurrentBookings: 5,
    services: ['plumbing', 'electrical', 'hvac'],
    bufferTimeBetweenBookings: 15,
    workingHoursStart: '08:00',
    workingHoursEnd: '17:00',
  });

  const [errors, setErrors] = useState<Partial<SettingsData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'maxConcurrentBookings' || name === 'bufferTimeBetweenBookings'
        ? parseInt(value, 10)
        : value,
    }));
    // Clear error for this field
    if (errors[name as keyof SettingsData]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof SettingsData];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Partial<SettingsData> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required' as any;
    }
    if (!formData.businessEmail.includes('@')) {
      newErrors.businessEmail = 'Valid email is required' as any;
    }
    if (formData.maxConcurrentBookings < 1) {
      newErrors.maxConcurrentBookings = 'Must be at least 1' as any;
    }
    if (formData.bufferTimeBetweenBookings < 0) {
      newErrors.bufferTimeBetweenBookings = 'Cannot be negative' as any;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Business Information Section */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Business Information
        </h3>
        <div className="space-y-4">
          <FormField
            label="Business Name"
            name="businessName"
            value={formData.businessName}
            onChange={handleInputChange}
            error={errors.businessName}
            required
          />
          <FormField
            label="Business Email"
            name="businessEmail"
            type="email"
            value={formData.businessEmail}
            onChange={handleInputChange}
            error={errors.businessEmail}
            required
          />
          <FormField
            label="Timezone"
            name="timezone"
            as="select"
            value={formData.timezone}
            onChange={handleInputChange}
          >
            <option value="America/New_York">Eastern (America/New_York)</option>
            <option value="America/Chicago">Central (America/Chicago)</option>
            <option value="America/Denver">Mountain (America/Denver)</option>
            <option value="America/Los_Angeles">Pacific (America/Los_Angeles)</option>
            <option value="America/Anchorage">Alaska (America/Anchorage)</option>
          </FormField>
        </div>
      </div>

      {/* Booking Configuration Section */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Booking Configuration
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Max Concurrent Bookings"
            name="maxConcurrentBookings"
            type="number"
            value={formData.maxConcurrentBookings.toString()}
            onChange={handleInputChange}
            error={errors.maxConcurrentBookings}
            min="1"
            required
          />
          <FormField
            label="Buffer Time Between Bookings (minutes)"
            name="bufferTimeBetweenBookings"
            type="number"
            value={formData.bufferTimeBetweenBookings.toString()}
            onChange={handleInputChange}
            error={errors.bufferTimeBetweenBookings}
            min="0"
            required
          />
        </div>
      </div>

      {/* Working Hours Section */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Working Hours
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Start Time"
            name="workingHoursStart"
            type="time"
            value={formData.workingHoursStart}
            onChange={handleInputChange}
            required
          />
          <FormField
            label="End Time"
            name="workingHoursEnd"
            type="time"
            value={formData.workingHoursEnd}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      {/* Services Section */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Services Offered
        </h3>
        <div className="space-y-2">
          {['plumbing', 'electrical', 'hvac', 'general-maintenance', 'landscaping'].map((service) => (
            <label
              key={service}
              className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 p-2 rounded"
            >
              <input
                type="checkbox"
                checked={formData.services.includes(service)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData((prev) => ({
                      ...prev,
                      services: [...prev.services, service],
                    }));
                  } else {
                    setFormData((prev) => ({
                      ...prev,
                      services: prev.services.filter((s) => s !== service),
                    }));
                  }
                }}
                className="w-4 h-4 rounded border-slate-300 cursor-pointer"
              />
              <span className="text-slate-700 dark:text-slate-300 capitalize">
                {service.replace('-', ' ')}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Submit button */}
      <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'flex items-center gap-2 px-6 py-2 bg-sky-500 text-white rounded-lg font-medium transition-colors',
            isSubmitting
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-sky-600'
          )}
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

/**
 * Form field component
 * Reusable input/select field with validation
 */
interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  error?: any;
  required?: boolean;
  as?: 'input' | 'select' | 'textarea';
  children?: React.ReactNode;
  min?: string;
}

function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  as = 'input',
  children,
  min,
}: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {as === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={cn(
            'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white',
            error
              ? 'border-red-500 dark:border-red-500'
              : 'border-slate-300 dark:border-slate-600'
          )}
        >
          {children}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          min={min}
          className={cn(
            'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white',
            error
              ? 'border-red-500 dark:border-red-500'
              : 'border-slate-300 dark:border-slate-600'
          )}
        />
      )}

      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>}
    </div>
  );
}
