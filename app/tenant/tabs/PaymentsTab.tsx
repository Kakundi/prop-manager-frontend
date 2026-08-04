'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle2, XCircle, CreditCard, LogOut, User, Home, UserCheck } from 'lucide-react';
import { PaymentRecord } from '../types';

interface TenantProfile {
  name: string;
  property_name: string;
  unit_number: string;
  caretaker_name: string;
}

export const PaymentsTab: React.FC = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileRes, paymentsRes] = await Promise.all([
          fetch('/api/tenant/profile'),
          fetch('/api/tenant/payments')
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData.profile || null);
        }

        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          setPaymentHistory(paymentsData.payments || []);
        }
      } catch (err) {
        console.error('Failed to fetch payment tab data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
        Loading payment records...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HERO SECTION WITH REAL DATABASE DATA ONLY */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <User size={20} className="text-gray-600" />
              {profile?.name ? `${profile.name} — Payment Ledger` : 'Payment Ledger'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Historical log of all submitted and verified transactions</p>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <Home className="text-blue-600 shrink-0" size={18} />
            <div>
              <div className="text-xs text-gray-500 font-medium">Property &amp; Unit</div>
              <div className="font-semibold text-gray-800">
                {profile?.property_name && profile?.unit_number
                  ? `${profile.property_name} (Unit ${profile.unit_number})`
                  : profile?.property_name || (profile?.unit_number ? `Unit ${profile.unit_number}` : 'Not assigned')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <UserCheck className="text-emerald-600 shrink-0" size={18} />
            <div>
              <div className="text-xs text-gray-500 font-medium">Assigned Caretaker</div>
              <div className="font-semibold text-gray-800">{profile?.caretaker_name || 'Not assigned'}</div>
            </div>
          </div>
        </div>
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