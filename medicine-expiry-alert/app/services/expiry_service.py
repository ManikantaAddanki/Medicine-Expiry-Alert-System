from datetime import date, datetime
from typing import List, Dict, Any, Optional
from decimal import Decimal
from app.core.enums import AlertSeverity, BatchStatus

def calculate_days_remaining(expiry_date: date, reference_date: Optional[date] = None) -> int:
    """
    Calculates signed days between reference_date (defaults to today) and expiry_date.
    Returns negative if already expired, 0 if expires today, positive if in future.
    """
    ref = reference_date or date.today()
    return (expiry_date - ref).days

def determine_expiry_severity(
    days_remaining: int,
    critical_threshold: int = 7,
    high_threshold: int = 30,
    warning_threshold: int = 60,
    upcoming_threshold: int = 90
) -> Optional[AlertSeverity]:
    """
    Evaluates exact threshold boundaries:
    - days_remaining <= 0: EXPIRED
    - 1 <= days_remaining <= critical_threshold: CRITICAL
    - critical_threshold < days_remaining <= high_threshold: HIGH
    - high_threshold < days_remaining <= warning_threshold: WARNING
    - warning_threshold < days_remaining <= upcoming_threshold: UPCOMING
    - > upcoming_threshold: None (Safe / Healthy)
    """
    if days_remaining <= 0:
        return AlertSeverity.EXPIRED
    elif days_remaining <= critical_threshold:
        return AlertSeverity.CRITICAL
    elif days_remaining <= high_threshold:
        return AlertSeverity.HIGH
    elif days_remaining <= warning_threshold:
        return AlertSeverity.WARNING
    elif days_remaining <= upcoming_threshold:
        return AlertSeverity.UPCOMING
    return None

def evaluate_batch_risk(
    batch: Any, 
    reference_date: Optional[date] = None,
    critical_days: int = 7,
    high_days: int = 30,
    warning_days: int = 60,
    upcoming_days: int = 90
) -> Optional[Dict[str, Any]]:
    """
    Evaluates an individual batch and produces an alert payload if within risk horizons.
    Excludes depleted or already deleted stock.
    """
    if getattr(batch, "available_quantity", 0) <= 0:
        return None

    days = calculate_days_remaining(batch.expiry_date, reference_date)
    severity = determine_expiry_severity(
        days, critical_days, high_days, warning_days, upcoming_days
    )

    if not severity:
        return None

    unit_price = getattr(batch, "purchase_price", 0)
    value_at_risk = Decimal(str(batch.available_quantity)) * Decimal(str(unit_price))

    return {
        "batch_id": getattr(batch, "id", None),
        "batch_number": batch.batch_number,
        "severity": severity,
        "days_remaining": days,
        "units_affected": batch.available_quantity,
        "estimated_value_at_risk": float(value_at_risk),
        "is_expired": days <= 0,
        "current_status": getattr(batch, "status", BatchStatus.ACTIVE)
    }
