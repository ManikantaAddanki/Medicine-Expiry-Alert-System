# Medicine Expiry Alert System - Feature Specifications

## 1. Core Feature Matrix

### Feature 1: Medicine Master & Catalog
- Multi-field catalog: Brand name, generic composition, strength, dosage form, manufacturer, storage conditions, Rx flag, minimum stock reorder level.
- Fast multi-criteria search (by name, generic name, barcode, category).
- Category categorization (Antibiotics, Analgesics, Cardiovascular, Antidiabetic, Respiratory, IV Fluids, etc.).

### Feature 2: Multi-Batch Expiry Tracking
- Independent batch-level tracking with manufacturing date, expiry date, supplier reference, rack/shelf storage location.
- Live calculation of days remaining or overdue against current date.
- Value-at-risk calculation ($Available\,Units \times Unit\,Purchase\,Cost$).
- Immediate isolation: An expired batch is isolated without affecting other safe batches of the same medicine.

### Feature 3: Automated Expiry Alert Engine
- 5-tier severity classification:
  1. **EXPIRED** ($\le 0$ days): Red badge, dispensing blocked.
  2. **CRITICAL** (1 to 7 days): Urgent action required.
  3. **HIGH** (8 to 30 days): Prepare supplier returns or prioritize FEFO usage.
  4. **WARNING** (31 to 60 days): Review reordering and clinical velocity.
  5. **UPCOMING** (61 to 90 days): Informational inventory pipeline flag.
- One-click manual scan trigger with execution status and timestamp tracking.
- Batch action resolution: Quarantine, Mark for Return to Vendor, Dispose/Write-off.

### Feature 4: FEFO (First Expiry, First Out) Dispensing Advisor
- Algorithmic dispenser: calculates the optimal batch distribution for a requested dosage count.
- Excludes expired, quarantined, recalled, or depleted batches.
- Greedily consumes from the earliest valid batch first, then rolls over to subsequent batches.

### Feature 5: Comprehensive Stock Movement Ledger
- Full transaction types: `RECEIVE`, `DISPENSE`, `ADJUSTMENT`, `TRANSFER`, `QUARANTINE`, `RELEASE`, `DAMAGE`, `RETURN`.
- Real-time balance integrity: tracks $Qty_{before}$, $\Delta Qty$, and $Qty_{after}$.
- Non-repudiation: Each record logs user identity, branch, reference ID, and audit explanation.

### Feature 6: Low Stock & Reorder Monitoring
- Compares total available units across all non-expired batches against the medicine's minimum reorder threshold.
- Generates automatic purchase order reorder recommendations with suggested supplier links.

### Feature 7: Supplier Directory & Purchase History
- Complete vendor profiles with contact person, phone, email, address, tax ID.
- Direct mapping of medicines supplied by each vendor.
- Supplier return tracking for items nearing expiry.

### Feature 8: Barcode & QR Code Suite
- Automatic QR generation per batch containing SKU, batch number, expiry date, and unit cost.
- Built-in camera barcode scanner and manual code search fallback.
- Instant lookup opens batch modal with current stock health.

### Feature 9: CSV Import & Export Pipeline
- Multi-row CSV importer with column headers: `medicine_name`, `generic_name`, `category`, `dosage_form`, `strength`, `batch_number`, `expiry_date`, `quantity`, `purchase_price`, `supplier_name`.
- Live format validation, error summary, preview modal, and transaction-safe ingestion.
- One-click CSV export of filtered inventory, expired lists, or audit logs.

### Feature 10: Interactive Visual Analytics
- Expiry timeline chart by month.
- Risk composition donut chart (Healthy vs Upcoming vs Warning vs High vs Critical vs Expired).
- Category inventory valuation bar chart.
- Real-time KPI counters: Total Active SKUs, Active Batches, Units at Risk, Capital at Risk ($).

### Feature 11: AI Inventory Assistant
- Conversational assistant powered by Gemini 3.8 Flash.
- Answers questions grounded strictly in live database facts:
  - "Which medicines expire this month?"
  - "List all quarantined batches."
  - "What is the total value at risk in antibiotics?"
  - "Which batches should we return to suppliers?"

### Feature 12: Role-Based Access Control (RBAC) & Audit Trails
- 4 Role Profiles: Admin, Pharmacist, Staff, Auditor.
- Role switcher allows demonstration of distinct permission boundaries.
- Full tamper-evident audit log with user, IP, action, entity, and state changes.
