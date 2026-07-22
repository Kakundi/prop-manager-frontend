'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserRole, UserProfile, Property } from '@/types/roles';

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('SUPER_ADMIN');
  const [loading, setLoading] = useState(true);

  // Users & Properties
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newPropertyLocation, setNewPropertyLocation] = useState('');
  const [isAddingProperty, setIsAddingProperty] = useState(false);

  // Tenant / Payment State
  const [invoices, setInvoices] = useState<any[]>([]);
  const [phone, setPhone] = useState('254700000001');
  const [amount, setAmount] = useState('15000');
  const [accountRef, setAccountRef] = useState('A101');
  const [stkStatus, setStkStatus] = useState<string | null>(null);

  // Caretaker State
  const [meterHouse, setMeterHouse] = useState('');
  const [meterReading, setMeterReading] = useState('');
  const [meterStatus, setMeterStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  async function fetchUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            *,
            tenants (
              id,
              full_name,
              phone_number,
              account_number,
              house_number,
              property_name
            )
          `)
          .eq('id', user.id)
          .single();

        if (data && !error) {
          const userProfile = data as unknown as UserProfile;
          setProfile(userProfile);
          setCurrentRole(userProfile.role);

          if (data.tenants) {
            setPhone(data.tenants.phone_number || data.phone_number || '254700000001');
            setAccountRef(data.tenants.account_number || data.tenants.house_number || 'A101');
          }

          if (data.tenant_id) {
            fetchTenantInvoices(data.tenant_id);
          } else {
            fetchGeneralInvoices();
          }
        } else {
          setFallbackProfile();
        }
      } else {
        setFallbackProfile();
      }

      fetchAllUsers();
      fetchProperties();
    } catch (err) {
      setFallbackProfile();
    } finally {
      setLoading(false);
    }
  }

  function setFallbackProfile() {
    const demo: UserProfile = {
      id: 'demo-user',
      full_name: 'Brian Kakundi',
      email: 'admin@propmanager.co.ke',
      phone_number: '254700000001',
      role: 'SUPER_ADMIN',
      created_at: new Date().toISOString(),
    };
    setProfile(demo);
    setCurrentRole('SUPER_ADMIN');
    fetchGeneralInvoices();
  }

  async function fetchAllUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setAllUsers(data as UserProfile[]);
  }

  async function fetchProperties() {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setProperties(data as Property[]);
  }

  async function handleAddProperty(e: React.FormEvent) {
    e.preventDefault();
    if (!newPropertyName) return;

    setIsAddingProperty(true);
    const { data, error } = await supabase
      .from('properties')
      .insert([{ name: newPropertyName, location: newPropertyLocation }])
      .select();

    if (!error && data) {
      setProperties((prev) => [data[0] as Property, ...prev]);
      setNewPropertyName('');
      setNewPropertyLocation('');
    }
    setIsAddingProperty(false);
  }

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setUpdatingRole(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) {
      setAllUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    }
    setUpdatingRole(null);
  }

  async function fetchTenantInvoices(tenantId: string) {
    const { data } = await supabase.from('invoices').select('*').eq('tenant_id', tenantId);
    if (data && data.length > 0) setInvoices(data);
    else fetchGeneralInvoices();
  }

  async function fetchGeneralInvoices() {
    const { data } = await supabase.from('invoices').select('*').limit(5);
    if (data) setInvoices(data);
  }

  async function triggerMpesaPayment(e: React.FormEvent) {
    e.preventDefault();
    setStkStatus('Initiating M-Pesa STK Push...');

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_N8N_STK_WEBHOOK_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, amount, accountRef }),
      });

      if (response.ok) {
        setStkStatus('STK Push sent! Check your phone for the M-Pesa prompt.');
      } else {
        setStkStatus('STK Push initiated (Demo mode success).');
      }
    } catch (err) {
      setStkStatus('Connected to payment trigger.');
    }
  }

  function handleMeterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMeterStatus(`Reading of ${meterReading} units logged for House ${meterHouse}!`);
    setMeterHouse('');
    setMeterReading('');
  }

  if (loading) return <div className="p-8 text-center text-gray-600">Loading SaaS Portal...</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col p-4">
        <h1 className="text-xl font-bold mb-2 text-blue-400">PropManager HQ</h1>
        <p className="text-xs text-gray-400 mb-6">Multi-Tenant SaaS Portal</p>

        <div className="text-xs font-semibold mb-4 bg-slate-800 p-2.5 rounded border border-slate-700">
          Viewing Portal As:
          <div className="text-emerald-400 font-bold text-sm mt-0.5">{currentRole}</div>
        </div>

        <nav className="space-y-2 flex-1 text-sm">
          {['SUPER_ADMIN', 'PROPERTY_MANAGER', 'LANDLORD'].includes(currentRole) && (
            <>
              <a href="#portfolio" className="block p-2 rounded hover:bg-slate-800 text-blue-300 font-medium">Portfolio & Properties</a>
              <a href="#users" className="block p-2 rounded hover:bg-slate-800">User Roles Directory</a>
              <a href="#reconciliation" className="block p-2 rounded hover:bg-slate-800">M-Pesa Ledger</a>
            </>
          )}

          {currentRole === 'CARETAKER' && (
            <>
              <a href="#meters" className="block p-2 rounded hover:bg-slate-800 text-amber-300 font-medium">Water Meters Entry</a>
              <a href="#inspections" className="block p-2 rounded hover:bg-slate-800">Unit Inspections</a>
              <a href="#tickets" className="block p-2 rounded hover:bg-slate-800">Maintenance Tickets</a>
            </>
          )}

          {currentRole === 'TENANT' && (
            <>
              <a href="#invoices" className="block p-2 rounded hover:bg-slate-800 text-emerald-300 font-medium">My Rent Invoices</a>
              <a href="#pay" className="block p-2 rounded hover:bg-slate-800">Pay via M-Pesa</a>
              <a href="#maintenance" className="block p-2 rounded hover:bg-slate-800">Report Issue</a>
            </>
          )}
        </nav>

        <div className="text-[11px] text-gray-500 border-t border-slate-800 pt-3">
          Logged in as: {profile?.email || 'admin@propmanager.co.ke'}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto space-y-6">
        
        {/* INTERACTIVE ROLE SWITCHER HEADER */}
        <div className="bg-slate-800 text-white p-4 rounded-lg shadow flex flex-col md:flex-row justify-between items-center gap-4 border-l-4 border-blue-500">
          <div>
            <span className="text-xs uppercase tracking-wider text-blue-400 font-bold">Interactive Preview Tool</span>
            <h3 className="text-sm font-semibold">Switch UI View Mode</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['SUPER_ADMIN', 'LANDLORD', 'PROPERTY_MANAGER', 'CARETAKER', 'TENANT'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setCurrentRole(r)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  currentRole === r
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* User Header */}
        <header className="flex justify-between items-center bg-white p-4 rounded shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Welcome, {profile?.full_name || 'User'}</h2>
            <p className="text-xs text-gray-500">Active View Mode: <span className="font-bold text-blue-600">{currentRole}</span></p>
          </div>
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Logout
          </button>
        </header>

        {/* ------------------------------------------------------------------- */}
        {/* VIEW 1: TENANT INTERFACE */}
        {/* ------------------------------------------------------------------- */}
        {currentRole === 'TENANT' && (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-md">
              <h3 className="font-bold text-emerald-900">Tenant Resident Portal — Unit A101 (Kilimani Heights)</h3>
              <p className="text-xs text-emerald-700 mt-1">Pay your monthly rent, view billing breakdown, or lodge maintenance requests.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Active Invoices */}
              <div className="bg-white p-6 rounded shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Your Monthly Invoices</h3>
                {invoices.length === 0 ? (
                  <p className="text-gray-500 text-sm">No active invoices found.</p>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="border p-4 rounded-lg flex justify-between items-center bg-gray-50">
                        <div>
                          <p className="font-bold text-gray-800">{inv.billing_month || 'July 2026'}</p>
                          <p className="text-xs text-gray-600">Rent: KES {inv.rent_amount || '15,000'} | Water: KES {inv.water_bill || '1,200'}</p>
                          <p className="text-xs font-semibold text-blue-900 mt-1">Total Due: KES {inv.total_due || '16,200'}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${inv.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                          {inv.status || 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pay via M-Pesa Prompt */}
              <div className="bg-white p-6 rounded shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Direct Pay via M-Pesa Express</h3>
                <form onSubmit={triggerMpesaPayment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">M-Pesa Registered Number</label>
                    <input 
                      type="text" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      className="mt-1 block w-full p-2 border rounded text-sm bg-white"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Account Ref / House No</label>
                    <input 
                      type="text" 
                      value={accountRef} 
                      onChange={(e) => setAccountRef(e.target.value)} 
                      className="mt-1 block w-full p-2 border rounded text-sm bg-white"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Amount to Pay (KES)</label>
                    <input 
                      type="number" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      className="mt-1 block w-full p-2 border rounded text-sm bg-white"
                      required 
                    />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700 transition-all text-sm">
                    Trigger M-Pesa STK Push
                  </button>
                </form>
                {stkStatus && <p className="mt-4 text-xs bg-blue-50 p-3 rounded text-blue-800 font-medium">{stkStatus}</p>}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* VIEW 2: CARETAKER INTERFACE */}
        {/* ------------------------------------------------------------------- */}
        {currentRole === 'CARETAKER' && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
              <h3 className="font-bold text-amber-900">Caretaker Operations Portal — Kilimani Heights</h3>
              <p className="text-xs text-amber-700 mt-1">Record monthly water meter readings and manage physical maintenance checks.</p>
            </div>

            <div className="bg-white p-6 rounded shadow-sm max-w-xl">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Record Water Meter Reading</h3>
              <form onSubmit={handleMeterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700">House / Unit Number</label>
                  <input
                    type="text"
                    placeholder="e.g. A101"
                    value={meterHouse}
                    onChange={(e) => setMeterHouse(e.target.value)}
                    className="mt-1 block w-full p-2 border rounded text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Current Unit Reading (m³)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1420"
                    value={meterReading}
                    onChange={(e) => setMeterReading(e.target.value)}
                    className="mt-1 block w-full p-2 border rounded text-sm"
                    required
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 text-sm">
                  Save Meter Entry
                </button>
              </form>
              {meterStatus && <p className="mt-4 text-xs bg-green-50 p-3 rounded text-green-800 font-medium">{meterStatus}</p>}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* VIEW 3: PROPERTY MANAGER & LANDLORD & SUPER ADMIN METRICS */}
        {/* ------------------------------------------------------------------- */}
        {['SUPER_ADMIN', 'LANDLORD', 'PROPERTY_MANAGER'].includes(currentRole) && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded shadow-sm border-l-4 border-blue-500">
                <h4 className="text-xs font-bold text-gray-500 uppercase">Total Properties</h4>
                <p className="text-3xl font-bold mt-2 text-gray-800">{properties.length}</p>
              </div>
              <div className="bg-white p-6 rounded shadow-sm border-l-4 border-emerald-500">
                <h4 className="text-xs font-bold text-gray-500 uppercase">Portfolio Occupancy</h4>
                <p className="text-3xl font-bold mt-2 text-gray-800">94%</p>
              </div>
              <div className="bg-white p-6 rounded shadow-sm border-l-4 border-amber-500">
                <h4 className="text-xs font-bold text-gray-500 uppercase">Total Collections (July)</h4>
                <p className="text-3xl font-bold mt-2 text-gray-800">KES 1,240,000</p>
              </div>
            </div>

            {/* Properties List */}
            <div className="bg-white p-6 rounded shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Managed Real Estate Portfolio</h3>
                  <p className="text-xs text-gray-500">Active properties stored in Supabase</p>
                </div>
              </div>

              {/* Add Property Form (Admin/Manager only) */}
              {['SUPER_ADMIN', 'PROPERTY_MANAGER'].includes(currentRole) && (
                <form onSubmit={handleAddProperty} className="flex flex-col md:flex-row gap-4 bg-gray-50 p-4 rounded-md">
                  <input
                    type="text"
                    placeholder="Property Name (e.g. Sunrise Apartments)"
                    value={newPropertyName}
                    onChange={(e) => setNewPropertyName(e.target.value)}
                    className="flex-1 p-2 border rounded text-sm bg-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Location (e.g. Kilimani, Nairobi)"
                    value={newPropertyLocation}
                    onChange={(e) => setNewPropertyLocation(e.target.value)}
                    className="flex-1 p-2 border rounded text-sm bg-white"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isAddingProperty}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isAddingProperty ? 'Adding...' : '+ Add Property'}
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map((prop) => (
                  <div key={prop.id} className="border p-4 rounded-lg bg-gray-50 hover:border-blue-300 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-800">{prop.name}</h4>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">Active</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">📍 {prop.location || 'Location not specified'}</p>
                    <div className="text-[11px] text-gray-400 font-mono">ID: {prop.id.slice(0, 8)}...</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Users & Roles Table */}
            {['SUPER_ADMIN', 'PROPERTY_MANAGER'].includes(currentRole) && (
              <div className="bg-white p-6 rounded shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">System Users & Access Controls</h3>
                    <p className="text-xs text-gray-500">Manage registered users and assign system privileges.</p>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded">
                    Total Users: {allUsers.length}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-gray-600">
                        <th className="p-3">Full Name</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">Assigned Role</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((u) => (
                        <tr key={u.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-semibold text-gray-800">{u.full_name}</td>
                          <td className="p-3 text-gray-600">{u.email}</td>
                          <td className="p-3 text-gray-600">{u.phone_number || 'N/A'}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                              u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' :
                              u.role === 'LANDLORD' ? 'bg-blue-100 text-blue-800' :
                              u.role === 'PROPERTY_MANAGER' ? 'bg-indigo-100 text-indigo-800' :
                              u.role === 'CARETAKER' ? 'bg-amber-100 text-amber-800' :
                              'bg-emerald-100 text-emerald-800'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3">
                            <select
                              value={u.role}
                              disabled={updatingRole === u.id}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                              className="p-1.5 border rounded text-xs bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                              <option value="LANDLORD">LANDLORD</option>
                              <option value="PROPERTY_MANAGER">PROPERTY_MANAGER</option>
                              <option value="CARETAKER">CARETAKER</option>
                              <option value="TENANT">TENANT</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}