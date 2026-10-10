import { Medicine, Batch, Supplier, Branch, StockTransaction, SystemSettings } from '../types/inventory';

export const INITIAL_BRANCHES: Branch[] = [
  { id: 1, name: 'Central Hospital Pharmacy', code: 'CHP-01', location: 'Main Building Ground Floor' },
  { id: 2, name: 'Emergency Ward Satellite', code: 'EWS-02', location: 'Trauma Center Level 1' },
  { id: 3, name: 'Outpatient Clinic Dispensary', code: 'OPC-03', location: 'Block B Wing A' },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 1,
    name: 'MedSource Healthcare Logistics',
    contact_person: 'Dr. Rajesh Mehta',
    phone: '+1 (555) 234-5678',
    email: 'orders@medsource.com',
    address: '450 Pharma Logistics Blvd, Suite 200',
    supplied_categories: ['Antibiotics', 'Analgesics', 'Antidiabetic']
  },
  {
    id: 2,
    name: 'Apex Pharmaceutical Distributors',
    contact_person: 'Sarah Jenkins',
    phone: '+1 (555) 876-5432',
    email: 'supply@apexpharma.org',
    address: '12 Medical Way, District 4',
    supplied_categories: ['Cardiovascular', 'Respiratory', 'IV Fluids']
  },
  {
    id: 3,
    name: 'Global BioTech Labs',
    contact_person: 'Mark Vance',
    phone: '+1 (555) 345-6789',
    email: 'contact@globalbiotech.com',
    address: '88 Innovation Corridor, Research Park',
    supplied_categories: ['Biologicals', 'Inhalers', 'Gastrointestinal']
  }
];

export const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 1,
    name: 'Paracetamol 500mg',
    generic_name: 'Acetaminophen',
    brand_name: 'Calpol / Crocin',
    category: 'Analgesics',
    dosage_form: 'Tablet',
    strength: '500 mg',
    manufacturer: 'GSK Healthcare',
    barcode: '8901001001',
    storage_instructions: 'Store below 25°C in a dry place away from direct sunlight',
    is_prescription_required: false,
    minimum_reorder_level: 100,
    unit_of_measure: 'tablets'
  },
  {
    id: 2,
    name: 'Amoxicillin 500mg',
    generic_name: 'Amoxicillin Trihydrate',
    brand_name: 'Amoxil',
    category: 'Antibiotics',
    dosage_form: 'Capsule',
    strength: '500 mg',
    manufacturer: 'Pfizer Inc',
    barcode: '8901001002',
    storage_instructions: 'Store below 25°C. Protect from moisture',
    is_prescription_required: true,
    minimum_reorder_level: 80,
    unit_of_measure: 'capsules'
  },
  {
    id: 3,
    name: 'Metformin HCl 500mg',
    generic_name: 'Metformin Hydrochloride',
    brand_name: 'Glucophage',
    category: 'Antidiabetic',
    dosage_form: 'Tablet',
    strength: '500 mg',
    manufacturer: 'Merck Healthcare',
    barcode: '8901001003',
    storage_instructions: 'Store between 15°C and 30°C',
    is_prescription_required: true,
    minimum_reorder_level: 120,
    unit_of_measure: 'tablets'
  },
  {
    id: 4,
    name: 'Atorvastatin 20mg',
    generic_name: 'Atorvastatin Calcium',
    brand_name: 'Lipitor',
    category: 'Cardiovascular',
    dosage_form: 'Tablet',
    strength: '20 mg',
    manufacturer: 'Viatris',
    barcode: '8901001004',
    storage_instructions: 'Controlled room temperature 20°C to 25°C',
    is_prescription_required: true,
    minimum_reorder_level: 60,
    unit_of_measure: 'tablets'
  },
  {
    id: 5,
    name: 'Salbutamol Inhaler 100mcg',
    generic_name: 'Albuterol Sulfate',
    brand_name: 'Ventolin Evohaler',
    category: 'Respiratory',
    dosage_form: 'Inhaler',
    strength: '100 mcg/actuation',
    manufacturer: 'GlaxoSmithKline',
    barcode: '8901001005',
    storage_instructions: 'Store below 30°C. Do not freeze or expose to direct sunlight',
    is_prescription_required: true,
    minimum_reorder_level: 30,
    unit_of_measure: 'canisters'
  },
  {
    id: 6,
    name: 'Normal Saline 0.9% IV 500ml',
    generic_name: 'Sodium Chloride 0.9% w/v',
    brand_name: 'Baxter Saline',
    category: 'IV Fluids',
    dosage_form: 'Injection',
    strength: '0.9% w/v',
    manufacturer: 'Baxter Healthcare',
    barcode: '8901001006',
    storage_instructions: 'Store below 25°C. Do not freeze',
    is_prescription_required: true,
    minimum_reorder_level: 50,
    unit_of_measure: 'bottles'
  },
  {
    id: 7,
    name: 'Pantoprazole 40mg',
    generic_name: 'Pantoprazole Sodium',
    brand_name: 'Pantocid',
    category: 'Gastrointestinal',
    dosage_form: 'Tablet',
    strength: '40 mg',
    manufacturer: 'Sun Pharmaceutical',
    barcode: '8901001007',
    storage_instructions: 'Store below 25°C in a dry location',
    is_prescription_required: false,
    minimum_reorder_level: 50,
    unit_of_measure: 'tablets'
  },
  {
    id: 8,
    name: 'Azithromycin 500mg',
    generic_name: 'Azithromycin Dihydrate',
    brand_name: 'Zithromax / Azee',
    category: 'Antibiotics',
    dosage_form: 'Tablet',
    strength: '500 mg',
    manufacturer: 'Cipla Ltd',
    barcode: '8901001008',
    storage_instructions: 'Store below 30°C',
    is_prescription_required: true,
    minimum_reorder_level: 70,
    unit_of_measure: 'tablets'
  }
];

