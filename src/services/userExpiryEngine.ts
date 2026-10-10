import { UserMedicine, ExpiryStatus, ExpiryUrgency } from '../types/userMedicine';

export const USER_CURRENT_DATE = '2026-10-10';

export function calculateMedicineExpiryStatus(
  medicine: UserMedicine,
  referenceDateStr: string = USER_CURRENT_DATE
): ExpiryStatus {
  const expiry = new Date(medicine.expiryDate + 'T00:00:00');
  const ref = new Date(referenceDateStr + 'T00:00:00');
  const diffTime = expiry.getTime() - ref.getTime();
  const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // Check if opened too long (e.g. eye drops opened > 28 days ago)
  let isOpenedTooLong = false;
  let openedDaysAgo: number | undefined;

  if (medicine.openedDate && medicine.discardAfterDaysOpened) {
    const opened = new Date(medicine.openedDate + 'T00:00:00');
    const openedTimeDiff = ref.getTime() - opened.getTime();
    openedDaysAgo = Math.round(openedTimeDiff / (1000 * 60 * 60 * 24));
    if (openedDaysAgo > medicine.discardAfterDaysOpened) {
      isOpenedTooLong = true;
    }
  }

  // Determine Urgency
  if (daysRemaining <= 0 || isOpenedTooLong) {
    const reason = isOpenedTooLong
      ? `Opened ${openedDaysAgo} days ago (limit was ${medicine.discardAfterDaysOpened} days). High bacteria/contamination risk.`
      : `Expired ${Math.abs(daysRemaining)} days ago on ${medicine.expiryDate}. Chemical potency lost.`;

    return {
      urgency: 'EXPIRED',
      daysRemaining,
      isExpired: true,
      isOpenedTooLong,
      openedDaysAgo,
      alertTitle: isOpenedTooLong ? 'Opened Too Long - Discard Now' : 'EXPIRED - DO NOT USE!',
      alertMessage: reason,
      badgeColor: 'bg-rose-600 text-white border-rose-700',
      bannerColor: 'bg-rose-50 border-rose-300 text-rose-900'
    };
  }

  if (daysRemaining <= 7) {
    return {
      urgency: 'CRITICAL',
      daysRemaining,
      isExpired: false,
      isOpenedTooLong: false,
      openedDaysAgo,
      alertTitle: `Expires in ${daysRemaining} Day${daysRemaining === 1 ? '' : 's'}!`,
      alertMessage: `Only ${daysRemaining} days left before expiry (${medicine.expiryDate}). Use soon or purchase a replacement.`,
      badgeColor: 'bg-red-500 text-white border-red-600',
      bannerColor: 'bg-red-50 border-red-200 text-red-900'
    };
  }

  if (daysRemaining <= 30) {
    return {
      urgency: 'UPCOMING',
      daysRemaining,
      isExpired: false,
      isOpenedTooLong: false,
      openedDaysAgo,
      alertTitle: `Expires in ${daysRemaining} Days`,
      alertMessage: `Expiring this month (${medicine.expiryDate}). Check if you need a refill.`,
      badgeColor: 'bg-amber-500 text-white border-amber-600',
      bannerColor: 'bg-amber-50 border-amber-200 text-amber-900'
    };
  }

  if (daysRemaining <= 60) {
    return {
      urgency: 'WARNING',
      daysRemaining,
      isExpired: false,
      isOpenedTooLong: false,
      openedDaysAgo,
      alertTitle: `Expires in ${Math.round(daysRemaining / 30)} Month(s)`,
      alertMessage: `Valid until ${medicine.expiryDate} (${daysRemaining} days remaining).`,
      badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      bannerColor: 'bg-yellow-50 border-yellow-200 text-yellow-900'
    };
  }

  return {
    urgency: 'SAFE',
    daysRemaining,
    isExpired: false,
    isOpenedTooLong: false,
    openedDaysAgo,
    alertTitle: 'Good & Safe to Use',
    alertMessage: `Expires on ${medicine.expiryDate} (${daysRemaining} days left).`,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    bannerColor: 'bg-emerald-50 border-emerald-200 text-emerald-900'
  };
}
