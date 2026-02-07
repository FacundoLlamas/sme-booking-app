'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

// Sample data for charts
const bookingsTrendData = [
  { date: 'Jan 1', daily: 12, weekly: 85, monthly: 380 },
  { date: 'Jan 8', daily: 19, weekly: 92, monthly: 400 },
  { date: 'Jan 15', daily: 15, weekly: 88, monthly: 410 },
  { date: 'Jan 22', daily: 25, weekly: 105, monthly: 450 },
  { date: 'Jan 29', daily: 22, weekly: 98, monthly: 470 },
  { date: 'Feb 5', daily: 28, weekly: 115, monthly: 500 },
];

const revenueData = [
  { service: 'Plumbing', revenue: 4800, fill: '#3b82f6' },
  { service: 'Electrical', revenue: 3800, fill: '#10b981' },
  { service: 'HVAC', revenue: 2800, fill: '#f59e0b' },
  { service: 'Carpentry', revenue: 2300, fill: '#ef4444' },
  { service: 'Other', revenue: 1800, fill: '#8b5cf6' },
];

const bookingDistributionData = [
  { name: 'Confirmed', value: 45, fill: '#10b981' },
  { name: 'Pending', value: 30, fill: '#f59e0b' },
  { name: 'Completed', value: 20, fill: '#3b82f6' },
  { name: 'Cancelled', value: 5, fill: '#ef4444' },
];

const noShowData = [
  { date: 'Week 1', noShowRate: 2.5 },
  { date: 'Week 2', noShowRate: 3.2 },
  { date: 'Week 3', noShowRate: 2.8 },
  { date: 'Week 4', noShowRate: 4.1 },
  { date: 'Week 5', noShowRate: 3.6 },
  { date: 'Week 6', noShowRate: 2.9 },
];

/**
 * AnalyticsCharts Component
 * Collection of interactive charts using Recharts
 * Features:
 * - Line chart for booking trends
 * - Bar chart for revenue by service
 * - Pie chart for booking distribution
 * - Area chart for no-show rates
 * - Responsive design
 * - Dark mode support
 * - Interactive tooltips and legends
 */
export function AnalyticsCharts() {
  const [dateRange, setDateRange] = useState<'daily' | 'weekly' | 'monthly'>(
    'monthly',
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-xs font-semibold text-gray-900 dark:text-white"
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex gap-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        {(['daily', 'weekly', 'monthly'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              dateRange === range
                ? 'bg-blue-600 text-white dark:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
            )}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Bookings Trend Line Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
          Bookings Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={bookingsTrendData}>
            <defs>
              <linearGradient
                id="colorDaily"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="stroke-gray-200 dark:stroke-gray-700"
            />
            <XAxis
              dataKey="date"
              stroke="currentColor"
              className="fill-gray-600 dark:fill-gray-400"
            />
            <YAxis
              stroke="currentColor"
              className="fill-gray-600 dark:fill-gray-400"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey={dateRange}
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue by Service Bar Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
            Revenue by Service
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="stroke-gray-200 dark:stroke-gray-700"
              />
              <XAxis
                dataKey="service"
                stroke="currentColor"
                className="fill-gray-600 dark:fill-gray-400"
              />
              <YAxis
                stroke="currentColor"
                className="fill-gray-600 dark:fill-gray-400"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" isAnimationActive={true}>
                {revenueData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Distribution Pie Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
            Booking Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={bookingDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} (${value}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                isAnimationActive={true}
              >
                {bookingDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* No-Show Rate Area Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
          No-Show Rate Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={noShowData}>
            <defs>
              <linearGradient id="colorNoShow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="stroke-gray-200 dark:stroke-gray-700"
            />
            <XAxis
              dataKey="date"
              stroke="currentColor"
              className="fill-gray-600 dark:fill-gray-400"
            />
            <YAxis
              stroke="currentColor"
              className="fill-gray-600 dark:fill-gray-400"
              label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="noShowRate"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorNoShow)"
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
