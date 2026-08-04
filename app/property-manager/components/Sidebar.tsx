'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Users, 
  UserPlus, 
  Receipt, 
  CreditCard,
  Building2,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { ManagerTab } from '../types';

interface SidebarProps {
  activeTab: ManagerTab;
  setActiveTab: (tab: ManagerTab) => void;
  fullName?: string;
  loadingUser?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  fullName, 
  loadingUser 
}) => {
  const navItems: { id: ManagerTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'add-property', label: 'Add Property', icon: <PlusCircle size={18} /> },
    { id: 'users', label: 'User Management', icon: <UserPlus size={18} /> },
    { id: 'tenants', label: 'Tenants & Payments', icon: <Users size={18} /> },
    { id: 'unassigned-payments', label: 'Unassigned Payments', icon: <Receipt size={18} /> },
    { id: 'subscription', label: 'Subscriptions', icon: <CreditCard size={18} /> },
  ];

  const displayName = fullName && fullName.trim() !== '' ? fullName : 'Property Manager';

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 shrink-0">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950/40">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <Building2 size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">PropManager</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Manager Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Main Menu
          </div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile Card */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
            {loadingUser ? <Loader2 size={14} className="animate-spin" /> : displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {loadingUser ? 'Loading profile...' : displayName}
            </p>
            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-400 inline" /> Property Manager
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};