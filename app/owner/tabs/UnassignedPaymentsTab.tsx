'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { UnassignedPayment } from '../types';
import { Loader2, AlertCircle } from 'lucide-react';

export const UnassignedPaymentsTab: React.FC = () => {
  const supabase = createClient();
  const [payments, setPayments] = useState<UnassignedPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUnassigned() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('unassigned_payments')
          .select('*')
          .eq('owner_id', user.id);

        setPayments(data || []);
      }
      setLoading(false);
    }
    fetchUnassigned();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Unassigned Payments</h2>
          <p className="text-xs text-gray-500">
            Incoming remittances that could not be matched automatically to a unit.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-medium border-b border-gray-200">
              <th className="px-6 py-3">Reference / Receipt</th>
              <th className="px-6 py-3">Source Phone</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Date Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No unassigned payments pending reconciliation.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">{p.payment_reference}</td>
                  <td className="px-6 py-4 text-gray-600">{p.source_phone}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">KES {p.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(p.payment_date).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};