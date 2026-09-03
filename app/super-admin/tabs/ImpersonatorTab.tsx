// app/super-admin/tabs/ImpersonatorTab.tsx
'use client';

import React, { useState } from 'react';
import { ShieldAlert, LogIn, Search } from 'lucide-react';

export const ImpersonatorTab: React.FC = () => {
  const [targetUser, setTargetUser] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStartImpersonation = async () => {
    if (!targetUser) return;
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    alert(`Debug session established for ${targetUser}. Opening tenant interface in read-only mode...`);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 max-w-2xl shadow-sm">
      <div className="border-b border-gray-100 pb-4">
        <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-xs px-3 py-1 rounded-full font-bold mb-2 border border-amber-200">
          <ShieldAlert size={14} className="text-amber-600" /> Superadmin Diagnostic Access
        </div>
        <h2 className="text-lg font-bold text-gray-900">User Session Impersonation</h2>
        <p className="text-xs text-gray-500 mt-1">
          Spawn a 15-minute read-only token to view UI layout and state directly as any Landlord, Accountant, or Tenant.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-2">User Email or Phone Number</label>
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="e.g. accounts@kiprono.co.ke or +254712345678"
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleStartImpersonation}
          disabled={loading || !targetUser}
          className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-3 rounded-xl transition shadow-sm disabled:opacity-50"
        >
          <LogIn size={16} />
          {loading ? 'Generating Session...' : 'Impersonate Session'}
        </button>
      </div>
    </div>
  );
};