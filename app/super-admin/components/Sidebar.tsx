'use client';

import React from 'react';
import { SuperAdminTab } from '../types';
import { LayoutDashboard, UserPlus, CreditCard, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface SidebarProps {
  activeTab: SuperAdminTab;
  setActiveTab: (tab: SuperAdminTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems: { id: SuperAdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'add-users', label: 'ADD USERS', icon: UserPlus },
    { id: 'unassigned-payments', label: 'UNASSIGNED PAYMENTS', icon: CreditCard },
  ];

  const isUnassignedActive =
    activeTab === 'unassigned-payments' ||
    activeTab === 'unassigned-tenant-payments' ||
    activeTab === 'unassigned-saas-payments';

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between hidden md:flex">
      <div>
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-wider text-indigo-400">
            SaaS Admin Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">System Controller</p>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === 'unassigned-payments' ? isUnassignedActive : activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 space-y-4">
        <div className="flex items-center space-x-3 px-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
            SA
          </div>
          <div>
            <p className="text-xs font-bold text-white">Superadmin</p>
            <p className="text-[10px] text-slate-400">System Controller</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};