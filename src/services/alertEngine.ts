import { Batch, Medicine, ExpiryAlert, AlertSeverity, SystemSettings } from '../types/inventory';

// Canonical reference date in 2026
export const CURRENT_SYSTEM_DATE = '2026-10-10';

export function calculateDaysRemaining(expiryDateStr: string, referenceDateStr: string = CURRENT_SYSTEM_DATE): number {
  const expiry = new Date(expiryDateStr + 'T00:00:00');
  const ref = new Date(referenceDateStr + 'T00:00:00');
  const diffTime = expiry.getTime() - ref.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function determineSeverity(
  daysRemaining: number,
  settings: SystemSettings
): AlertSeverity | null {
  if (daysRemaining <= 0) {
    return 'EXPIRED';
  } else if (daysRemaining <= settings.threshold_critical_days) {
    return 'CRITICAL';
  } else if (daysRemaining <= settings.threshold_high_days) {
    return 'HIGH';
  } else if (daysRemaining <= settings.threshold_warning_days) {
    return 'WARNING';
  } else if (daysRemaining <= settings.threshold_upcoming_days) {
    return 'UPCOMING';
  }
  return null;
}

export function generateExpiryAlerts(
  batches: Batch[],
  medicines: Medicine[],
  settings: SystemSettings,
  referenceDateStr: string = CURRENT_SYSTEM_DATE
): ExpiryAlert[] {
  const medMap = new Map(medicines.map(m => [m.id, m]));
  const alerts: ExpiryAlert[] = [];

  batches.forEach((batch) => {
    if (batch.available_quantity <= 0) return;

    const days = calculateDaysRemaining(batch.expiry_date, referenceDateStr);
    const severity = determineSeverity(days, settings);

    if (severity) {
      const med = medMap.get(batch.medicine_id);
      const medicineName = med ? med.name : `Medicine #${batch.medicine_id}`;
      const valueAtRisk = batch.available_quantity * batch.purchase_price;

      alerts.push({
        id: batch.id * 100,
        batch_id: batch.id,
        medicine_id: batch.medicine_id,
        medicine_name: medicineName,
        batch_number: batch.batch_number,
        expiry_date: batch.expiry_date,
        days_remaining: days,
        severity: severity,
        units_affected: batch.available_quantity,
        estimated_value_at_risk: Number(valueAtRisk.toFixed(2)),
        status: 'NEW',
        branch_id: batch.branch_id,
        created_at: `${referenceDateStr} 06:00:00`
      });
    }
  });

  // Sort: Expired first, then Critical, High, Warning, Upcoming
  const order: Record<AlertSeverity, number> = {
    EXPIRED: 1,
    CRITICAL: 2,
    HIGH: 3,
    WARNING: 4,
    UPCOMING: 5
  };

  return alerts.sort((a, b) => order[a.severity] - order[b.severity] || a.days_remaining - b.days_remaining);
}
