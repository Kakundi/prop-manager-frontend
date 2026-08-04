'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { TenantPaymentHistory } from '../types';

export const TenantsTab: React.FC = () => {
  const [paymentHistory, setPaymentHistory] = useState<TenantPaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      // Attempt endpoint fetch with fallback between /owner and /property-manager
      let res = await fetch('/owner/api/tenant-payments', { cache: 'no-store' });
      if (!res.ok) {
        res = await fetch('/property-manager/api/tenant-payments', { cache: 'no-store' });
      }

      if (res.ok) {
        const data = await res.json();
        const records = data.payments || data || [];
        setPaymentHistory(Array.isArray(records) ? records : []);
      } else {
        setFetchError('Unable to sync payment records from database.');
      }
    } catch (err) {
      console.error('Failed to load tenant payment history from database:', err);
      setFetchError('Database connection issue. Showing cached state.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden space-y-0">
      {/* HEADER SECTION */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Tenants & Payment History</h2>
          <p className="text-sm text-gray-500">
            Overview of recorded rent collections, pending balances, and tenant ledger activity.
          </p>
        </div>
        <button
          onClick={fetchPaymentHistory}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-lg transition"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Records
        </button>
      </div>

      {/* ERROR / NOTICE ALERT */}
      {fetchError && (
        <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* TABLE / EMPTY STATE */}
      {loading && paymentHistory.length === 0 ? (
        <div className="p-12 flex items-center justify-center text-gray-500 gap-2">
          <Loader2 className="animate-spin text-blue-600" size={20} />
          <span className="text-sm">Loading tenant payment records...</span>
        </div>
      ) : paymentHistory.length === 0 ? (
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
                  <td className="p-4 font-medium text-gray-900">
                    KES {typeof item.amount === 'number' ? item.amount.toLocaleString() : item.amount}
                  </td>
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