'use client';

import React, { useState, useEffect } from 'react';
import { SuperAdminTab } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardTab } from './tabs/DashboardTab';
import { AddUsersTab } from './tabs/AddUsersTab';
import { UnassignedPaymentsHubTab } from './tabs/UnassignedPaymentsHubTab';
import { TenantUnassignedPaymentsTab } from './tabs/TenantUnassignedPaymentsTab';
import { SaaSUnassignedPaymentsTab } from './tabs/SaaSUnassignedPaymentsTab';
import { supabase } from '@/lib/supabaseClient';

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('dashboard');
  const [adminFullName, setAdminFullName] = useState<string>('Brian Nyamai');

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (data?.full_name) {
          setAdminFullName(data.full_name);
        }
      }
    }
    fetchProfile();
  }, []);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. SIDEBAR MENU */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HEADER */}
        <Header fullName={adminFullName} />

        {/* TAB ROUTING AREA */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'add-users' && <AddUsersTab />}
          {activeTab === 'unassigned-payments' && (
            <UnassignedPaymentsHubTab setActiveTab={setActiveTab} />
          )}
          {activeTab === 'unassigned-tenant-payments' && (
            <TenantUnassignedPaymentsTab setActiveTab={setActiveTab} />
          )}
          {activeTab === 'unassigned-saas-payments' && (
            <SaaSUnassignedPaymentsTab setActiveTab={setActiveTab} />
          )}
        </main>
      </div>
    </div>
  );
}