'use client';

import React from 'react';
import { BookingCalendar } from '@/components/dashboard/BookingCalendar';
import { Card } from '@/components/dashboard/Card';

/**
 * Calendar view page
 * Displays bookings on an interactive calendar with drag-to-reschedule
 */
export default function CalendarPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Calendar
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          View and manage bookings on a calendar. Drag events to reschedule.
        </p>
      </div>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Plumbing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Electrical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-sm text-slate-600 dark:text-slate-400">HVAC</span>
          </div>
        </div>
      </Card>

      {/* Calendar component */}
      <Card className="p-0">
        <BookingCalendar />
      </Card>
    </div>
  );
}
