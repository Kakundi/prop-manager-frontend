export type OwnerTab =
  | 'dashboard'
  | 'add-property'
  | 'users'
  | 'tenants'
  | 'unassigned-payments'
  | 'subscription';

export interface OwnerPropertySummary {
  id: string;
  name: string;
  location: string;
  total_units: number;
  occupied_units: number;
  monthly_revenue: number;
}

export interface OwnerTenantRecord {
  id: string;
  full_name: string;
  unit_number: string;
  property_name: string;
  phone: string;
  rent_status: 'paid' | 'overdue' | 'pending';
}

export interface UnassignedPayment {
  id: string;
  amount: number;
  payment_reference: string;
  payment_date: string;
  source_phone: string;
}

export interface SubscriptionStatus {
  tier: string;
  status: 'active' | 'past_due' | 'canceled';
  current_period_end: string;
}