// app/super-admin/types.ts

export type SuperadminTab = 
  // Business & SaaS Operations
  | 'dashboard'
  | 'subscribers'
  | 'add-users'
  | 'generate-invoice'
  // Reconciliation Hubs
  | 'unassigned-payments-hub'
  | 'saas-unassigned-payments'
  | 'tenant-unassigned-payments'
  // Technical & Developer Controls
  | 'system-control'
  | 'webhook-debugger'
  | 'impersonator'
  // Governance & Feature Control
  | 'audit-logs'
  | 'feature-flags';

export interface Subscriber {
  id: string;
  agency_name: string;
  contact_email: string;
  phone: string;
  plan: 'starter' | 'growth' | 'enterprise';
  status: 'active' | 'suspended' | 'past_due';
}

export interface FailedWebhook {
  id: string;
  source: 'mpesa_c2b' | 'mpesa_stk' | 'whatsapp' | 'sms';
  endpoint: string;
  payload: Record<string, any>;
  error_message: string;
  retry_count: number;
  created_at: string;
}