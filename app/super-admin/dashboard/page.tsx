'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Role = 'SUPERADMIN' | 'LANDLORD' | 'PROPERTY_MANAGER' | 'CARETAKER' | 'TENANT';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
}

export default function SuperAdminDashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saasAmount, setSaasAmount] = useState<number>(5000);
  const [selectedOwner, setSelectedOwner] = useState<string>('');

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*');
    if (!error && data) {
      setProfiles(data);
    }
    setLoading(false);
  }

  async function handleRoleChange(userId: string, newRole: Role) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      alert(`Error updating role: ${error.message}`);
    } else {
      loadProfiles();
    }
  }

  async function handleIssueSubscriptionInvoice() {
    if (!selectedOwner) {
      alert('Please select a Property Owner or Manager.');
      return;
    }

    // Replace with your actual database invoice insert or external webhook/API
    alert(`Platform SaaS Subscription Invoice of KES ${saasAmount.toLocaleString()} issued successfully!`);
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading user accounts and platform permissions...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Superadmin Control Center</h1>
        <p className="text-sm text-slate-500">Manage global user roles and issue SaaS platform invoices</p>
      </div>

      {/* 1. User & Role Assignment Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-lg font-bold text-slate-800">User Management & Permissions</h2>
          <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-full">
            {profiles.length} Accounts
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {profiles.map((prof) => (
            <div key={prof.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm text-slate-900">{prof.full_name || 'Unnamed Account'}</p>
                <p className="text-xs text-slate-500">
                  {prof.email} {prof.phone ? `• ${prof.phone}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Role:</span>
                <select
                  value={prof.role}
                  onChange={(e) => handleRoleChange(prof.id, e.target.value as Role)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SUPERADMIN">Superadmin</option>
                  <option value="LANDLORD">Property Owner (Landlord)</option>
                  <option value="PROPERTY_MANAGER">Property Manager</option>
                  <option value="CARETAKER">Caretaker</option>
                  <option value="TENANT">Tenant</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Platform SaaS Invoicing Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b pb-3">
          <h2 className="text-lg font-bold text-slate-800">Issue Platform Subscription Invoice</h2>
          <p className="text-xs text-slate-500">Raise software usage bills directly to clients/owners</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase">Select Client Account</label>
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 mt-1 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose Landlord / Property Manager --</option>
              {profiles
                .filter((p) => p.role === 'LANDLORD' || p.role === 'PROPERTY_MANAGER')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.email} ({p.role})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase">Subscription Fee (KES)</label>
            <input
              type="number"
              value={saasAmount}
              onChange={(e) => setSaasAmount(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg p-2.5 mt-1 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleIssueSubscriptionInvoice}
          className="bg-slate-900 text-white font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-slate-800 transition shadow-sm"
        >
          Issue Subscription Invoice
        </button>
      </div>
    </div>
  );
}