# Medicine Expiry Alert System - Implementation Tasks & Roadmap

## Implementation Checklist

### Phase 1: Requirements Analysis & System Design
- [x] Analyze clinical & regulatory requirements for pharmaceutical expiry tracking.
- [x] Specify MySQL 8.0 normalized schema with InnoDB engine and indexing.
- [x] Create architectural overview, entity-relationship diagrams, and feature docs.
- [x] Define FEFO allocation rules, 5-tier alert criteria, and ledger data integrity.

### Phase 2: MySQL Models, Migrations & Database Infrastructure
- [x] SQLAlchemy 2.0 ORM base and connection engine with pooling.
- [x] Models: `Organization`, `Branch`, `User`, `Category`, `Medicine`, `Batch`, `ExpiryAlert`, `StockTransaction`, `Supplier`, `SystemSettings`, `AuditLog`.
- [x] Alembic migration script setup (`alembic/versions/`).
- [x] Dockerfile & Docker Compose with MySQL 8.0 service.

### Phase 3: Core Backend Business Logic & REST API
- [x] FastAPI application entrypoint with CORS, error handlers, and lifecycle hooks.
- [x] Medicine service & endpoints (`/api/v1/medicines`).
- [x] Batch management & endpoints (`/api/v1/batches`).
- [x] Expiry Alert Engine service with configurable date boundaries (`/api/v1/alerts`).
- [x] FEFO calculation engine for dispensing allocation.
- [x] Stock transaction ledger with atomic debit/credit (`/api/v1/inventory/transactions`).
- [x] Suppliers & PO endpoints (`/api/v1/suppliers`).
- [x] CSV Import/Export parser with strict date & numeric validation.
- [x] AI Assistant endpoint with grounded prompt engineering.

### Phase 4: Interactive Web Application UI (Frontend)
- [x] Clean, responsive Pharmacy Management UI with Tailwind CSS.
- [x] Role switcher (Admin, Pharmacist, Staff, Auditor) demonstrating RBAC permissions.
- [x] KPI Overview & Analytics with interactive Chart.js graphs.
- [x] Medicine Catalog with search, filters, and Add/Edit modal.
- [x] Batch Inventory table with live days-remaining calculation & severity color badges.
- [x] Expiry Alert Center with filter tabs (Expired, Critical, High, Warning, Upcoming) and one-click scanner.
- [x] FEFO Dispensing Tool with dynamic batch allocation recommendation.
- [x] Stock Movement Ledger with detailed transaction history & filter by type.
- [x] Quarantine & Quality Control modal (quarantine, unquarantine with recorded reason).
- [x] Supplier Directory & Order Management.
- [x] Barcode & QR Code batch generator + Interactive camera/manual scanner.
- [x] CSV Import / Export with validation preview.
- [x] AI Assistant Chat with sample quick-prompts and grounded responses.
- [x] System Settings panel to adjust alert thresholds (7/30/60/90 days).
- [x] Audit Log viewer.
- [x] Embedded Schema & Architecture Inspector for final-year project reviews.

### Phase 5: Verification & Quality Assurance
- [x] Pytest suite covering batch expiry boundary checks, FEFO logic, and transactions.
- [x] Edge-case verification: batch expiring today, batch expired yesterday, zero-quantity batches.
- [x] Compile and lint frontend application.
