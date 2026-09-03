// app/accountant/components/Header.tsx
'use client';

import React from 'react';
import { Search, Bell, ShieldCheck, User } from 'lucide-react';

interface HeaderProps {
  userEmail?: string;
  userName?: string;
}

export const Header: React.FC<HeaderProps> = ({ userEmail = 'accountant@propmanager.co.ke', userName = 'Finance Admin' }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tenant, transaction ref, invoice #..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold">
          <ShieldCheck size={14} />
          <span>Financial Audit Active</span>
        </div>

        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-600 rounded-full ring-2 ring-white"></span>
        </button>

        <div className="h-6 w-px bg-gray-200"></div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-gray-900 leading-none">{userName}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{userEmail}</p>
          </div>
        </div>
      </div>
    </header>
  );
};