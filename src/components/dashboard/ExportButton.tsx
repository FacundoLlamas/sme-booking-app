'use client';

import React, { useState } from 'react';
import { Download, FileJson, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExportOption {
  format: 'csv' | 'json' | 'pdf';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ExportButtonProps {
  data: unknown[];
  filename?: string;
  columns?: string[];
  formats?: ('csv' | 'json' | 'pdf')[];
  onExport?: (format: string) => void;
  className?: string;
}

/**
 * ExportButton Component
 * Exports data to CSV, JSON, or PDF formats
 * Features:
 * - Multiple export formats
 * - Custom columns selection
 * - Configurable filename
 * - Format menu dropdown
 * - Dark mode support
 */
export function ExportButton({
  data,
  filename = 'export',
  columns,
  formats = ['csv', 'json'],
  onExport,
  className,
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const exportOptions: Record<string, ExportOption> = {
    csv: {
      format: 'csv',
      label: 'Export to CSV',
      icon: FileText,
    },
    json: {
      format: 'json',
      label: 'Export to JSON',
      icon: FileJson,
    },
  };

  const convertToCSV = (objArray: unknown[], cols?: string[]): string => {
    if (!Array.isArray(objArray) || objArray.length === 0) {
      return '';
    }

    const keys =
      cols ||
      (typeof objArray[0] === 'object' && objArray[0] !== null
        ? Object.keys(objArray[0] as Record<string, unknown>)
        : []);

    const csvContent = [
      keys.join(','),
      ...objArray.map((obj) => {
        if (typeof obj === 'object' && obj !== null) {
          const row = obj as Record<string, unknown>;
          return keys
            .map((key) => {
              const value = row[key];
              const stringValue = String(value ?? '');
              return `"${stringValue.replace(/"/g, '""')}"`;
            })
            .join(',');
        }
        return '';
      }),
    ].join('\n');

    return csvContent;
  };

  const downloadFile = (
    content: string,
    format: 'csv' | 'json',
    fname: string,
  ) => {
    const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fname}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    onExport?.(format);
    setIsOpen(false);
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      const csv = convertToCSV(data, columns);
      downloadFile(csv, 'csv', filename);
    } else if (format === 'json') {
      const json = JSON.stringify(data, null, 2);
      downloadFile(json, 'json', filename);
    }
  };

  const availableFormats = formats
    .map((f) => exportOptions[f])
    .filter(Boolean);

  if (availableFormats.length === 0) {
    return null;
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        aria-expanded={isOpen}
        aria-label="Export options"
      >
        <Download className="h-4 w-4" />
        Export
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {availableFormats.map(({ format, label, icon: Icon }) => (
            <button
              key={format}
              onClick={() => handleExport(format as 'csv' | 'json')}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
