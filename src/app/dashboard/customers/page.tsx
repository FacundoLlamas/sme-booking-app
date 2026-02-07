'use client';

import React, { useState } from 'react';
import { CustomersList } from '@/components/dashboard/CustomersList';
import { Card } from '@/components/dashboard/Card';
import { Plus, Search } from 'lucide-react';

/**
 * Customer management page
 * Displays all customers with search, filter, and actions
 */
export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Customers
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage customer information and booking history
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium">
          <Plus className="w-5 h-5" />
          New Customer
        </button>
      </div>

      {/* Search bar */}
      <Card>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </Card>

      {/* Customers list */}
      <Card className="p-0">
        <CustomersList searchQuery={searchQuery} />
      </Card>
    </div>
  );
}
