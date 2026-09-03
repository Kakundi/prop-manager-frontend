// app/developer/components/Header.tsx
'use client';

import React from 'react';
import { Terminal, Cpu, Bell, Activity } from 'lucide-react';

interface HeaderProps {
  userEmail?: string;
}

export const Header: React.FC<HeaderProps> = ({ userEmail = 'dev@propmanager.co.ke' }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between text-slate-300 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Prod Cluster: us-east-1</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 text-xs font-mono">
          <Cpu size={13} />
          <span>v2.4.0-stable</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full"></span>
        </button>

        <div className="h-5 w-px bg-slate-800"></div>

        <div className="flex items-center gap-2.5 font-mono text-xs">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
            <Terminal size={14} />
          </div>
          <span className="text-slate-200">{userEmail}</span>
        </div>
      </div>
    </header>
  );
};