// Current reference date: 2026-10-10
export const INITIAL_BATCHES: Batch[] = [
  // 1. Expired 12 days ago (2026-09-28) - Paracetamol
  {
    id: 1,
    medicine_id: 1,
    branch_id: 1,
    supplier_id: 1,
    batch_number: 'PCM-2024-EXP',
    manufacturing_date: '2024-09-28',
    expiry_date: '2026-09-28',
    quantity_received: 100,
    available_quantity: 35,
    purchase_price: 2.20,
    selling_price: 4.50,
    storage_location: 'Rack A-01 (Shelf 2)',
    status: 'EXPIRED',
    received_at: '2024-10-01'
  },
  // 2. Critical: Expires in 4 days (2026-10-14) - Paracetamol (Earliest eligible active batch for FEFO)
  {
    id: 2,
    medicine_id: 1,
    branch_id: 1,
    supplier_id: 1,
    batch_number: 'PCM-2024-CRT',
    manufacturing_date: '2024-10-14',
    expiry_date: '2026-10-14',
    quantity_received: 150,
    available_quantity: 40,
    purchase_price: 2.20,
    selling_price: 4.50,
    storage_location: 'Rack A-01 (Shelf 1)',
    status: 'ACTIVE',
    received_at: '2024-10-20'
  },
  // 3. High: Expires in 22 days (2026-11-01) - Paracetamol (Second eligible active batch for FEFO)
  {
    id: 3,
    medicine_id: 1,
    branch_id: 1,
    supplier_id: 1,
    batch_number: 'PCM-2025-HGH',
    manufacturing_date: '2025-05-01',
    expiry_date: '2026-11-01',
    quantity_received: 200,
    available_quantity: 120,
    purchase_price: 2.30,
    selling_price: 4.50,
    storage_location: 'Rack A-01 (Shelf 3)',
    status: 'ACTIVE',
    received_at: '2025-05-10'
  },
  // 4. Healthy: Expires in 280 days (2027-07-15) - Paracetamol
  {
    id: 4,
    medicine_id: 1,
    branch_id: 1,
    supplier_id: 1,
    batch_number: 'PCM-2025-HLT',
    manufacturing_date: '2025-07-15',
    expiry_date: '2027-07-15',
    quantity_received: 300,
    available_quantity: 280,
    purchase_price: 2.35,
    selling_price: 4.50,
    storage_location: 'Rack A-01 (Bulk Bin)',
    status: 'ACTIVE',
    received_at: '2025-08-01'
  },

  // 5. Critical: Expires in 6 days (2026-10-16) - Amoxicillin
  {
    id: 5,
    medicine_id: 2,
    branch_id: 1,
    supplier_id: 1,
    batch_number: 'AMX-2024-001',
    manufacturing_date: '2024-10-16',
    expiry_date: '2026-10-16',
    quantity_received: 80,
    available_quantity: 25,
    purchase_price: 5.50,
    selling_price: 9.80,
    storage_location: 'Antibiotics Cabinet B-2',
    status: 'ACTIVE',
    received_at: '2024-10-25'
  },
  // 6. Quarantined batch: Amoxicillin (Suspected packaging moisture breach)
  {
    id: 6,
    medicine_id: 2,
    branch_id: 1,
    supplier_id: 1,
    batch_number: 'AMX-2025-QRN',
    manufacturing_date: '2025-01-10',
    expiry_date: '2027-01-10',
    quantity_received: 100,
    available_quantity: 60,
    purchase_price: 5.50,
    selling_price: 9.80,
    storage_location: 'Quarantine Holding Rack Q-1',
    status: 'QUARANTINED',
    quarantine_reason: 'External blister foil discoloration noted upon inspection. Quality QC review pending.',
    received_at: '2025-01-20'
  },

  // 7. Warning: Expires in 48 days (2026-11-27) - Metformin
  {
    id: 7,
    medicine_id: 3,
    branch_id: 1,
    supplier_id: 1,
    batch_number: 'MET-2024-WRN',
    manufacturing_date: '2024-11-27',
    expiry_date: '2026-11-27',
    quantity_received: 150,
    available_quantity: 45,
    purchase_price: 3.10,
    selling_price: 6.20,
    storage_location: 'Chronic Care Rack C-1',
    status: 'ACTIVE',
    received_at: '2024-12-05'
  },

  // 8. Upcoming: Expires in 75 days (2026-12-24) - Atorvastatin
  {
    id: 8,
    medicine_id: 4,
    branch_id: 1,
    supplier_id: 2,
    batch_number: 'ATV-2025-UPC',
    manufacturing_date: '2025-01-05',
    expiry_date: '2026-12-24',
    quantity_received: 100,
    available_quantity: 30,
    purchase_price: 8.20,
    selling_price: 14.50,
    storage_location: 'Cardio Drawer 3',
    status: 'ACTIVE',
    received_at: '2025-01-15'
  },

  // 9. Low stock & Healthy: Salbutamol Inhaler (Total active units = 12, min reorder level = 30)
  {
    id: 9,
    medicine_id: 5,
    branch_id: 1,
    supplier_id: 2,
    batch_number: 'SAL-2025-LOW',
    manufacturing_date: '2025-03-01',
    expiry_date: '2027-09-01',
    quantity_received: 50,
    available_quantity: 12,
    purchase_price: 12.00,
    selling_price: 21.00,
    storage_location: 'Respiratory Shelf R-2',
    status: 'ACTIVE',
    received_at: '2025-03-10'
  },

  // 10. High: Expires in 15 days (2026-10-25) - Normal Saline IV
  {
    id: 10,
    medicine_id: 6,
    branch_id: 1,
    supplier_id: 2,
    batch_number: 'NS-2025-HGH',
    manufacturing_date: '2025-04-10',
    expiry_date: '2026-10-25',
    quantity_received: 120,
    available_quantity: 38,
    purchase_price: 4.80,
    selling_price: 8.00,
    storage_location: 'IV Solutions Bay 1',
    status: 'ACTIVE',
    received_at: '2025-04-20'
  },

  // 11. Expired 3 days ago (2026-10-07) - Pantoprazole
  {
    id: 11,
    medicine_id: 7,
    branch_id: 1,
    supplier_id: 3,
    batch_number: 'PAN-2024-EXP',
    manufacturing_date: '2024-10-07',
    expiry_date: '2026-10-07',
    quantity_received: 90,
    available_quantity: 22,
    purchase_price: 3.40,
    selling_price: 7.00,
    storage_location: 'GI Cabinet G-4',
    status: 'EXPIRED',
    received_at: '2024-10-15'
  },

  // 12. Warning: Expires in 52 days (2026-12-01) - Azithromycin
  {
    id: 12,
    medicine_id: 8,
    branch_id: 1,
    supplier_id: 3,
    batch_number: 'AZI-2024-WRN',
    manufacturing_date: '2024-12-01',
    expiry_date: '2026-12-01',
    quantity_received: 100,
    available_quantity: 50,
    purchase_price: 9.50,
    selling_price: 18.00,
    storage_location: 'Antibiotics Cabinet B-4',
    status: 'ACTIVE',
    received_at: '2024-12-10'
  }
];

