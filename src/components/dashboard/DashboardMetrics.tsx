'use client';

import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import {
  TrendingUp,
  Users,
  Calendar,
  Clock,
} from 'lucide-react';

interface StatsData {
  totalBookings: number;
  activeCustomers: number;
  completionRate: number;
  pendingBookings: number;
}

export function DashboardMetrics() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/dashboard/stats')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setStats(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const metrics = [
    {
      label: 'Total Bookings',
      value: loading ? '...' : String(stats?.totalBookings ?? 0),
      icon: Calendar,
      color: 'sky',
    },
    {
      label: 'Active Customers',
      value: loading ? '...' : String(stats?.activeCustomers ?? 0),
      icon: Users,
      color: 'green',
    },
    {
      label: 'Pending Bookings',
      value: loading ? '...' : String(stats?.pendingBookings ?? 0),
      icon: Clock,
      color: 'amber',
    },
    {
      label: 'Completion Rate',
      value: loading ? '...' : `${stats?.completionRate ?? 0}%`,
      icon: TrendingUp,
      color: 'emerald',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const colorClass = {
          sky: 'text-sky-600 dark:text-sky-400',
          green: 'text-green-600 dark:text-green-400',
          amber: 'text-amber-600 dark:text-amber-400',
          emerald: 'text-emerald-600 dark:text-emerald-400',
        }[metric.color] || 'text-sky-600';

        const bgColorClass = {
          sky: 'bg-sky-50 dark:bg-sky-900/20',
          green: 'bg-green-50 dark:bg-green-900/20',
          amber: 'bg-amber-50 dark:bg-amber-900/20',
          emerald: 'bg-emerald-50 dark:bg-emerald-900/20',
        }[metric.color] || 'bg-sky-50';

        return (
          <Card key={metric.label} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  {metric.label}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                  {metric.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${bgColorClass}`}>
                <Icon className={`w-5 h-5 ${colorClass}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
