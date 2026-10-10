export type MedicineCategory = 
  | 'Fever & Pain' 
  | 'Cold & Cough' 
  | 'Allergy' 
  | 'Digestion & Stomach' 
  | 'First Aid & Skin' 
  | 'Daily & Chronic' 
  | 'Vitamins & Supplements' 
  | 'Eye & Ear Drops' 
  | 'Other';

export type StorageLocation = 
  | 'Bathroom Cabinet' 
  | 'Kitchen / Fridge' 
  | 'Bedroom Nightstand' 
  | 'First Aid Kit' 
  | 'Travel Bag' 
  | 'Living Room';

export type FamilyMember = 
  | 'Self' 
  | 'Family Shared' 
  | 'Mom' 
  | 'Dad' 
  | 'Kids' 
  | 'Grandparents' 
  | 'Pet';

export type ExpiryUrgency = 
  | 'EXPIRED' 
  | 'CRITICAL'   // 1 to 7 days
  | 'UPCOMING'   // 8 to 30 days
  | 'WARNING'    // 31 to 60 days
  | 'SAFE';      // > 60 days

export type IntakeTime = 'Morning' | 'Afternoon' | 'Night' | 'As Needed';

export interface UserMedicine {
  id: string;
  name: string;
  brandOrGeneric: string;
  category: MedicineCategory;
  purpose: string;
  expiryDate: string; // YYYY-MM-DD
  openedDate?: string; // YYYY-MM-DD
  discardAfterDaysOpened?: number; // e.g. 28 days for eye drops
  quantity: string;
  dosageNotes?: string;
  location: StorageLocation;
  assignedTo: FamilyMember;
  isPrescription: boolean;
  notes?: string;
  intakeTime?: IntakeTime;
  takenToday?: boolean;
  lastTakenTime?: string;
  activeIngredients?: string[];
  estimatedRefillCost?: number; // Retail price estimate
  createdAt: string;
  photoUrl?: string; // Captured or uploaded medicine photo
  batchNumber?: string;
  manufacturingDate?: string;
  scanConfidence?: 'high' | 'medium' | 'low';
}

export interface ExpiryStatus {
  urgency: ExpiryUrgency;
  daysRemaining: number;
  isExpired: boolean;
  isOpenedTooLong: boolean;
  openedDaysAgo?: number;
  alertTitle: string;
  alertMessage: string;
  badgeColor: string;
  bannerColor: string;
}

export interface DrugInteraction {
  medicineA: string;
  medicineB: string;
  severity: 'DANGEROUS' | 'MODERATE' | 'SAFE';
  summary: string;
  clinicalAdvice: string;
}
