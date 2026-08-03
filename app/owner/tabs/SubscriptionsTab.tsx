'use client';

import React from 'react';
import { CreditCard, CheckCircle2 } from 'lucide-react';

export const SubscriptionsTab: React.FC = () => {
  return (
    <div className="max-w-xl bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
          <CreditCard className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">System Subscription</h2>
          <p className="text-xs text-gray-500">Manage software licensing for your property portfolio.</p>
        </div>
      </div>

      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-900 text-sm">Pro Landlord Plan</p>
            <p className="text-xs text-emerald-700">Active - Auto renews monthly</p>
          </div>
        </div>
        <span className="text-xs font-bold bg-emerald-200 text-emerald-800 px-2.5 py-1 rounded-full">
          ACTIVE
        </span>
      </div>
    </div>
  );
};