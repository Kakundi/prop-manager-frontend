'use client';

import React from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  fullName: string;
}

export const Header: React.FC<HeaderProps> = ({ fullName }) => {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-slate-900/60 border-b border-slate-800 backdrop-blur-md px-6 flex items-center justify-between">
      <div className="text-sm font-semibold text-slate-200">
        Welcome Back, <span className="text-indigo-400 font-bold">{fullName}</span>
      </div>

      <div className="flex items-center space-x-4">
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold">
          SYSTEM LIVE
        </span>
        <button
          onClick={handleLogout}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
};