// app/accountant/tabs/ReconciliationTab.tsx
'use client';

import React from 'react';
import { ArrowLeftRight, Check, AlertTriangle } from 'lucide-react';

export const ReconciliationTab: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">M-Pesa & Bank Reconciliation</h2>
        <p className="text-xs text-gray-500">Match incoming bank and C2B transaction codes with pending tenant invoices.</p>
      </div>

      <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 flex items-center justify-between text-xs text-amber-900">
        <div className="flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          <span><strong>2 Unassigned Payments detected:</strong> KES 35,000 received with unmatched till reference.</span>
        </div>
        <button className="bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs">Match Payments</button>
      </div>
    </div>
  );
};