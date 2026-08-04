'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle2, CreditCard, History, DollarSign } from 'lucide-react';
import { SubscriptionInvoice } from '../types';

interface SubscriptionPaymentRecord {
  id: string;
  invoice_id: string;
  description: string;
  amount_paid: number;
  payment_method: string;
  transaction_reference: string;
  paid_at: string;
}

export const SubscriptionsTab: React.FC = () => {
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<SubscriptionPaymentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Payment State
  const [selectedInvoice, setSelectedInvoice] = useState<SubscriptionInvoice | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/property-manager/api/subscriptions', { cache: 'no-store' });
      
      if (!res.ok) {
        throw new Error('Failed to load subscription data from database.');
      }
      
      const data = await res.json();
      setInvoices(data.invoices || []);
      setPaymentHistory(data.payments || []);
    } catch (err: unknown) {
      console.error('Error fetching subscription records:', err);
      const message = err instanceof Error ? err.message : 'Unable to connect to database.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const handleInitiatePayment = async (invoiceId: string) => {
    try {
      setIsProcessing(true);
      setFeedback(null);

      const res = await fetch('/property-manager/api/subscriptions/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoiceId }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Payment processing failed.');

      setFeedback({
        type: 'success',
        msg: `Payment for invoice successful! Transaction Ref: ${result.reference || 'N/A'}`,
      });

      setSelectedInvoice(null);
      fetchSubscriptionData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error executing payment transaction.';
      setFeedback({
        type: 'error',
        msg: message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 gap-2 shadow-sm">
        <Loader2 className="animate-spin text-blue-600" size={24} />
        <span>Fetching live subscription and payment records from database...</span>
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

  const unpaidInvoices = invoices.filter((inv) => inv.status !== 'paid');

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Subscriptions & Platform Billing</h2>
        <p className="text-sm text-gray-500">
          Manage invoices raised by the Superadmin for platform operations and review settled payment logs.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {feedback.msg}
        </div>
      )}

      {/* 1. ACTIVE / UNPAID INVOICES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center gap-2">
          <CreditCard size={20} className="text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">Pending & Open Invoices</h3>
        </div>

        {unpaidInvoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center justify-center">
            <CheckCircle2 size={32} className="text-green-500 mb-2" />
            <span>No pending subscription invoices. Your account is fully paid up!</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                  <th className="p-4">Description</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {unpaidInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="p-4 font-medium text-gray-900">{inv.description}</td>
                    <td className="p-4 text-gray-600">{inv.due_date}</td>
                    <td className="p-4 font-bold text-gray-900">${inv.amount.toFixed(2)}</td>
                    <td className="p-4">
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-1 rounded-full font-medium">
                        Unpaid
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded transition shadow-sm flex items-center gap-1"
                      >
                        <DollarSign size={14} /> Pay Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. PAYMENT HISTORY LEDGER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center gap-2">
          <History size={20} className="text-blue-600" />
          <div>
            <h3 className="text-lg font-bold text-gray-800">Subscription Payment History</h3>
            <p className="text-xs text-gray-500">A historical ledger of all completed platform licensing payments.</p>
          </div>
        </div>

        {paymentHistory.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No completed payment records found in database history.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                  <th className="p-4">Invoice Description</th>
                  <th className="p-4">Amount Paid</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Transaction Ref</th>
                  <th className="p-4">Date Paid</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {paymentHistory.map((pmt) => (
                  <tr key={pmt.id}>
                    <td className="p-4 font-medium text-gray-900">{pmt.description}</td>
                    <td className="p-4 font-bold text-gray-900">${pmt.amount_paid.toFixed(2)}</td>
                    <td className="p-4 text-gray-600 uppercase text-xs font-semibold">{pmt.payment_method}</td>
                    <td className="p-4 font-mono text-xs text-gray-600">{pmt.transaction_reference}</td>
                    <td className="p-4 text-gray-500">{pmt.paid_at}</td>
                    <td className="p-4">
                      <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium flex items-center w-fit gap-1">
                        <CheckCircle2 size={12} /> Settled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRMATION / PAYMENT MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Confirm Subscription Payment</h3>
              <p className="text-xs text-gray-500 mt-1">
                You are paying platform license fee for <span className="font-semibold text-gray-700">{selectedInvoice.description}</span>.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice ID:</span>
                <span className="font-mono font-medium text-gray-800">{selectedInvoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Due Date:</span>
                <span className="text-gray-800">{selectedInvoice.due_date}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-base">
                <span className="text-gray-800">Total Amount:</span>
                <span className="text-emerald-600">${selectedInvoice.amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleInitiatePayment(selectedInvoice.id)}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={14} /> Processing...
                  </>
                ) : (
                  <>
                    <DollarSign size={14} /> Confirm & Pay ${selectedInvoice.amount.toFixed(2)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};