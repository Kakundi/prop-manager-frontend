// app/super-admin/tabs/SystemControlTab.tsx
'use client';

import React, { useState } from 'react';
import { ShieldAlert, Play, ToggleRight, ToggleLeft, AlertTriangle } from 'lucide-react';

export const SystemControlTab: React.FC = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [runningJob, setRunningJob] = useState<string | null>(null);

  const jobs = [
    {
      id: 'job_monthly_invoices',
      name: 'Batch Monthly Rent Invoicing',
      description: 'Generates recurring monthly rent and utility invoices for all active leases across agencies.',
      lastRun: 'Today, 00:00 EAT',
    },
    {
      id: 'job_mpesa_reconcile',
      name: 'M-Pesa Auto-Match Worker',
      description: 'Scans unassigned C2B payments and attempts fuzzy matching on house numbers.',
      lastRun: '15 minutes ago',
    },
    {
      id: 'job_whatsapp_dispatch',
      name: 'WhatsApp Bot Rent Reminders',
      description: 'Dispatches automated payment notifications to tenants with balance > 0.',
      lastRun: 'Yesterday, 08:00 EAT',
    },
  ];

  const handleRunJob = async (id: string) => {
    setRunningJob(id);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRunningJob(null);
    alert(`Job [${id}] triggered and completed successfully.`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-6 text-red-200 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-red-400 text-sm">
            <AlertTriangle size={18} /> Maintenance Mode & Emergency Lockdown
          </div>
          <p className="text-xs text-red-300">
            Locks down database mutations across client portals during critical database maintenance or outage windows.
          </p>
        </div>
        <button onClick={() => setMaintenanceMode(!maintenanceMode)}>
          {maintenanceMode ? (
            <ToggleRight size={40} className="text-red-500" />
          ) : (
            <ToggleLeft size={40} className="text-slate-600" />
          )}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
        <h3 className="font-bold text-gray-900 text-sm">Manual Job Runner & Queue Trigger</h3>
        <div className="divide-y divide-gray-100">
          {jobs.map((job) => (
            <div key={job.id} className="py-3.5 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <p className="font-bold text-gray-900">{job.name}</p>
                <p className="text-gray-500 text-[11px]">{job.description}</p>
                <p className="text-gray-400 text-[10px]">Last execution: {job.lastRun}</p>
              </div>
              <button
                onClick={() => handleRunJob(job.id)}
                disabled={runningJob === job.id}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg transition text-xs disabled:opacity-50 shrink-0"
              >
                <Play size={12} className={runningJob === job.id ? 'animate-spin' : ''} />
                {runningJob === job.id ? 'Executing...' : 'Run Worker'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};