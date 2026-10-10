# Medicine Expiry Alert System - MySQL Database Design

## 1. Database Specifications
- **Database Engine**: MySQL 8.0+
- **Default Storage Engine**: InnoDB (Strict ACID compliance, foreign key constraints, row-level locking)
- **Character Set**: `utf8mb4`
- **Collation**: `utf8mb4_unicode_ci`
- **ORM / Driver**: SQLAlchemy 2.0+ with PyMySQL
- **Migration Framework**: Alembic

---

## 2. Entity-Relationship Summary

```
[organizations] 1 ----< [branches]
                           |
                           v
[users] >---- [user_roles] ----< [roles]
   |
   +----< [audit_logs]
   +----< [stock_transactions]
   +----< [notifications]

[medicine_categories] 1 ----< [medicines]
                                   |
[suppliers] 1 -------------------+ |
                                 | |
                                 v v
                       [medicine_batches]
                                 |
                                 +----< [expiry_alerts]
                                 +----< [stock_transactions]
                                 +----< [stock_transfers]
```

---

## 3. Detailed Table Specifications

### 3.1. `organizations` & `branches`
- **`organizations`**:
  - `id`: INT AUTO_INCREMENT PRIMARY KEY
  - `name`: VARCHAR(150) NOT NULL
  - `code`: VARCHAR(50) UNIQUE NOT NULL
  - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- **`branches`**:
  - `id`: INT AUTO_INCREMENT PRIMARY KEY
  - `organization_id`: INT NOT NULL, FOREIGN KEY -> `organizations(id)`
  - `name`: VARCHAR(150) NOT NULL
  - `code`: VARCHAR(50) UNIQUE NOT NULL
  - `address`: TEXT NULL
  - `phone`: VARCHAR(30) NULL
  - `email`: VARCHAR(100) NULL
  - `is_active`: BOOLEAN DEFAULT TRUE

### 3.2. `users` & `roles`
- **`users`**:
  - `id`: INT AUTO_INCREMENT PRIMARY KEY
  - `branch_id`: INT NULL, FOREIGN KEY -> `branches(id)`
  - `email`: VARCHAR(120) UNIQUE NOT NULL
  - `username`: VARCHAR(80) UNIQUE NOT NULL
  - `hashed_password`: VARCHAR(255) NOT NULL
  - `full_name`: VARCHAR(120) NOT NULL
  - `role`: ENUM('admin', 'pharmacist', 'staff', 'auditor') NOT NULL DEFAULT 'staff'
  - `is_active`: BOOLEAN DEFAULT TRUE
  - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
  - `updated_at`: DATETIME ON UPDATE CURRENT_TIMESTAMP

