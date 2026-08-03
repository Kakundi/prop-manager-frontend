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

interface DashboardTabProps {
  propertyName: string;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ propertyName }) => {
  return (
    <div className="space-y-8">
      {/* 1. Property Banner */}
      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-emerald-600">Assigned Property</span>
          <h2 className="text-xl font-bold text-emerald-950">{propertyName}</h2>
        </div>
      </div>

      {/* 2. Numerical Representation Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-1">
            <Building2 size={16} /> Occupied Units
          </div>
          <div className="text-2xl font-bold text-gray-900">24</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-1">
            <Building2 size={16} /> Vacant Units
          </div>
          <div className="text-2xl font-bold text-gray-900">4</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium mb-1">
            <CheckCircle2 size={16} /> Paid Invoices
          </div>
          <div className="text-2xl font-bold text-gray-900">18</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-yellow-600 text-sm font-medium mb-1">
            <Clock size={16} /> Unpaid Invoices
          </div>
          <div className="text-2xl font-bold text-gray-900">4</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-red-600 text-sm font-medium mb-1">
            <AlertCircle size={16} /> Overdue
          </div>
          <div className="text-2xl font-bold text-gray-900">1</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-1">
            <DollarSign size={16} /> Partial Payments
          </div>
          <div className="text-2xl font-bold text-gray-900">1</div>
        </div>
      </section>

      {/* 3. Graphical Representation of Financials */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <PieChart size={20} className="text-emerald-600" /> Financials & Invoicing Breakdown
          </h2>
        </div>

        <div className="space-y-4">
          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
            <div style={{ width: '75%' }} className="bg-green-500" title="Paid Invoices" />
            <div style={{ width: '15%' }} className="bg-yellow-400" title="Unpaid Invoices" />
            <div style={{ width: '5%' }} className="bg-red-500" title="Overdue" />
            <div style={{ width: '5%' }} className="bg-blue-500" title="Partial Payments" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <div>
                <div className="text-gray-500">Paid Invoices</div>
                <div className="font-bold text-gray-800">$14,400.00</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
              <div>
                <div className="text-gray-500">Unpaid Invoices</div>
                <div className="font-bold text-gray-800">$3,200.00</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <div>
                <div className="text-gray-500">Overdue</div>
                <div className="font-bold text-gray-800">$800.00</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <div>
                <div className="text-gray-500">Partial Payments</div>
                <div className="font-bold text-gray-800">$400.00</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};