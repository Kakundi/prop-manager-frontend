'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Building, 
  UserPlus, 
  Users, 
  CreditCard, 
  HelpCircle,
  Loader2,
  AlertCircle 
} from 'lucide-react';

// Import all tab components
import { DashboardTab } from './tabs/DashboardTab';
import { AddPropertyTab } from './tabs/AddPropertyTab';
import { UserManagementTab } from './tabs/UserManagementTab';
import { TenantsTab } from './tabs/TenantsTab';
import { UnassignedPaymentsTab } from './tabs/UnassignedPaymentsTab';
import { SubscriptionsTab } from './tabs/SubscriptionsTab';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

type TabType = 'dashboard' | 'add-property' | 'user-management' | 'tenants' | 'unassigned-payments' | 'subscriptions';

export default function PropertyManagerPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [userError, setUserError] = useState<string | null>(null);

  // Fetch logged-in user details on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoadingUser(true);
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        
        if (!res.ok) {
          throw new Error('Failed to load user profile session.');
        }
        
        const data = await res.json();
        setUser(data.user || null);
      } catch (err: any) {
        console.error('User profile fetch error:', err);
        setUserError(err.message || 'Could not verify session.');
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Compute display name safely
  const displayName = user?.full_name?.trim() ? user.full_name : 'Property Manager';

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HERO SECTION WITH REAL FULL NAME */}
        <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              Property Manager Portal
            </div>

            {loadingUser ? (
              <div className="flex items-center gap-3 my-2">
                <Loader2 className="animate-spin text-blue-400" size={28} />
                <span className="text-xl text-slate-300">Loading your profile...</span>
              </div>
            ) : (
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Welcome back, <span className="text-blue-400">{displayName}</span> 👋
              </h1>
            )}

            <p className="text-slate-300 text-sm md:text-base mt-2 leading-relaxed">
              Manage your real estate portfolio, assign tenant credentials, resolve unassigned payments, and track platform subscription billing in real time.
            </p>
          </div>
        </section>

        {userError && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-center gap-2">
            <AlertCircle size={18} />
            <span>Note: Displaying fallback user details ({userError})</span>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <nav className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('add-property')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'add-property'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Building size={18} />
            Add Property
          </button>

          <button
            onClick={() => setActiveTab('user-management')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'user-management'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <UserPlus size={18} />
            User Management
          </button>

          <button
            onClick={() => setActiveTab('tenants')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'tenants'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Users size={18} />
            Tenants
          </button>

          <button
            onClick={() => setActiveTab('unassigned-payments')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'unassigned-payments'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <HelpCircle size={18} />
            Unassigned Payments
          </button>

          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'subscriptions'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <CreditCard size={18} />
            Subscriptions
          </button>
        </nav>

        {/* TAB CONTENT PANEL */}
        <main className="transition-all duration-200">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'add-property' && <AddPropertyTab />}
          {activeTab === 'user-management' && <UserManagementTab />}
          {activeTab === 'tenants' && <TenantsTab />}
          {activeTab === 'unassigned-payments' && <UnassignedPaymentsTab />}
          {activeTab === 'subscriptions' && <SubscriptionsTab />}
        </main>

      </div>
    </div>
  );
}