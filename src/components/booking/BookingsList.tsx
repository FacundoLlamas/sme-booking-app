/**
 * Bookings List Component
 * Displays customer's booking history with filtering and pagination
 */

'use client';

import { useState } from 'react';
import { BookingHistoryItem, BookingFilter } from '@/types/booking';
import Link from 'next/link';

interface BookingsListProps {
  bookings: BookingHistoryItem[];
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function BookingsList({ bookings, isLoading }: BookingsListProps) {
  const [filter, setFilter] = useState<BookingFilter>(BookingFilter.UPCOMING);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const now = new Date();
    switch (filter) {
      case BookingFilter.UPCOMING:
        return booking.bookingTime > now;
      case BookingFilter.PAST:
        return booking.bookingTime <= now;
      case BookingFilter.CANCELLED:
        return booking.status === 'cancelled';
      default:
        return true;
    }
  });

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedBookings = filteredBookings.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  // Get status badge styles
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { label: 'Upcoming', value: BookingFilter.UPCOMING },
          { label: 'Past', value: BookingFilter.PAST },
          { label: 'Cancelled', value: BookingFilter.CANCELLED }
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => {
              setFilter(tab.value);
              setCurrentPage(1);
            }}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              filter === tab.value
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin">
            <svg className="w-8 h-8 text-sky-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading bookings...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No {filter.toLowerCase()} bookings found
          </p>
          {filter === BookingFilter.UPCOMING && (
            <Link
              href="/bookings/new"
              className="inline-block px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors"
            >
              Create New Booking
            </Link>
          )}
        </div>
      )}

      {/* Bookings List */}
      {!isLoading && filteredBookings.length > 0 && (
        <>
          <div className="space-y-3">
            {paginatedBookings.map(booking => (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-sky-300 dark:hover:border-sky-600 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {booking.serviceType}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyles(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      📅 {formatDate(booking.bookingTime)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      📍 {booking.address}
                    </p>
                    {booking.expert_name && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        👤 {booking.expert_name}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                      {booking.confirmationCode}
                    </code>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 border rounded text-sm font-medium transition-colors ${
                    currentPage === i + 1
                      ? 'border-sky-500 bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
