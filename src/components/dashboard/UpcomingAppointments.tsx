'use client';

import React from 'react';
import { Card } from './Card';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';

/**
 * Upcoming appointments component
 * Displays list of next scheduled appointments
 */
export function UpcomingAppointments() {
  const appointments = [
    {
      id: 1,
      customerName: 'John Smith',
      time: new Date(Date.now() + 2 * 60 * 60 * 1000),
      service: 'Plumbing',
    },
    {
      id: 2,
      customerName: 'Sarah Johnson',
      time: new Date(Date.now() + 6 * 60 * 60 * 1000),
      service: 'Electrical',
    },
    {
      id: 3,
      customerName: 'Mike Davis',
      time: new Date(Date.now() + 26 * 60 * 60 * 1000),
      service: 'HVAC',
    },
  ];

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Today's Schedule
      </h2>

      <div className="space-y-3">
        {appointments.length > 0 ? (
          appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded">
                  <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white text-sm">
                    {appointment.customerName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {format(appointment.time, 'HH:mm')} · {appointment.service}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              No appointments today
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
