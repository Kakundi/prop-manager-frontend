export type CaretakerTab = 
  | 'dashboard' 
  | 'meter-reading' 
  | 'payments' 
  | 'add-tenant';

export interface CaretakerProfile {
  full_name: string;
  assigned_property_name: string;
}

export interface UnitMeterData {
  unit_id: string;
  unit_number: string;
  tenant_name: string;
  previous_meter_reading: number;
  water_rate_per_unit: number; // e.g. $5 per unit
}

export interface WaterInvoice {
  id: string;
  unit_number: string;
  tenant_name: string;
  previous_reading: number;
  current_reading: number;
  units_consumed: number;
  rate_per_unit: number;
  total_amount: number;
  created_at: string;
  status: 'sent' | 'pending';
}

export interface TenantInvoiceRecord {
  id: string;
  tenant_name: string;
  unit_number: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue' | 'partial';
  due_date: string;
  paid_amount?: number;
}