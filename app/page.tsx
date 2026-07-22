'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserRole, UserProfile } from '@/types/roles';

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

          // Prefill M-Pesa details if tenant record exists
          if (data.tenants) {
            setPhone(data.tenants.phone_number || data.phone_number || '');
            setAccountRef(data.tenants.account_number || data.tenants.house_number || '');
          }

          if (data.tenant_id) {
            fetchTenantInvoices(data.tenant_id);
          } else {
            // Fallback: Fetch all active invoices if user is admin or unlinked
            fetchGeneralInvoices();
          }
        } else {
          setFallbackProfile();
        }
      } else {
        setFallbackProfile();
      }
    } catch (err) {
      setFallbackProfile();
    } finally {
      setLoading(false);
    }
  }

  function setFallbackProfile() {
    // Fallback profile for initial rendering or testing prior to auth login
    setProfile({
      id: 'demo-user',
      full_name: 'Brian Kakundi',
      email: 'admin@propmanager.co.ke',
      phone_number: '254700000001',
      role: 'SUPER_ADMIN' as UserRole,
      created_at: new Date().toISOString(),
    });
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

  // Trigger M-Pesa STK Push via n8n Webhook
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
          {profile?.role === 'SUPER_ADMIN' && (
            <>
              <a href="#subscriptions" className="block p-2 rounded hover:bg-slate-800">Subscriptions</a>
              <a href="#managers" className="block p-2 rounded hover:bg-slate-800">Property Managers</a>
              <a href="#system" className="block p-2 rounded hover:bg-slate-800">System Logs</a>
            </>
          )}

          {profile?.role === 'LANDLORD' && (
            <>
              <a href="#portfolio" className="block p-2 rounded hover:bg-slate-800">Portfolio Overview</a>
              <a href="#occupancy" className="block p-2 rounded hover:bg-slate-800">Occupancy Rates</a>
              <a href="#payouts" className="block p-2 rounded hover:bg-slate-800">Financial Payouts</a>
            </>
          )}

          {profile?.role === 'PROPERTY_MANAGER' && (
            <>
              <a href="#units" className="block p-2 rounded hover:bg-slate-800">Units & Tenants</a>
              <a href="#billing" className="block p-2 rounded hover:bg-slate-800">Monthly Billing</a>
              <a href="#reconciliation" className="block p-2 rounded hover:bg-slate-800">M-Pesa Reconciliation</a>
            </>
          )}

          {profile?.role === 'CARETAKER' && (
            <>
              <a href="#inspections" className="block p-2 rounded hover:bg-slate-800">Unit Inspections</a>
              <a href="#meters" className="block p-2 rounded hover:bg-slate-800">Water Meter Readings</a>
              <a href="#tickets" className="block p-2 rounded hover:bg-slate-800">Maintenance Requests</a>
            </>
          )}

          {profile?.role === 'TENANT' && (
            <>
              <a href="#invoices" className="block p-2 rounded hover:bg-slate-800">My Invoices</a>
              <a href="#pay" className="block p-2 rounded hover:bg-slate-800">Pay via M-Pesa</a>
              <a href="#tickets" className="block p-2 rounded hover:bg-slate-800">Repair Tickets</a>
            </>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800">
            Welcome, {profile?.full_name || 'User'}
          </h2>
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Logout
          </button>
        </header>

        {/* Dynamic Views According to Role */}

        {/* 1. TENANT VIEW */}
        {profile?.role === 'TENANT' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Invoices */}
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

            {/* Pay via M-Pesa Prompt */}
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

        {/* 2. CARETAKER VIEW */}
        {profile?.role === 'CARETAKER' && (
          <div className="bg-white p-6 rounded shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Record Water Meter Reading</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" placeholder="House Number (e.g. A102)" className="p-2 border rounded" />
              <input type="number" placeholder="Current Meter Units" className="p-2 border rounded" />
              <button className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Submit Reading</button>
            </div>
          </div>
        )}

        {/* 3. PROPERTY MANAGER & LANDLORD & SUPER ADMIN VIEWS */}
        {['PROPERTY_MANAGER', 'LANDLORD', 'SUPER_ADMIN'].includes(profile?.role || '') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded shadow-sm border-l-4 border-blue-500">
              <h4 className="text-sm font-bold text-gray-500">Total Properties</h4>
              <p className="text-3xl font-bold mt-2">12</p>
            </div>
            <div className="bg-white p-6 rounded shadow-sm border-l-4 border-emerald-500">
              <h4 className="text-sm font-bold text-gray-500">Occupancy Rate</h4>
              <p className="text-3xl font-bold mt-2">94%</p>
            </div>
            <div className="bg-white p-6 rounded shadow-sm border-l-4 border-amber-500">
              <h4 className="text-sm font-bold text-gray-500">Total Collected (This Month)</h4>
              <p className="text-3xl font-bold mt-2">KES 1,240,000</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}