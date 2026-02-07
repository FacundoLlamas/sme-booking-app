'use client';

import React from 'react';
import { Card } from './Card';
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
} from 'lucide-react';

/**
 * Dashboard key metrics component
 * Displays summary cards with key business metrics
 */
export function DashboardMetrics() {
  const metrics = [
    {
      label: 'Total Bookings',
      value: '156',
      change: '+12% from last month',
      icon: Calendar,
      color: 'sky',
    },
    {
      label: 'Active Customers',
      value: '43',
      change: '+5 this week',
      icon: Users,
      color: 'green',
    },
    {
      label: 'Revenue (30 days)',
      value: '$4,280',
      change: '+22% from last period',
      icon: DollarSign,
      color: 'amber',
    },
    {
      label: 'Completion Rate',
      value: '94%',
      change: '+3% improvement',
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
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                  {metric.change}
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
