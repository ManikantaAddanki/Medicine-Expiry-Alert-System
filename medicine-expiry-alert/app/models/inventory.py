from datetime import datetime, date
from enum import Enum
from sqlalchemy import (
    Column, Integer, String, Boolean, Date, DateTime, 
    Numeric, ForeignKey, Text, Enum as SQLEnum, Index, UniqueConstraint, JSON
)
from sqlalchemy.orm import relationship
from app.database.session import Base

class RoleEnum(str, Enum):
    ADMIN = "admin"
    PHARMACIST = "pharmacist"
    STAFF = "staff"
    AUDITOR = "auditor"

class BatchStatus(str, Enum):
    ACTIVE = "ACTIVE"
    QUARANTINED = "QUARANTINED"
    RECALLED = "RECALLED"
    EXPIRED = "EXPIRED"
    DEPLETED = "DEPLETED"

class AlertSeverity(str, Enum):
    EXPIRED = "EXPIRED"
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    WARNING = "WARNING"
    UPCOMING = "UPCOMING"

class TransactionType(str, Enum):
    RECEIVE = "RECEIVE"
    DISPENSE = "DISPENSE"
    ADJUSTMENT = "ADJUSTMENT"
    TRANSFER = "TRANSFER"
    QUARANTINE = "QUARANTINE"
    RELEASE = "RELEASE"
    DAMAGE = "DAMAGE"
    RETURN = "RETURN"

class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    address = Column(Text, nullable=True)
    phone = Column(String(30), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="branch")
    batches = relationship("MedicineBatch", back_populates="branch")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    username = Column(String(80), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(120), nullable=False)
    role = Column(SQLEnum(RoleEnum), default=RoleEnum.STAFF, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    branch = relationship("Branch", back_populates="users")
    transactions = relationship("StockTransaction", back_populates="user")

class MedicineCategory(Base):
    __tablename__ = "medicine_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255), nullable=True)

    medicines = relationship("Medicine", back_populates="category")

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    contact_person = Column(String(100), nullable=True)
    phone = Column(String(30), nullable=False)
    email = Column(String(100), nullable=False)
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    batches = relationship("MedicineBatch", back_populates="supplier")

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("medicine_categories.id"), nullable=False)
    name = Column(String(150), nullable=False, index=True)
    generic_name = Column(String(150), nullable=False, index=True)
    brand_name = Column(String(100), nullable=True)
    composition = Column(String(255), nullable=True)
    strength = Column(String(60), nullable=False)
    dosage_form = Column(String(60), nullable=False)  # Tablet, Capsule, Syrup, etc.
    manufacturer = Column(String(120), nullable=False)
    barcode = Column(String(100), unique=True, index=True, nullable=True)
    storage_instructions = Column(String(200), default="Store below 25°C in a dry place")
    is_prescription_required = Column(Boolean, default=False)
    minimum_reorder_level = Column(Integer, default=50, nullable=False)
    unit_of_measure = Column(String(30), default="units")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("MedicineCategory", back_populates="medicines")
    batches = relationship("MedicineBatch", back_populates="medicine", cascade="all, delete-orphan")

class MedicineBatch(Base):
    __tablename__ = "medicine_batches"

    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    batch_number = Column(String(80), nullable=False)
    manufacturing_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=False, index=True)
    quantity_received = Column(Integer, nullable=False)
    available_quantity = Column(Integer, nullable=False)
    purchase_price = Column(Numeric(10, 2), nullable=False)
    selling_price = Column(Numeric(10, 2), nullable=False)
    storage_location = Column(String(80), nullable=True)  # Rack A-1
    status = Column(SQLEnum(BatchStatus), default=BatchStatus.ACTIVE, nullable=False, index=True)
    quarantine_reason = Column(Text, nullable=True)
    received_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("batch_number", "branch_id", "medicine_id", name="uq_batch_branch_medicine"),
        Index("idx_batch_expiry_status", "expiry_date", "status"),
    )

    medicine = relationship("Medicine", back_populates="batches")
    branch = relationship("Branch", back_populates="batches")
    supplier = relationship("Supplier", back_populates="batches")
    alerts = relationship("ExpiryAlert", back_populates="batch", cascade="all, delete-orphan")
    transactions = relationship("StockTransaction", back_populates="batch")

class ExpiryAlert(Base):
    __tablename__ = "expiry_alerts"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("medicine_batches.id"), nullable=False)
    severity = Column(SQLEnum(AlertSeverity), nullable=False, index=True)
    days_remaining = Column(Integer, nullable=False)
    units_affected = Column(Integer, nullable=False)
    estimated_value_at_risk = Column(Numeric(12, 2), nullable=False)
    status = Column(String(50), default="NEW")  # NEW, ACKNOWLEDGED, RESOLVED
    resolved_action = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    batch = relationship("MedicineBatch", back_populates="alerts")

class StockTransaction(Base):
    __tablename__ = "stock_transactions"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("medicine_batches.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    quantity_change = Column(Integer, nullable=False)
    previous_quantity = Column(Integer, nullable=False)
    resulting_quantity = Column(Integer, nullable=False)
    reference_id = Column(String(100), nullable=True)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    batch = relationship("MedicineBatch", back_populates="transactions")
    user = relationship("User", back_populates="transactions")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(80), nullable=False)
    entity_name = Column(String(80), nullable=False)
    entity_id = Column(Integer, nullable=True)
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
