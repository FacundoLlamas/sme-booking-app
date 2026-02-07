'use client';

import React, { useState } from 'react';
import { Card } from '@/components/dashboard/Card';
import { SettingsForm } from '@/components/dashboard/SettingsForm';
import { Check } from 'lucide-react';

/**
 * Settings & configuration page
 * Allows business owners to configure their business settings
 */
export default function SettingsPage() {
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (data: any) => {
    // Show success message
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    console.log('Saving settings:', data);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Manage your business configuration and preferences
        </p>
      </div>

      {/* Success notification */}
      {saveSuccess && (
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-green-700 dark:text-green-300">
            Settings saved successfully!
          </p>
        </div>
      )}

      {/* Settings form */}
      <Card>
        <SettingsForm onSave={handleSave} />
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200 dark:border-red-800/50">
        <div className="p-6 border-t border-red-200 dark:border-red-800/50">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
            Danger Zone
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Irreversible and destructive actions
          </p>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
            Delete Business Account
          </button>
        </div>
      </Card>
    </div>
  );
}
