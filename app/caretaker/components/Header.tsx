'use client';

import React from 'react';

interface HeaderProps {
  fullName: string;
  propertyName: string;
}

export const Header: React.FC<HeaderProps> = ({ fullName, propertyName }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-800">
        Welcome back <span className="text-emerald-600">"{fullName}"</span>
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        Managing Building: <span className="font-semibold text-gray-700">{propertyName}</span>
      </p>
    </header>
  );
};