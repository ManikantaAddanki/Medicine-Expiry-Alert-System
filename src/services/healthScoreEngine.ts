import { UserMedicine } from '../types/userMedicine';
import { calculateMedicineExpiryStatus } from './userExpiryEngine';

export interface CabinetHealthScore {
  score: number;
  label: string;
  color: string;
  bgColor: string;
  badgeColor: string;
  expiredCount: number;
  criticalCount: number;
  openedRiskCount: number;
  actionRequired: string;
}

export function computeCabinetHealthScore(medicines: UserMedicine[]): CabinetHealthScore {
  if (medicines.length === 0) {
    return {
      score: 100,
      label: 'Empty Cabinet',
      color: 'text-slate-600',
      bgColor: 'bg-slate-100',
      badgeColor: 'bg-slate-200 text-slate-700',
      expiredCount: 0,
      criticalCount: 0,
      openedRiskCount: 0,
      actionRequired: 'Add your home medicines to start monitoring safety.'
    };
  }

  let penalty = 0;
  let expiredCount = 0;
  let criticalCount = 0;
  let openedRiskCount = 0;

  medicines.forEach(m => {
    const s = calculateMedicineExpiryStatus(m);
    if (s.urgency === 'EXPIRED') {
      penalty += 25;
      expiredCount++;
    } else if (s.isOpenedTooLong) {
      penalty += 20;
      openedRiskCount++;
    } else if (s.urgency === 'CRITICAL') {
      penalty += 10;
      criticalCount++;
    } else if (s.urgency === 'UPCOMING') {
      penalty += 4;
    }
  });

  const finalScore = Math.max(10, Math.min(100, 100 - penalty));

  if (finalScore >= 90) {
    return {
      score: finalScore,
      label: 'Excellent & Safe',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-500',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      expiredCount,
      criticalCount,
      openedRiskCount,
      actionRequired: 'All medications are well within safety expiration dates.'
    };
  } else if (finalScore >= 70) {
    return {
      score: finalScore,
      label: 'Good (Minor Expiry Approaching)',
      color: 'text-teal-700',
      bgColor: 'bg-teal-500',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
      expiredCount,
      criticalCount,
      openedRiskCount,
      actionRequired: `${criticalCount} medicine(s) expiring soon. Plan refills.`
    };
  } else if (finalScore >= 50) {
    return {
      score: finalScore,
      label: 'Fair (Requires Cleaning)',
      color: 'text-amber-700',
      bgColor: 'bg-amber-500',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      expiredCount,
      criticalCount,
      openedRiskCount,
      actionRequired: 'Check expiring medications to ensure family safety.'
    };
  } else {
    return {
      score: finalScore,
      label: 'Attention: Expired Meds Present!',
      color: 'text-rose-700',
      bgColor: 'bg-rose-500',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      expiredCount,
      criticalCount,
      openedRiskCount,
      actionRequired: `Throw away ${expiredCount} expired medicine(s) to restore cabinet safety.`
    };
  }
}
