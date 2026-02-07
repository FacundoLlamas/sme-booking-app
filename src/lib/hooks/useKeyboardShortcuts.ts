import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  keys: string[];
  description: string;
  action: () => void;
  category?: 'navigation' | 'bookings' | 'actions' | 'interactions';
}

interface ShortcutConfig {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean; // Cmd on Mac, Win on Windows
}

/**
 * Hook for managing keyboard shortcuts
 * Supports 40+ shortcuts for power users
 * Features:
 * - Global keyboard listener
 * - Multiple key combinations
 * - Category-based organization
 * - Help modal support (Cmd+?)
 * - Prevents conflicts with browser defaults
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const parseKey = (key: string): { code: string; config: ShortcutConfig } => {
    const parts = key.toLowerCase().split('+');
    const config: ShortcutConfig = {
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
    };

    let code = '';
    for (const part of parts) {
      if (part === 'ctrl') config.ctrl = true;
      else if (part === 'shift') config.shift = true;
      else if (part === 'alt') config.alt = true;
      else if (part === 'cmd' || part === 'meta') config.meta = true;
      else code = part;
    }

    return { code, config };
  };

  const matchesShortcut = (
    event: KeyboardEvent,
    keys: string[],
  ): boolean => {
    return keys.some((key) => {
      const { code, config } = parseKey(key);

      // Check modifiers
      const ctrlMatch =
        (config.ctrl || config.meta) ===
        (event.ctrlKey || event.metaKey);
      const shiftMatch = config.shift === event.shiftKey;
      const altMatch = config.alt === event.altKey;

      // Check key
      const keyMatch =
        event.key.toLowerCase() === code ||
        event.code.toLowerCase() === code;

      return ctrlMatch && shiftMatch && altMatch && keyMatch;
    });
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if typing in an input
    const target = event.target as HTMLElement;
    const isInput =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true';

    for (const shortcut of shortcutsRef.current) {
      if (matchesShortcut(event, shortcut.keys)) {
        // For some shortcuts, allow in input (like Escape)
        if (isInput && !['Escape', 'Cmd+?', 'Cmd+/', '?'].some((k) =>
          shortcut.keys.some((sk) => sk.toLowerCase().includes(k.toLowerCase()))
        )) {
          continue;
        }

        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Get all default shortcuts for the dashboard
 */
