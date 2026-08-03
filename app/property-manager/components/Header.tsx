'use client';

import React from 'react';

interface HeaderProps {
  fullName: string;
}

export const Header: React.FC<HeaderProps> = ({ fullName }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-800">
        Welcome Back <span className="text-blue-600">"{fullName}"</span>
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        Here is what's happening across your assigned properties today.
      </p>
    </header>
  );
};