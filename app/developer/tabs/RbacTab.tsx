// app/developer/tabs/RbacTab.tsx
'use client';

import React from 'react';
import { Shield, Users, Key } from 'lucide-react';

export const RbacTab: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Role-Based Access Control (RBAC)</h2>
        <p className="text-xs text-gray-500">Manage global permissions across Admin, Marketer, Accountant, and Tenant roles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {['Marketer', 'Accountant', 'Developer'].map((role) => (
          <div key={role} className="border border-gray-200 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between font-bold text-gray-900">
              <span>{role} Role</span>
              <Shield size={16} className="text-indigo-600" />
            </div>
            <p className="text-gray-500 text-[11px]">Full access to operational features within the {role.toLowerCase()} portal.</p>
          </div>
        ))}
      </div>
    </div>
  );
};