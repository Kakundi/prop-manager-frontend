// app/marketer/components/Header.tsx
'use client';

import React from 'react';
import { UserCheck, Bell } from 'lucide-react';

interface HeaderProps {
  fullName: string;
}

export const Header: React.FC<HeaderProps> = ({ fullName }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500">Portal /</span>
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
          Growth & Onboarding
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full"></span>
        </button>

        <div className="h-6 w-px bg-gray-200"></div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
            {fullName ? fullName.charAt(0).toUpperCase() : 'M'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-gray-900 leading-tight">{fullName}</p>
            <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
              <UserCheck size={10} className="text-green-600" /> Authorized Marketer
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};