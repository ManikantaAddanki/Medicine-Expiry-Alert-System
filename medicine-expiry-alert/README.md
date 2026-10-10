# Medicine Expiry Alert System

A robust, enterprise-grade pharmaceutical inventory and automated batch-level expiry monitoring platform built with **Python 3.12**, **FastAPI**, **SQLAlchemy 2.0**, and **MySQL 8.0**.

---

## 🌟 Key Features

1. **Batch-Level Inventory Tracking**: Tracks medications at individual batch numbers with specific manufacturing and expiry dates, storage locations, and purchase costs.
2. **Automated Expiry Alert Engine**:
   - `EXPIRED` ($\le 0$ days overdue) - Automatic dispensing freeze.
   - `CRITICAL` (1 to 7 days remaining).
   - `HIGH PRIORITY` (8 to 30 days remaining).
   - `WARNING` (31 to 60 days remaining).
   - `UPCOMING` (61 to 90 days remaining).
3. **FEFO (First Expiry, First Out) Algorithm**: Intelligent dispensing allocation that prioritizes batches closest to expiry while excluding expired, quarantined, or recalled stock.
4. **Append-Only Stock Transaction Ledger**: Comprehensive audit trail for `RECEIVE`, `DISPENSE`, `ADJUSTMENT`, `TRANSFER`, `QUARANTINE`, `RELEASE`, `DAMAGE`, and `RETURN`.
5. **Low Stock & Reorder Alerts**: Reorder calculation comparing total available units across active batches against minimum safety thresholds.
6. **Role-Based Access Control (RBAC)**: Fine-grained permissions across Administrator, Pharmacist, Staff Member, and Auditor roles.
7. **CSV Import & Export**: Fast batch ingestion with column validation and error reporting.
8. **QR & Barcode Generation & Scanning**: Generates batch identification codes and supports instant optical lookup.

---

## 🏗️ Architecture & Technology Stack

- **Backend**: Python 3.12+, FastAPI, Pydantic v2
- **Database**: MySQL 8.0 (InnoDB engine, strict foreign key constraints)
- **ORM & Migrations**: SQLAlchemy 2.0, PyMySQL driver, Alembic
- **Background Tasks**: APScheduler (scheduled daily expiry scanner)
- **Testing**: Pytest, HTTPX, Unittest
- **Deployment**: Docker & Docker Compose

---

## 🚀 Quickstart with Docker Compose

1. Clone the repository and configure `.env`:
   ```bash
   cp .env.example .env
   ```

2. Start MySQL and FastAPI backend:
   ```bash
   docker-compose up -d --build
   ```

3. Access the interactive API documentation:
   - OpenAPI Docs: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`
   - Healthcheck: `http://localhost:8000/health`

---

## 🧪 Running Automated Tests

Run the test suite for expiry threshold boundary conditions and FEFO allocation:
```bash
python3 -m unittest tests/test_expiry_fefo.py
```

All 5 core boundary tests verify exact 0-day, 7-day, 30-day, 60-day, and 90-day transitions, as well as quarantine exclusion from dispensing.
