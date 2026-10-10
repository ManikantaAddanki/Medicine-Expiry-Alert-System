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

export type UserRole = 'admin' | 'caregiver' | 'pharmacist' | 'patient';

export interface RoleConfig {
  id: UserRole;
  label: string;
  shortLabel: string;
  emoji: string;
  badgeClass: string;
  description: string;
  privileges: string[];
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  admin: {
    id: 'admin',
    label: 'Cabinet Administrator',
    shortLabel: 'Admin',
    emoji: '👑',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Full system oversight: manage all registered users, assign roles, configure automated email rules, and view compliance audits.',
    privileges: [
      'Access to Admin Module & User Management',
      'Change & assign security roles',
      'Trigger automated expiry emails to all users',
      'Full cabinet inventory & batch disposal authority'
    ]
  },
  caregiver: {
    id: 'caregiver',
    label: 'Family Caregiver',
    shortLabel: 'Caregiver',
    emoji: '🛡️',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
    description: 'Family health manager: adds and organizes medicines for dependents, logs doses taken, and receives automated email alerts.',
    privileges: [
      'Add, edit & photo scan medications',
      'Track daily family dose schedule',
      'Receive instant automated inbox alerts for expiring meds',
      'Initiate safe household disposal guides'
    ]
  },
  pharmacist: {
    id: 'pharmacist',
    label: 'Clinical Pharmacist / Medical Advisor',
    shortLabel: 'Pharmacist',
    emoji: '💊',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Medical & chemical review: checks active ingredients, dangerous drug interactions, contraindications, and expiry quarantine.',
    privileges: [
      'Clinical drug clash & interaction analysis',
      'Certify medicine quality and packaging integrity',
      'Approve chemical disposal protocol for expired items',
      'Inspect lot/batch numbers and recalls'
    ]
  },
  patient: {
    id: 'patient',
    label: 'Individual Patient / Family Member',
    shortLabel: 'Patient',
    emoji: '👤',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Medication recipient: views personal prescriptions, checks daily dose schedule, and receives personal expiry reminders.',
    privileges: [
      'View personal assigned medications',
      'Check off daily morning / night doses',
      'Receive personal alerts when medicine expires or is low',
      'Access emergency room medication locator'
    ]
  }
};