### 3.3. `medicine_categories`
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `name`: VARCHAR(100) UNIQUE NOT NULL
- `description`: VARCHAR(255) NULL
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### 3.4. `suppliers`
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `name`: VARCHAR(150) NOT NULL
- `contact_person`: VARCHAR(100) NULL
- `phone`: VARCHAR(30) NOT NULL
- `email`: VARCHAR(100) NOT NULL
- `address`: TEXT NULL
- `tax_id`: VARCHAR(50) NULL
- `is_active`: BOOLEAN DEFAULT TRUE
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### 3.5. `medicines` (Medicine Master)
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `category_id`: INT NOT NULL, FOREIGN KEY -> `medicine_categories(id)`
- `name`: VARCHAR(150) NOT NULL (e.g., "Paracetamol 500mg")
- `generic_name`: VARCHAR(150) NOT NULL (e.g., "Acetaminophen")
- `brand_name`: VARCHAR(100) NULL (e.g., "Calpol", "Crocin")
- `composition`: VARCHAR(255) NULL
- `strength`: VARCHAR(60) NOT NULL (e.g., "500 mg", "10 mg/ml")
- `dosage_form`: ENUM('Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Powder') NOT NULL
- `manufacturer`: VARCHAR(120) NOT NULL
- `barcode`: VARCHAR(100) UNIQUE NULL
- `storage_instructions`: VARCHAR(200) DEFAULT 'Store in a cool, dry place'
- `is_prescription_required`: BOOLEAN DEFAULT FALSE
- `minimum_reorder_level`: INT NOT NULL DEFAULT 50 (Low stock threshold)
- `unit_of_measure`: VARCHAR(30) DEFAULT 'units' (e.g., 'tablets', 'vials', 'bottles')
- `is_active`: BOOLEAN DEFAULT TRUE
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at`: DATETIME ON UPDATE CURRENT_TIMESTAMP
- **Indexes**: `INDEX idx_medicines_name (name)`, `INDEX idx_medicines_generic (generic_name)`, `INDEX idx_medicines_barcode (barcode)`

### 3.6. `medicine_batches` (Batch Inventory)
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `medicine_id`: INT NOT NULL, FOREIGN KEY -> `medicines(id)`
- `branch_id`: INT NOT NULL, FOREIGN KEY -> `branches(id)`
- `supplier_id`: INT NULL, FOREIGN KEY -> `suppliers(id)`
- `batch_number`: VARCHAR(80) NOT NULL
- `manufacturing_date`: DATE NULL
- `expiry_date`: DATE NOT NULL
- `quantity_received`: INT NOT NULL
- `available_quantity`: INT NOT NULL
- `purchase_price`: DECIMAL(10, 2) NOT NULL (Cost price per unit)
- `selling_price`: DECIMAL(10, 2) NOT NULL (Retail price per unit)
- `storage_location`: VARCHAR(80) NULL (e.g., "Shelf A-3", "Cold Storage B")
- `status`: ENUM('ACTIVE', 'QUARANTINED', 'RECALLED', 'EXPIRED', 'DEPLETED') DEFAULT 'ACTIVE'
- `quarantine_reason`: TEXT NULL
- `received_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at`: DATETIME ON UPDATE CURRENT_TIMESTAMP
- **Constraints & Indexes**:
  - `UNIQUE KEY uq_batch_branch_medicine (batch_number, branch_id, medicine_id)`
  - `INDEX idx_batch_expiry (expiry_date, status)`
  - `INDEX idx_batch_status (status)`

### 3.7. `expiry_alerts`
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `batch_id`: INT NOT NULL, FOREIGN KEY -> `medicine_batches(id)`
- `severity`: ENUM('EXPIRED', 'CRITICAL', 'HIGH', 'WARNING', 'UPCOMING') NOT NULL
- `days_remaining`: INT NOT NULL (Negative if expired)
- `units_affected`: INT NOT NULL
- `estimated_value_at_risk`: DECIMAL(12, 2) NOT NULL
- `status`: ENUM('NEW', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED') DEFAULT 'NEW'
- `resolved_action`: VARCHAR(100) NULL (e.g. 'QUARANTINED', 'RETURNED_TO_VENDOR', 'DISPOSED')
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- `updated_at`: DATETIME ON UPDATE CURRENT_TIMESTAMP
- **Indexes**: `INDEX idx_alerts_severity_status (severity, status)`

### 3.8. `stock_transactions` (Audit Stock Ledger)
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `batch_id`: INT NOT NULL, FOREIGN KEY -> `medicine_batches(id)`
- `user_id`: INT NOT NULL, FOREIGN KEY -> `users(id)`
- `transaction_type`: ENUM('RECEIVE', 'DISPENSE', 'ADJUSTMENT', 'TRANSFER', 'QUARANTINE', 'RELEASE', 'DAMAGE', 'RETURN') NOT NULL
- `quantity_change`: INT NOT NULL (positive for in, negative for out)
- `previous_quantity`: INT NOT NULL
- `resulting_quantity`: INT NOT NULL
- `reference_id`: VARCHAR(100) NULL (e.g., Invoice #, Dispense Rx #, Return #)
- `reason`: TEXT NULL
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP
- **Indexes**: `INDEX idx_transactions_batch (batch_id, created_at)`

### 3.9. `notifications` & `notification_logs`
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `user_id`: INT NULL, FOREIGN KEY -> `users(id)`
- `type`: ENUM('EXPIRY', 'LOW_STOCK', 'QUARANTINE', 'SYSTEM') NOT NULL
- `title`: VARCHAR(150) NOT NULL
- `message`: TEXT NOT NULL
- `severity`: ENUM('info', 'warning', 'danger', 'success') DEFAULT 'info'
- `is_read`: BOOLEAN DEFAULT FALSE
- `channel`: ENUM('IN_APP', 'EMAIL', 'SMS') DEFAULT 'IN_APP'
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### 3.10. `system_settings`
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `threshold_critical_days`: INT DEFAULT 7
- `threshold_high_days`: INT DEFAULT 30
- `threshold_warning_days`: INT DEFAULT 60
- `threshold_upcoming_days`: INT DEFAULT 90
- `auto_quarantine_expired`: BOOLEAN DEFAULT TRUE
- `email_alerts_enabled`: BOOLEAN DEFAULT TRUE
- `alert_email_recipient`: VARCHAR(150) DEFAULT 'pharmacy-alerts@hospital.org'
- `last_scan_at`: DATETIME NULL
- `updated_at`: DATETIME ON UPDATE CURRENT_TIMESTAMP

### 3.11. `audit_logs`
- `id`: INT AUTO_INCREMENT PRIMARY KEY
- `user_id`: INT NULL, FOREIGN KEY -> `users(id)`
- `action`: VARCHAR(80) NOT NULL (e.g., 'CREATE_BATCH', 'QUARANTINE_BATCH', 'UPDATE_PRICE')
- `entity_name`: VARCHAR(80) NOT NULL (e.g., 'medicine_batches')
- `entity_id`: INT NULL
- `old_values`: JSON NULL
- `new_values`: JSON NULL
- `ip_address`: VARCHAR(45) NULL
- `timestamp`: DATETIME DEFAULT CURRENT_TIMESTAMP
