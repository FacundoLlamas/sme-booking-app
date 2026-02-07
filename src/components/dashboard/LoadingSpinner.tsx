'use client';

import React from 'react';

/**
 * Loading spinner component
 * Displays animated spinner while data is loading
 */
export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-500 animate-spin" />
      </div>
      <p className="text-slate-600 dark:text-slate-400">Loading...</p>
    </div>
  );
}
