'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Unit {
  id: string;
  unit_number: string;
  rent_amount: number;
  garbage_fee: number;
  parking_fee: number;
  properties: {
    name: string;
    location: string | null;
  };
}

interface TenantRecord {
  id: string;
  unit_id: string;
  is_active: boolean;
  units: Unit;
}

interface Invoice {
  id: string;
  billing_month: string;
  rent_amount: number;
  water_amount: number;
  garbage_fee: number;
  parking_fee: number;
  total_amount: number;
  previous_water_reading: number;
  current_water_reading: number;
  status: 'UNPAID' | 'PAID' | 'PARTIAL';
  created_at: string;
}

export default function TenantDashboard({ currentUserId }: { currentUserId?: string }) {
  const [tenantInfo, setTenantInfo] = useState<TenantRecord | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTenantData();
  }, [currentUserId]);

  async function fetchTenantData() {
    setLoading(true);

    if (!currentUserId) {
      setLoading(false);
      return;
    }

    // 1. Fetch active tenant agreement & unit info linked to profile
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('*, units(*, properties(name, location))')
      .eq('profile_id', currentUserId)
      .eq('is_active', true)
      .maybeSingle();

    if (tenantData) {
      setTenantInfo(tenantData as any);

      // 2. Fetch invoices for this tenant record
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('*')
        .eq('tenant_id', tenantData.id)
        .order('billing_month', { ascending: false });

      if (invoiceData) setInvoices(invoiceData);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading tenant portal statement...
      </div>
    );
  }

  if (!tenantInfo) {
    return (
      <div className="max-w-2xl mx-auto p-8 my-12 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
        <h2 className="text-xl font-bold text-slate-800">No Active Lease Found</h2>
        <p className="text-sm text-slate-500 mt-2">
          Your profile is not currently assigned to an active property unit. Please contact your property manager or landlord.
        </p>
      </div>
    );
  }

  const latestInvoice = invoices[0];
  const unit = tenantInfo.units;
  const property = unit?.properties;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Tenant Portal</h1>
        <p className="text-sm text-slate-500">
          View unit details, current statement breakdowns, and billing history
        </p>
      </div>

      {/* Residence Overview Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase">Property Name</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{property?.name || 'N/A'}</p>
          <p className="text-xs text-slate-500">{property?.location || 'Location not specified'}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase">Unit Number</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">Unit {unit?.unit_number}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase">Base Monthly Rent</p>
          <p className="text-lg font-bold text-slate-900 font-mono mt-1">
            KES {unit?.rent_amount?.toLocaleString() || '0'}
          </p>
        </div>
      </div>

      {/* Latest Billing Statement */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Current Monthly Statement</h2>
            <p className="text-xs text-slate-500">
              {latestInvoice ? `Period: ${latestInvoice.billing_month}` : 'No invoice generated yet for this period'}
            </p>
          </div>

          {latestInvoice && (
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold self-start sm:self-auto ${
                latestInvoice.status === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              STATUS: {latestInvoice.status}
            </span>
          )}
        </div>

        {latestInvoice ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 font-mono">
              <div>
                <p className="text-xs text-slate-500 font-sans uppercase font-semibold">House Rent</p>
                <p className="text-base font-bold text-slate-800 mt-1">
                  KES {latestInvoice.rent_amount?.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-sans uppercase font-semibold">Water Charge</p>
                <p className="text-base font-bold text-slate-800 mt-1">
                  KES {latestInvoice.water_amount?.toLocaleString()}
                </p>
                <span className="text-[10px] text-slate-400 font-sans">
                  ({latestInvoice.previous_water_reading} → {latestInvoice.current_water_reading} units)
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-sans uppercase font-semibold">Garbage Fee</p>
                <p className="text-base font-bold text-slate-800 mt-1">
                  KES {latestInvoice.garbage_fee?.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-sans uppercase font-semibold">Parking Fee</p>
                <p className="text-base font-bold text-slate-800 mt-1">
                  KES {latestInvoice.parking_fee?.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-slate-900 text-white rounded-xl">
              <p className="text-sm font-medium">Total Amount Payable:</p>
              <p className="text-2xl font-extrabold font-mono mt-1 sm:mt-0">
                KES {latestInvoice.total_amount?.toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 py-4 text-center">
            No active invoice issued for the current period.
          </p>
        )}
      </div>

      {/* Invoice History Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Billing & Payment History</h2>

        {invoices.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No previous billing records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Billing Month</th>
                  <th className="py-3 px-4">Rent</th>
                  <th className="py-3 px-4">Water</th>
                  <th className="py-3 px-4">Garbage/Parking</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{inv.billing_month}</td>
                    <td className="py-3 px-4 font-mono">KES {inv.rent_amount?.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono">KES {inv.water_amount?.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono">
                      KES {((inv.garbage_fee || 0) + (inv.parking_fee || 0)).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                      KES {inv.total_amount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inv.status}
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
}