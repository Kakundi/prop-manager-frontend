'use client';

import React from 'react';
import { UnassignedPayment } from '../types';

export const UnassignedPaymentsTab: React.FC = () => {
  const unassignedPaymentsList: UnassignedPayment[] = [
    {
      id: '1',
      sender_name: 'Mark Davis',
      phone: '+254 712 345678',
      reference: 'TXN9984321',
      amount: 850.00,
      date: '2026-08-01 10:45 AM',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Unassigned Payments</h2>
        <p className="text-sm text-gray-500">Unassigned payments from tenants attached to assigned properties.</p>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
            <th className="p-4">Sender / Phone</th>
            <th className="p-4">Reference No.</th>
            <th className="p-4">Amount</th>
            <th className="p-4">Date Received</th>
            <th className="p-4">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-sm">
          {unassignedPaymentsList.map((pay) => (
            <tr key={pay.id}>
              <td className="p-4 font-medium text-gray-900">
                {pay.sender_name} ({pay.phone})
              </td>
              <td className="p-4 text-gray-600">{pay.reference}</td>
              <td className="p-4 font-medium text-gray-900">${pay.amount.toFixed(2)}</td>
              <td className="p-4 text-gray-500">{pay.date}</td>
              <td className="p-4">
                <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded font-medium transition">
                  Map Payment
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};