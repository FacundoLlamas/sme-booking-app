'use client';

import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterOption {
  id: string;
  label: string;
  options: Array<{
    id: string;
    label: string;
    count?: number;
  }>;
  multi?: boolean;
}

interface FilterPanelProps {
  filters: FilterOption[];
  activeFilters?: Record<string, string[]>;
  onFilterChange?: (filters: Record<string, string[]>) => void;
  className?: string;
}

/**
 * FilterPanel Component
 * Advanced filter controls for data tables and lists
 * Features:
 * - Multiple filter categories
 * - Multi-select support
 * - Clear filters button
 * - Collapsible groups
 * - Dark mode support
 */
export function FilterPanel({
  filters,
  activeFilters = {},
  onFilterChange,
  className,
}: FilterPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(filters.map((f) => f.id)),
  );

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleFilterChange = (filterId: string, optionId: string) => {
    const currentValues = activeFilters[filterId] || [];
    const newValues = currentValues.includes(optionId)
      ? currentValues.filter((v) => v !== optionId)
      : [...currentValues, optionId];

    const newFilters = { ...activeFilters, [filterId]: newValues };
    if (newValues.length === 0) {
      delete newFilters[filterId];
    }

    onFilterChange?.(newFilters);
  };

  const handleClearAll = () => {
    onFilterChange?.({});
  };

  const activeCount = Object.values(activeFilters).flat().length;

  return (
    <div
      className={cn(
        'space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Filters
          {activeCount > 0 && (
            <span className="ml-2 inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {activeCount}
            </span>
          )}
        </h3>
        {activeCount > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-2">
        {filters.map((filter) => (
          <div key={filter.id}>
            <button
              onClick={() => toggleGroup(filter.id)}
              className="flex w-full items-center justify-between rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {filter.label}
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform text-gray-500 dark:text-gray-400',
                  expandedGroups.has(filter.id) && 'rotate-180',
                )}
              />
            </button>

            {expandedGroups.has(filter.id) && (
              <div className="space-y-2 border-l border-gray-200 pl-4 dark:border-gray-700">
                {filter.options.map((option) => (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <input
                      type={filter.multi ? 'checkbox' : 'radio'}
                      name={filter.id}
                      value={option.id}
                      checked={(
                        activeFilters[filter.id] || []
                      ).includes(option.id)}
                      onChange={() =>
                        handleFilterChange(filter.id, option.id)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {option.label}
                    </span>
                    {option.count !== undefined && (
                      <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                        {option.count}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
