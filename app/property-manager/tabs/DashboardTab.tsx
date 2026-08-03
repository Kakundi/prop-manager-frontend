'use client';

import React from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  PieChart 
} from 'lucide-react';

export const DashboardTab: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* 1. Numerical Representation Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-1">
            <Building2 size={16} /> Occupied Units
          </div>
          <div className="text-2xl font-bold text-gray-900">42</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-1">
            <Building2 size={16} /> Vacant Units
          </div>
          <div className="text-2xl font-bold text-gray-900">8</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium mb-1">
            <CheckCircle2 size={16} /> Paid Invoices
          </div>
          <div className="text-2xl font-bold text-gray-900">35</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-yellow-600 text-sm font-medium mb-1">
            <Clock size={16} /> Unpaid Invoices
          </div>
          <div className="text-2xl font-bold text-gray-900">10</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-red-600 text-sm font-medium mb-1">
            <AlertCircle size={16} /> Overdue
          </div>
          <div className="text-2xl font-bold text-gray-900">3</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-1">
            <DollarSign size={16} /> Partial Payments
          </div>
          <div className="text-2xl font-bold text-gray-900">2</div>
        </div>
      </section>

      {/* 2. Graphical Representation of Financials */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <PieChart size={20} className="text-blue-600" /> Financial Overview & Invoicing Breakdown
          </h2>
        </div>

        <div className="space-y-4">
          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
            <div style={{ width: '60%' }} className="bg-green-500" title="Invoice Paid" />
            <div style={{ width: '20%' }} className="bg-yellow-400" title="Invoice Unpaid" />
            <div style={{ width: '10%' }} className="bg-red-500" title="Overdue" />
            <div style={{ width: '10%' }} className="bg-blue-500" title="Partial Payments" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <div>
                <div className="text-gray-500">Invoice Paid</div>
                <div className="font-bold text-gray-800">$18,400.00</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
              <div>
                <div className="text-gray-500">Invoice Unpaid</div>
                <div className="font-bold text-gray-800">$4,200.00</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <div>
                <div className="text-gray-500">Overdue</div>
                <div className="font-bold text-gray-800">$1,500.00</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <div>
                <div className="text-gray-500">Partial Payments</div>
                <div className="font-bold text-gray-800">$850.00</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};