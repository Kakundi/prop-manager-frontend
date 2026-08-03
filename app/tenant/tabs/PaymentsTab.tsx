'use client';

import React from 'react';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import { PaymentRecord } from '../types';

export const PaymentsTab: React.FC = () => {
  const paymentHistory: PaymentRecord[] = [
    {
      id: '1',
      reference: 'MPESA-Q88219A',
      description: 'July Rent Payment',
      amount: 800,
      date: '2026-07-01',
      method: 'M-Pesa Express',
      status: 'completed',
    },
    {
      id: '2',
      reference: 'MPESA-Q99102B',
      description: 'July Water Utility Bill',
      amount: 180,
      date: '2026-07-05',
      method: 'M-Pesa Express',
      status: 'completed',
    },
    {
      id: '3',
      reference: 'BANK-REF-77112',
      description: 'Garbage Collection - July 2026',
      amount: 50,
      date: '2026-07-30',
      method: 'Bank Transfer',
      status: 'under_review',
    },
  ];

  const getStatusBadge = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium">
            <CheckCircle2 size={12} /> Confirmed
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium">
            <Clock size={12} /> Waiting Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-full font-medium">
            <XCircle size={12} /> Rejected
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800">Payment History</h3>
        <p className="text-sm text-gray-500">Record of all completed and pending payments.</p>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
            <th className="p-4">Reference</th>
            <th className="p-4">Description</th>
            <th className="p-4">Method</th>
            <th className="p-4">Date</th>
            <th className="p-4">Amount</th>
            <th className="p-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-sm">
          {paymentHistory.map((rec) => (
            <tr key={rec.id}>
              <td className="p-4 font-mono text-xs font-semibold text-gray-700">{rec.reference}</td>
              <td className="p-4 font-medium text-gray-900">{rec.description}</td>
              <td className="p-4 text-gray-600">{rec.method}</td>
              <td className="p-4 text-gray-500">{rec.date}</td>
              <td className="p-4 font-bold text-gray-900">${rec.amount.toFixed(2)}</td>
              <td className="p-4">{getStatusBadge(rec.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};