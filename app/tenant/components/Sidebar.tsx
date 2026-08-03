'use client';

import React from 'react';
import { LayoutDashboard, History } from 'lucide-react';
import { TenantTab } from '../types';

interface SidebarProps {
  activeTab: TenantTab;
  setActiveTab: (tab: TenantTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems: { id: TenantTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'payments', label: 'Payment History', icon: <History size={18} /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0">
      <div>
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-wide text-blue-400">Tenant Portal</h1>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        &copy; 2026 Property Portal
      </div>
    </aside>
  );
};