'use client';

import React from 'react';
import { LayoutDashboard, Gauge, FileText, Settings, LogOut } from 'lucide-react';
import { CaretakerTab } from '../page';

interface SidebarProps {
  activeTab: CaretakerTab;
  setActiveTab: (tab: CaretakerTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems: { id: CaretakerTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'meter-reading', label: 'Meter Readings', icon: <Gauge size={18} /> },
    { id: 'tenant-requests', label: 'Tenant Requests', icon: <FileText size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-wide text-emerald-400">Caretaker Portal</h1>
          <p className="text-xs text-slate-400 mt-1">Property Management</p>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                activeTab === item.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 flex items-center justify-between">
        <div className="text-xs text-slate-400">
          <p className="font-medium text-slate-300">Caretaker Mode</p>
          <p className="text-[10px]">v1.0.0</p>
        </div>
        <button
          onClick={() => alert('Logging out...')}
          className="text-slate-400 hover:text-red-400 p-2 rounded-lg transition"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};