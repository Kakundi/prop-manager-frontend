'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface SubscriptionInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  status: 'UNPAID' | 'PAID' | 'OVERDUE';
  created_at: string;
}

export default function OwnerSubscriptionPage() {
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingInvoice, setPayingInvoice] = useState<SubscriptionInvoice | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptionInvoices();
  }, []);

  async function fetchSubscriptionInvoices() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('saas_invoices')
        .select('*')
        .eq('subscriber_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) setInvoices(data);
    }
    setLoading(false);
  }

  async function handleMpesaPay(e: React.FormEvent) {
    e.preventDefault();
    if (!payingInvoice) return;
    setPayLoading(true);

    try {
      const res = await fetch('/api/payments/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          amount: payingInvoice.amount,
          invoiceId: payingInvoice.id,
        }),
      });

      if (!res.ok) throw new Error('STK Push initiation failed.');

      alert(`STK Push prompt sent to ${phoneNumber}. Complete the PIN entry on your phone.`);
      setPayingInvoice(null);
      fetchSubscriptionInvoices();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPayLoading(false);
    }
  }

  const unpaidInvoices = invoices.filter((i) => i.status !== 'PAID');
  const paidHistory = invoices.filter((i) => i.status === 'PAID');

  return (
    <div className="p-6 space-y-8 bg-slate-950 text-slate-100 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Subscriptions & Invoices</h1>
        <p className="text-xs text-slate-400 mt-1">Manage platform licensing fees and review payment receipts.</p>
      </div>

      {/* SECTION 1: PENDING INVOICES */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white">Pending SaaS Invoices</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">Loading invoices...</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {unpaidInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500 font-sans">
                      All subscription invoices are fully paid.
                    </td>
                  </tr>
                ) : (
                  unpaidInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40 font-sans">
                      <td className="py-3.5 px-4 font-mono font-semibold text-white">{inv.invoice_number}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">KES {inv.amount.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">{new Date(inv.due_date).toLocaleDateString()}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${inv.status === 'OVERDUE' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setPayingInvoice(inv)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-1.5 rounded-lg transition shadow-lg shadow-emerald-600/20"
                        >
                          Pay Now
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION 2: PAYMENT HISTORY */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white">Payment History</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Amount Paid</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {paidHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500 font-sans">
                    No historical payments found.
                  </td>
                </tr>
              ) : (
                paidHistory.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 font-sans">
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">{inv.invoice_number}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">KES {inv.amount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-[10px] font-bold">
                        PAID
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAY NOW STK PUSH MODAL */}
      {payingInvoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Pay Invoice #{payingInvoice.invoice_number}</h3>
            <p className="text-xs text-slate-400">
              Enter your M-Pesa phone number to receive an instant STK PIN prompt for KES {payingInvoice.amount.toLocaleString()}.
            </p>

            <form onSubmit={handleMpesaPay} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">M-Pesa Phone Number</label>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="2547XXXXXXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 rounded-xl transition disabled:opacity-50"
                >
                  {payLoading ? 'Sending STK Push...' : 'Trigger M-Pesa Prompt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}