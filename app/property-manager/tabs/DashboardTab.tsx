'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  PieChart,
  Loader2
} from 'lucide-react';

interface DashboardMetrics {
  occupied_units: number;
  vacant_units: number;
  paid_invoices_count: number;
  unpaid_invoices_count: number;
  overdue_invoices_count: number;
  partial_invoices_count: number;
  total_paid_amount: number;
  total_unpaid_amount: number;
  total_overdue_amount: number;
  total_partial_amount: number;
}

export const DashboardTab: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/property-manager/api/dashboard-metrics', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch dashboard metrics.');
        const data = await res.json();
        setMetrics(data.metrics || null);
      } catch (err: any) {
        console.error('Error loading dashboard metrics:', err);
        setError(err.message || 'Unable to connect to database.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardMetrics();
  }, []);

  if (loading) {
    return (
      <div className="p-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 gap-2">
        <Loader2 className="animate-spin text-blue-600" size={24} />
        <span>Fetching live metrics from database...</span>
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

  const m = metrics || {
    occupied_units: 0,
    vacant_units: 0,
    paid_invoices_count: 0,
    unpaid_invoices_count: 0,
    overdue_invoices_count: 0,
    partial_invoices_count: 0,
    total_paid_amount: 0,
    total_unpaid_amount: 0,
    total_overdue_amount: 0,
    total_partial_amount: 0,
  };

  const grandTotal =
    m.total_paid_amount + m.total_unpaid_amount + m.total_overdue_amount + m.total_partial_amount;

  const getPercentage = (val: number) => (grandTotal > 0 ? `${((val / grandTotal) * 100).toFixed(1)}%` : '0%');

  return (
    <div className="space-y-8">
      {/* 1. Numerical Representation Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-1">
            <Building2 size={16} /> Occupied Units
          </div>
          <div className="text-2xl font-bold text-gray-900">{m.occupied_units}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-1">
            <Building2 size={16} /> Vacant Units
          </div>
          <div className="text-2xl font-bold text-gray-900">{m.vacant_units}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium mb-1">
            <CheckCircle2 size={16} /> Paid Invoices
          </div>
          <div className="text-2xl font-bold text-gray-900">{m.paid_invoices_count}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-yellow-600 text-sm font-medium mb-1">
            <Clock size={16} /> Unpaid Invoices
          </div>
          <div className="text-2xl font-bold text-gray-900">{m.unpaid_invoices_count}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-red-600 text-sm font-medium mb-1">
            <AlertCircle size={16} /> Overdue
          </div>
          <div className="text-2xl font-bold text-gray-900">{m.overdue_invoices_count}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-1">
            <DollarSign size={16} /> Partial Payments
          </div>
          <div className="text-2xl font-bold text-gray-900">{m.partial_invoices_count}</div>
        </div>
      </section>

      {/* 2. Graphical Representation of Financials */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <PieChart size={20} className="text-blue-600" /> Financial Overview & Invoicing Breakdown
          </h2>
        </div>

        {grandTotal === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No invoice records found in the database.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
              <div style={{ width: getPercentage(m.total_paid_amount) }} className="bg-green-500" title="Invoice Paid" />
              <div style={{ width: getPercentage(m.total_unpaid_amount) }} className="bg-yellow-400" title="Invoice Unpaid" />
              <div style={{ width: getPercentage(m.total_overdue_amount) }} className="bg-red-500" title="Overdue" />
              <div style={{ width: getPercentage(m.total_partial_amount) }} className="bg-blue-500" title="Partial Payments" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <div>
                  <div className="text-gray-500">Invoice Paid</div>
                  <div className="font-bold text-gray-800">${m.total_paid_amount.toFixed(2)}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <div>
                  <div className="text-gray-500">Invoice Unpaid</div>
                  <div className="font-bold text-gray-800">${m.total_unpaid_amount.toFixed(2)}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <div>
                  <div className="text-gray-500">Overdue</div>
                  <div className="font-bold text-gray-800">${m.total_overdue_amount.toFixed(2)}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <div>
                  <div className="text-gray-500">Partial Payments</div>
                  <div className="font-bold text-gray-800">${m.total_partial_amount.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};