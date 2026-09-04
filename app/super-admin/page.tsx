'use client';

import React, { useState } from 'react';
import { SuperAdminTab } from './types';
import { TenantUnassignedPaymentsTab } from './tabs/TenantUnassignedPaymentsTab';
import { AddUsersTab } from './tabs/AddUsersTab';

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('add-users');

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation - Solid Dark Slate */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 shrink-0 flex flex-col justify-between p-4 z-20">
        <div>
          {/* Logo / Header */}
          <div className="flex items-center space-x-3 px-3 py-3 border-b border-slate-800 mb-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30">
              P
            </div>
            <div>
              <h2 className="font-bold text-sm text-white tracking-wide">PropManager HQ</h2>
              <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Superadmin Portal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-medium">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Operations & SaaS Management
            </div>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl transition text-left ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              Overview Dashboard
            </button>
            <button
              onClick={() => setActiveTab('add-users')}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl transition text-left ${
                activeTab === 'add-users'
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              User Onboarding
            </button>

            <div className="pt-4 px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Reconciliation Hub
            </div>
            <button
              onClick={() => setActiveTab('tenant-unassigned-payments')}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl transition text-left ${
                activeTab === 'tenant-unassigned-payments' || activeTab === 'unassigned-tenant-payments'
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              Tenant Rent Unassigned
            </button>
          </nav>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 px-3 py-2 text-xs text-slate-400 flex items-center justify-between">
          <span className="truncate text-slate-300">admin@propmanager.co.ke</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"></span>
        </div>
      </aside>

      {/* Main Content Workspace - Enforced Dark slate-950 background */}
      <main className="flex-1 min-h-screen bg-slate-950 p-6 md:p-10 overflow-y-auto">
        {activeTab === 'tenant-unassigned-payments' || activeTab === 'unassigned-tenant-payments' ? (
          <TenantUnassignedPaymentsTab setActiveTab={setActiveTab} />
        ) : activeTab === 'add-users' ? (
          <AddUsersTab />
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100">
            <h1 className="text-xl font-bold text-white">Super Admin Dashboard</h1>
            <p className="text-xs text-slate-400 mt-1">Select an operational module from the sidebar navigation.</p>
          </div>
        )}
      </main>
    </div>
  );
}
