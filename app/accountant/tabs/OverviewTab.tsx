// app/accountant/tabs/OverviewTab.tsx
'use client';

import React from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export const OverviewTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Rent Collected</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign size={18} /></span>
          </div>
          <h3 className="text-2xl font-black text-gray-900">KES 1,240,000</h3>
          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <ArrowUpRight size={14} /> +12.4% vs last month
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Overdue Balances</span>
            <span className="p-2 bg-red-50 text-red-600 rounded-xl"><AlertCircle size={18} /></span>
          </div>
          <h3 className="text-2xl font-black text-gray-900">KES 185,000</h3>
          <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
            <ArrowDownRight size={14} /> 14 uncollected units
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Payouts</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl"><TrendingUp size={18} /></span>
          </div>
          <h3 className="text-2xl font-black text-gray-900">KES 840,000</h3>
          <p className="text-xs text-gray-500">Ready for remittance</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Collection Rate</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl"><CheckCircle size={18} /></span>
          </div>
          <h3 className="text-2xl font-black text-gray-900">87.0%</h3>
          <p className="text-xs text-emerald-600 font-semibold">Target: 95%</p>
        </div>
      </div>
    </div>
  );
};