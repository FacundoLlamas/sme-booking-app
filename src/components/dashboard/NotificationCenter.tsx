'use client';

import React from 'react';
import { format } from 'date-fns';
import { X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'booking' | 'cancellation' | 'no-show' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationCenterProps {
  isOpen: boolean;
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClearAll?: () => void;
}

/**
 * Notification center component
 * Displays list of notifications with actions
 *
 * @param isOpen - Whether notification center is open
 * @param notifications - Array of notifications
 * @param onClose - Callback to close notification center
 * @param onMarkAsRead - Callback when notification is marked as read
 * @param onDelete - Callback when notification is deleted
 * @param onClearAll - Callback to clear all notifications
 */
export function NotificationCenter({
  isOpen,
  notifications,
  onClose,
  onMarkAsRead,
  onDelete,
  onClearAll,
}: NotificationCenterProps) {
  if (!isOpen) return null;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'booking':
        return '✓';
      case 'cancellation':
        return '✕';
      case 'no-show':
        return '!';
      case 'system':
        return 'ℹ';
      default:
        return '•';
    }
  };

  const getColor = (type: Notification['type']) => {
    switch (type) {
      case 'booking':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'cancellation':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'no-show':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
      case 'system':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-96 max-h-96 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col z-50">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Notifications
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1">
        {notifications.length > 0 ? (
          <div className="space-y-0">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'p-4 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors',
                  !notification.read && 'bg-blue-50 dark:bg-blue-900/10'
                )}
              >
                <div className="flex gap-3">
                  <div className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold flex-shrink-0',
                    getColor(notification.type)
                  )}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                      {notification.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      {format(notification.timestamp, 'p')}
                    </p>
                  </div>
                  <button
                    onClick={() => onDelete?.(notification.id)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded flex-shrink-0"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <p className="text-sm">No notifications</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClearAll}
            className="w-full text-sm text-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium py-2"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
