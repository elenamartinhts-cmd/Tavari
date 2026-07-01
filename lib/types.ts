export type RoomStatus = "vacant" | "reserved" | "occupied" | "maintenance";
export type PaymentStatus = "paid" | "pending" | "overdue" | "partial";
export type IssueStatus = "open" | "in_progress" | "waiting_tenant" | "resolved" | "closed";
export type IssuePriority = "low" | "medium" | "urgent";
export type ContractStatus = "draft" | "pending_signature" | "active" | "expiring" | "expired" | "terminated";

export interface Property {
  id: string;
  landlord_id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  created_at: string;
  rooms?: Room[];
}

export interface Room {
  id: string;
  property_id: string;
  number: string;
  monthly_rent: number;
  deposit_amount: number;
  size_sqm: number | null;
  amenities: string[];
  status: RoomStatus;
  floor: number | null;
  notes: string | null;
  join_code: string | null;
  created_at: string;
  current_tenant?: Tenant | null;
  property?: Property;
  tenants?: Tenant[];
}

export interface Tenant {
  id: string;
  landlord_id: string;
  room_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string | null;
  nationality: string | null;
  id_type: "dni" | "nie" | "passport" | null;
  id_number: string | null;
  id_expiry_date: string | null;
  employer: string | null;
  position: string | null;
  monthly_income: number | null;
  current_address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  guarantor_name: string | null;
  guarantor_phone: string | null;
  guarantor_id_number: string | null;
  move_in_date: string | null;
  move_out_date: string | null;
  is_active: boolean;
  expenses_included: boolean;
  user_id: string | null;
  invite_sent_at: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  room_id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: PaymentStatus;
  notes: string | null;
  created_at: string;
  tenant?: Tenant;
  room?: Room;
}

export interface MaintenanceIssue {
  id: string;
  property_id: string;
  room_id: string | null;
  tenant_id: string | null;
  title: string;
  description: string;
  category: string;
  priority: IssuePriority;
  status: IssueStatus;
  created_at: string;
  updated_at: string;
  property?: Property;
  room?: Room;
}

export interface ContractTemplate {
  id: string;
  landlord_id: string;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  landlord_id: string;
  tenant_id: string;
  room_id: string | null;
  property_id: string | null;
  template_id: string | null;
  generated_content: string | null;
  start_date: string;
  end_date: string | null;
  monthly_rent: number;
  deposit_amount: number;
  status: ContractStatus;
  signed_landlord_at: string | null;
  signed_tenant_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyExpense {
  id: string;
  property_id: string;
  landlord_id: string;
  category: string;
  description: string;
  amount: number;
  period_month: string;
  factura_url: string | null;
  notes: string | null;
  is_recurring: boolean;
  template_id: string | null;
  created_at: string;
  expense_shares?: ExpenseShare[];
}

export interface ExpenseShare {
  id: string;
  expense_id: string;
  tenant_id: string;
  amount: number;
  added_to_payments: boolean;
  created_at: string;
  tenants?: { id: string; full_name: string; room_id: string | null };
}

export interface DashboardStats {
  total_properties: number;
  total_rooms: number;
  occupied_rooms: number;
  vacant_rooms: number;
  monthly_income: number;
  pending_income: number;
  open_issues: number;
  urgent_issues: number;
}
