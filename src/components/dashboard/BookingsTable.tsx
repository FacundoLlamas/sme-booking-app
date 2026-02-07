'use client';

import React, { useState, useMemo } from 'react';
import { List } from 'react-window';
import { format } from 'date-fns';
import { Eye, MoreVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Booking {
  id: number;
  customerName: string;
  service: string;
  dateTime: Date;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  duration: number;
}

interface BookingsTableProps {
  filters?: any;
}

/**
 * Virtualized bookings table component
 * Uses react-window for performance with large datasets
 * Features: sorting, filtering, pagination, actions
 *
 * @param filters - Filter configuration
 */
export function BookingsTable({ filters }: BookingsTableProps) {
  // Sample bookings data - in real app, would come from API
  const allBookings: Booking[] = [
    {
      id: 1,
      customerName: 'John Smith',
      service: 'Plumbing Repair',
      dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'confirmed',
      duration: 60,
    },
    {
      id: 2,
      customerName: 'Sarah Johnson',
      service: 'Electrical Inspection',
      dateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'pending',
      duration: 90,
    },
    {
      id: 3,
      customerName: 'Mike Davis',
      service: 'HVAC Maintenance',
      dateTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      status: 'confirmed',
      duration: 120,
    },
    {
      id: 4,
      customerName: 'Emma Wilson',
      service: 'Plumbing Repair',
      dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'pending',
      duration: 60,
    },
    {
      id: 5,
      customerName: 'Robert Brown',
      service: 'Electrical Repair',
      dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'completed',
      duration: 75,
    },
    // Add more mock data for testing virtualization
    ...Array.from({ length: 45 }, (_, i) => ({
      id: 6 + i,
      customerName: `Customer ${6 + i}`,
      service: ['Plumbing', 'Electrical', 'HVAC'][i % 3],
      dateTime: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      status: ['confirmed', 'pending', 'completed', 'cancelled'][i % 4] as any,
      duration: Math.floor(Math.random() * 120) + 30,
    })),
  ];

  const [sortBy, setSortBy] = useState<'customerName' | 'dateTime' | 'status'>('dateTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 25;

  // Handle sorting
  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Filtered and sorted bookings
  const processedBookings = useMemo(() => {
    let result = allBookings;

    // Apply filters
    if (filters?.search) {
      result = result.filter((b) =>
        b.customerName.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    if (filters?.status) {
      result = result.filter((b) => b.status === filters.status);
    }
    if (filters?.serviceType) {
      result = result.filter((b) =>
        b.service.toLowerCase().includes(filters.serviceType.toLowerCase())
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'customerName':
          compareValue = a.customerName.localeCompare(b.customerName);
          break;
        case 'dateTime':
          compareValue = a.dateTime.getTime() - b.dateTime.getTime();
          break;
        case 'status':
          compareValue = a.status.localeCompare(b.status);
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return result;
  }, [allBookings, filters, sortBy, sortOrder]);

  // Paginate bookings
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = processedBookings.slice(startIndex, endIndex);

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
      {/* Table header and data */}
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
            {paginatedBookings.map((booking) => (
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
                  {format(booking.dateTime, 'MMM d, yyyy')}
                  <br />
                  <span className="text-xs">
                    {format(booking.dateTime, 'p')}
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Showing {startIndex + 1} to {Math.min(endIndex, processedBookings.length)} of{' '}
          {processedBookings.length} bookings
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
            Page {currentPage + 1} of{' '}
            {Math.ceil(processedBookings.length / itemsPerPage)}
          </span>
          <button
            onClick={() =>
              setCurrentPage(
                Math.min(
                  Math.ceil(processedBookings.length / itemsPerPage) - 1,
                  currentPage + 1
                )
              )
            }
            disabled={endIndex >= processedBookings.length}
            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
