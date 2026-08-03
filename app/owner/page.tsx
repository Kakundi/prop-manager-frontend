'use client';

import React, { useEffect, useState } from 'react';
import { OwnerTab } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardTab } from './tabs/DashboardTab';
import { AddPropertyTab } from './tabs/AddPropertyTab';
import { UserManagementTab } from './tabs/UserManagementTab';
import { TenantsTab } from './tabs/TenantsTab';
import { UnassignedPaymentsTab } from './tabs/UnassignedPaymentsTab';
import { SubscriptionsTab } from './tabs/SubscriptionsTab';
import { createClient } from '@/lib/supabaseClient';

export default function OwnerPage() {
  const [activeTab, setActiveTab] = useState<OwnerTab>('dashboard');
  const [ownerFullName, setOwnerFullName] = useState<string>('Brian Nyamai');

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (data?.full_name) {
          setOwnerFullName(data.full_name);
        }
      }
    }
    fetchProfile();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* 1. SIDEBAR MENU */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. MAIN LAYOUT AREA */}
      <main className="flex-1 overflow-y-auto">
        {/* HERO HEADER */}
        <Header fullName={ownerFullName} />

        {/* TAB CONTENT AREA */}
        <div className="p-8">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'add-property' && <AddPropertyTab />}
          {activeTab === 'users' && <UserManagementTab />}
          {activeTab === 'tenants' && <TenantsTab />}
          {activeTab === 'unassigned-payments' && <UnassignedPaymentsTab />}
          {activeTab === 'subscription' && <SubscriptionsTab />}
        </div>
      </main>
    </div>
  );
}