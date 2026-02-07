import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, getDefaultShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let listener: ((e: KeyboardEvent) => void) | null = null;

  beforeEach(() => {
    listener = null;
    // Mock addEventListener and removeEventListener
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    addSpy.mockImplementation((event, handler) => {
      if (event === 'keydown') {
        listener = handler as (e: KeyboardEvent) => void;
      }
    });

    removeSpy.mockImplementation(() => {});

    return () => {
      addSpy.mockRestore();
      removeSpy.mockRestore();
    };
  });

  it('should register keyboard shortcuts', () => {
    const action = vi.fn();
    const shortcuts = [
      {
        keys: ['cmd+k', 'ctrl+k'],
        description: 'Search',
        action,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    expect(listener).toBeDefined();
  });

  it('should trigger action on matching shortcut', () => {
    const action = vi.fn();
    const shortcuts = [
      {
        keys: ['cmd+k', 'ctrl+k'],
        description: 'Search',
        action,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Simulate Cmd+K (Mac)
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
    });

    listener?.(event);
    expect(action).toHaveBeenCalled();
  });

  it('should handle Ctrl+K on non-Mac', () => {
    const action = vi.fn();
    const shortcuts = [
      {
        keys: ['cmd+k', 'ctrl+k'],
        description: 'Search',
        action,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
    });

    listener?.(event);
    expect(action).toHaveBeenCalled();
  });

  it('should prevent default when shortcut matches', () => {
    const action = vi.fn();
    const shortcuts = [
      {
        keys: ['cmd+s', 'ctrl+s'],
        description: 'Save',
        action,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
    });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    listener?.(event);
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(action).toHaveBeenCalled();
  });

  it('should handle multiple key combinations', () => {
    const action1 = vi.fn();
    const action2 = vi.fn();

    const shortcuts = [
      {
        keys: ['cmd+k', 'ctrl+k'],
        description: 'Search',
        action: action1,
      },
      {
        keys: ['cmd+/', 'ctrl+/'],
        description: 'Help',
        action: action2,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Test first shortcut
    let event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
    });
    listener?.(event);
    expect(action1).toHaveBeenCalled();

    // Test second shortcut
    action1.mockClear();
    action2.mockClear();

    event = new KeyboardEvent('keydown', {
      key: '/',
      ctrlKey: true,
    });
    listener?.(event);
    expect(action2).toHaveBeenCalled();
  });

  it('should handle Shift modifier', () => {
    const action = vi.fn();
    const shortcuts = [
      {
        keys: ['cmd+shift+s', 'ctrl+shift+s'],
        description: 'Save As',
        action,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      shiftKey: true,
    });

    listener?.(event);
    expect(action).toHaveBeenCalled();
  });

  it('should not trigger when typing in input', () => {
    const action = vi.fn();
    const shortcuts = [
      {
        keys: ['cmd+k', 'ctrl+k'],
        description: 'Search',
        action,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const input = document.createElement('input');
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
    });

    Object.defineProperty(event, 'target', { value: input });

    listener?.(event);
    // Should not call action when typing in input
    expect(action).not.toHaveBeenCalled();
  });

  it('should handle arrow keys', () => {
    const upAction = vi.fn();
    const downAction = vi.fn();

    const shortcuts = [
      {
        keys: ['ArrowUp'],
        description: 'Navigate Up',
        action: upAction,
      },
      {
        keys: ['ArrowDown'],
        description: 'Navigate Down',
        action: downAction,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    let event = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
    });
    listener?.(event);
    expect(upAction).toHaveBeenCalled();

    event = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
    });
    listener?.(event);
    expect(downAction).toHaveBeenCalled();
  });
});

describe('getDefaultShortcuts', () => {
  it('should return 40+ shortcuts', () => {
    const callbacks = {
      goToBookings: vi.fn(),
      goToCalendar: vi.fn(),
      goToAnalytics: vi.fn(),
      goToSettings: vi.fn(),
      goToCustomers: vi.fn(),
      goToHome: vi.fn(),
      newBooking: vi.fn(),
      exportBookings: vi.fn(),
      refreshData: vi.fn(),
      openSearch: vi.fn(),
      openHelp: vi.fn(),
      showShortcuts: vi.fn(),
      closeDialog: vi.fn(),
      confirm: vi.fn(),
    };

    const shortcuts = getDefaultShortcuts(callbacks);
    expect(shortcuts.length).toBeGreaterThanOrEqual(40);
  });

  it('should include navigation shortcuts', () => {
    const callbacks = {};
    const shortcuts = getDefaultShortcuts(callbacks);

    const navShortcuts = shortcuts.filter((s) => s.category === 'navigation');
    expect(navShortcuts.length).toBeGreaterThan(0);

    const descriptions = navShortcuts.map((s) => s.description);
    expect(descriptions).toContain('Go to Bookings');
    expect(descriptions).toContain('Go to Calendar');
  });

  it('should include booking shortcuts', () => {
    const callbacks = {};
    const shortcuts = getDefaultShortcuts(callbacks);

    const bookingShortcuts = shortcuts.filter((s) => s.category === 'bookings');
    expect(bookingShortcuts.length).toBeGreaterThan(0);

    const descriptions = bookingShortcuts.map((s) => s.description);
    expect(descriptions).toContain('New Booking');
    expect(descriptions).toContain('Export Bookings');
  });

  it('should include action shortcuts', () => {
    const callbacks = {};
    const shortcuts = getDefaultShortcuts(callbacks);

    const actionShortcuts = shortcuts.filter((s) => s.category === 'actions');
    expect(actionShortcuts.length).toBeGreaterThan(0);

    const descriptions = actionShortcuts.map((s) => s.description);
    expect(descriptions).toContain('Search');
    expect(descriptions).toContain('Help & Shortcuts');
  });

  it('should include interaction shortcuts', () => {
    const callbacks = {};
    const shortcuts = getDefaultShortcuts(callbacks);

    const interactionShortcuts = shortcuts.filter(
      (s) => s.category === 'interactions',
    );
    expect(interactionShortcuts.length).toBeGreaterThan(0);

    const descriptions = interactionShortcuts.map((s) => s.description);
    expect(descriptions).toContain('Close Dialog/Modal');
    expect(descriptions).toContain('Confirm Action');
  });

  it('should support callback execution', () => {
    const goToBookings = vi.fn();
    const callbacks = { goToBookings };

    const shortcuts = getDefaultShortcuts(callbacks);
    const bookingsShortcut = shortcuts.find(
      (s) => s.description === 'Go to Bookings',
    );

    expect(bookingsShortcut).toBeDefined();
    bookingsShortcut?.action();
    expect(goToBookings).toHaveBeenCalled();
  });
});
