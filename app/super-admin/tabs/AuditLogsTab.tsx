// app/super-admin/tabs/AuditLogsTab.tsx
'use client';

import React, { useState } from 'react';
import { Shield, Search, Filter, Clock, User, AlertCircle } from 'lucide-react';

export interface AuditLogItem {
  id: string;
  actor_email: string;
  action: string;
  target_organization: string;
  ip_address: string;
  status: 'success' | 'failed' | 'warning';
  timestamp: string;
}

export const AuditLogsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const mockLogs: AuditLogItem[] = [
    {
      id: 'log_901',
      actor_email: 'superadmin@propmanager.co.ke',
      action: 'IMPERSONATE_USER',
      target_organization: 'Kiprono Real Estate',
      ip_address: '102.217.64.12',
      status: 'warning',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'log_902',
      actor_email: 'superadmin@propmanager.co.ke',
      action: 'REPLAY_MPESA_WEBHOOK',
      target_organization: 'Greenwood Heights',
      ip_address: '102.217.64.12',
      status: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: 'log_903',
      actor_email: 'accounts@kiprono.co.ke',
      action: 'MANUAL_RECONCILE_PAYMENT',
      target_organization: 'Kiprono Real Estate',
      ip_address: '197.232.14.88',
      status: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Platform Audit Logs</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Immutable tracking of administrative actions, user impersonations, and security events.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by actor, action, or agency..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-bold">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Action</th>
                <th className="p-3">Target Agency</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {mockLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-3 text-gray-500 text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3 font-bold text-gray-800">{log.actor_email}</td>
                  <td className="p-3 font-bold text-indigo-600">{log.action}</td>
                  <td className="p-3 text-gray-700">{log.target_organization}</td>
                  <td className="p-3 text-gray-500 text-[11px]">{log.ip_address}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.status === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};