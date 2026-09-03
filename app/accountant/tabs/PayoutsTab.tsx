// app/accountant/tabs/PayoutsTab.tsx
'use client';

import React from 'react';
import { DollarSign, CheckCircle2 } from 'lucide-react';

export const PayoutsTab: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Property Owner Remittances</h2>
          <p className="text-xs text-gray-500">Calculate net revenue and execute owner bank payouts.</p>
        </div>
      </div>

      <div className="divide-y divide-gray-100 text-xs">
        <div className="py-4 flex justify-between items-center">
          <div>
            <h4 className="font-bold text-gray-900">Kiprono Properties Ltd (Greenwood Heights)</h4>
            <p className="text-gray-500 text-[11px]">Gross: KES 450,000 | Mgmt Fee (10%): KES 45,000</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-bold text-emerald-700 text-sm">Net: KES 405,000</span>
            <button className="bg-emerald-600 text-white font-bold px-3.5 py-2 rounded-xl">Approve Payout</button>
          </div>
        </div>
      </div>
    </div>
  );
};