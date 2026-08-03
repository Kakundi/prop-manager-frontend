export type SuperAdminTab =
  | 'dashboard'
  | 'add-users'
  | 'unassigned-payments'
  | 'unassigned-tenant-payments'
  | 'unassigned-saas-payments';

export interface InvoiceMetrics {
  paidAmount: number;
  paidCount: number;
  unpaidAmount: number;
  unpaidCount: number;
  overdueAmount: number;
  overdueCount: number;
}

export interface SaaSPayment {
  id: string;
  transaction_code: string;
  amount: number;
  created_at: string;
  sender_name: string | null;
  sender_phone: string | null;
  payment_method: string;
  status: string;
  notes: string | null;
}

export interface TenantPayment {
  id: string;
  transaction_code: string;
  amount: number;
  payment_date: string;
  sender_phone: string | null;
  tenant_full_name: string | null;
  unit_name: string | null;
  property_name: string | null;
  status: string;
}