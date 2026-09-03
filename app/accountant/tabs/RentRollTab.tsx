// app/accountant/tabs/RentRollTab.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Sparkles, RefreshCw, Search, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { RentRollEntry } from '../types';

export const RentRollTab: React.FC = () => {
  const [entries, setEntries] = useState<RentRollEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchRentRoll = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/accountant/api/payments', {
        headers: { Authorization: `Bearer ${session?.access_token || ''}` },
      });

      if (res.ok) {
        const data = await res.json();
        setEntries(data.rentRoll || []);
      }
    } catch (err) {
      console.error('Failed to load rent roll:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentRoll();
  }, []);

  const filteredEntries = entries.filter((e) => {
    const matchesSearch = 
      e.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.unit_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-emerald-100 text-xs px-3 py-1 rounded-full font-medium mb-3 border border-white/10">
          <Sparkles size={14} className="text-emerald-300" /> Live Rent Tracking
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Rent Roll Ledger</h1>
        <p className="text-emerald-100 text-sm mt-1 max-w-xl">
          Monitor property tenant balances, collected rent, utility breakdowns, and overdue balances.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tenant or property..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <button
            onClick={fetchRentRoll}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-3.5 py-2 rounded-lg transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Ledger
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm py-8 text-center">Loading rent roll data...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-3.5">Tenant & Unit</th>
                  <th className="p-3.5">Rent</th>
                  <th className="p-3.5">Utilities</th>
                  <th className="p-3.5">Total Due</th>
                  <th className="p-3.5">Amount Paid</th>
                  <th className="p-3.5">Balance</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {filteredEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-gray-900">{e.tenant_name}</div>
                      <div className="text-gray-500 text-[11px]">
                        {e.property_name} — Unit {e.unit_number}
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-gray-800">
                      KES {e.monthly_rent.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-gray-600">
                      KES {(e.water_fee + e.garbage_fee).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-bold text-gray-900">
                      KES {e.total_due.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-emerald-700 font-medium">
                      KES {e.amount_paid.toLocaleString()}
                    </td>
                    <td className="p-3.5 font-bold text-red-600">
                      KES {e.balance.toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold capitalize text-[11px] ${
                          e.status === 'paid'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : e.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {e.status === 'paid' && <CheckCircle2 size={12} />}
                        {e.status === 'pending' && <Clock size={12} />}
                        {e.status === 'overdue' && <AlertCircle size={12} />}
                        {e.status}
                      </span>
                    </td>
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