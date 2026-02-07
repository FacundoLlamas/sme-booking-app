'use client';

import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { MessageSquare, Star, Eye, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  lastBooking: Date | null;
  isVip: boolean;
  status: 'active' | 'inactive';
  joinedDate: Date;
}

interface CustomersListProps {
  searchQuery: string;
}

/**
 * Customers list component
 * Displays virtualized list of customers with search and actions
 *
 * @param searchQuery - Search query string
 */
export function CustomersList({ searchQuery }: CustomersListProps) {
  // Sample customer data
  const allCustomers: Customer[] = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john@example.com',
      phone: '555-0101',
      totalBookings: 12,
      lastBooking: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      isVip: true,
      status: 'active',
      joinedDate: new Date(2024, 0, 15),
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '555-0102',
      totalBookings: 8,
      lastBooking: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      isVip: false,
      status: 'active',
      joinedDate: new Date(2024, 1, 20),
    },
    {
      id: 3,
      name: 'Mike Davis',
      email: 'mike@example.com',
      phone: '555-0103',
      totalBookings: 15,
      lastBooking: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      isVip: true,
      status: 'active',
      joinedDate: new Date(2023, 11, 10),
    },
    {
      id: 4,
      name: 'Emma Wilson',
      email: 'emma@example.com',
      phone: '555-0104',
      totalBookings: 5,
      lastBooking: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      isVip: false,
      status: 'inactive',
      joinedDate: new Date(2024, 2, 5),
    },
    // Add more mock customers
    ...Array.from({ length: 20 }, (_, i) => ({
      id: 5 + i,
      name: `Customer ${5 + i}`,
      email: `customer${5 + i}@example.com`,
      phone: `555-${String(100 + i).padStart(4, '0')}`,
      totalBookings: Math.floor(Math.random() * 20),
      lastBooking: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
      isVip: Math.random() > 0.8,
      status: (Math.random() > 0.2 ? 'active' : 'inactive') as 'active' | 'inactive',
      joinedDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
    })),
  ];

  const [sortBy, setSortBy] = useState<'name' | 'bookings' | 'lastBooking'>('name');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 25;

  // Filter and sort customers
  const processedCustomers = useMemo(() => {
    let result = allCustomers;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.phone.includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'bookings':
          return b.totalBookings - a.totalBookings;
        case 'lastBooking':
          const aDate = a.lastBooking?.getTime() || 0;
          const bDate = b.lastBooking?.getTime() || 0;
          return bDate - aDate;
        default:
          return 0;
      }
    });

    return result;
  }, [allCustomers, searchQuery, sortBy]);

  // Paginate
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = processedCustomers.slice(startIndex, endIndex);

  return (
    <div className="flex flex-col h-full">
      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="text-left px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 w-1/4">
                <button
                  onClick={() => setSortBy('name')}
                  className="hover:text-sky-600 dark:hover:text-sky-400"
                >
                  Name {sortBy === 'name' && '↓'}
                </button>
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 w-1/4">
                Contact
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 w-1/6">
                <button
                  onClick={() => setSortBy('bookings')}
                  className="hover:text-sky-600 dark:hover:text-sky-400"
                >
                  Bookings {sortBy === 'bookings' && '↓'}
                </button>
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 w-1/6">
                <button
                  onClick={() => setSortBy('lastBooking')}
                  className="hover:text-sky-600 dark:hover:text-sky-400"
                >
                  Last Booking {sortBy === 'lastBooking' && '↓'}
                </button>
              </th>
              <th className="text-left px-6 py-3 font-semibold text-slate-700 dark:text-slate-300 w-1/12">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.map((customer) => (
              <tr
                key={customer.id}
                className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    {customer.isVip && (
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    )}
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {customer.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {customer.status === 'active' ? '✓ Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <div className="text-slate-600 dark:text-slate-400">
                    <p className="text-xs">{customer.email}</p>
                    <p className="text-xs">{customer.phone}</p>
                  </div>
                </td>
                <td className="px-6 py-3 text-slate-900 dark:text-white font-medium">
                  {customer.totalBookings}
                </td>
                <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                  {customer.lastBooking ? (
                    <div className="text-xs">
                      <p>{format(customer.lastBooking, 'MMM d, yyyy')}</p>
                    </div>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">-</span>
                  )}
                </td>
                <td className="px-6 py-3">
                  <div className="flex gap-1">
                    <button
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                      title="Send message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Showing {startIndex + 1} to {Math.min(endIndex, processedCustomers.length)} of{' '}
          {processedCustomers.length} customers
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400">
            Page {currentPage + 1} of{' '}
            {Math.ceil(processedCustomers.length / itemsPerPage)}
          </span>
          <button
            onClick={() =>
              setCurrentPage(
                Math.min(
                  Math.ceil(processedCustomers.length / itemsPerPage) - 1,
                  currentPage + 1
                )
              )
            }
            disabled={endIndex >= processedCustomers.length}
            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
