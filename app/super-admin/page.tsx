'use client';

import React, { useState } from 'react';
import { TenantUnassignedPaymentsTab } from './tabs/TenantUnassignedPaymentsTab';
import { AddUsersTab } from './tabs/AddUsersTab';

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<string>('add-users');

  const navItems = [
    {
      section: 'OPERATIONS & SAAS MANAGEMENT',
      items: [
        { id: 'dashboard', label: 'Overview Dashboard', icon: '📊' },
        { id: 'subscribers', label: 'Subscribers & Agencies', icon: '🏢' },
        { id: 'add-users', label: 'User Onboarding', icon: '👤+' },
        { id: 'saas-invoicing', label: 'SaaS Invoicing', icon: '📄' },
      ],
    },
    {
      section: 'RECONCILIATION HUB',
      items: [
        { id: 'payments-overview', label: 'Payments Hub Overview', icon: '💳' },
        { id: 'saas-b2b-unassigned', label: 'SaaS B2B Unassigned', icon: '🏛️' },
        { id: 'tenant-unassigned-payments', label: 'Tenant Rent Unassigned', icon: '💵' },
      ],
    },
    {
      section: 'TECHNICAL & GOD-MODE CONTROLS',
      items: [
        { id: 'cron-lockdown', label: 'Cron & Emergency Lockdown', icon: '⏰' },
        { id: 'webhook-dlq', label: 'Webhook DLQ & Replay', icon: '🔄' },
        { id: 'tenant-impersonation', label: 'Tenant Impersonation', icon: '👥' },
      ],
    },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 shrink-0 flex flex-col justify-between p-4 z-20 overflow-y-auto">
        <div>
          {/* Logo / Header */}
          <div className="flex items-center space-x-3 px-3 py-3 border-b border-slate-800 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-amber-500/20">
              👑
            </div>
            <div>
              <h2 className="font-bold text-sm text-white tracking-wide">PropManager HQ</h2>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Superadmin Portal</p>
            </div>
          </div>

          {/* Navigation Links Grouped by Section */}
          <nav className="space-y-4 text-xs font-medium">
            {navItems.map((group) => (
              <div key={group.section} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {group.section}
                </div>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition text-left ${
                      activeTab === item.id
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer / Sign Out */}
        <div className="pt-4 border-t border-slate-800 px-3 py-2 text-xs flex flex-col space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="truncate text-[11px]">admin@propmanager.co.ke</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"></span>
          </div>
          <button
            onClick={() => console.log('Sign out')}
            className="w-full flex items-center space-x-2 px-2 py-1.5 text-slate-400 hover:text-rose-400 text-left transition rounded-lg hover:bg-slate-800/50"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Workspace Area */}
      <main className="flex-1 min-h-screen bg-slate-950 p-6 md:p-8 overflow-y-auto text-slate-100">
        {activeTab === 'add-users' ? (
          <AddUsersTab />
        ) : activeTab === 'tenant-unassigned-payments' || activeTab === 'unassigned-tenant-payments' ? (
          <TenantUnassignedPaymentsTab setActiveTab={setActiveTab} />
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100">
            <h1 className="text-xl font-bold text-white capitalize">{activeTab.replace(/-/g, ' ')}</h1>
            <p className="text-xs text-slate-400 mt-1">This module is active and loaded under SuperAdmin control.</p>
          </div>
        )}
      </main>
    </div>
  );
}
