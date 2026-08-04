'use client';

import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { DashboardTab } from './tabs/DashboardTab';
import { AddPropertyTab } from './tabs/AddPropertyTab';
import { UserManagementTab } from './tabs/UserManagementTab';
import { TenantsTab } from './tabs/TenantsTab';
import { UnassignedPaymentsTab } from './tabs/UnassignedPaymentsTab';
import { SubscriptionsTab } from './tabs/SubscriptionsTab';
import { ManagerTab } from './types';

export default function PropertyManagerPage() {
  const [activeTab, setActiveTab] = useState<ManagerTab>('dashboard');
  const [fullName, setFullName] = useState<string>('');
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoadingUser(true);
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        
        if (res.ok) {
          const data = await res.json();
          
          // Checks all standard shapes returned from the profiles table query
          const name = 
            data?.full_name || 
            data?.profile?.full_name || 
            data?.user?.full_name || 
            data?.user?.user_metadata?.full_name ||
            '';

          if (name.trim()) {
            setFullName(name.trim());
          }
        }
      } catch (err) {
        console.error('Error fetching profiles full_name:', err);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        fullName={fullName}
        loadingUser={loadingUser}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header fullName={fullName} loading={loadingUser} />

        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/60">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardTab />}
            {activeTab === 'add-property' && <AddPropertyTab />}
            {activeTab === 'users' && <UserManagementTab />}
            {activeTab === 'tenants' && <TenantsTab />}
            {activeTab === 'unassigned-payments' && <UnassignedPaymentsTab />}
            {activeTab === 'subscription' && <SubscriptionsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}