'use client';

import React, { useState } from 'react';
import { ManagerTab } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardTab } from './tabs/DashboardTab';
import { AddPropertyTab } from './tabs/AddPropertyTab';
import { UserManagementTab } from './tabs/UserManagementTab'; // NEW IMPORT
import { TenantsTab } from './tabs/TenantsTab';
import { UnassignedPaymentsTab } from './tabs/UnassignedPaymentsTab';
import { SubscriptionsTab } from './tabs/SubscriptionsTab';

export default function PropertyManagerPage() {
  const [activeTab, setActiveTab] = useState<ManagerTab>('dashboard');
  const [managerFullName] = useState<string>('Brian Nyamai');

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* 1. SIDEBAR MENU */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. MAIN LAYOUT AREA */}
      <main className="flex-1 overflow-y-auto">
        {/* HERO HEADER */}
        <Header fullName={managerFullName} />

        {/* TAB CONTENT AREA */}
        <div className="p-8">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'add-property' && <AddPropertyTab />}
          {activeTab === 'users' && <UserManagementTab />} {/* NEW ROUTE */}
          {activeTab === 'tenants' && <TenantsTab />}
          {activeTab === 'unassigned-payments' && <UnassignedPaymentsTab />}
          {activeTab === 'subscription' && <SubscriptionsTab />}
        </div>
      </main>
    </div>
  );
}