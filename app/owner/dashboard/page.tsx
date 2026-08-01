'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Role = 'SUPERADMIN' | 'LANDLORD' | 'PROPERTY_MANAGER' | 'CARETAKER' | 'TENANT';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
}

interface Property {
  id: string;
  name: string;
  location: string | null;
  landlord_id: string | null;
  property_manager_id: string | null;
  caretaker_id: string | null;
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

export default function PropertyOwnerDashboard({ currentUserId }: { currentUserId?: string }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form states for assignment
  const [targetRole, setTargetRole] = useState<'TENANT' | 'CARETAKER' | 'PROPERTY_MANAGER'>('TENANT');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');

  useEffect(() => {
    fetchOwnerData();
  }, [currentUserId]);

  async function fetchOwnerData() {
    setLoading(true);

    // 1. Fetch properties owned by this landlord (or all properties if no ID passed)
    let query = supabase.from('properties').select('*');
    if (currentUserId) {
      query = query.eq('landlord_id', currentUserId);
    }
    const { data: propsData } = await query;
    if (propsData) setProperties(propsData);

    // 2. Fetch profiles for assignment dropdowns
    const { data: profsData } = await supabase.from('profiles').select('*');
    if (profsData) setProfiles(profsData);

    setLoading(false);
  }

  // Load units whenever property selection changes
  async function handlePropertyChange(propertyId: string) {
    setSelectedPropertyId(propertyId);
    setSelectedUnitId('');

    if (propertyId) {
      const { data: unitData } = await supabase
        .from('units')
        .select('*')
        .eq('property_id', propertyId);
      if (unitData) setUnits(unitData);
    } else {
      setUnits([]);
    }
  }

  async function handleConfirmAssignment() {
    if (!selectedPropertyId || !selectedProfileId) {
      alert('Please select a property and a person.');
      return;
    }

    try {
      if (targetRole === 'TENANT') {
        if (!selectedUnitId) {
          alert('Please select a target unit for the tenant.');
          return;
        }

        const { error } = await supabase.from('tenants').insert({
          property_id: selectedPropertyId,
          unit_id: selectedUnitId,
          profile_id: selectedProfileId,
          is_active: true,
        });

        if (error) throw error;
        alert('Tenant assigned to unit successfully!');

      } else if (targetRole === 'CARETAKER') {
        const { error } = await supabase
          .from('properties')
          .update({ caretaker_id: selectedProfileId })
          .eq('id', selectedPropertyId);

        if (error) throw error;
        alert('Caretaker assigned to property!');

      } else if (targetRole === 'PROPERTY_MANAGER') {
        const { error } = await supabase
          .from('properties')
          .update({ property_manager_id: selectedProfileId })
          .eq('id', selectedPropertyId);

        if (error) throw error;
        alert('Property Manager assigned!');
      }

      // Reset selection
      setSelectedProfileId('');
      setSelectedUnitId('');
      fetchOwnerData();

    } catch (err: any) {
      alert(`Assignment failed: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading property portfolio data...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Property Owner Dashboard</h1>
        <p className="text-sm text-slate-500">
          Manage your real estate portfolio, assign staff, and place tenants
        </p>
      </div>

      {/* Portfolio Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Properties</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{properties.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Assigned Managers</p>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">
            {properties.filter((p) => p.property_manager_id).length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Assigned Caretakers</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">
            {properties.filter((p) => p.caretaker_id).length}
          </p>
        </div>
      </div>

      {/* Staff & Tenant Assignment Control */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b pb-3">
          <h2 className="text-lg font-bold text-slate-800">Assign Roles & Units</h2>
          <p className="text-xs text-slate-500">
            Link staff members to properties or attach tenants directly to units
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase">Assignment Category</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as any)}
              className="w-full border border-slate-300 rounded-lg p-2.5 mt-1 text-sm bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TENANT">Tenant to Unit</option>
              <option value="CARETAKER">Caretaker to Property</option>
              <option value="PROPERTY_MANAGER">Property Manager to Property</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase">Select Person Profile</label>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 mt-1 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Person --</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name || p.email} ({p.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase">Target Property</label>
            <select
              value={selectedPropertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 mt-1 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose Property --</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.location ? `(${p.location})` : ''}
                </option>
              ))}
            </select>
          </div>

          {targetRole === 'TENANT' && (
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">Target Unit</label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                disabled={!selectedPropertyId}
                className="w-full border border-slate-300 rounded-lg p-2.5 mt-1 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">
                  {selectedPropertyId ? '-- Choose Unit --' : 'Select a property first'}
                </option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.unit_number} — KES {u.rent_amount.toLocaleString()}/mo
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          onClick={handleConfirmAssignment}
          className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-blue-700 transition shadow-sm"
        >
          Confirm Assignment
        </button>
      </div>

      {/* Property Portfolio Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-800">My Properties</h2>

        {properties.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No properties registered under this account.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Property Name</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Water Rate (Unit)</th>
                  <th className="py-3 px-4">Manager Status</th>
                  <th className="py-3 px-4">Caretaker Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{prop.name}</td>
                    <td className="py-3 px-4 text-slate-500">{prop.location || 'N/A'}</td>
                    <td className="py-3 px-4 font-mono">KES {prop.water_rate_per_unit}</td>
                    <td className="py-3 px-4">
                      {prop.property_manager_id ? (
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-medium">Assigned</span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {prop.caretaker_id ? (
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-medium">Assigned</span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium">Unassigned</span>
                      )}
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