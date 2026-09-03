// app/developer/tabs/AuditLogsTab.tsx
'use client';

import React from 'react';
import { History, ShieldAlert } from 'lucide-react';

export const AuditLogsTab: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Immutable System Audit Trail</h2>
        <p className="text-xs text-gray-500">Security audit log for sensitive mutations (permission updates, data exports).</p>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600">
            <tr>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Actor</th>
              <th className="p-3">Action</th>
              <th className="p-3">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="p-3 font-mono">{new Date().toLocaleTimeString()}</td>
              <td className="p-3 font-bold text-gray-900">brian@propmanager.co.ke</td>
              <td className="p-3 text-indigo-600">MODIFIED_ROLE_PERMISSIONS</td>
              <td className="p-3 font-mono text-gray-500">197.232.X.X</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};