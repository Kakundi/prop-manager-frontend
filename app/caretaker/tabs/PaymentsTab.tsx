'use client';

import React from 'react';
import { PieChart, CheckCircle2, Clock, AlertCircle, DollarSign } from 'lucide-react';
import { TenantInvoiceRecord } from '../types';

export const PaymentsTab: React.FC = () => {
  const records: TenantInvoiceRecord[] = [
    { id: '1', tenant_name: 'Alice Smith', unit_number: 'Apt 1A', amount: 800, status: 'paid', due_date: '2026-08-01' },
    { id: '2', tenant_name: 'John Doe', unit_number: 'Apt 1B', amount: 850, status: 'unpaid', due_date: '2026-08-05' },
    { id: '3', tenant_name: 'Mary Connor', unit_number: 'Apt 2A', amount: 900, status: 'overdue', due_date: '2026-07-25' },
    { id: '4', tenant_name: 'David Beck', unit_number: 'Apt 2B', amount: 800, status: 'partial', paid_amount: 400, due_date: '2026-08-01' },
  ];

  const getStatusBadge = (status: TenantInvoiceRecord['status']) => {
    switch (status) {
      case 'paid':
        return <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium">Paid</span>;
      case 'unpaid':
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-1 rounded-full font-medium">Pending</span>;
      case 'overdue':
        return <span className="bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-full font-medium">Overdue</span>;
      case 'partial':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium">Partial</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Graphical Financial Overview */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
          <PieChart size={20} className="text-emerald-600" /> Tenant Payment Breakdown
        </h3>
        
        <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
          <div style={{ width: '50%' }} className="bg-green-500" title="Paid Invoices" />
          <div style={{ width: '25%' }} className="bg-yellow-400" title="Pending Invoices" />
          <div style={{ width: '15%' }} className="bg-red-500" title="Overdue Invoices" />
          <div style={{ width: '10%' }} className="bg-blue-500" title="Partial Payments" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-500" />
            <div>
              <div className="text-gray-500">Paid</div>
              <div className="font-bold text-gray-800">18 Clients</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-yellow-500" />
            <div>
              <div className="text-gray-500">Pending</div>
              <div className="font-bold text-gray-800">4 Clients</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            <div>
              <div className="text-gray-500">Overdue</div>
              <div className="font-bold text-gray-800">1 Client</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-blue-500" />
            <div>
              <div className="text-gray-500">Partial</div>
              <div className="font-bold text-gray-800">1 Client</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Detailed Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">Tenant Payment Statuses</h3>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
              <th className="p-4">Tenant</th>
              <th className="p-4">Unit</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Due Date</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {records.map((rec) => (
              <tr key={rec.id}>
                <td className="p-4 font-medium text-gray-900">{rec.tenant_name}</td>
                <td className="p-4 text-gray-600">{rec.unit_number}</td>
                <td className="p-4 font-medium text-gray-900">
                  ${rec.amount.toFixed(2)}
                  {rec.paid_amount && (
                    <span className="block text-xs text-blue-600">
                      (Paid: ${rec.paid_amount.toFixed(2)})
                    </span>
                  )}
                </td>
                <td className="p-4 text-gray-500">{rec.due_date}</td>
                <td className="p-4">{getStatusBadge(rec.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};