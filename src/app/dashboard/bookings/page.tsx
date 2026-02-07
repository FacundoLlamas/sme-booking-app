'use client';

import React, { useState } from 'react';
import { BookingsTable } from '@/components/dashboard/BookingsTable';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { Card } from '@/components/dashboard/Card';
import { Download, Plus } from 'lucide-react';

/**
 * Bookings management page
 * Displays all bookings with filtering, sorting, and actions
 */
export default function BookingsPage() {
  const [filters, setFilters] = useState<{
    status: string | null;
    serviceType: string | null;
    dateFrom: string | null;
    dateTo: string | null;
    search: string;
  }>({
    status: null,
    serviceType: null,
    dateFrom: null,
    dateTo: null,
    search: '',
  });

  const handleExport = (format: 'csv' | 'pdf') => {
    // TODO: Implement export functionality
    console.log(`Exporting as ${format}`);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Bookings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage and track all customer bookings
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium">
          <Plus className="w-5 h-5" />
          New Booking
        </button>
      </div>

      {/* Filters */}
      <FilterBar onFiltersChange={setFilters} />

      {/* Export buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleExport('csv')}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
        <button
          onClick={() => handleExport('pdf')}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Bookings table */}
      <Card className="p-0">
        <BookingsTable filters={filters} />
      </Card>
    </div>
  );
}
