'use client';

import React, { useMemo, useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  id: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string | number;
  sortable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  striped?: boolean;
  className?: string;
}

/**
 * DataTable Component
 * Generic table component with sorting, pagination, and advanced features
 * Features:
 * - Sortable columns
 * - Pagination
 * - Custom rendering
 * - Row click handlers
 * - Striped rows
 * - Responsive design
 * - Dark mode support
 */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  sortable = true,
  paginated = true,
  pageSize = 10,
  onRowClick,
  striped = true,
  className,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    columnId: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const sortedData = useMemo(() => {
    if (!sortConfig || !sortable) return data;

    const sortedArray = [...data];
    const column = columns.find((c) => c.id === sortConfig.columnId);
    if (!column) return sortedArray;

    sortedArray.sort((a, b) => {
      const aValue = column.accessor(a);
      const bValue = column.accessor(b);

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }

      return 0;
    });

    return sortedArray;
  }, [data, sortConfig, columns, sortable]);

  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, paginated]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (columnId: string) => {
    if (!sortable) return;

    setSortConfig((current) => {
      if (current?.columnId === columnId) {
        return current.direction === 'asc'
          ? { columnId, direction: 'desc' }
          : null;
      }
      return { columnId, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  const getSortIcon = (columnId: string) => {
    if (sortConfig?.columnId !== columnId) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    ) : (
      <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    'px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.sortable !== false &&
                      sortable &&
                      'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700',
                  )}
                  style={column.width ? { width: column.width } : undefined}
                  onClick={() => {
                    if ((column.sortable !== false && sortable) || sortable) {
                      handleSort(column.id);
                    }
                  }}
                  role={sortable && column.sortable !== false ? 'button' : undefined}
                  tabIndex={sortable && column.sortable !== false ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (
                      sortable &&
                      column.sortable !== false &&
                      (e.key === 'Enter' || e.key === ' ')
                    ) {
                      handleSort(column.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable !== false && sortable && (
                      getSortIcon(column.id)
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={rowKey(row, index)}
                  className={cn(
                    'border-b border-gray-200 transition-colors dark:border-gray-700',
                    striped && index % 2 === 0 && 'bg-gray-50 dark:bg-gray-800/30',
                    onRowClick &&
                      'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20',
                  )}
                  onClick={() => onRowClick?.(row)}
                  role={onRowClick ? 'button' : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                      onRowClick(row);
                    }
                  }}
                >
                  {columns.map((column) => (
                    <td
                      key={`${rowKey(row, index)}-${column.id}`}
                      className={cn(
                        'px-6 py-4 text-sm text-gray-900 dark:text-white',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                      )}
                    >
                      {column.accessor(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of{' '}
            {sortedData.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded p-2 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-700"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum =
                  currentPage > 3
                    ? currentPage - 2 + i
                    : i + 1;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'h-8 w-8 rounded text-sm font-medium',
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white dark:bg-blue-700'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700',
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded p-2 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-700"
              aria-label="Next page"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
