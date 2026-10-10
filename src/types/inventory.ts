export type UserRole = 'admin' | 'pharmacist' | 'staff' | 'auditor';

export type BatchStatus = 'ACTIVE' | 'QUARANTINED' | 'RECALLED' | 'EXPIRED' | 'DEPLETED';

export type AlertSeverity = 'EXPIRED' | 'CRITICAL' | 'HIGH' | 'WARNING' | 'UPCOMING';

export type TransactionType = 
  | 'RECEIVE' 
  | 'DISPENSE' 
  | 'ADJUSTMENT' 
  | 'TRANSFER' 
  | 'QUARANTINE' 
  | 'RELEASE' 
  | 'DAMAGE' 
  | 'RETURN';

export interface Medicine {
  id: number;
  name: string;
  generic_name: string;
  brand_name: string;
  category: string;
  dosage_form: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Ointment' | 'Drops' | 'Inhaler';
  strength: string;
  manufacturer: string;
  barcode: string;
  storage_instructions: string;
  is_prescription_required: boolean;
  minimum_reorder_level: number;
  unit_of_measure: string;
}

export interface Batch {
  id: number;
  medicine_id: number;
  branch_id: number;
  supplier_id: number;
  batch_number: string;
  manufacturing_date: string; // YYYY-MM-DD
  expiry_date: string; // YYYY-MM-DD
  quantity_received: number;
  available_quantity: number;
  purchase_price: number; // Cost price per unit
  selling_price: number;
  storage_location: string;
  status: BatchStatus;
  quarantine_reason?: string;
  received_at: string;
}

export interface ExpiryAlert {
  id: number;
  batch_id: number;
  medicine_id: number;
  medicine_name: string;
  batch_number: string;
  expiry_date: string;
  days_remaining: number; // Negative if expired
  severity: AlertSeverity;
  units_affected: number;
  estimated_value_at_risk: number;
  status: 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED';
  branch_id: number;
  created_at: string;
}

export interface StockTransaction {
  id: number;
  batch_id: number;
  medicine_name: string;
  batch_number: string;
  transaction_type: TransactionType;
  quantity_change: number;
  previous_quantity: number;
  resulting_quantity: number;
  user_name: string;
  user_role: UserRole;
  reference_id?: string;
  reason: string;
  timestamp: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  supplied_categories: string[];
}

export interface SystemSettings {
  threshold_critical_days: number; // Default 7
  threshold_high_days: number;     // Default 30
  threshold_warning_days: number;  // Default 60
  threshold_upcoming_days: number; // Default 90
  auto_quarantine_expired: boolean;
  email_notifications_enabled: boolean;
  alert_email_recipient: string;
  last_scan_timestamp: string;
}

export interface Branch {
  id: number;
  name: string;
  code: string;
  location: string;
}
