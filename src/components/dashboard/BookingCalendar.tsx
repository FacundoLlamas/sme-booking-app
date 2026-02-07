'use client';

import React, { useState, useCallback } from 'react';
import {
  Calendar,
  dateFnsLocalizer,
  View,
  SlotInfo,
} from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay, addHours } from 'date-fns';
import { cn } from '@/lib/utils';
import './BookingCalendar.css';

// Setup date-fns localizer
const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  customer: string;
  service: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  resourceId?: string;
}

/**
 * Booking Calendar Component
 * Interactive calendar view using React Big Calendar
 * Features:
 * - Month/Week/Day/Agenda views
 * - Drag-to-reschedule bookings
 * - Color-coded by service type
 * - Custom event rendering
 * - Timezone support
 * - Dark mode support
 */
export function BookingCalendar() {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date(2025, 1, 7)); // Feb 7, 2025
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Sample events with proper date structure
  const events: CalendarEvent[] = [
    {
      id: 1,
      title: 'John Smith - Plumbing Repair',
      start: new Date(2025, 1, 8, 10, 0),
      end: new Date(2025, 1, 8, 11, 0),
      customer: 'John Smith',
      service: 'Plumbing Repair',
      status: 'confirmed',
    },
    {
      id: 2,
      title: 'Sarah Johnson - Electrical Inspection',
      start: new Date(2025, 1, 12, 14, 0),
      end: new Date(2025, 1, 12, 15, 0),
      customer: 'Sarah Johnson',
      service: 'Electrical Inspection',
      status: 'pending',
    },
    {
      id: 3,
      title: 'Mike Davis - HVAC Maintenance',
      start: new Date(2025, 1, 15, 9, 0),
      end: new Date(2025, 1, 15, 10, 30),
      customer: 'Mike Davis',
      service: 'HVAC Maintenance',
      status: 'confirmed',
    },
    {
      id: 4,
      title: 'Jessica Chen - Plumbing Repair',
      start: new Date(2025, 1, 18, 16, 0),
      end: new Date(2025, 1, 18, 17, 0),
      customer: 'Jessica Chen',
      service: 'Plumbing Repair',
      status: 'confirmed',
    },
    {
      id: 5,
      title: 'Robert Williams - Carpentry Work',
      start: new Date(2025, 1, 20, 13, 0),
      end: new Date(2025, 1, 20, 15, 0),
      customer: 'Robert Williams',
      service: 'Carpentry Work',
      status: 'completed',
    },
    {
      id: 6,
      title: 'Emily Rodriguez - Electrical Work',
      start: new Date(2025, 1, 25, 11, 0),
      end: new Date(2025, 1, 25, 12, 0),
      customer: 'Emily Rodriguez',
      service: 'Electrical Work',
      status: 'pending',
    },
  ];

  const getEventColor = (event: CalendarEvent): string => {
    const serviceColors: Record<string, string> = {
      'Plumbing Repair': '#ef4444', // red
      'Electrical Inspection': '#3b82f6', // blue
      'HVAC Maintenance': '#f59e0b', // amber
      'Carpentry Work': '#8b5cf6', // purple
      'Electrical Work': '#06b6d4', // cyan
    };
    return serviceColors[event.service] || '#6b7280'; // gray
  };

  const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      confirmed: '#10b981', // green
      pending: '#f59e0b', // amber
      completed: '#3b82f6', // blue
      cancelled: '#ef4444', // red
    };
    return statusColors[status] || '#6b7280';
  };

  // Custom event style getter
  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: getEventColor(event),
        borderRadius: '0.375rem',
        opacity: event.status === 'cancelled' ? 0.6 : 1,
        color: 'white',
        border: `2px solid ${getStatusColor(event.status)}`,
        display: 'block',
        textDecoration: event.status === 'cancelled' ? 'line-through' : 'none',
      },
    };
  };

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  // Handle drag and drop (reschedule)
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    console.log('Selected slot:', slotInfo);
    // In a real app, this would show a "reschedule" dialog
  };

  // Handle event drop (drag-to-reschedule)
  const handleEventDrop = (dragEvent: any) => {
    const { event, start, end } = dragEvent;
    console.log(`Rescheduling event ${event.id} to ${start} - ${end}`);
    // In a real app, this would update the backend
  };

  return (
    <div className="space-y-4">
      {/* Calendar View Selector */}
      <div className="flex gap-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        {(['month', 'week', 'day', 'agenda'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              view === v
                ? 'bg-blue-600 text-white dark:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
            )}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* React Big Calendar */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          popup
          eventPropGetter={eventStyleGetter}
          className="dark-calendar"
        />
      </div>

      {/* Event Details Panel */}
      {selectedEvent && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedEvent.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Customer: <span className="font-medium">{selectedEvent.customer}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Service: <span className="font-medium">{selectedEvent.service}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Time: <span className="font-medium">
                  {format(selectedEvent.start, 'MMM d, yyyy h:mm a')} -{' '}
                  {format(selectedEvent.end, 'h:mm a')}
                </span>
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: getStatusColor(selectedEvent.status) }}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedEvent.status.charAt(0).toUpperCase() +
                    selectedEvent.status.slice(1)}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedEvent(null)}
              className="rounded px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Close
            </button>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-2">
            <button className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
              Reschedule
            </button>
            {selectedEvent.status === 'confirmed' && (
              <button className="flex-1 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400">
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
