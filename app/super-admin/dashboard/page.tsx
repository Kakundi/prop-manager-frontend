'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface InvoiceMetrics {
  paidAmount: number;
  paidCount: number;
  unpaidAmount: number;
  unpaidCount: number;
  overdueAmount: number;
  overdueCount: number;
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<InvoiceMetrics>({
    paidAmount: 0,
    paidCount: 0,
    unpaidAmount: 0,
    unpaidCount: 0,
    overdueAmount: 0,
    overdueCount: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      const { data, error } = await supabase.from('saas_invoices').select('amount, status');

      if (!error && data) {
        const initial = {
          paidAmount: 0,
          paidCount: 0,
          unpaidAmount: 0,
          unpaidCount: 0,
          overdueAmount: 0,
          overdueCount: 0,
        };

        const result = data.reduce((acc, inv) => {
          if (inv.status === 'PAID') {
            acc.paidAmount += inv.amount;
            acc.paidCount += 1;
          } else if (inv.status === 'UNPAID') {
            acc.unpaidAmount += inv.amount;
            acc.unpaidCount += 1;
          } else if (inv.status === 'OVERDUE') {
            acc.overdueAmount += inv.amount;
            acc.overdueCount += 1;
          }
          return acc;
        }, initial);

        setMetrics(result);
      }
      setLoading(false);
    }

    fetchMetrics();
  }, []);

  return (
    <div className="p-6 space-y-6 bg-slate-950 text-slate-100 min-h-screen">
      {/* HERO / WELCOME */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Welcome Back, Brian Nyamai
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Here is your SaaS subscription revenue overview from Property Managers and Owners.
        </p>
      </div>

      {/* NUMERICAL METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Paid Invoices */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>PAID INVOICES</span>
            <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">✓</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-white">
              KES {loading ? '...' : metrics.paidAmount.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-400 font-semibold mt-1">
              {metrics.paidCount} Subscriptions Paid
            </p>
          </div>
        </div>

        {/* Unpaid Invoices */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>UNPAID INVOICES</span>
            <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">⏳</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-white">
              KES {loading ? '...' : metrics.unpaidAmount.toLocaleString()}
            </p>
            <p className="text-xs text-amber-400 font-semibold mt-1">
              {metrics.unpaidCount} Pending Payments
            </p>
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>OVERDUE INVOICES</span>
            <span className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg">⚠️</span>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-white">
              KES {loading ? '...' : metrics.overdueAmount.toLocaleString()}
            </p>
            <p className="text-xs text-rose-400 font-semibold mt-1">
              {metrics.overdueCount} Overdue Accounts
            </p>
          </div>
        </div>
      </div>

      {/* GRAPHICAL REPRESENTATION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white">Revenue Distribution Breakdown</h2>

        {/* Visual Progress Bar */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex">
            <div
              style={{
                width: `${
                  metrics.paidCount + metrics.unpaidCount + metrics.overdueCount > 0
                    ? (metrics.paidCount /
                        (metrics.paidCount + metrics.unpaidCount + metrics.overdueCount)) *
                      100
                    : 0
                }%`,
              }}
              className="bg-emerald-500 transition-all"
            ></div>
            <div
              style={{
                width: `${
                  metrics.paidCount + metrics.unpaidCount + metrics.overdueCount > 0
                    ? (metrics.unpaidCount /
                        (metrics.paidCount + metrics.unpaidCount + metrics.overdueCount)) *
                      100
                    : 0
                }%`,
              }}
              className="bg-amber-500 transition-all"
            ></div>
            <div
              style={{
                width: `${
                  metrics.paidCount + metrics.unpaidCount + metrics.overdueCount > 0
                    ? (metrics.overdueCount /
                        (metrics.paidCount + metrics.unpaidCount + metrics.overdueCount)) *
                      100
                    : 0
                }%`,
              }}
              className="bg-rose-500 transition-all"
            ></div>
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 pt-1 font-mono">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>Paid ({metrics.paidCount})</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
              <span>Unpaid ({metrics.unpaidCount})</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
              <span>Overdue ({metrics.overdueCount})</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}