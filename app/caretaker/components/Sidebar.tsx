'use client';

import React from 'react';
import { LayoutDashboard, Gauge, UserPlus, History, Wrench } from 'lucide-react';

export type CaretakerTab = 'dashboard' | 'meter' | 'add-tenant' | 'payments' | 'requests' | 'settings';

interface SidebarProps {
  activeTab: CaretakerTab;
  setActiveTab: (tab: CaretakerTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col justify-between shrink-0">
      <div>
        <h1 className="text-xl font-bold text-white mb-1 tracking-wide flex items-center gap-2">
          <Wrench className="text-emerald-400" size={22} />
          Caretaker Portal
        </h1>
        <p className="text-xs text-slate-400 mb-8">Property Management</p>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
              activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('meter')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
              activeTab === 'meter' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Gauge size={18} />
            Meter Readings
          </button>
          <button
            onClick={() => setActiveTab('add-tenant')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
              activeTab === 'add-tenant' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <UserPlus size={18} />
            Add Tenant
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
              activeTab === 'payments' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <History size={18} />
            Payment History
          </button>
        </nav>
      </div>
      <div className="text-xs text-slate-500">Caretaker Mode v1.0.0</div>
    </aside>
  );
};