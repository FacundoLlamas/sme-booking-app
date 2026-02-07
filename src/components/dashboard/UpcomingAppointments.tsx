'use client';

import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';

interface AppointmentData {
  id: number;
  customerName: string;
  service: string;
  dateTime: string;
}

export function UpcomingAppointments() {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/bookings?upcoming=true&limit=5')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setAppointments(json.data.bookings);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Upcoming Appointments
      </h2>

      <div className="space-y-3">
        {loading ? (
          <div className="py-8 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Loading...
            </p>
          </div>
        ) : appointments.length > 0 ? (
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
                    {format(new Date(appointment.dateTime), 'MMM d, HH:mm')} ·{' '}
                    {appointment.service}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              No upcoming appointments
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
