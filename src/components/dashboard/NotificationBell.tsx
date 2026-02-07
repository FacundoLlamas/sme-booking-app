'use client';

import React from 'react';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  type: 'booking' | 'cancellation' | 'no-show' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationBellProps {
  notifications?: Notification[];
  onOpenNotifications?: () => void;
}

/**
 * Notification bell component with badge
 * Shows unread notification count
 *
 * @param notifications - Array of notifications
 * @param onOpenNotifications - Callback when bell is clicked
 */
export function NotificationBell({
  notifications = [],
  onOpenNotifications,
}: NotificationBellProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <button
      onClick={onOpenNotifications}
      className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
      aria-label="Notifications"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
