'use client';

import React, { useState } from 'react';
import { TenantTab, TenantProfile } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardTab } from './tabs/DashboardTab';
import { PaymentsTab } from './tabs/PaymentsTab';

export default function TenantPage() {
  const [activeTab, setActiveTab] = useState<TenantTab>('dashboard');
  const [tenantProfile] = useState<TenantProfile>({
    full_name: 'Alice Smith',
    property_name: 'Sunset Heights Apartments',
    unit_number: 'Apt 1A',
    caretaker_name: 'David Miller',
    caretaker_phone: '+254700111222',
  });

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* 1. SIDEBAR NAVIGATION */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto">
        {/* HERO HEADER */}
        <Header
          fullName={tenantProfile.full_name}
          propertyName={tenantProfile.property_name}
          unitNumber={tenantProfile.unit_number}
          caretakerName={tenantProfile.caretaker_name}
          caretakerPhone={tenantProfile.caretaker_phone}
        />

        {/* TAB CONTENT AREA */}
        <div className="p-8">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'payments' && <PaymentsTab />}
        </div>
      </main>
    </div>
  );
}