// app/developer/components/Sidebar.tsx
'use client';

import React from 'react';
import { 
  Activity, 
  FileCode, 
  ShieldCheck, 
  History, 
  ToggleRight, 
  Terminal, 
  LogOut 
} from 'lucide-react';
import { DeveloperTab } from '../types';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  activeTab: DeveloperTab;
  setActiveTab: (tab: DeveloperTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { id: 'system-health' as DeveloperTab, label: 'System Health & Services', icon: Activity },
    { id: 'api-logs' as DeveloperTab, label: 'API & Webhook Logs', icon: FileCode },
    { id: 'rbac' as DeveloperTab, label: 'RBAC & User Access', icon: ShieldCheck },
    { id: 'audit-logs' as DeveloperTab, label: 'Audit Trail', icon: History },
    { id: 'feature-flags' as DeveloperTab, label: 'Feature Flags', icon: ToggleRight },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-indigo-600 text-white p-2.5 rounded-xl flex items-center justify-center shadow-sm">
          <Terminal size={20} />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-tight text-base">PropManager HQ</h1>
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-900/50 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-700/50">
            Dev Console
          </span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">
          System Control
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
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition"
        >
          <LogOut size={18} className="text-slate-500 hover:text-red-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};