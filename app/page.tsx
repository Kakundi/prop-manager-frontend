'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  PhoneCall,
  Building,
  User,
  ShieldCheck,
  FileText,
  CreditCard,
  LogOut,
  Users,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'LANDLORD' | 'PROPERTY_MANAGER' | 'CARETAKER' | 'TENANT';
  tenant_id?: string;
}

interface Property {
  id: string;
  name: string;
  location: string;
  caretaker_name?: string;
  caretaker_phone?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      // Fetch Profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileErr || !profileData) {
        console.error('Error fetching profile:', profileErr);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch Properties accessible to this user via RLS
      const { data: propertyData } = await supabase
        .from('properties')
        .select('*');

      if (propertyData) {
        setProperties(propertyData);
      }

      setLoading(false);
    }

    loadUserData();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-400">Loading Dashboard & RLS Context...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* ------------------------------------------------------------------- */}
      {/* NAVBAR                                                              */}
      {/* ------------------------------------------------------------------- */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Building className="w-6 h-6 text-blue-500" />
          <span className="font-bold text-lg text-white">PropManager HQ</span>
        </div>

        {profile && (
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white">{profile.full_name}</p>
              <p className="text-xs text-blue-400 font-mono">{profile.role}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </header>

      {/* ------------------------------------------------------------------- */}
      {/* MAIN DASHBOARD CONTENT BY ROLE                                      */}
      {/* ------------------------------------------------------------------- */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {profile?.full_name}!
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Active Role: <span className="text-amber-400 font-semibold">{profile?.role}</span>
            </p>
          </div>
          <div className="text-xs bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 font-mono text-slate-400">
            Auth ID: {profile?.id.substring(0, 8)}...
          </div>
        </div>

        {/* ================================================================= */}
        {/* ROLE 1: TENANT DASHBOARD                                          */}
        {/* ================================================================= */}
        {profile?.role === 'TENANT' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Call Caretaker Section */}
            <div className="bg-gradient-to-br from-amber-900/40 to-slate-900 border border-amber-500/30 rounded-xl p-6 space-y-4">
              <div className="flex items-center space-x-3 text-amber-400">
                <PhoneCall className="w-6 h-6" />
                <h2 className="font-bold text-lg">Direct Caretaker Contact</h2>
              </div>
              <p className="text-xs text-slate-300">
                Need urgent assistance, repairs, or inquiries? Reach your property caretaker immediately.
              </p>
              {properties.length > 0 && properties[0].caretaker_phone ? (
                <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800 space-y-2">
                  <p className="text-xs text-slate-400">Caretaker: <span className="text-white font-semibold">{properties[0].caretaker_name || 'Samuel Otieno'}</span></p>
                  <a
                    href={`tel:${properties[0].caretaker_phone}`}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 rounded-lg flex items-center justify-center space-x-2 transition"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call Caretaker ({properties[0].caretaker_phone})</span>
                  </a>
                </div>
              ) : (
                <a
                  href="tel:254700123456"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 rounded-lg flex items-center justify-center space-x-2 transition"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call Caretaker (+254 700 123 456)</span>
                </a>
              )}
            </div>

            {/* Tenant Overview */}
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h2 className="font-bold text-lg text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <span>My Unit & Invoices</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <p className="text-xs text-slate-400">Current Status</p>
                  <p className="text-lg font-bold text-emerald-400 mt-1">Paid in Full</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <p className="text-xs text-slate-400">Next Due Date</p>
                  <p className="text-lg font-bold text-white mt-1">1st Next Month</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* ROLE 2: CARETAKER DASHBOARD                                       */}
        {/* ================================================================= */}
        {profile?.role === 'CARETAKER' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                <Users className="w-6 h-6 text-amber-400 mb-2" />
                <h3 className="text-sm font-medium text-slate-400">Assigned Tenants</h3>
                <p className="text-2xl font-bold text-white mt-1">12 Occupied</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                <FileText className="w-6 h-6 text-blue-400 mb-2" />
                <h3 className="text-sm font-medium text-slate-400">Pending Utility Invoices</h3>
                <p className="text-2xl font-bold text-white mt-1">3 Water / Garbage</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                <PhoneCall className="w-6 h-6 text-emerald-400 mb-2" />
                <h3 className="text-sm font-medium text-slate-400">Caretaker Line</h3>
                <p className="text-lg font-mono text-emerald-400 mt-1">+254 712 999 888</p>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* ROLE 3 & 4: PROPERTY MANAGER & LANDLORD DASHBOARD                 */}
        {/* ================================================================= */}
        {(profile?.role === 'PROPERTY_MANAGER' || profile?.role === 'LANDLORD') && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                <Building className="w-6 h-6 text-blue-400 mb-2" />
                <h3 className="text-xs font-medium text-slate-400">Managed Properties</h3>
                <p className="text-2xl font-bold text-white mt-1">{properties.length}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                <DollarSign className="w-6 h-6 text-emerald-400 mb-2" />
                <h3 className="text-xs font-medium text-slate-400">Monthly Revenue</h3>
                <p className="text-2xl font-bold text-white mt-1">KES 450,000</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                <CreditCard className="w-6 h-6 text-amber-400 mb-2" />
                <h3 className="text-xs font-medium text-slate-400">Unassigned Payments</h3>
                <p className="text-2xl font-bold text-amber-400 mt-1">2 Pending</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                <Users className="w-6 h-6 text-indigo-400 mb-2" />
                <h3 className="text-xs font-medium text-slate-400">Occupancy Rate</h3>
                <p className="text-2xl font-bold text-white mt-1">94%</p>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* ROLE 5: SUPER ADMIN DASHBOARD                                     */}
        {/* ================================================================= */}
        {profile?.role === 'SUPER_ADMIN' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-purple-950/30 border border-purple-800/40 p-6 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-purple-400 mb-2" />
                <h3 className="text-xs font-medium text-slate-400">System Admin Control</h3>
                <p className="text-xl font-bold text-purple-300 mt-1">Full System Override</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                <Users className="w-6 h-6 text-blue-400 mb-2" />
                <h3 className="text-xs font-medium text-slate-400">Total System Profiles</h3>
                <p className="text-2xl font-bold text-white mt-1">13 Auth Users</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                <Building className="w-6 h-6 text-emerald-400 mb-2" />
                <h3 className="text-xs font-medium text-slate-400">Properties Managed</h3>
                <p className="text-2xl font-bold text-white mt-1">{properties.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Active Managed Properties List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <Building className="w-5 h-5 text-blue-400" />
            <span>Accessible Properties (Filtered by RLS)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {properties.map((prop) => (
              <div key={prop.id} className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <h3 className="font-bold text-white">{prop.name}</h3>
                <p className="text-xs text-slate-400 mt-1">Location: {prop.location}</p>
                {prop.caretaker_name && (
                  <p className="text-xs text-amber-400 mt-2">
                    Caretaker: {prop.caretaker_name} ({prop.caretaker_phone})
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}