# Medicine Expiry Alert System - Architecture Document

## 1. High-Level Architecture Overview

The system follows a modern multi-tier architecture with separation of concerns:

```
+---------------------------------------------------------------------------------+
|                               Presentation Layer                                |
|   - Responsive Web UI (HTML5, Tailwind CSS, React / Jinja2 / Bootstrap)        |
|   - Real-time Alert Banners, Chart.js Visualizations, QR/Barcode Scanner        |
|   - Role-Based Dynamic Views & Permissions Matrix                               |
+---------------------------------------------------------------------------------+
                                      |
                                      | HTTPS / REST JSON
                                      v
+---------------------------------------------------------------------------------+
|                               API & Routing Layer                               |
|   - FastAPI REST API Endpoints (/api/v1/auth, /medicines, /batches, /alerts...) |
|   - Request Validation with Pydantic v2 Models                                  |
|   - JWT & Session Cookie Authentication + RBAC Dependency Injection             |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
|                                 Business Layer                                  |
|   - Expiry Alert Engine (Evaluates <=0d, <=7d, <=30d, <=60d, <=90d thresholds)  |
|   - FEFO Dispensing Engine (Greedy earliest-expiry allocation)                  |
|   - Stock Ledger Service (Atomic transactional debit/credit + audit logging)    |
|   - Quarantine & Quality Control State Machine                                  |
|   - CSV Import/Export Pipeline with schema validation                           |
|   - AI Inventory Assistant (Gemini 3.8 Flash RAG over inventory metrics)        |
+---------------------------------------------------------------------------------+
          |                                                   |
          v                                                   v
+-----------------------------+             +-------------------------------------+
|      Background Worker      |             |         Data & Storage Layer        |
| - APScheduler Periodic Scan |             | - MySQL 8.0 InnoDB Engine           |
| - Daily Expiry Scanner      |             | - SQLAlchemy ORM with Connection    |
| - Low-Stock Reorder Watcher |             |   Pooling (QueuePool)               |
| - In-App & Email Notifier   |             | - Alembic Database Migrations       |
+-----------------------------+             +-------------------------------------+
```

## 2. Component Breakdown

### A. Expiry Alert Engine (`app/services/expiry_service.py`)
- **Evaluation Logic**: Runs daily (or on-demand). Evaluates every batch where `available_quantity > 0` and status is not `DELETED`.
- **Threshold Tiers**:
  - `EXPIRED`: `expiry_date < CURRENT_DATE` (Days $\le 0$). Stock is locked from dispensing.
  - `CRITICAL`: $1 \le \text{Days} \le 7$. Immediate priority for supplier return or clinical usage.
  - `HIGH`: $8 \le \text{Days} \le 30$. High urgency alert.
  - `WARNING`: $31 \le \text{Days} \le 60$. Warning flag for reorder halt and promotional push.
  - `UPCOMING`: $61 \le \text{Days} \le 90$. Approaching expiry window.
- **Idempotency & Deduplication**: If an active alert already exists for a batch with the same tier, it avoids generating duplicate spam alerts. If the batch tier changes (e.g. from WARNING to CRITICAL), it transitions the alert state.

### B. FEFO (First Expiry, First Out) Allocator
When dispensing quantity $Q$ of a medicine:
1. Query active batches for that medicine in the branch.
2. Filter out batches where `status != 'ACTIVE'` (excludes QUARANTINED, RECALLED, EXPIRED).
3. Filter out batches where `expiry_date <= CURRENT_DATE`.
4. Order batches by `expiry_date ASC, batch_number ASC`.
5. Greedy allocation: Fill requested quantity from the earliest batch; if insufficient, spill over into the next earliest batch.

### C. Stock Movement & Ledger Engine
All stock modifications must execute within an explicit database transaction:
- `RECEIVE`: Increments batch available quantity.
- `DISPENSE`: Decrements batch available quantity; enforces non-negative balance.
- `TRANSFER`: Atomic decrement in source branch, increment in destination branch.
- `QUARANTINE`: Sets batch status to `QUARANTINED`, freezing available units.
- `RELEASE`: Returns quarantined batch to `ACTIVE`.
- `DAMAGE`: Decrements available quantity with recorded incident note.
- `RETURN`: Returns stock to supplier, decrements batch, records credit note reference.

### D. Security & Role-Based Access Control (RBAC)
- Password hashing with **Bcrypt** / **Argon2id**.
- Fine-grained permission checks injected into route dependencies:
  - `admin`: All routes.
  - `pharmacist`: Inventory mutations, batch creation, quarantine, reports.
  - `staff`: Read inventory, scan barcode, dispense, log damage.
  - `auditor`: Strictly read-only on inventory, transactions, and audit logs.
- Immutable audit log table (`audit_logs`) records user ID, IP address, action, target entity, timestamp, and JSON diff payload.
