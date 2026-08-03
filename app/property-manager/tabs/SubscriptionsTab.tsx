'use client';

import React from 'react';
import { SubscriptionInvoice } from '../types';

export const SubscriptionsTab: React.FC = () => {
  const superadminInvoices: SubscriptionInvoice[] = [
    {
      id: 'inv_101',
      description: 'August 2026 Manager Platform License',
      due_date: '2026-08-15',
      amount: 150.00,
      status: 'unpaid',
    },
    {
      id: 'inv_100',
      description: 'July 2026 Manager Platform License',
      due_date: '2026-07-15',
      amount: 150.00,
      status: 'paid',
      paid_date: '2026-07-10',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Subscription & Raised Invoices</h2>
        <p className="text-sm text-gray-500">Invoices raised by the Superadmin for platform operations and payment history.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
              <th className="p-4">Description</th>
              <th className="p-4">Due Date</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action / Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {superadminInvoices.map((inv) => (
              <tr key={inv.id}>
                <td className="p-4 font-medium text-gray-900">{inv.description}</td>
                <td className="p-4 text-gray-600">{inv.due_date}</td>
                <td className="p-4 font-medium text-gray-900">${inv.amount.toFixed(2)}</td>
                <td className="p-4">
                  {inv.status === 'paid' ? (
                    <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium">
                      Paid
                    </span>
                  ) : (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-1 rounded-full font-medium">
                      Unpaid
                    </span>
                  )}
                </td>
                <td className="p-4">
                  {inv.status === 'unpaid' ? (
                    <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded transition shadow-sm">
                      Pay Now
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">Paid on {inv.paid_date}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};