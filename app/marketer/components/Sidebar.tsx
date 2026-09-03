// app/marketer/components/Sidebar.tsx
'use client';

import React from 'react';
import { LayoutDashboard, UserPlus, Building, UserCheck, Building2, LogOut } from 'lucide-react';
import { MarketerTab } from '../types';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  activeTab: MarketerTab;
  setActiveTab: (tab: MarketerTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    {
      id: 'dashboard' as MarketerTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'add-clients' as MarketerTab,
      label: 'Add Clients',
      icon: UserPlus,
    },
    {
      id: 'add-properties' as MarketerTab,
      label: 'Add Properties',
      icon: Building,
    },
    {
      id: 'add-user' as MarketerTab,
      label: 'Add User',
      icon: UserCheck,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <div className="bg-blue-600 text-white p-2.5 rounded-xl flex items-center justify-center shadow-sm">
          <Building2 size={20} />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 tracking-tight text-base">PropManager HQ</h1>
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
            Growth Portal
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-3 mb-2">
          Main Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
        >
          <LogOut size={18} className="text-gray-500 hover:text-red-600" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};