export function getDefaultShortcuts(
  callbacks: Record<string, () => void>,
): KeyboardShortcut[] {
  return [
    // Navigation (Cmd+Letter)
    {
      keys: ['cmd+b', 'ctrl+b'],
      description: 'Go to Bookings',
      category: 'navigation',
      action: callbacks.goToBookings || (() => {}),
    },
    {
      keys: ['cmd+c', 'ctrl+c'],
      description: 'Go to Calendar',
      category: 'navigation',
      action: callbacks.goToCalendar || (() => {}),
    },
    {
      keys: ['cmd+a', 'ctrl+a'],
      description: 'Go to Analytics',
      category: 'navigation',
      action: callbacks.goToAnalytics || (() => {}),
    },
    {
      keys: ['cmd+s', 'ctrl+s'],
      description: 'Go to Settings',
      category: 'navigation',
      action: callbacks.goToSettings || (() => {}),
    },
    {
      keys: ['cmd+u', 'ctrl+u'],
      description: 'Go to Customers',
      category: 'navigation',
      action: callbacks.goToCustomers || (() => {}),
    },
    {
      keys: ['cmd+h', 'ctrl+h'],
      description: 'Go to Home',
      category: 'navigation',
      action: callbacks.goToHome || (() => {}),
    },

    // Bookings (Cmd+Shift)
    {
      keys: ['cmd+n', 'ctrl+n'],
      description: 'New Booking',
      category: 'bookings',
      action: callbacks.newBooking || (() => {}),
    },
    {
      keys: ['cmd+e', 'ctrl+e'],
      description: 'Export Bookings',
      category: 'bookings',
      action: callbacks.exportBookings || (() => {}),
    },
    {
      keys: ['cmd+r', 'ctrl+r'],
      description: 'Refresh Data',
      category: 'bookings',
      action: callbacks.refreshData || (() => {}),
    },

    // Quick Actions (Cmd+Special)
    {
      keys: ['cmd+k', 'ctrl+k'],
      description: 'Search',
      category: 'actions',
      action: callbacks.openSearch || (() => {}),
    },
    {
      keys: ['cmd+/', 'ctrl+/'],
      description: 'Help & Shortcuts',
      category: 'actions',
      action: callbacks.openHelp || (() => {}),
    },
    {
      keys: ['cmd+?', 'ctrl+?'],
      description: 'Keyboard Shortcuts List',
      category: 'actions',
      action: callbacks.showShortcuts || (() => {}),
    },
    {
      keys: ['?'],
      description: 'Keyboard Shortcuts List (Alt)',
      category: 'actions',
      action: callbacks.showShortcuts || (() => {}),
    },

    // Interactions
    {
      keys: ['Escape'],
      description: 'Close Dialog/Modal',
      category: 'interactions',
      action: callbacks.closeDialog || (() => {}),
    },
    {
      keys: ['Enter'],
      description: 'Confirm Action',
      category: 'interactions',
      action: callbacks.confirm || (() => {}),
    },

    // Numeric Navigation (1-9)
    {
      keys: ['1'],
      description: 'Navigate to first item',
      category: 'interactions',
      action: callbacks.navigateFirst || (() => {}),
    },
    {
      keys: ['2'],
      description: 'Navigate to second item',
      category: 'interactions',
      action: callbacks.navigateSecond || (() => {}),
    },
    {
      keys: ['3'],
      description: 'Navigate to third item',
      category: 'interactions',
      action: callbacks.navigateThird || (() => {}),
    },
    {
      keys: ['4'],
      description: 'Navigate to fourth item',
      category: 'interactions',
      action: callbacks.navigateFourth || (() => {}),
    },
    {
      keys: ['5'],
      description: 'Navigate to fifth item',
      category: 'interactions',
      action: callbacks.navigateFifth || (() => {}),
    },
    {
      keys: ['6'],
      description: 'Navigate to sixth item',
      category: 'interactions',
      action: callbacks.navigateSixth || (() => {}),
    },

    // Additional Actions
    {
      keys: ['cmd+l', 'ctrl+l'],
      description: 'Focus Location Bar',
      category: 'actions',
      action: callbacks.focusSearch || (() => {}),
    },
    {
      keys: ['cmd+shift+n', 'ctrl+shift+n'],
      description: 'New Window/Tab',
      category: 'actions',
      action: callbacks.newTab || (() => {}),
    },
    {
      keys: ['cmd+d', 'ctrl+d'],
      description: 'Download',
      category: 'actions',
      action: callbacks.download || (() => {}),
    },
    {
      keys: ['cmd+f', 'ctrl+f'],
      description: 'Find in Page',
      category: 'actions',
      action: callbacks.findInPage || (() => {}),
    },
    {
      keys: ['cmd+shift+c', 'ctrl+shift+c'],
      description: 'Copy Link',
      category: 'actions',
      action: callbacks.copyLink || (() => {}),
    },
    {
      keys: ['cmd+shift+s', 'ctrl+shift+s'],
      description: 'Save As',
      category: 'actions',
      action: callbacks.saveAs || (() => {}),
    },
    {
      keys: ['cmd+shift+delete', 'ctrl+shift+delete'],
      description: 'Clear Browsing Data',
      category: 'actions',
      action: callbacks.clearData || (() => {}),
    },
    {
      keys: ['cmd+shift+p', 'ctrl+shift+p'],
      description: 'Print',
      category: 'actions',
      action: callbacks.print || (() => {}),
    },
    {
      keys: ['cmd+;', 'ctrl+;'],
      description: 'Open Settings',
      category: 'actions',
      action: callbacks.openSettings || (() => {}),
    },
    {
      keys: ['cmd+,', 'ctrl+,'],
      description: 'Preferences',
      category: 'actions',
      action: callbacks.openPreferences || (() => {}),
    },

    // Tab/Window Navigation
    {
      keys: ['cmd+shift+w', 'ctrl+shift+w'],
      description: 'Close Tab/Window',
      category: 'navigation',
      action: callbacks.closeTab || (() => {}),
    },
    {
      keys: ['cmd+shift+t', 'ctrl+shift+t'],
      description: 'Reopen Last Tab',
      category: 'navigation',
      action: callbacks.reopenTab || (() => {}),
    },
    {
      keys: ['cmd+shift+q', 'ctrl+shift+q'],
      description: 'Quit App',
      category: 'navigation',
      action: callbacks.quitApp || (() => {}),
    },

    // Arrow Keys
    {
      keys: ['ArrowUp'],
      description: 'Navigate Up',
      category: 'interactions',
      action: callbacks.navigateUp || (() => {}),
    },
    {
      keys: ['ArrowDown'],
      description: 'Navigate Down',
      category: 'interactions',
      action: callbacks.navigateDown || (() => {}),
    },
    {
      keys: ['ArrowLeft'],
      description: 'Navigate Left',
      category: 'interactions',
      action: callbacks.navigateLeft || (() => {}),
    },
    {
      keys: ['ArrowRight'],
      description: 'Navigate Right',
      category: 'interactions',
      action: callbacks.navigateRight || (() => {}),
    },

    // Additional Shortcuts
    {
      keys: ['Tab'],
      description: 'Focus Next Element',
      category: 'interactions',
      action: callbacks.focusNext || (() => {}),
    },
    {
      keys: ['shift+Tab'],
      description: 'Focus Previous Element',
      category: 'interactions',
      action: callbacks.focusPrevious || (() => {}),
    },
    {
      keys: ['Home'],
      description: 'Go to Top',
      category: 'interactions',
      action: callbacks.goToTop || (() => {}),
    },
    {
      keys: ['End'],
      description: 'Go to Bottom',
      category: 'interactions',
      action: callbacks.goToBottom || (() => {}),
    },
    {
      keys: ['Page Up'],
      description: 'Scroll Up',
      category: 'interactions',
      action: callbacks.scrollUp || (() => {}),
    },
    {
      keys: ['Page Down'],
      description: 'Scroll Down',
      category: 'interactions',
      action: callbacks.scrollDown || (() => {}),
    },

    // Additional quick actions
    {
      keys: ['cmd+z', 'ctrl+z'],
      description: 'Undo',
      category: 'actions',
      action: callbacks.undo || (() => {}),
    },
    {
      keys: ['cmd+shift+z', 'ctrl+shift+z'],
      description: 'Redo',
      category: 'actions',
      action: callbacks.redo || (() => {}),
    },
    {
      keys: ['cmd+x', 'ctrl+x'],
      description: 'Cut',
      category: 'actions',
      action: callbacks.cut || (() => {}),
    },
    {
      keys: ['cmd+c', 'ctrl+c'],
      description: 'Copy',
      category: 'actions',
      action: callbacks.copy || (() => {}),
    },
    {
      keys: ['cmd+v', 'ctrl+v'],
      description: 'Paste',
      category: 'actions',
      action: callbacks.paste || (() => {}),
    },
    {
      keys: ['cmd+a', 'ctrl+a'],
      description: 'Select All',
      category: 'interactions',
      action: callbacks.selectAll || (() => {}),
    },
    {
      keys: ['Delete', 'Backspace'],
      description: 'Delete Item',
      category: 'actions',
      action: callbacks.delete || (() => {}),
    },
  ];
}

/**
 * Hook for displaying keyboard shortcuts in a modal
 */
export function useShortcutsModal() {
  return {
    getGroupedShortcuts: (shortcuts: KeyboardShortcut[]) => {
      const grouped: Record<string, KeyboardShortcut[]> = {};
      for (const shortcut of shortcuts) {
        const category = shortcut.category || 'actions';
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(shortcut);
      }
      return grouped;
    },
  };
}
