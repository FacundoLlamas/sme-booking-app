/**
 * Booking Confirmation Card Component
 * Displays booking details with success state
 */

'use client';

import { ConfirmationPageData } from '@/types/booking';
import { downloadIcsFile, copyIcsToClipboard } from '@/lib/calendar/ics-generator';
import { useState } from 'react';

interface ConfirmationCardProps {
  booking: ConfirmationPageData;
  onPrint?: () => void;
  onReturnToChat?: () => void;
}

const SERVICE_DISPLAY_NAMES: Record<string, string> = {
  'plumbing': '🚰 Plumbing',
  'electrical': '⚡ Electrical',
  'hvac': '❄️ HVAC',
  'general-maintenance': '🔧 General Maintenance',
  'landscaping': '🌿 Landscaping'
};

export default function ConfirmationCard({
  booking,
  onPrint,
  onReturnToChat
}: ConfirmationCardProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Format date/time
  const formattedDateTime = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(booking.bookingTime);

  const serviceDisplay = SERVICE_DISPLAY_NAMES[booking.serviceType] || booking.serviceType;

  // Handle calendar download
  const handleDownloadCalendar = async () => {
    setDownloadLoading(true);
    try {
      downloadIcsFile(booking);
    } catch (error) {
      console.error('Failed to download calendar:', error);
    } finally {
      setDownloadLoading(false);
    }
  };

  // Handle copy to clipboard
  const handleCopyIcs = async () => {
    try {
      const success = await copyIcsToClipboard(booking);
      if (success) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Handle print
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Success Animation Background */}
      <div className="relative mb-8">
        {/* Celebration SVG */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full dark:bg-green-900/30 mb-4 animate-pulse">
            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
            Booking Confirmed! ✨
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your service appointment has been successfully scheduled
          </p>
        </div>
      </div>

      {/* Main Confirmation Card */}
      <div className="bg-gradient-to-br from-white to-sky-50 dark:from-gray-800 dark:to-gray-900 border border-sky-200 dark:border-gray-700 rounded-xl shadow-lg p-8 mb-6">
        {/* Confirmation Code Section */}
        <div className="bg-sky-100 dark:bg-sky-900/30 border-l-4 border-sky-500 rounded-lg p-4 mb-6">
          <p className="text-sm text-sky-700 dark:text-sky-400 font-medium mb-1">Confirmation Code</p>
          <p className="text-3xl font-bold text-sky-900 dark:text-sky-300 font-mono">
            {booking.confirmationCode}
          </p>
          <p className="text-xs text-sky-600 dark:text-sky-500 mt-2">
            Keep this code for your records
          </p>
        </div>

        {/* Booking Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Service Type */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Service Type</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {serviceDisplay}
            </p>
          </div>

          {/* Date & Time */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Scheduled For</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formattedDateTime}
            </p>
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Service Address</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {booking.address}
            </p>
          </div>

          {/* Customer Name */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Name</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {booking.customerName}
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Contact</p>
            <div className="text-sm">
              <p className="text-gray-900 dark:text-white">{booking.phone}</p>
              <p className="text-gray-600 dark:text-gray-400">{booking.email}</p>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {booking.notes && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Additional Notes</p>
            <p className="text-gray-700 dark:text-gray-300">{booking.notes}</p>
          </div>
        )}

        {/* Reminder Schedule */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">📅 Reminder Schedule</p>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
            <li className="flex items-start">
              <span className="mr-2">📧</span>
              <span>Email confirmation sent to <strong>{booking.email}</strong></span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">🔔</span>
              <span>Reminder email 24 hours before appointment</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">⏰</span>
              <span>Reminder notification 2 hours before appointment</span>
            </li>
          </ul>
        </div>

        {/* Important Information */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-2">📌 Important Information</p>
          <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-400">
            <li>• Please be available 5-10 minutes early</li>
            <li>• Our technician will call upon arrival</li>
            <li>• To reschedule, contact us at least 24 hours in advance</li>
            <li>• Cancellations must be made 24 hours before the appointment</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {/* Add to Calendar Button */}
        <button
          onClick={handleDownloadCalendar}
          disabled={downloadLoading}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloadLoading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Adding...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add to Calendar
            </>
          )}
        </button>

        {/* Copy Calendar Button */}
        <button
          onClick={handleCopyIcs}
          className={`flex items-center justify-center gap-2 px-6 py-3 font-medium rounded-lg transition-colors ${
            copySuccess
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {copySuccess ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Calendar Data
            </>
          )}
        </button>
      </div>

      {/* Secondary Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Print Button */}
        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4H9a2 2 0 00-2 2v2a2 2 0 002 2h4a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
          </svg>
          Print Confirmation
        </button>

        {/* Return to Chat Button */}
        {onReturnToChat && (
          <button
            onClick={onReturnToChat}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Return to Chat
          </button>
        )}
      </div>
    </div>
  );
}
