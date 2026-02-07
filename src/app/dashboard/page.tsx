'use client';

import React from 'react';
import { Card } from '@/components/dashboard/Card';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { RecentBookings } from '@/components/dashboard/RecentBookings';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';
import { LoadingSpinner } from '@/components/dashboard/LoadingSpinner';

/**
 * Dashboard overview page
 * Displays key metrics, recent bookings, and upcoming appointments
 */
export default function DashboardPage() {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      {/* Key metrics */}
      <DashboardMetrics />

      {/* Grid layout for bookings and appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent bookings - spans 2 columns on large screens */}
        <div className="lg:col-span-2">
          <RecentBookings />
        </div>

        {/* Upcoming appointments - spans 1 column */}
        <div>
          <UpcomingAppointments />
        </div>
      </div>

      {/* Quick actions footer */}
      <Card className="bg-gradient-to-r from-sky-50 dark:from-sky-900/20 to-blue-50 dark:to-blue-900/20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Getting started?
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Set up your business profile, services, and team members.
            </p>
          </div>
          <a
            href="/dashboard/settings"
            className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium whitespace-nowrap"
          >
            Go to Settings
          </a>
        </div>
      </Card>
    </div>
  );
}
