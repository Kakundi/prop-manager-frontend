import React from 'react';
import { SuperAdminTab } from '../types';

interface SidebarProps {
  activeTab: SuperAdminTab;
  setActiveTab: (tab: SuperAdminTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems: { id: SuperAdminTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'subscribers', label: 'Subscribers', icon: '👥' },
    { id: 'generate-invoice', label: 'Generate Invoice', icon: '📄' },
    { id: 'add-users', label: 'Add Users', icon: '➕' },
    { id: 'unassigned-payments', label: 'Unassigned Payments', icon: '💳' },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between">
      <div className="p-4 space-y-4">
        <div className="text-lg font-bold text-white tracking-wider px-3">
          SUPER ADMIN
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};