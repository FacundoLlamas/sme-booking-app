'use client';

import React, { useState } from 'react';
import { Card } from '@/components/dashboard/Card';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { Download } from 'lucide-react';

/**
 * Analytics & reports page
 * Displays charts, metrics, and reporting capabilities
 */
export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  const handleExport = (format: 'csv' | 'pdf') => {
    // TODO: Implement export functionality
    console.log(`Exporting analytics as ${format}`);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Business insights and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Date range picker */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              From
            </label>
            <input
              type="date"
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              defaultValue={dateRange.from.toISOString().split('T')[0]}
              onChange={(e) =>
                setDateRange({ ...dateRange, from: new Date(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              To
            </label>
            <input
              type="date"
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              defaultValue={dateRange.to.toISOString().split('T')[0]}
              onChange={(e) =>
                setDateRange({ ...dateRange, to: new Date(e.target.value) })
              }
            />
          </div>
          <button className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium">
            Apply
          </button>
        </div>
      </Card>

      {/* Charts */}
      <AnalyticsCharts />
    </div>
  );
}
