import unittest
from datetime import date, timedelta
from dataclasses import dataclass
from typing import Optional
from decimal import Decimal

from app.core.enums import BatchStatus, AlertSeverity
from app.services.expiry_service import (
    calculate_days_remaining, 
    determine_expiry_severity, 
    evaluate_batch_risk
)
from app.services.fefo_service import calculate_fefo_allocation

@dataclass
class MockBatch:
    id: int
    batch_number: str
    expiry_date: date
    available_quantity: int
    status: BatchStatus = BatchStatus.ACTIVE
    purchase_price: float = 12.50
    storage_location: str = "Shelf A-1"

class TestExpiryAndFEFOEngine(unittest.TestCase):
    def setUp(self):
        # Canonical Reference date: 2026-10-10
        self.ref_date = date(2026, 10, 10)

    def test_days_remaining_calculation(self):
        # Expired yesterday
        d_past = self.ref_date - timedelta(days=1)
        self.assertEqual(calculate_days_remaining(d_past, self.ref_date), -1)

        # Expires today (boundary case: 0 days)
        self.assertEqual(calculate_days_remaining(self.ref_date, self.ref_date), 0)

        # Expires in 7 days
        d_7 = self.ref_date + timedelta(days=7)
        self.assertEqual(calculate_days_remaining(d_7, self.ref_date), 7)

    def test_exact_expiry_threshold_boundaries(self):
        # Passed or today (<= 0)
        self.assertEqual(determine_expiry_severity(-5), AlertSeverity.EXPIRED)
        self.assertEqual(determine_expiry_severity(0), AlertSeverity.EXPIRED)

        # Critical: 1 to 7 days
        self.assertEqual(determine_expiry_severity(1), AlertSeverity.CRITICAL)
        self.assertEqual(determine_expiry_severity(7), AlertSeverity.CRITICAL)

        # High priority: 8 to 30 days
        self.assertEqual(determine_expiry_severity(8), AlertSeverity.HIGH)
        self.assertEqual(determine_expiry_severity(30), AlertSeverity.HIGH)

        # Warning: 31 to 60 days
        self.assertEqual(determine_expiry_severity(31), AlertSeverity.WARNING)
        self.assertEqual(determine_expiry_severity(60), AlertSeverity.WARNING)

        # Upcoming: 61 to 90 days
        self.assertEqual(determine_expiry_severity(61), AlertSeverity.UPCOMING)
        self.assertEqual(determine_expiry_severity(90), AlertSeverity.UPCOMING)

        # Healthy: > 90 days
        self.assertIsNone(determine_expiry_severity(91))
        self.assertIsNone(determine_expiry_severity(180))

    def test_value_at_risk_calculation(self):
        batch = MockBatch(
            id=10,
            batch_number="AMX099",
            expiry_date=self.ref_date + timedelta(days=5),
            available_quantity=200,
            purchase_price=8.50
        )
        risk = evaluate_batch_risk(batch, self.ref_date)
        self.assertIsNotNone(risk)
        self.assertEqual(risk["severity"], AlertSeverity.CRITICAL)
        self.assertEqual(risk["days_remaining"], 5)
        self.assertEqual(risk["units_affected"], 200)
        self.assertAlmostEqual(risk["estimated_value_at_risk"], 1700.0)

    def test_fefo_allocation_earliest_first(self):
        # Batch A expires in 15 days (earlier)
        batch_a = MockBatch(
            id=1,
            batch_number="PCM001",
            expiry_date=self.ref_date + timedelta(days=15),
            available_quantity=40,
            status=BatchStatus.ACTIVE
        )
        # Batch B expires in 90 days (later)
        batch_b = MockBatch(
            id=2,
            batch_number="PCM002",
            expiry_date=self.ref_date + timedelta(days=90),
            available_quantity=100,
            status=BatchStatus.ACTIVE
        )

        # Request 60 units: should take 40 from Batch A, 20 from Batch B
        result = calculate_fefo_allocation([batch_b, batch_a], 60, self.ref_date)
        self.assertTrue(result["is_fully_fulfilled"])
        self.assertEqual(result["total_allocated"], 60)
        self.assertEqual(len(result["allocations"]), 2)
        
        # Batch A allocated first
        self.assertEqual(result["allocations"][0]["batch_number"], "PCM001")
        self.assertEqual(result["allocations"][0]["allocated_units"], 40)
        # Batch B allocated remainder
        self.assertEqual(result["allocations"][1]["batch_number"], "PCM002")
        self.assertEqual(result["allocations"][1]["allocated_units"], 20)

    def test_fefo_excludes_quarantined_and_expired(self):
        batch_expired = MockBatch(
            id=1,
            batch_number="EXPIRED_BATCH",
            expiry_date=self.ref_date - timedelta(days=2),
            available_quantity=50,
            status=BatchStatus.ACTIVE
        )
        batch_quarantined = MockBatch(
            id=2,
            batch_number="QUARANTINE_BATCH",
            expiry_date=self.ref_date + timedelta(days=10),
            available_quantity=50,
            status=BatchStatus.QUARANTINED
        )
        batch_valid = MockBatch(
            id=3,
            batch_number="VALID_BATCH",
            expiry_date=self.ref_date + timedelta(days=20),
            available_quantity=30,
            status=BatchStatus.ACTIVE
        )

        # Request 50 units
        result = calculate_fefo_allocation(
            [batch_expired, batch_quarantined, batch_valid], 50, self.ref_date
        )
        # Only batch_valid is eligible; should allocate 30 and leave 20 unfulfilled
        self.assertEqual(result["total_allocated"], 30)
        self.assertEqual(result["unfulfilled_units"], 20)
        self.assertFalse(result["is_fully_fulfilled"])
        self.assertEqual(result["excluded_batches_count"], 2)
        self.assertEqual(result["allocations"][0]["batch_number"], "VALID_BATCH")

if __name__ == "__main__":
    unittest.main()
