'use client';

import React from 'react';
import { TenantPaymentHistory } from '../types';

export const TenantsTab: React.FC = () => {
  const tenantsPaymentHistory: TenantPaymentHistory[] = [
    {
      id: '1',
      tenant_name: 'Alice Smith',
      property_name: 'Sunset Heights',
      unit_number: 'Apt 3B',
      amount: 880.00,
      status: 'paid',
      date: '2026-08-01',
    },
    {
      id: '2',
      tenant_name: 'Robert Johnson',
      property_name: 'Sunset Heights',
      unit_number: 'Apt 1A',
      amount: 400.00,
      status: 'partial',
      date: '2026-08-02',
    },
  ];

  const getStatusBadge = (status: TenantPaymentHistory['status']) => {
    switch (status) {
      case 'paid':
        return <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium">Paid</span>;
      case 'unpaid':
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-1 rounded-full font-medium">Unpaid</span>;
      case 'overdue':
        return <span className="bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-full font-medium">Overdue</span>;
      case 'partial':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium">Partial</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Tenants & Payment History</h2>
      </div>
      
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
            <th className="p-4">Tenant Name</th>
            <th className="p-4">Property</th>
            <th className="p-4">Unit</th>
            <th className="p-4">Amount</th>
            <th className="p-4">Status</th>
            <th className="p-4">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-sm">
          {tenantsPaymentHistory.map((item) => (
            <tr key={item.id}>
              <td className="p-4 font-medium text-gray-900">{item.tenant_name}</td>
              <td className="p-4 text-gray-600">{item.property_name}</td>
              <td className="p-4 text-gray-600">{item.unit_number}</td>
              <td className="p-4 font-medium text-gray-900">${item.amount.toFixed(2)}</td>
              <td className="p-4">{getStatusBadge(item.status)}</td>
              <td className="p-4 text-gray-500">{item.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};