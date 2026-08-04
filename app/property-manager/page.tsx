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
  LogOut,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

// Import all tab components
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

  // Fetch logged-in user details on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoadingUser(true);
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null);
        }
      } catch (err) {
        console.error('User profile session fetch error:', err);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Compute display name safely with smooth fallback
  const displayName = user?.full_name?.trim() ? user.full_name : 'Brian Nyamai';

  const navigationItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'add-property' as TabType, label: 'Add Property', icon: Building },
    { id: 'user-management' as TabType, label: 'User Management', icon: UserPlus },
    { id: 'tenants' as TabType, label: 'Tenants', icon: Users },
    { id: 'unassigned-payments' as TabType, label: 'Unassigned Payments', icon: HelpCircle },
    { id: 'subscriptions' as TabType, label: 'Subscriptions', icon: CreditCard },
  ];

  const getActiveTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'add-property': return 'Property Registration';
      case 'user-management': return 'User Access Management';
      case 'tenants': return 'Tenant Directory';
      case 'unassigned-payments': return 'Unassigned Payments Audit';
      case 'subscriptions': return 'Platform Billing & Subscriptions';
      default: return 'Portal';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* 1. SIDE NAVIGATION MENU */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 shrink-0">
        <div>
          {/* Logo / Brand Header */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950/40">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Building2 size={20} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">PropManager</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Manager Portal</p>
            </div>
          </div>

          {/* Navigation Items */}
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

        {/* Footer User Profile Summary inside Side Menu */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
              {displayName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{displayName}</p>
              <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-400 inline" /> Property Manager
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{getActiveTabTitle()}</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-gray-900">
                Welcome, <span className="text-blue-600">{loadingUser ? '...' : displayName}</span>
              </p>
              <p className="text-[11px] text-gray-500">Real Estate Manager</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs">
              {displayName.charAt(0)}
            </div>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/60">
          <div className="max-w-7xl mx-auto space-y-6">
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