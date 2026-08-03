'use client';

import React from 'react';
import { Bell, User } from 'lucide-react';

interface HeaderProps {
  fullName: string;
}

export const Header: React.FC<HeaderProps> = ({ fullName }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Welcome back, {fullName}</h1>
        <p className="text-xs text-gray-500">
          Overview of your property performance and management
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 border-l pl-4 border-gray-200">
          <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
            <User className="w-5 h-5" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-gray-800">{fullName}</p>
            <p className="text-xs text-gray-400">Property Owner</p>
          </div>
        </div>
      </div>
    </header>
  );
};