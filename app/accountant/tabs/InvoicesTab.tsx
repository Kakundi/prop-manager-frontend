// app/accountant/tabs/InvoicesTab.tsx
'use client';

import React from 'react';
import { Plus, Download, FileText } from 'lucide-react';

export const InvoicesTab: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Monthly Invoices & Billing</h2>
          <p className="text-xs text-gray-500">Generate, view, and dispatch rent and utility invoices.</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm">
          <Plus size={16} /> Generate Monthly Invoices
        </button>
      </div>

      <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl space-y-3">
        <FileText size={36} className="mx-auto text-gray-400" />
        <h3 className="text-sm font-bold text-gray-700">Automated Invoice Generation Ready</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Click generate to automatically create water, garbage, and rent bills for all active leases.
        </p>
      </div>
    </div>
  );
};