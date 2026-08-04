'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Users } from 'lucide-react';
import { TenantPaymentHistory } from '../types';

export const TenantsTab: React.FC = () => {
  const [paymentHistory, setPaymentHistory] = useState<TenantPaymentHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/property-manager/api/tenant-payments', { cache: 'no-store' });
        
        if (!res.ok) {
          throw new Error('Failed to load tenant payment records from database.');
        }

        const data = await res.json();
        setPaymentHistory(data.payments || []);
      } catch (err: unknown) {
        console.error('Failed to load tenant payment history from database:', err);
        const message = err instanceof Error ? err.message : 'Unable to retrieve tenant payment records.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentHistory();
  }, []);

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
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded-full font-medium">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 gap-2 shadow-sm">
        <Loader2 className="animate-spin text-blue-600" size={24} />
        <span>Loading tenant payment records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
        <AlertCircle size={18} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex items-center gap-2">
        <Users size={20} className="text-blue-600" />
        <h2 className="text-xl font-bold text-gray-800">Tenants & Payment History</h2>
      </div>

      {paymentHistory.length === 0 ? (
        <div className="p-12 text-center text-gray-500 text-sm">
          No tenant payment records found in the database.
        </div>
      ) : (
        <div className="overflow-x-auto">
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
              {paymentHistory.map((item) => (
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
      )}
    </div>
  );
};