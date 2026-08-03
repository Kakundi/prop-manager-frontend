'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface UnassignedPayment {
  id: string;
  transaction_code: string;
  amount: number;
  created_at: string;
  sender_phone: string | null;
  tenant_name: string;
  property_name: string;
}

export default function OwnerUnassignedPaymentsPage() {
  const [payments, setPayments] = useState<UnassignedPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnassigned();
  }, []);

  async function fetchUnassigned() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('unassigned_payments')
        .select(`
          id,
          transaction_code,
          amount,
          created_at,
          sender_phone,
          tenant:profiles(full_name),
          property:properties(name, owner_id)
        `)
        .eq('property.owner_id', user.id)
        .eq('status', 'UNASSIGNED');

      if (!error && data) {
        const formatted = data.map((item: any) => ({
          id: item.id,
          transaction_code: item.transaction_code,
          amount: item.amount,
          created_at: item.created_at,
          sender_phone: item.sender_phone,
          tenant_name: item.tenant?.full_name || 'Unidentified Tenant',
          property_name: item.property?.name || 'General Property',
        }));
        setPayments(formatted);
      }
    }
    setLoading(false);
  }

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Unassigned Payments</h1>
        <p className="text-xs text-slate-400 mt-1">Review tenant transactions requiring manual unit mapping.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading payments...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Tenant Name</th>
                  <th className="py-3 px-4">Property</th>
                  <th className="py-3 px-4">Tx Code</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No unassigned payments found for your properties.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-semibold text-white">{p.tenant_name}</td>
                      <td className="py-3.5 px-4 text-slate-300">{p.property_name}</td>
                      <td className="py-3.5 px-4 font-mono text-amber-400">{p.transaction_code}</td>
                      <td className="py-3.5 px-4 font-mono">{p.sender_phone || 'N/A'}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        KES {p.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition">
                          Map to Unit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}