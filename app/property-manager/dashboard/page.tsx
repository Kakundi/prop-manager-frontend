'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Property {
  id: string;
  name: string;
  water_rate_per_unit: number;
}

interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  rent_amount: number;
  garbage_fee: number;
  parking_fee: number;
}

interface TenantWithProfile {
  id: string;
  unit_id: string;
  profile_id: string;
  profiles: {
    full_name: string;
    email: string;
    phone: string | null;
  };
}

interface Invoice {
  id: string;
  tenant_id: string;
  unit_id: string;
  billing_month: string;
  rent_amount: number;
  water_amount: number;
  garbage_fee: number;
  parking_fee: number;
  total_amount: number;
  status: 'UNPAID' | 'PAID' | 'PARTIAL';
}

export default function PropertyManagerDashboard({ currentUserId }: { currentUserId?: string }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<TenantWithProfile[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State: Unit Selection & Meter Reading Entry
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [previousReading, setPreviousReading] = useState<number>(0);
  const [currentReading, setCurrentReading] = useState<number>(0);
  const [billingMonth, setBillingMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // Default YYYY-MM
  );

  useEffect(() => {
    fetchManagerData();
  }, [currentUserId]);

  async function fetchManagerData() {
    setLoading(true);

    // Fetch properties managed by this property manager
    let propQuery = supabase.from('properties').select('*');
    if (currentUserId) {
      propQuery = propQuery.eq('property_manager_id', currentUserId);
    }
    const { data: propsData } = await propQuery;
    if (propsData) setProperties(propsData);

    // Fetch recent invoices
    const { data: invData } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });
    if (invData) setInvoices(invData);

    setLoading(false);
  }

  // Load Units & Active Tenants when Property changes
  async function handlePropertySelect(propertyId: string) {
    setSelectedPropertyId(propertyId);
    setSelectedUnitId('');

    if (!propertyId) {
      setUnits([]);
      setTenants([]);
      return;
    }

    const { data: unitData } = await supabase
      .from('units')
      .select('*')
      .eq('property_id', propertyId);
    if (unitData) setUnits(unitData);

    const { data: tenantData } = await supabase
      .from('tenants')
      .select('*, profiles(full_name, email, phone)')
      .eq('property_id', propertyId)
      .eq('is_active', true);
    if (tenantData) setTenants(tenantData as any);
  }

  // Calculate & Generate Monthly Invoice
  async function handleGenerateInvoice() {
    if (!selectedPropertyId || !selectedUnitId) {
      alert('Please select both a property and a unit.');
      return;
    }

    const activeTenant = tenants.find((t) => t.unit_id === selectedUnitId);
    if (!activeTenant) {
      alert('No active tenant found assigned to this unit.');
      return;
    }

    const unitInfo = units.find((u) => u.id === selectedUnitId);
    const propertyInfo = properties.find((p) => p.id === selectedPropertyId);

    if (!unitInfo || !propertyInfo) return;

    // Water consumption calculation
    const unitsConsumed = Math.max(0, currentReading - previousReading);
    const waterAmount = unitsConsumed * (propertyInfo.water_rate_per_unit || 0);

    const rent = unitInfo.rent_amount || 0;
    const garbage = unitInfo.garbage_fee || 0;
    const parking = unitInfo.parking_fee || 0;
    const totalAmount = rent + waterAmount + garbage + parking;

    try {
      const { error } = await supabase.from('invoices').insert({
        property_id: selectedPropertyId,
        unit_id: selectedUnitId,
        tenant_id: activeTenant.id,
        billing_month: billingMonth,
        previous_water_reading: previousReading,
        current_water_reading: currentReading,
        water_amount: waterAmount,
        rent_amount: rent,
        garbage_fee: garbage,
        parking_fee: parking,
        total_amount: totalAmount,
        status: 'UNPAID',
      });

      if (error) throw error;

      alert(`Invoice generated for Unit ${unitInfo.unit_number}! Total: KES ${totalAmount.toLocaleString()}`);
      
      // Reset meter fields
      setPreviousReading(currentReading);
      setCurrentReading(0);
      fetchManagerData();
    } catch (err: any) {
      alert(`Error generating invoice: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading property management module...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Property Manager Workspace</h1>
        <p className="text-sm text-slate-500">
          Record utility readings, issue monthly billing, and monitor unit occupancy
        </p>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Assigned Properties</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{properties.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Managed Units</p>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">{units.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Active Invoices</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">{invoices.length}</p>
        </div>
      </div>

      {/* Meter Reading & Monthly Invoice Generator */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b pb-3">
          <h2 className="text-lg font-bold text-slate-800">Meter Readings & Invoice Generation</h2>
          <p className="text-xs text-slate-500">
            Input water meter readings to compile full billing (Rent + Water + Garbage + Parking)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase">Property</label>
            <select
              value={selectedPropertyId}
              onChange={(e) => handlePropertySelect(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 mt-1 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Property --</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase">Unit</label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              disabled={!selectedPropertyId}
              className="w-full border border-slate-300 rounded-lg p-2.5 mt-1 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">-- Select Unit --</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  Unit {u.unit_number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase">Billing Month</label>
            <input
              type="month"
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 mt-1 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase">Previous Water Reading</label>
            <input
              type="number"
              value={previousReading}
              onChange={(e) => setPreviousReading(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg p-2.5 mt-1 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase">Current Water Reading</label>
            <input
              type="number"
              value={currentReading}
              onChange={(e) => setCurrentReading(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg p-2.5 mt-1 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateInvoice}
              className="w-full bg-slate-900 text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-slate-800 transition shadow-sm"
            >
              Generate Monthly Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Generated Invoices Ledger */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Recent Invoices & Payment Ledger</h2>

        {invoices.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No invoices generated yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Billing Period</th>
                  <th className="py-3 px-4">Rent</th>
                  <th className="py-3 px-4">Water</th>
                  <th className="py-3 px-4">Garbage/Parking</th>
                  <th className="py-3 px-4">Total Amount</th>
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