export const INITIAL_TRANSACTIONS: StockTransaction[] = [
  {
    id: 1,
    batch_id: 1,
    medicine_name: 'Paracetamol 500mg',
    batch_number: 'PCM-2024-EXP',
    transaction_type: 'QUARANTINE',
    quantity_change: 0,
    previous_quantity: 35,
    resulting_quantity: 35,
    user_name: 'Dr. Jane Miller',
    user_role: 'pharmacist',
    reason: 'Statutory expiry passed on 2026-09-28. Batch locked from dispensing.',
    timestamp: '2026-09-29 08:30:00'
  },
  {
    id: 2,
    batch_id: 6,
    medicine_name: 'Amoxicillin 500mg',
    batch_number: 'AMX-2025-QRN',
    transaction_type: 'QUARANTINE',
    quantity_change: 0,
    previous_quantity: 60,
    resulting_quantity: 60,
    user_name: 'Robert Davis',
    user_role: 'pharmacist',
    reason: 'Visual defect: blister foil discoloration flagged during morning stock audit.',
    timestamp: '2026-10-02 11:15:00'
  },
  {
    id: 3,
    batch_id: 2,
    medicine_name: 'Paracetamol 500mg',
    batch_number: 'PCM-2024-CRT',
    transaction_type: 'DISPENSE',
    quantity_change: -10,
    previous_quantity: 50,
    resulting_quantity: 40,
    user_name: 'Emily Watson',
    user_role: 'staff',
    reference_id: 'RX-2026-8891',
    reason: 'FEFO recommendation dispensing to Inpatient Ward 4B',
    timestamp: '2026-10-09 14:20:00'
  },
  {
    id: 4,
    batch_id: 4,
    medicine_name: 'Paracetamol 500mg',
    batch_number: 'PCM-2025-HLT',
    transaction_type: 'RECEIVE',
    quantity_change: 300,
    previous_quantity: 0,
    resulting_quantity: 300,
    user_name: 'Robert Davis',
    user_role: 'pharmacist',
    reference_id: 'PO-2025-0442',
    reason: 'Vendor shipment intake from MedSource Healthcare Logistics',
    timestamp: '2025-08-01 10:00:00'
  }
];

export const INITIAL_SETTINGS: SystemSettings = {
  threshold_critical_days: 7,
  threshold_high_days: 30,
  threshold_warning_days: 60,
  threshold_upcoming_days: 90,
  auto_quarantine_expired: true,
  email_notifications_enabled: true,
  alert_email_recipient: 'chief-pharmacist@hospital.org',
  last_scan_timestamp: '2026-10-10 06:00:00'
};
