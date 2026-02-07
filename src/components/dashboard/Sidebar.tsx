'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Calendar,
  Clock,
  Home,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Sidebar navigation component
 * Provides navigation menu for all dashboard sections
 * Responsive: hamburger menu on mobile, full sidebar on desktop
 *
 * @param isOpen - Whether sidebar is open (mobile)
 * @param onClose - Callback when sidebar should close
 */
export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: Home,
      label: 'home',
    },
    {
      name: 'Bookings',
      href: '/dashboard/bookings',
      icon: Clock,
      label: 'bookings',
    },
    {
      name: 'Calendar',
      href: '/dashboard/calendar',
      icon: Calendar,
      label: 'calendar',
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: BarChart3,
      label: 'analytics',
    },
    {
      name: 'Customers',
      href: '/dashboard/customers',
      icon: Users,
      label: 'customers',
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      label: 'settings',
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">E</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white">
              Evios HQ
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">{renderNavItems(navItems, isActive)}</nav>
        <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2 h-16 px-4 border-b border-slate-200 dark:border-slate-700">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">E</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white">
            Evios HQ
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {renderNavItems(navItems, isActive)}
        </nav>

        {/* Logout button */}
        <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * Render navigation items
 *
 * @param navItems - Array of navigation items
 * @param isActive - Function to check if item is active
 */
function renderNavItems(
  navItems: Array<{ name: string; href: string; icon: any; label: string }>,
  isActive: (href: string) => boolean
) {
  return navItems.map((item) => {
    const Icon = item.icon;
    const active = isActive(item.href);

    return (
      <Link
        key={item.label}
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors',
          active
            ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        )}
        aria-current={active ? 'page' : undefined}
      >
        <Icon className="w-5 h-5" />
        <span>{item.name}</span>
      </Link>
    );
  });
}
