export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'LANDLORD' 
  | 'PROPERTY_MANAGER' 
  | 'CARETAKER' 
  | 'TENANT';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone_number?: string;
  created_at?: string;
  tenant_id?: string;
}

export interface Property {
  id: string;
  name: string;
  location: string;
  landlord_id?: string;
  created_at?: string;
}