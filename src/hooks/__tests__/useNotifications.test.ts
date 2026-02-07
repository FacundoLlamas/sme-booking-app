import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotifications, Notification } from '../useNotifications';

// Mock EventSource
class MockEventSource {
  url: string;
  readyState = 1; // OPEN
  listeners: Record<string, Function[]> = {};

  constructor(url: string) {
    this.url = url;
    this.listeners = {};
  }

  addEventListener(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  removeEventListener(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }

  close() {
    this.readyState = 2; // CLOSED
  }

  // Helper to trigger events in tests
  _trigger(event: string, data: string) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback: any) => {
        callback(new MessageEvent(event, { data }));
      });
    }
  }

  _triggerError(error: Error) {
    if (this.listeners['error']) {
      this.listeners['error'].forEach((callback: any) => {
        callback(error);
      });
    }
  }

  _triggerClose() {
    if (this.listeners['close']) {
      this.listeners['close'].forEach((callback: any) => {
        callback();
      });
    }
  }
}

describe('useNotifications', () => {
  let mockEventSource: MockEventSource | null = null;

  beforeEach(() => {
    // Mock EventSource globally
    (global as any).EventSource = vi.fn((url) => {
      mockEventSource = new MockEventSource(url);
      return mockEventSource;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockEventSource = null;
  });

  it('should initialize with empty notifications', () => {
    const { result } = renderHook(() => useNotifications());

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('should handle booking notifications', async () => {
    const onNotification = vi.fn();
    const { result } = renderHook(() =>
      useNotifications({ onNotification }),
    );

    await waitFor(() => {
      expect(mockEventSource).toBeDefined();
    });

    act(() => {
      mockEventSource?._trigger(
        'booking',
        JSON.stringify({
          id: 'booking-1',
          message: 'New booking from John',
        }),
      );
    });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.unreadCount).toBe(1);
    });

    expect(onNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'booking',
        title: 'New Booking',
      }),
    );
  });

  it('should handle cancellation notifications', async () => {
    const onNotification = vi.fn();
    const { result } = renderHook(() =>
      useNotifications({ onNotification }),
    );

    await waitFor(() => {
      expect(mockEventSource).toBeDefined();
    });

    act(() => {
      mockEventSource?._trigger(
        'cancellation',
        JSON.stringify({
          id: 'cancel-1',
          message: 'Booking cancelled by customer',
        }),
      );
    });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
    });

    expect(result.current.notifications[0].type).toBe('cancellation');
  });

  it('should handle no-show notifications', async () => {
    const onNotification = vi.fn();
    const { result } = renderHook(() =>
      useNotifications({ onNotification }),
    );

    await waitFor(() => {
      expect(mockEventSource).toBeDefined();
    });

    act(() => {
      mockEventSource?._trigger(
        'noshow',
        JSON.stringify({
          id: 'noshow-1',
          message: 'Customer did not show up',
        }),
      );
    });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
    });

    expect(result.current.notifications[0].type).toBe('noshow');
  });

  it('should handle system notifications', async () => {
    const onNotification = vi.fn();
    const { result } = renderHook(() =>
      useNotifications({ onNotification }),
    );

    await waitFor(() => {
      expect(mockEventSource).toBeDefined();
    });

    act(() => {
      mockEventSource?._trigger(
        'system',
        JSON.stringify({
          id: 'system-1',
          title: 'Maintenance Alert',
          message: 'System maintenance scheduled',
        }),
      );
    });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
    });

    expect(result.current.notifications[0].type).toBe('system');
  });

  it('should track unread count', async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(mockEventSource).toBeDefined();
    });

    act(() => {
      mockEventSource?._trigger('booking', JSON.stringify({ id: '1' }));
      mockEventSource?._trigger('booking', JSON.stringify({ id: '2' }));
    });

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(2);
    });
  });

  it('should mark notification as read', async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(mockEventSource).toBeDefined();
    });

    act(() => {
      mockEventSource?._trigger('booking', JSON.stringify({ id: 'booking-1' }));
    });

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(1);
    });

    act(() => {
      result.current.markAsRead(result.current.notifications[0].id);
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications[0].read).toBe(true);
  });

  it('should mark all as read', async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(mockEventSource).toBeDefined();
    });

    act(() => {
      mockEventSource?._trigger('booking', JSON.stringify({ id: '1' }));
      mockEventSource?._trigger('booking', JSON.stringify({ id: '2' }));
    });

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(2);
    });

    act(() => {
      result.current.markAllAsRead();
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications.every((n) => n.read)).toBe(true);
  });

  it('should delete notification', async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(mockEventSource).toBeDefined();
    });

    act(() => {
      mockEventSource?._trigger('booking', JSON.stringify({ id: 'booking-1' }));
    });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
    });

    const notificationId = result.current.notifications[0].id;

    act(() => {
      result.current.deleteNotification(notificationId);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should clear all notifications', async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(mockEventSource).toBeDefined();
    });

    act(() => {
      mockEventSource?._trigger('booking', JSON.stringify({ id: '1' }));
      mockEventSource?._trigger('booking', JSON.stringify({ id: '2' }));
    });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(2);
    });

    act(() => {
      result.current.clearNotifications();
    });

    expect(result.current.notifications).toHaveLength(0);
    expect(result.current.unreadCount).toBe(0);
  });

  it('should handle connection errors', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useNotifications({
        onError,
        autoReconnect: false,
      }),
    );

    await waitFor(() => {
      expect(mockEventSource).toBeDefined();
    });

    act(() => {
      mockEventSource?._triggerError(new Error('Connection failed'));
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });

    expect(onError).toHaveBeenCalled();
  });

  it('should auto-reconnect on error', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() =>
      useNotifications({
        autoReconnect: true,
        reconnectDelay: 1000,
        maxReconnectAttempts: 3,
      }),
    );

    await waitFor(() => {
      expect(mockEventSource).toBeDefined();
    });

    act(() => {
      mockEventSource?._triggerError(new Error('Connection failed'));
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });

    // Fast-forward time to trigger reconnect
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    vi.useRealTimers();
  });

  it('should handle manual disconnect', async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(mockEventSource).toBeDefined();
    });

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.isConnected).toBe(false);
  });

  it('should maintain notification order (newest first)', async () => {
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(mockEventSource).toBeDefined();
    });

    act(() => {
      mockEventSource?._trigger('booking', JSON.stringify({ id: '1' }));
      mockEventSource?._trigger('booking', JSON.stringify({ id: '2' }));
      mockEventSource?._trigger('booking', JSON.stringify({ id: '3' }));
    });

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(3);
    });

    // Newest notification should be first
    expect(result.current.notifications[0].data).toHaveProperty('id', '3');
    expect(result.current.notifications[1].data).toHaveProperty('id', '2');
    expect(result.current.notifications[2].data).toHaveProperty('id', '1');
  });
});
