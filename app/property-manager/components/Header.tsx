'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface HeaderProps {
  fullName?: string;
  loading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ fullName, loading }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-8 py-6 text-white shrink-0 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Property Manager Portal
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome back,{' '}
            <span className="text-blue-400">
              {loading ? (
                <span className="inline-flex items-center gap-2 text-slate-300 text-lg font-normal">
                  <Loader2 size={18} className="animate-spin" /> Fetching database profile...
                </span>
              ) : fullName && fullName.trim() !== '' ? (
                fullName
              ) : (
                'Property Manager'
              )}
            </span> 👋
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1">
            Manage your real estate portfolio, assign tenant credentials, resolve unassigned payments, and track platform subscription billing in real time.
          </p>
        </div>
      </div>
    </header>
  );
};