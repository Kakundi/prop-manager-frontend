'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle2, XCircle, CreditCard, LogOut } from 'lucide-react';
import { PaymentRecord } from '../types';

export const PaymentsTab: React.FC = () => {
  const router = useRouter();
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/tenant/payments');
        if (res.ok) {
          const data = await res.json();
          setPaymentHistory(data.payments || []);
        }
      } catch (err) {
        console.error('Failed to fetch payments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

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

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500 font-medium animate-pulse">
        Loading payment transactions...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER WITH LOGOUT */}
      <div className="flex items-center justify-between bg-white p-4 px-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
          <p className="text-xs text-gray-500">Record of all completed and pending payments</p>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
        >
          <LogOut size={16} />
          {isLoggingOut ? 'Logging out...' : 'Log Out'}
        </button>
      </div>

      {/* PAYMENT TABLE SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {paymentHistory.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2 text-gray-500">
            <CreditCard size={36} className="text-gray-400" />
            <p className="font-semibold text-gray-700">No payment records found</p>
            <p className="text-xs text-gray-400">You haven't made any transactions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                    <td className="p-4 font-bold text-gray-900">KES {rec.amount.toFixed(2)}</td>
                    <td className="p-4">{getStatusBadge(rec.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};