# Medicine Expiry Alert System - Project Context

## 1. Problem Statement
Hospital pharmacies, retail clinics, and central medical distribution warehouses hold thousands of pharmaceutical stock keeping units (SKUs). Unlike standard retail merchandise, pharmaceuticals are strictly regulated, batch-delineated, and perish on strict statutory expiry dates. 

Major challenges in current operations:
1. **Financial Loss from Wastage**: Unused medications sitting on shelves past expiry represent dead capital and hazardous disposal costs.
2. **Patient Safety Violations**: Dispensing expired, degraded, or recalled medication endangers patient health and violates regulatory standards (FDA, CDSCO, EMA).
3. **Suboptimal Stock Rotation (Non-FEFO)**: Staff frequently pick the most physically accessible box on a shelf instead of applying **First Expiry, First Out (FEFO)**, letting older batches expire in the back.
4. **Visibility Gaps**: Inventory systems often aggregate total quantities of a medicine (e.g., "500 tablets of Amoxicillin") without tracking individual batch numbers, manufacturing dates, and distinct expiry dates.
5. **Lack of Proactive Early Alerts**: Without multi-tiered advance warnings (90-day, 60-day, 30-day, 7-day, Expired), pharmacy managers cannot arrange vendor returns, discounted dispensing, or inter-branch stock transfers in time.

## 2. Project Scope & Target Users
The **Medicine Expiry Alert System** is an enterprise-grade inventory management and expiry surveillance platform built for healthcare organizations.

### Primary User Roles
1. **System Administrator**: Configures system policies, alert thresholds (7/30/60/90 days), branch hierarchies, user roles, security settings, and audits.
2. **Pharmacist / Inventory Manager**: Handles medicine procurement, batch creation, quarantine management, FEFO dispensing, stock adjustments, and supplier returns.
3. **Pharmacy Staff Member**: Conducts daily dispensing, barcode scanning, physical stock counts, and damaged stock reports.
4. **Quality Auditor / Read-Only Officer**: Inspects compliance logs, batch traceability, disposal records, and financial valuation without mutation privileges.

## 3. Guiding Principles & Constraints
- **Zero-Trust Stock Integrity**: Every physical movement (receiving, dispensing, quarantine, transfer) writes an append-only row to the `stock_transactions` ledger.
- **Strict Batch Isolation**: A single medicine SKU has multiple independent batches with unique expiry dates. An expired batch must never taint other active batches of the same SKU, nor may it ever be dispensed.
- **FEFO Enforcement**: Dispensing recommendations prioritize the batch closest to expiry among non-quarantined, non-recalled, valid stock.
- **Determinism & Time-Zone Precision**: All expiry evaluations compare dates strictly against canonical UTC/local calendar day boundaries with no loose floating-point or timezone skew.
- **Explainability**: AI features do not act as autonomous decision-makers; they provide grounded, transparent inventory summaries and risk forecasts.
