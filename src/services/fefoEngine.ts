import { Batch } from '../types/inventory';
import { calculateDaysRemaining, CURRENT_SYSTEM_DATE } from './alertEngine';

export interface AllocationItem {
  batch_id: number;
  batch_number: string;
  expiry_date: string;
  days_remaining: number;
  allocated_units: number;
  available_units: number;
  storage_location: string;
}

export interface FEFOResult {
  requested_units: number;
  total_allocated: number;
  unfulfilled_units: number;
  is_fully_fulfilled: boolean;
  allocations: AllocationItem[];
  eligible_batches_count: number;
  excluded_batches: {
    batch_number: string;
    reason: string;
    status: string;
    expiry_date: string;
  }[];
}

export function calculateFefoDispense(
  batches: Batch[],
  medicineId: number,
  branchId: number,
  requestedUnits: number,
  referenceDateStr: string = CURRENT_SYSTEM_DATE
): FEFOResult {
  const medicineBatches = batches.filter(
    b => b.medicine_id === medicineId && b.branch_id === branchId
  );

  const eligible: Batch[] = [];
  const excluded: { batch_number: string; reason: string; status: string; expiry_date: string }[] = [];

  for (const b of medicineBatches) {
    if (b.available_quantity <= 0) {
      continue;
    }
    const daysRemaining = calculateDaysRemaining(b.expiry_date, referenceDateStr);

    if (b.status === 'QUARANTINED') {
      excluded.push({
        batch_number: b.batch_number,
        reason: b.quarantine_reason || 'Batch is placed in Quarantine',
        status: 'QUARANTINED',
        expiry_date: b.expiry_date
      });
      continue;
    }

    if (b.status === 'RECALLED') {
      excluded.push({
        batch_number: b.batch_number,
        reason: 'Manufacturer recall issued',
        status: 'RECALLED',
        expiry_date: b.expiry_date
      });
      continue;
    }

    if (daysRemaining <= 0 || b.status === 'EXPIRED') {
      excluded.push({
        batch_number: b.batch_number,
        reason: `Statutory expiry date passed (${b.expiry_date})`,
        status: 'EXPIRED',
        expiry_date: b.expiry_date
      });
      continue;
    }

    if (b.status === 'ACTIVE') {
      eligible.push(b);
    }
  }

  // Sort eligible batches by earliest expiry date first
  eligible.sort((a, b) => {
    const diff = new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
    if (diff !== 0) return diff;
    return a.batch_number.localeCompare(b.batch_number);
  });

  const allocations: AllocationItem[] = [];
  let remainingNeeded = requestedUnits;

  for (const b of eligible) {
    if (remainingNeeded <= 0) break;

    const take = Math.min(b.available_quantity, remainingNeeded);
    allocations.push({
      batch_id: b.id,
      batch_number: b.batch_number,
      expiry_date: b.expiry_date,
      days_remaining: calculateDaysRemaining(b.expiry_date, referenceDateStr),
      allocated_units: take,
      available_units: b.available_quantity,
      storage_location: b.storage_location
    });

    remainingNeeded -= take;
  }

  const totalAllocated = requestedUnits - remainingNeeded;

  return {
    requested_units: requestedUnits,
    total_allocated: totalAllocated,
    unfulfilled_units: remainingNeeded,
    is_fully_fulfilled: remainingNeeded === 0,
    allocations,
    eligible_batches_count: eligible.length,
    excluded_batches: excluded
  };
}
