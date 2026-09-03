// app/accountant/components/Sidebar.tsx
'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  CreditCard, 
  ArrowLeftRight, 
  DollarSign, 
  Building2, 
  LogOut 
} from 'lucide-react';
import { AccountantTab } from '../types';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  activeTab: AccountantTab;
  setActiveTab: (tab: AccountantTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { id: 'overview' as AccountantTab, label: 'Financial Overview', icon: LayoutDashboard },
    { id: 'rent-roll' as AccountantTab, label: 'Rent Roll', icon: Receipt },
    { id: 'invoices' as AccountantTab, label: 'Invoices & Billing', icon: CreditCard },
    { id: 'reconciliation' as AccountantTab, label: 'Reconciliation', icon: ArrowLeftRight },
    { id: 'payouts' as AccountantTab, label: 'Owner Payouts', icon: DollarSign },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <div className="bg-emerald-600 text-white p-2.5 rounded-xl flex items-center justify-center shadow-sm">
          <Building2 size={20} />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 tracking-tight text-base">PropManager HQ</h1>
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
            Finance Portal
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-3 mb-2">
          Finance Operations
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
                  ? 'bg-emerald-600 text-white shadow-sm'
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