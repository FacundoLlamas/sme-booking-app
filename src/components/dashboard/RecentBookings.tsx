'use client';

import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';

interface BookingData {
  id: number;
  customerName: string;
  service: string;
  dateTime: string;
  status: string;
}

export function RecentBookings() {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/bookings?limit=5')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setBookings(json.data.bookings);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Recent Bookings
        </h2>
        <a
          href="/dashboard/bookings"
          className="text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
        >
          View All →
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                Customer
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                Service
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                Date & Time
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                Status
              </th>
              <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  No bookings yet
                </td>
              </tr>
            ) : (
              bookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                    {booking.customerName}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {booking.service}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {format(new Date(booking.dateTime), 'MMM d, yyyy')}
                    <br />
                    <span className="text-xs">
                      {format(new Date(booking.dateTime), 'p')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {booking.status.charAt(0).toUpperCase() +
                        booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                      aria-label="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
