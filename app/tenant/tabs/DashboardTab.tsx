'use client';

import React, { useState } from 'react';
import { AlertTriangle, Clock, Gauge, CreditCard, CheckCircle2 } from 'lucide-react';
import { TenantInvoice, MeterReadingInfo } from '../types';

export const DashboardTab: React.FC = () => {
  const [meterInfo] = useState<MeterReadingInfo>({
    previous_meter_reading: 1420,
    current_meter_reading: 1460,
    units_consumed: 40,
    billing_month: 'August 2026',
  });

  const [invoices, setInvoices] = useState<TenantInvoice[]>([
    {
      id: 'INV-WAT-001',
      title: 'Water Utility Bill - August 2026',
      amount: 200,
      due_date: '2026-08-10',
      status: 'unpaid',
      meter_info: {
        previous_meter_reading: 1420,
        current_meter_reading: 1460,
        units_consumed: 40,
        billing_month: 'August 2026',
      },
    },
    {
      id: 'INV-RENT-001',
      title: 'Monthly Rent - August 2026',
      amount: 800,
      due_date: '2026-08-01',
      status: 'overdue',
    },
    {
      id: 'INV-GARB-001',
      title: 'Garbage Collection - July 2026',
      amount: 50,
      due_date: '2026-07-30',
      status: 'under_review',
    },
  ]);

  const [payingId, setPayingId] = useState<string | null>(null);

  const handlePayNow = async (invoiceId: string, amount: number) => {
    setPayingId(invoiceId);
    try {
      const res = await fetch('/tenant/api/pay-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoiceId, amount }),
      });

      if (!res.ok) throw new Error('Payment processing failed');

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId ? { ...inv, status: 'under_review' } : inv
        )
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Payment failed');
      }
    } finally {
      setPayingId(null);
    }
  };

  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
  const reviewInvoices = invoices.filter((i) => i.status === 'under_review');

  return (
    <div className="space-y-8">
      {/* 1. NOTIFICATION ALERTS SECTION */}
      <div className="space-y-3">
        {overdueInvoices.length > 0 && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-bold text-red-900 text-sm">Overdue Payment Notice</h4>
              <p className="text-sm text-red-700 mt-0.5">
                You have {overdueInvoices.length} overdue invoice(s). Please make payment promptly to avoid penalties.
              </p>
            </div>
          </div>
        )}

        {reviewInvoices.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
            <Clock className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-bold text-amber-900 text-sm">Payment Received &amp; Pending Review</h4>
              <p className="text-sm text-amber-700 mt-0.5">
                Your recent payment was received and captured in the system. It is currently awaiting verification and review from management.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. METER READING OVERVIEW */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4 text-gray-800 font-bold text-lg">
          <Gauge className="text-blue-600" size={22} />
          <h3>Water Meter Reading Overview ({meterInfo.billing_month})</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-xs text-gray-500 font-medium">Previous Meter Reading</div>
            <div className="text-2xl font-bold text-gray-800 mt-1">{meterInfo.previous_meter_reading}</div>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-xs text-gray-500 font-medium">Current Meter Reading</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{meterInfo.current_meter_reading}</div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs text-blue-600 font-medium">Total Units Consumed</div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{meterInfo.units_consumed} units</div>
          </div>
        </div>
      </div>

      {/* 3. RAISED INVOICES & DIRECT PAY BUTTON */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">Raised Invoices</h3>
          <p className="text-sm text-gray-500">Pay your active bills directly from this portal.</p>
        </div>

        <div className="divide-y divide-gray-200">
          {invoices.map((inv) => (
            <div key={inv.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{inv.title}</span>
                  {inv.status === 'overdue' && (
                    <span className="bg-red-100 text-red-800 text-xs px-2.5 py-0.5 rounded-full font-medium">Overdue</span>
                  )}
                  {inv.status === 'under_review' && (
                    <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-medium">Awaiting Review</span>
                  )}
                  {inv.status === 'unpaid' && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-0.5 rounded-full font-medium">Unpaid</span>
                  )}
                </div>

                {inv.meter_info && (
                  <p className="text-xs text-gray-500">
                    Readings: {inv.meter_info.previous_meter_reading} to {inv.meter_info.current_meter_reading} ({inv.meter_info.units_consumed} units)
                  </p>
                )}

                <div className="text-xs text-gray-500">
                  Due Date: <span className="font-medium text-gray-700">{inv.due_date}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 justify-between md:justify-end">
                <div className="text-right">
                  <div className="text-xs text-gray-400">Amount Due</div>
                  <div className="text-xl font-bold text-gray-900">${inv.amount.toFixed(2)}</div>
                </div>

                {inv.status === 'under_review' ? (
                  <button
                    disabled
                    className="bg-amber-100 text-amber-800 text-sm font-medium px-5 py-2.5 rounded-lg cursor-not-allowed flex items-center gap-2"
                  >
                    <Clock size={16} /> Payment Pending Review
                  </button>
                ) : inv.status === 'paid' ? (
                  <button
                    disabled
                    className="bg-green-100 text-green-800 text-sm font-medium px-5 py-2.5 rounded-lg cursor-not-allowed flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Paid
                  </button>
                ) : (
                  <button
                    onClick={() => handlePayNow(inv.id, inv.amount)}
                    disabled={payingId === inv.id}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <CreditCard size={16} />
                    {payingId === inv.id ? 'Processing...' : 'Pay Now'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};