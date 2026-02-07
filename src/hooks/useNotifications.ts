import { useEffect, useCallback, useRef, useState } from 'react';

export interface Notification {
  id: string;
  type: 'booking' | 'cancellation' | 'noshow' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, unknown>;
}

interface UseNotificationsOptions {
  onNotification?: (notification: Notification) => void;
  onError?: (error: Error) => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

/**
 * Hook for real-time notifications via SSE/WebSocket
 * Features:
 * - Real-time booking alerts
 * - Cancellation updates
 * - No-show alerts
 * - System notifications
 * - Auto-reconnect with exponential backoff
 * - Error handling
 * - Badge count tracking
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    onNotification,
    onError,
    autoReconnect = true,
    reconnectDelay = 1000,
    maxReconnectAttempts = 5,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      return; // Already connected
    }

    try {
      // Use WebSocket for real-time notifications
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/api/v1/notifications/stream`;

      // Try WebSocket first, fall back to SSE
      try {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsConnected(true);
          reconnectCountRef.current = 0;
          console.log('Notification WebSocket connected');
        };

        ws.onmessage = (event) => {
          try {
            const notification = JSON.parse(event.data) as Notification;
            notification.timestamp = new Date(notification.timestamp);

            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Show toast notification
            if (onNotification) {
              onNotification(notification);
            }

            // Handle specific notification types
            handleNotificationType(notification);
          } catch (error) {
            console.error('Failed to parse notification:', error);
            if (onError) {
              onError(new Error('Failed to parse notification'));
            }
          }
        };

        ws.onerror = (error) => {
          console.error('Notification WebSocket error:', error);
          setIsConnected(false);
          if (onError) {
            onError(new Error('WebSocket connection error'));
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          console.log('Notification WebSocket closed');

          if (autoReconnect && reconnectCountRef.current < maxReconnectAttempts) {
            reconnectCountRef.current += 1;
            const delay = reconnectDelay * Math.pow(2, reconnectCountRef.current - 1);
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          }
        };

        eventSourceRef.current = ws as any;
      } catch (wsError) {
        // Fall back to SSE
        console.log('WebSocket not available, using SSE');
        const eventSource = new EventSource('/api/v1/notifications/stream');

        eventSource.addEventListener('booking', (event) => {
          try {
            const data = JSON.parse(event.data);
            const notification: Notification = {
              id: data.id || `booking-${Date.now()}`,
              type: 'booking',
              title: 'New Booking',
              message: data.message || 'A new booking has been created',
              timestamp: new Date(),
              read: false,
              data,
            };

            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            if (onNotification) {
              onNotification(notification);
            }

            handleNotificationType(notification);
          } catch (error) {
            console.error('Failed to parse booking notification:', error);
          }
        });

        eventSource.addEventListener('cancellation', (event) => {
          try {
            const data = JSON.parse(event.data);
            const notification: Notification = {
              id: data.id || `cancel-${Date.now()}`,
              type: 'cancellation',
              title: 'Booking Cancelled',
              message: data.message || 'A booking has been cancelled',
              timestamp: new Date(),
              read: false,
              data,
            };

            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            if (onNotification) {
              onNotification(notification);
            }

            handleNotificationType(notification);
          } catch (error) {
            console.error('Failed to parse cancellation notification:', error);
          }
        });

        eventSource.addEventListener('noshow', (event) => {
          try {
            const data = JSON.parse(event.data);
            const notification: Notification = {
              id: data.id || `noshow-${Date.now()}`,
              type: 'noshow',
              title: 'No-Show Alert',
              message: data.message || 'Customer did not show up for booking',
              timestamp: new Date(),
              read: false,
              data,
            };

            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            if (onNotification) {
              onNotification(notification);
            }

            handleNotificationType(notification);
          } catch (error) {
            console.error('Failed to parse no-show notification:', error);
          }
        });

        eventSource.addEventListener('system', (event) => {
          try {
            const data = JSON.parse(event.data);
            const notification: Notification = {
              id: data.id || `system-${Date.now()}`,
              type: 'system',
              title: data.title || 'System Alert',
              message: data.message || 'A system alert has been issued',
              timestamp: new Date(),
              read: false,
              data,
            };

            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            if (onNotification) {
              onNotification(notification);
            }

            handleNotificationType(notification);
          } catch (error) {
            console.error('Failed to parse system notification:', error);
          }
        });

        eventSource.onerror = (error) => {
          console.error('SSE connection error:', error);
          setIsConnected(false);
          eventSource.close();

          if (onError) {
            onError(new Error('SSE connection error'));
          }

          if (autoReconnect && reconnectCountRef.current < maxReconnectAttempts) {
            reconnectCountRef.current += 1;
            const delay = reconnectDelay * Math.pow(2, reconnectCountRef.current - 1);
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          }
        };

        eventSourceRef.current = eventSource as any;
        setIsConnected(true);
        reconnectCountRef.current = 0;
      }
    } catch (error) {
      console.error('Failed to connect to notifications:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }

      if (autoReconnect && reconnectCountRef.current < maxReconnectAttempts) {
        reconnectCountRef.current += 1;
        const delay = reconnectDelay * Math.pow(2, reconnectCountRef.current - 1);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    }
  }, [onNotification, onError, autoReconnect, reconnectDelay, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      if (eventSourceRef.current instanceof EventSource) {
        eventSourceRef.current.close();
      } else if (eventSourceRef.current instanceof WebSocket) {
        (eventSourceRef.current as any).close();
      }
      eventSourceRef.current = null;
      setIsConnected(false);
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif,
      ),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => {
      const notif = prev.find((n) => n.id === notificationId);
      if (notif && !notif.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id !== notificationId);
    });
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    deleteNotification,
    connect,
    disconnect,
  };
}

/**
 * Handle specific notification types
 * Can trigger specific UI updates or actions
 */
function handleNotificationType(notification: Notification) {
  switch (notification.type) {
    case 'booking':
      // Show badge, update dashboard
      updateDashboardBadge('new-booking');
      break;
    case 'cancellation':
      // Update booking status in table
      updateDashboardBadge('cancellation');
      break;
    case 'noshow':
      // Flag booking in table
      updateDashboardBadge('no-show');
      break;
    case 'system':
      // Show system-level alert
      updateDashboardBadge('system-alert');
      break;
  }
}

/**
 * Update dashboard UI based on notification type
 */
function updateDashboardBadge(type: string) {
  // Send custom event for dashboard to listen to
  const event = new CustomEvent('notification-event', {
    detail: { type },
  });
  window.dispatchEvent(event);
}

/**
 * Hook for listening to notification events
 */
export function useNotificationListener(
  callback: (type: string) => void,
) {
  useEffect(() => {
    const handler = (event: Event) => {
      if (event instanceof CustomEvent) {
        callback(event.detail.type);
      }
    };

    window.addEventListener('notification-event', handler);
    return () => window.removeEventListener('notification-event', handler);
  }, [callback]);
}
