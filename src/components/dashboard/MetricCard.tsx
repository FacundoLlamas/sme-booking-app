'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  icon?: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'green' | 'red' | 'amber' | 'purple';
  sparkData?: number[];
  className?: string;
}

/**
 * MetricCard Component
 * Displays a single metric with optional trend and sparkline
 * Features:
 * - Icon support
 * - Trend indicator (up/down)
 * - Color variants
 * - Optional sparkline data
 * - Dark mode support
 */
export function MetricCard({
  label,
  value,
  unit,
  trend,
  icon: Icon,
  color = 'blue',
  sparkData,
  className,
}: MetricCardProps) {
  const colorVariants = {
    blue: 'bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-400',
    green:
      'bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-400',
    amber:
      'bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-400',
    purple:
      'bg-purple-50 text-purple-900 dark:bg-purple-900/20 dark:text-purple-400',
  };

  const trendColor = trend?.isPositive
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {label}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            {unit && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {unit}
              </p>
            )}
          </div>

          {trend && (
            <div className={cn('mt-3 flex items-center gap-1', trendColor)}>
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-xs font-semibold">
                {trend.value}% {trend.label}
              </span>
            </div>
          )}
        </div>

        {Icon && (
          <div className={cn('rounded-lg p-3', colorVariants[color])}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* Sparkline visualization */}
      {sparkData && sparkData.length > 0 && (
        <div className="mt-4 flex items-end gap-1">
          {sparkData.map((point, index) => {
            const maxValue = Math.max(...sparkData);
            const height = (point / maxValue) * 100;
            return (
              <div
                key={index}
                className="flex-1 bg-blue-200 dark:bg-blue-900/50"
                style={{ height: `${Math.max(height, 10)}px` }}
                title={`${point}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
