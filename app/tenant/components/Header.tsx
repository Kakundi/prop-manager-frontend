'use client';

import React from 'react';
import { Home, Phone } from 'lucide-react';

interface HeaderProps {
  fullName: string;
  propertyName: string;
  unitNumber: string;
  caretakerName: string;
  caretakerPhone: string;
}

export const Header: React.FC<HeaderProps> = ({
  fullName,
  propertyName,
  unitNumber,
  caretakerName,
  caretakerPhone,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome Back <span className="text-blue-600">&quot;{fullName}&quot;</span>
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
          <Home size={16} className="text-gray-400" />
          <span>
            <strong className="text-gray-700">{propertyName}</strong> &mdash; Unit{' '}
            <span className="font-semibold text-blue-600">{unitNumber}</span>
          </span>
        </div>
      </div>

      {/* CALL CARETAKER PUSH BUTTON */}
      <a
        href={`tel:${caretakerPhone}`}
        className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition shadow-sm"
      >
        <Phone size={16} />
        Call Caretaker ({caretakerName})
      </a>
    </header>
  );
};