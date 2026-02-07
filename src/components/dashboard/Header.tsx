'use client';

import React, { useState } from 'react';
import {
  Bell,
  Menu,
  Moon,
  Search,
  Sun,
  User,
  Command,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

/**
 * Dashboard header component
 * Displays top bar with hamburger menu, search, theme toggle, notifications, and user menu
 * Keyboard shortcuts: Cmd+K for search, ? for help
 *
 * @param onMenuClick - Callback when menu button is clicked
 * @param darkMode - Current dark mode state
 * @param onToggleDarkMode - Callback to toggle dark mode
 */
export function Header({
  onMenuClick,
  darkMode,
  onToggleDarkMode,
}: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Keyboard shortcut handler
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+K or Ctrl+K → Focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchFocused(true);
      }

      // Cmd+/ or Ctrl+/ → Show help
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        showKeyboardShortcuts();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showKeyboardShortcuts = () => {
    alert(`Keyboard Shortcuts:
Cmd+K (or Ctrl+K) - Search
Cmd+/ (or Ctrl+/) - Show this help
? - Show keyboard shortcuts
Esc - Close dialogs`);
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Left side: Menu button and search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Menu button (mobile) */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search bar */}
        <div
          className={cn(
            'flex-1 max-w-sm hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors',
            searchFocused
              ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
          )}
        >
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search bookings, customers..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 outline-none placeholder-slate-400 dark:placeholder-slate-500"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="hidden md:flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-300">
            <Command className="w-3 h-3" />
            <span>K</span>
          </kbd>
        </div>
      </div>

      {/* Right side: Theme toggle, notifications, help, user menu */}
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
        {/* Theme toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Help button */}
        <button
          onClick={showKeyboardShortcuts}
          className="hidden sm:block p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Show help"
          title="Keyboard shortcuts"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Notification dropdown */}
          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Notifications
                </h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                  No new notifications
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="User menu"
          >
            <User className="w-5 h-5" />
          </button>

          {/* User dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                  John Doe
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  john@bookpro.com
                </p>
              </div>
              <div className="p-2 space-y-1">
                <a
                  href="#"
                  className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                >
                  Profile
                </a>
                <a
                  href="#"
                  className="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                >
                  Settings
                </a>
                <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
