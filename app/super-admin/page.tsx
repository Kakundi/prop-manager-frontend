// app/super-admin/page.tsx
'use client';

import React, { useState } from 'react';
import { SuperadminTab } from './types';
import { Sidebar } from './components/Sidebar';

// Business & Reconciliation Tabs
import { DashboardTab } from './tabs/DashboardTab';
import { SubscribersTab } from './tabs/SubscribersTab';
import { AddUsersTab } from './tabs/AddUsersTab';
import { GenerateInvoiceTab } from './tabs/GenerateInvoiceTab';
import { UnassignedPaymentsHubTab } from './tabs/UnassignedPaymentsHubTab';
import { SaaSUnassignedPaymentsTab } from './tabs/SaaSUnassignedPaymentsTab';
import { TenantUnassignedPaymentsTab } from './tabs/TenantUnassignedPaymentsTab';

// Technical & Governance Tabs
import { SystemControlTab } from './tabs/SystemControlTab';
import { WebhookDebuggerTab } from './tabs/WebhookDebuggerTab';
import { ImpersonatorTab } from './tabs/ImpersonatorTab';
import { AuditLogsTab } from './tabs/AuditLogsTab';
import { FeatureFlagsTab } from './tabs/FeatureFlagsTab';

export default function SuperadminPage() {
  const [activeTab, setActiveTab] = useState<SuperadminTab>('dashboard');

  const renderActiveTab = () => {
    switch (activeTab) {
      // Operations & Business
      case 'dashboard':
        return <DashboardTab />;
      case 'subscribers':
        return <SubscribersTab />;
      case 'add-users':
        return <AddUsersTab />;
      case 'generate-invoice':
        return <GenerateInvoiceTab />;

      // Reconciliation Hubs
      case 'unassigned-payments-hub':
        return <UnassignedPaymentsHubTab setActiveTab={setActiveTab} />;
      case 'saas-unassigned-payments':
        return <SaaSUnassignedPaymentsTab setActiveTab={setActiveTab} />;
      case 'tenant-unassigned-payments':
        return <TenantUnassignedPaymentsTab setActiveTab={setActiveTab} />;

      // Developer Controls
      case 'system-control':
        return <SystemControlTab />;
      case 'webhook-debugger':
        return <WebhookDebuggerTab />;
      case 'impersonator':
        return <ImpersonatorTab />;

      // Governance
      case 'audit-logs':
        return <AuditLogsTab />;
      case 'feature-flags':
        return <FeatureFlagsTab />;

      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
}