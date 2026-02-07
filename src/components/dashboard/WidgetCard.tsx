'use client';

import React, { ReactNode, useState } from 'react';
import { GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WidgetCardProps {
  id: string;
  title: string;
  children: ReactNode;
  draggable?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  className?: string;
}

/**
 * WidgetCard Component
 * Draggable dashboard widget wrapper for customizable dashboard
 * Features:
 * - Drag handle for reordering
 * - Optional remove button
 * - Responsive sizing
 * - Dark mode support
 */
export function WidgetCard({
  id,
  title,
  children,
  draggable = false,
  removable = false,
  onRemove,
  onDragStart,
  className,
}: WidgetCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    if (onDragStart) onDragStart(e);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all dark:border-gray-700 dark:bg-gray-800',
        isDragging && 'opacity-50 ring-2 ring-blue-500',
        className,
      )}
      data-widget-id={id}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 items-start gap-3">
          {draggable && (
            <GripVertical
              className="mt-1 h-5 w-5 cursor-grab text-gray-400 active:cursor-grabbing dark:text-gray-500"
              aria-label="Drag handle"
            />
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <div className="mt-4">{children}</div>
          </div>
        </div>

        {removable && (
          <button
            onClick={onRemove}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label="Remove widget"
            title="Remove widget"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
