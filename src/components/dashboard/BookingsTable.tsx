'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { MoreVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Booking {
  id: number;
  customerName: string;
  service: string;
  dateTime: string;
  status: string;
  confirmationCode: string | null;
}

interface BookingsTableProps {
  filters?: any;
}

export function BookingsTable({ filters }: BookingsTableProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'customerName' | 'dateTime' | 'status'>('dateTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 25;

  const fetchBookings = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('limit', String(itemsPerPage));
    params.set('page', String(currentPage));
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);

    fetch(`/api/v1/bookings?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setBookings(json.data.bookings);
          setTotal(json.data.total);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentPage, filters?.status, filters?.search]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [filters?.status, filters?.search]);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Client-side sort on current page
  const sortedBookings = useMemo(() => {
    const sorted = [...bookings];
    sorted.sort((a, b) => {
      let compareValue = 0;
      switch (sortBy) {
        case 'customerName':
          compareValue = a.customerName.localeCompare(b.customerName);
          break;
        case 'dateTime':
          compareValue = new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
          break;
        case 'status':
          compareValue = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
    return sorted;
  }, [bookings, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, total);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300';
    }
  };

  const SortHeader = ({
    column,
    label,
  }: {
    column: typeof sortBy;
    label: string;
  }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center gap-1 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
    >
      {label}
      {sortBy === column && (
        <span>
          {sortOrder === 'asc' ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="text-left px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 w-1/4">
                <SortHeader column="customerName" label="Customer" />
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 w-1/4">
                Service
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 w-1/4">
                <SortHeader column="dateTime" label="Date & Time" />
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 w-1/6">
                <SortHeader column="status" label="Status" />
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 w-1/12">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : sortedBookings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                  No bookings found
                </td>
              </tr>
            ) : (
              sortedBookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <td className="px-6 py-3 text-slate-900 dark:text-white font-medium">
                    {booking.customerName}
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                    {booking.service}
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                    {format(new Date(booking.dateTime), 'MMM d, yyyy')}
                    <br />
                    <span className="text-xs">
                      {format(new Date(booking.dateTime), 'p')}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        getStatusColor(booking.status)
                      )}
                    >
                      {booking.status.charAt(0).toUpperCase() +
                        booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <button
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                      aria-label="More options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {total > 0
            ? `Showing ${startIndex + 1} to ${endIndex} of ${total} bookings`
            : 'No bookings'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
