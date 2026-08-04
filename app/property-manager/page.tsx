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
  Building2,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

// Import tab components
import { DashboardTab } from './tabs/DashboardTab';
import { AddPropertyTab } from './tabs/AddPropertyTab';
import { UserManagementTab } from './tabs/UserManagementTab';
import { TenantsTab } from './tabs/TenantsTab';
import { UnassignedPaymentsTab } from './tabs/UnassignedPaymentsTab';
import { SubscriptionsTab } from './tabs/SubscriptionsTab';

export interface UserProfile {
  id?: string;
  full_name?: string;
  email?: string;
  role?: string;
}

type TabType = 'dashboard' | 'add-property' | 'user-management' | 'tenants' | 'unassigned-payments' | 'subscriptions';

export default function PropertyManagerPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  // Fetch authenticated user profile directly from database/session endpoint
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoadingUser(true);
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error('Error fetching user profile from database:', err);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Format real full name directly from DB record, fallback gracefully if loading
  const realFullName = user?.full_name?.trim() ? user.full_name : null;

  const navigationItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'add-property' as TabType, label: 'Add Property', icon: Building },
    { id: 'user-management' as TabType, label: 'User Management', icon: UserPlus },
    { id: 'tenants' as TabType, label: 'Tenants', icon: Users },
    { id: 'unassigned-payments' as TabType, label: 'Unassigned Payments', icon: HelpCircle },
    { id: 'subscriptions' as TabType, label: 'Subscriptions', icon: CreditCard },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 shrink-0">
        <div>
          {/* App Brand Header */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950/40">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Building2 size={20} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">PropManager</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Manager Portal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Main Menu
            </div>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={14} className="text-blue-200" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
              {loadingUser ? <Loader2 size={14} className="animate-spin" /> : (realFullName ? realFullName.charAt(0) : 'U')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {loadingUser ? 'Loading profile...' : (realFullName || 'Authenticated User')}
              </p>
              <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-400 inline" /> Property Manager
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* TOP WORKSPACE HEADER / HERO BANNER (Consistent with portal pages) */}
        <header className="bg-slate-900 border-b border-slate-800 px-8 py-6 text-white shrink-0 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase mb-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                Property Manager Portal
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Welcome back,{' '}
                <span className="text-blue-400">
                  {loadingUser ? (
                    <span className="inline-flex items-center gap-2 text-slate-300 text-lg">
                      <Loader2 size={18} className="animate-spin" /> Fetching DB user profile...
                    </span>
                  ) : (
                    realFullName || 'Property Manager'
                  )}
                </span> 👋
              </h1>
              <p className="text-slate-300 text-xs md:text-sm mt-1">
                Manage your real estate portfolio, assign tenant credentials, resolve unassigned payments, and track platform subscription billing in real time.
              </p>
            </div>
          </div>
        </header>

        {/* TAB WORKSPACE */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/60">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'add-property' && <AddPropertyTab />}
            {activeTab === 'user-management' && <UserManagementTab />}
            {activeTab === 'tenants' && <TenantsTab />}
            {activeTab === 'unassigned-payments' && <UnassignedPaymentsTab />}
            {activeTab === 'subscriptions' && <SubscriptionsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}