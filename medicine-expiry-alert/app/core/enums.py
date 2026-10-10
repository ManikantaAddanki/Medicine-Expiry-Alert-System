from enum import Enum

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
