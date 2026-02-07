/**
 * Multi-Step Booking Form Container
 * Manages form state, validation, and navigation between steps
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookingFormSchema, BookingFormData } from '@/types/booking';
import StepIndicator from './StepIndicator';
import BookingStep1 from './BookingStep1';
import BookingStep2 from './BookingStep2';
import BookingStep3 from './BookingStep3';
import BookingStep4 from './BookingStep4';

const STORAGE_KEY = 'booking_form_draft';
const AUTO_SAVE_INTERVAL = 500; // ms

interface BookingFormProps {
  onSuccess?: (bookingId: number, confirmationCode: string) => void;
}

export default function BookingForm({ onSuccess }: BookingFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize form with React Hook Form
  const form = useForm<BookingFormData>({
    resolver: zodResolver(BookingFormSchema),
    mode: 'onChange',
    defaultValues: {
      customer_name: '',
      email: '',
      phone: '',
      address: '',
      service_type: undefined,
      booking_time: '',
      notes: ''
    }
  });

  const { watch, getValues, setValue, formState: { errors, isValid } } = form;

  // Auto-save to localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      const formData = getValues();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [getValues]);

  // Load saved draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const data = JSON.parse(savedDraft);
        Object.entries(data).forEach(([key, value]) => {
          setValue(key as keyof BookingFormData, value as any);
        });
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, [setValue]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep(step => step + 1);
      setSubmitError(null);
    }
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(step => step - 1);
      setSubmitError(null);
    }
  }, [currentStep]);

  // Form submission
  const handleSubmit = useCallback(async (data: BookingFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: data.customer_name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          service_type: data.service_type,
          booking_time: data.booking_time,
          notes: data.notes
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create booking');
      }

      const result = await response.json();
      const { data: bookingData } = result;

      // Clear saved draft on success
      localStorage.removeItem(STORAGE_KEY);

      // Reset form
      form.reset();
      setCurrentStep(1);

      setSuccessMessage(`Booking confirmed! Code: ${bookingData.confirmation_code}`);
      
      // Trigger callback
      if (onSuccess) {
        onSuccess(bookingData.booking_id, bookingData.confirmation_code);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      setSubmitError(message);
      console.error('Booking submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, onSuccess]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
          <p className="text-green-700 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-700 dark:text-red-400">{submitError}</p>
        </div>
      )}

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} totalSteps={4} />

      {/* Form Container */}
      <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-8">
        {/* Step 1: Customer Details */}
        {currentStep === 1 && (
          <BookingStep1
            form={form}
            isLoading={isSubmitting}
          />
        )}

        {/* Step 2: Service Selection */}
        {currentStep === 2 && (
          <BookingStep2
            form={form}
            isLoading={isSubmitting}
          />
        )}

        {/* Step 3: Time Slot Selection */}
        {currentStep === 3 && (
          <BookingStep3
            form={form}
            isLoading={isSubmitting}
          />
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <BookingStep4
            form={form}
            isLoading={isSubmitting}
            isValid={isValid}
          />
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-8 pt-6 border-t dark:border-gray-700">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1 || isSubmitting}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Previous
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="ml-auto px-6 py-2 text-sm font-medium text-white bg-sky-500 rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="ml-auto px-6 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Booking...' : 'Confirm Booking'}
            </button>
          )}
        </div>
      </form>

      {/* Helpful Footer */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg text-sm text-gray-600 dark:bg-blue-900/20 dark:text-gray-400">
        <p>💡 <strong>Tip:</strong> Your form is automatically saved as you fill it out. You can close and return to this page to continue.</p>
      </div>
    </div>
  );
}
