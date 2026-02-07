'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  illustration?: React.ReactNode;
  className?: string;
}

/**
 * EmptyState Component
 * Displays when there's no data with illustration and CTA
 * Features:
 * - Icon or custom illustration
 * - Title and description
 * - Optional action button
 * - Multiple variants
 * - Dark mode support
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  illustration,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center dark:border-gray-600 dark:bg-gray-900/20',
        className,
      )}
    >
      {/* Illustration */}
      {illustration ? (
        <div className="mb-6 flex items-center justify-center">{illustration}</div>
      ) : Icon ? (
        <div className="mb-6 flex items-center justify-center rounded-full bg-gray-200 p-4 dark:bg-gray-700">
          <Icon className="h-8 w-8 text-gray-600 dark:text-gray-300" />
        </div>
      ) : null}

      {/* Content */}
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>

      {description && (
        <p className="mb-6 max-w-sm text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'inline-flex items-center justify-center rounded-lg px-6 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
            action.variant === 'primary'
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
