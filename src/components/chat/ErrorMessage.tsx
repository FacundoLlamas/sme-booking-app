/**
 * ErrorMessage Component - Reusable error display with retry button
 * Shows error notifications with consistent styling and accessibility
 * Integrates with design system for light/dark theme support
 */

'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';

/**
 * ErrorMessage component props
 */
export interface ErrorMessageProps {
  /**
   * Error message text to display
   */
  message: string;
  /**
   * Optional callback for retry button click
   */
  onRetry?: () => void;
  /**
   * Optional callback for dismiss button click
   */
  onDismiss?: () => void;
  /**
   * CSS class name for additional styling
   */
  className?: string;
  /**
   * Whether to show the retry button
   */
  showRetry?: boolean;
  /**
   * Error severity level for styling
   */
  severity?: 'error' | 'warning' | 'info';
}

/**
 * Get severity-specific styling
 */
function getSeverityStyles(severity: 'error' | 'warning' | 'info' = 'error'): {
  bg: string;
  border: string;
  text: string;
  icon: string;
} {
  switch (severity) {
    case 'warning':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-700 dark:text-yellow-300',
        icon: '⚠️',
      };
    case 'info':
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-700 dark:text-blue-300',
        icon: 'ℹ️',
      };
    case 'error':
    default:
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-700 dark:text-red-300',
        icon: '❌',
      };
  }
}

/**
 * ErrorMessage Component
 * 
 * Displays error notifications with optional retry and dismiss buttons.
 * Supports different severity levels and integrates with the design system.
 * 
 * @param {ErrorMessageProps} props - Component props
 * @returns {JSX.Element} Error message display
 * 
 * @example
 * ```tsx
 * <ErrorMessage 
 *   message="Failed to send message" 
 *   onRetry={handleRetry}
 *   onDismiss={handleDismiss}
 *   severity="error"
 * />
 * ```
 */
export function ErrorMessage({
  message,
  onRetry,
  onDismiss,
  className = '',
  showRetry = true,
  severity = 'error',
}: ErrorMessageProps): JSX.Element {
  const styles = getSeverityStyles(severity);

  /**
   * Handle retry button click
   */
  const handleRetryClick = useCallback(() => {
    onRetry?.();
  }, [onRetry]);

  /**
   * Handle dismiss button click
   */
  const handleDismissClick = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`mx-4 mt-3 p-3 rounded-lg 
        ${styles.bg} border ${styles.border} ${styles.text} text-sm
        ${className}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        {/* Error Icon */}
        <span
          className="flex-shrink-0 text-lg leading-none"
          aria-hidden="true"
        >
          {styles.icon}
        </span>

        {/* Error Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium leading-tight">{message}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 flex gap-2 ml-2">
          {/* Retry Button */}
          {showRetry && onRetry && (
            <motion.button
              onClick={handleRetryClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-2 py-1 rounded text-xs font-medium
                hover:opacity-80 transition-opacity
                focus:outline-none focus:ring-2 focus:ring-offset-1
                ${severity === 'error'
                  ? 'focus:ring-red-500 focus:ring-offset-red-50 dark:focus:ring-offset-red-900'
                  : severity === 'warning'
                  ? 'focus:ring-yellow-500 focus:ring-offset-yellow-50 dark:focus:ring-offset-yellow-900'
                  : 'focus:ring-blue-500 focus:ring-offset-blue-50 dark:focus:ring-offset-blue-900'
                }`}
              title="Retry the action"
              aria-label="Retry"
            >
              🔄 Retry
            </motion.button>
          )}

          {/* Dismiss Button */}
          {onDismiss && (
            <motion.button
              onClick={handleDismissClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-2 py-1 rounded text-xs font-medium
                hover:opacity-80 transition-opacity
                focus:outline-none focus:ring-2 focus:ring-offset-1
                ${severity === 'error'
                  ? 'focus:ring-red-500 focus:ring-offset-red-50 dark:focus:ring-offset-red-900'
                  : severity === 'warning'
                  ? 'focus:ring-yellow-500 focus:ring-offset-yellow-50 dark:focus:ring-offset-yellow-900'
                  : 'focus:ring-blue-500 focus:ring-offset-blue-50 dark:focus:ring-offset-blue-900'
                }`}
              title="Dismiss this message"
              aria-label="Dismiss"
            >
              ✕ Dismiss
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default ErrorMessage;
