'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserRole, UserProfile } from '@/types/roles';

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Users Data (For Admin/Manager View)
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  // Sample State Data
  const [invoices, setInvoices] = useState<any[]>([]);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [accountRef, setAccountRef] = useState('');
  const [stkStatus, setStkStatus] = useState<string | null>(null);

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
          setProfile(data as unknown as UserProfile);

          if (data.tenants) {
            setPhone(data.tenants.phone_number || data.phone_number || '');
            setAccountRef(data.tenants.account_number || data.tenants.house_number || '');
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

      // Fetch all system users if Admin or Manager
      fetchAllUsers();

    } catch (err) {
      setFallbackProfile();
    } finally {
      setLoading(false);
    }
  }

  function setFallbackProfile() {
    setProfile({
      id: 'demo-user',
      full_name: 'Brian Kakundi',
      email: 'admin@propmanager.co.ke',
      phone_number: '254700000001',
      role: 'SUPER_ADMIN' as UserRole,
      created_at: new Date().toISOString(),
    });
  }

  async function fetchAllUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setAllUsers(data as UserProfile[]);
  }

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setUpdatingRole(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) {
      setAllUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
      );
      if (profile && profile.id === userId) {
        setProfile({ ...profile, role: newRole });
      }
    }
    setUpdatingRole(null);
  }

  async function fetchTenantInvoices(tenantId: string) {
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('tenant_id', tenantId);

    if (data && data.length > 0) {
      setInvoices(data);
    } else {
      fetchGeneralInvoices();
    }
  }

  async function fetchGeneralInvoices() {
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .limit(5);

    if (data) setInvoices(data);
  }

  async function triggerMpesaPayment(e: React.FormEvent) {
    e.preventDefault();
    setStkStatus('Initiating M-Pesa Prompt...');

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_N8N_STK_WEBHOOK_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone,
          amount: amount,
          accountRef: accountRef,
        }),
      });

      if (response.ok) {
        setStkStatus('STK Push sent! Please enter your M-Pesa PIN on your phone.');
      } else {
        setStkStatus('Failed to send M-Pesa prompt. Please try again.');
      }
    } catch (err) {
      setStkStatus('Error connecting to payment gateway.');
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-600">Loading Dashboard...</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col p-4">
        <h1 className="text-xl font-bold mb-6 text-blue-400">PropManager HQ</h1>
        <div className="text-sm font-semibold mb-4 text-gray-400">
          Role: <span className="text-emerald-400">{profile?.role || 'SUPER_ADMIN'}</span>
        </div>

        <nav className="space-y-2 flex-1">
          {['SUPER_ADMIN', 'PROPERTY_MANAGER', 'LANDLORD'].includes(profile?.role || '') && (
            <>
              <a href="#users" className="block p-2 rounded hover:bg-slate-800 text-blue-300 font-medium">User Management</a>
              <a href="#portfolio" className="block p-2 rounded hover:bg-slate-800">Properties & Units</a>
              <a href="#reconciliation" className="block p-2 rounded hover:bg-slate-800">M-Pesa Ledger</a>
            </>
          )}

          {profile?.role === 'CARETAKER' && (
            <>
              <a href="#inspections" className="block p-2 rounded hover:bg-slate-800">Unit Inspections</a>
              <a href="#meters" className="block p-2 rounded hover:bg-slate-800">Water Meters</a>
            </>
          )}

          {profile?.role === 'TENANT' && (
            <>
              <a href="#invoices" className="block p-2 rounded hover:bg-slate-800">My Invoices</a>
              <a href="#pay" className="block p-2 rounded hover:bg-slate-800">Pay via M-Pesa</a>
            </>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto space-y-8">
        <header className="flex justify-between items-center bg-white p-4 rounded shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Welcome, {profile?.full_name || 'User'}</h2>
            <p className="text-xs text-gray-500">SaaS Portal • {profile?.role}</p>
          </div>
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Logout
          </button>
        </header>

        {/* 1. USER ROLES MANAGEMENT TABLE (ADMIN/MANAGER VIEW) */}
        {['SUPER_ADMIN', 'PROPERTY_MANAGER', 'LANDLORD'].includes(profile?.role || '') && (
          <div className="bg-white p-6 rounded shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">System Users & Role Management</h3>
                <p className="text-xs text-gray-500">View registered users and modify permissions in real-time.</p>
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
                    <th className="p-3">Current Role</th>
                    <th className="p-3">Action (Change Role)</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-500">No users found in database.</td>
                    </tr>
                  ) : (
                    allUsers.map((u) => (
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. OVERVIEW METRICS */}
        {['PROPERTY_MANAGER', 'LANDLORD', 'SUPER_ADMIN'].includes(profile?.role || '') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded shadow-sm border-l-4 border-blue-500">
              <h4 className="text-sm font-bold text-gray-500">Total Properties</h4>
              <p className="text-3xl font-bold mt-2 text-gray-800">12</p>
            </div>
            <div className="bg-white p-6 rounded shadow-sm border-l-4 border-emerald-500">
              <h4 className="text-sm font-bold text-gray-500">Occupancy Rate</h4>
              <p className="text-3xl font-bold mt-2 text-gray-800">94%</p>
            </div>
            <div className="bg-white p-6 rounded shadow-sm border-l-4 border-amber-500">
              <h4 className="text-sm font-bold text-gray-500">Total Collected (This Month)</h4>
              <p className="text-3xl font-bold mt-2 text-gray-800">KES 1,240,000</p>
            </div>
          </div>
        )}

        {/* 3. TENANT VIEW */}
        {profile?.role === 'TENANT' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Your Invoices</h3>
              {invoices.length === 0 ? (
                <p className="text-gray-500">No active invoices found.</p>
              ) : (
                <div className="space-y-4">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="border p-4 rounded flex justify-between items-center">
                      <div>
                        <p className="font-bold">{inv.billing_month}</p>
                        <p className="text-sm text-gray-600">Rent: KES {inv.rent_amount} | Water: KES {inv.water_bill}</p>
                        <p className="text-sm text-gray-600">Total: KES {inv.total_due} | Paid: KES {inv.amount_paid}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-bold rounded ${inv.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {inv.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Pay Rent via M-Pesa</h3>
              <form onSubmit={triggerMpesaPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">M-Pesa Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="2547XXXXXXXX" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    className="mt-1 block w-full p-2 border rounded"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Reference (House No / BillRef)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. ACC-A101" 
                    value={accountRef} 
                    onChange={(e) => setAccountRef(e.target.value)} 
                    className="mt-1 block w-full p-2 border rounded"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount (KES)</label>
                  <input 
                    type="number" 
                    placeholder="10000" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    className="mt-1 block w-full p-2 border rounded"
                    required 
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700">
                  Send M-Pesa Express Prompt
                </button>
              </form>
              {stkStatus && <p className="mt-4 text-sm text-blue-600 font-medium">{stkStatus}</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}