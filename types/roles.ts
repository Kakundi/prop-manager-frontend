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
  tenant_id?: string;
}