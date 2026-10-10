from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional, Dict, Any
from datetime import date
from pydantic import BaseModel, Field

from app.core.enums import RoleEnum, BatchStatus, AlertSeverity, TransactionType
from app.services.expiry_service import determine_expiry_severity, calculate_days_remaining
from app.services.fefo_service import calculate_fefo_allocation

router = APIRouter()

# Pydantic Schemas for Request/Response validation
class MedicineCreate(BaseModel):
    name: str = Field(..., example="Paracetamol 500mg")
    generic_name: str = Field(..., example="Acetaminophen")
    category_id: int = Field(..., example=1)
    brand_name: Optional[str] = "Calpol"
    strength: str = "500 mg"
    dosage_form: str = "Tablet"
    manufacturer: str = "GSK Healthcare"
    barcode: Optional[str] = "890123456789"
    minimum_reorder_level: int = 50

class BatchCreate(BaseModel):
    medicine_id: int
    branch_id: int = 1
    supplier_id: Optional[int] = 1
    batch_number: str
    manufacturing_date: Optional[date] = None
    expiry_date: date
    quantity_received: int
    available_quantity: int
    purchase_price: float
    selling_price: float
    storage_location: Optional[str] = "Shelf A-1"

class FEFORequest(BaseModel):
    medicine_id: int
    requested_units: int
    branch_id: int = 1

class TransactionCreate(BaseModel):
    batch_id: int
    transaction_type: TransactionType
    quantity_change: int
    reason: Optional[str] = None
    reference_id: Optional[str] = None

# --- Mock In-Memory Store for API Testing ---
# (In production with MySQL connection, these delegate to SQLAlchemy ORM queries via SessionLocal)
MOCK_MEDICINES = [
    {
        "id": 1, "name": "Paracetamol 500mg", "generic_name": "Acetaminophen", 
        "category": "Analgesics", "dosage_form": "Tablet", "strength": "500 mg",
        "manufacturer": "GSK Healthcare", "barcode": "8901001001", "minimum_reorder_level": 50,
        "is_prescription_required": False
    },
    {
        "id": 2, "name": "Amoxicillin 250mg", "generic_name": "Amoxicillin Trihydrate", 
        "category": "Antibiotics", "dosage_form": "Capsule", "strength": "250 mg",
        "manufacturer": "Pfizer Ltd", "barcode": "8901001002", "minimum_reorder_level": 40,
        "is_prescription_required": True
    },
    {
        "id": 3, "name": "Metformin 500mg", "generic_name": "Metformin Hydrochloride", 
        "category": "Antidiabetic", "dosage_form": "Tablet", "strength": "500 mg",
        "manufacturer": "Sun Pharma", "barcode": "8901001003", "minimum_reorder_level": 60,
        "is_prescription_required": True
    }
]

@router.get("/medicines", summary="List all medicines in catalog")
def get_medicines(search: Optional[str] = None):
    if search:
        s = search.lower()
        return [m for m in MOCK_MEDICINES if s in m["name"].lower() or s in m["generic_name"].lower()]
    return MOCK_MEDICINES

@router.post("/medicines", status_code=status.HTTP_201_CREATED, summary="Create a new medicine record")
def create_medicine(payload: MedicineCreate):
    new_id = len(MOCK_MEDICINES) + 1
    item = payload.model_dump()
    item["id"] = new_id
    MOCK_MEDICINES.append(item)
    return item

@router.get("/alerts/summary", summary="Get aggregated KPI alert counts and value at risk")
def get_alerts_summary():
    return {
        "expired_batches": 2,
        "critical_batches_7d": 3,
        "high_priority_30d": 5,
        "warning_60d": 4,
        "upcoming_90d": 6,
        "total_value_at_risk_usd": 3845.50,
        "quarantined_batches": 1,
        "last_scan_timestamp": "2026-10-10T05:00:00Z"
    }

@router.post("/inventory/fefo-recommendation", summary="Calculate FEFO allocation for dispensing")
def get_fefo_recommendation(payload: FEFORequest):
    # Demonstrating FEFO allocation logic
    from dataclasses import dataclass
    from datetime import timedelta
    today = date.today()

    # Simulate batches for the requested medicine
    batches = [
        type('Batch', (), {
            'id': 101, 'batch_number': 'PCM-26A', 'expiry_date': today + timedelta(days=12),
            'available_quantity': 35, 'status': BatchStatus.ACTIVE, 'storage_location': 'Shelf 1-A'
        })(),
        type('Batch', (), {
            'id': 102, 'batch_number': 'PCM-26B', 'expiry_date': today + timedelta(days=75),
            'available_quantity': 100, 'status': BatchStatus.ACTIVE, 'storage_location': 'Shelf 2-B'
        })(),
        type('Batch', (), {
            'id': 103, 'batch_number': 'PCM-OLD', 'expiry_date': today - timedelta(days=5),
            'available_quantity': 20, 'status': BatchStatus.EXPIRED, 'storage_location': 'Quarantine Bin'
        })()
    ]
    return calculate_fefo_allocation(batches, payload.requested_units, today)
