'use client';

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardTab } from './tabs/DashboardTab';
import { MeterReadingTab } from './tabs/MeterReadingTab';

// Define types right here
export type CaretakerTab = 'dashboard' | 'meter-reading' | 'tenant-requests' | 'settings';

export interface CaretakerProfile {
  id: string;
  full_name: string;
  phone_number: string;
  assigned_property: string;
}

export default function CaretakerPage() {
  const [activeTab, setActiveTab] = useState<CaretakerTab>('dashboard');

  const [caretaker] = useState<CaretakerProfile>({
    id: 'CT-101',
    full_name: 'David Miller',
    phone_number: '+254700111222',
    assigned_property: 'Sunset Heights Apartments',
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 1. SIDEBAR WITH TAB STATE SWITCHER */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 pb-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome Back, {caretaker.full_name}
            </h1>
            <p className="text-sm text-gray-500">
              Assigned Property: <span className="font-semibold text-gray-700">{caretaker.assigned_property}</span>
            </p>
          </div>
        </header>

        {/* 3. CONDITIONAL TAB RENDERING */}
        {activeTab === 'dashboard' && (
          <DashboardTab propertyName={caretaker.assigned_property} />
        )}
        {activeTab === 'meter-reading' && <MeterReadingTab />}
        {activeTab === 'tenant-requests' && (
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">Tenant Requests</h2>
            <p className="text-sm text-gray-500 mt-1">No active maintenance requests submitted.</p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">Caretaker Account Settings</h2>
            <p className="text-sm text-gray-500 mt-1">Manage profile and contact details.</p>
          </div>
        )}
      </main>
    </div>
  );
}