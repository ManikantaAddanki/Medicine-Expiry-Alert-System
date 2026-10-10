import { UserMedicine } from '../types/userMedicine';

export const INITIAL_USER_MEDICINES: UserMedicine[] = [
  {
    id: 'med-1',
    name: 'Dolo 650mg (Paracetamol)',
    brandOrGeneric: 'Micro Labs / Paracetamol',
    category: 'Fever & Pain',
    purpose: 'Fever, headache, body aches, sore throat',
    expiryDate: '2026-10-14', // Expires in 4 days from Oct 10, 2026!
    quantity: '6 tablets left (in blister strip)',
    dosageNotes: '1 tablet after food every 6 hours if fever > 100°F (Max 3/day)',
    location: 'Bathroom Cabinet',
    assignedTo: 'Self',
    isPrescription: false,
    notes: 'Bought for viral flu last season',
    createdAt: '2026-02-15'
  },
  {
    id: 'med-2',
    name: 'Benadryl Dry Cough Formula Syrup',
    brandOrGeneric: 'Diphenhydramine + Dextromethorphan',
    category: 'Cold & Cough',
    purpose: 'Nighttime dry cough & throat irritation',
    expiryDate: '2026-10-02', // Expired 8 days ago!
    openedDate: '2026-08-10',
    discardAfterDaysOpened: 90,
    quantity: '1 bottle (~60ml left)',
    dosageNotes: '10ml at bedtime',
    location: 'Kitchen / Fridge',
    assignedTo: 'Kids',
    isPrescription: false,
    notes: 'Keep bottle tightly closed and refrigerated',
    createdAt: '2026-08-10'
  },
  {
    id: 'med-3',
    name: 'Ciplox Eye / Ear Drops 10ml',
    brandOrGeneric: 'Ciprofloxacin 0.3%',
    category: 'Eye & Ear Drops',
    purpose: 'Eye irritation, conjunctivitis, bacterial infection',
    expiryDate: '2027-04-15', // Bottle expiry is 2027, BUT opened date has passed!
    openedDate: '2026-08-25', // Opened 46 days ago
    discardAfterDaysOpened: 28, // Max 28 days after breaking seal
    quantity: '1 bottle (half full)',
    dosageNotes: '2 drops in affected eye twice daily',
    location: 'Bathroom Cabinet',
    assignedTo: 'Mom',
    isPrescription: true,
    notes: 'CRITICAL: Eye drops grow bacteria once seal is open past 4 weeks!',
    createdAt: '2026-08-25'
  },
  {
    id: 'med-4',
    name: 'Pantocid 40mg (Pantoprazole)',
    brandOrGeneric: 'Sun Pharma / Pantoprazole',
    category: 'Digestion & Stomach',
    purpose: 'Severe acid reflux, heartburn, GERD',
    expiryDate: '2026-10-28', // Expires in 18 days!
    quantity: '8 tablets left',
    dosageNotes: 'Take 1 tablet in morning 30 minutes before breakfast with water',
    location: 'Bedroom Nightstand',
    assignedTo: 'Dad',
    isPrescription: true,
    notes: 'Prescribed by gastroenterologist for acidity',
    createdAt: '2026-05-10'
  },
  {
    id: 'med-5',
    name: 'Cetirizine 10mg (Zyrtec / Cetzine)',
    brandOrGeneric: 'Cetirizine Hydrochloride',
    category: 'Allergy',
    purpose: 'Sneezing, runny nose, pollen allergy, skin hives',
    expiryDate: '2027-03-30', // Safe, ~5 months away
    quantity: '15 tablets left',
    dosageNotes: '1 tablet once at night if sneezing starts (causes mild drowsiness)',
    location: 'Travel Bag',
    assignedTo: 'Family Shared',
    isPrescription: false,
    notes: 'Always carry during spring/fall travel',
    createdAt: '2026-04-01'
  },
  {
    id: 'med-6',
    name: 'Amoxicillin 500mg Capsules',
    brandOrGeneric: 'Pfizer / Amoxicillin',
    category: 'Daily & Chronic',
    purpose: 'Leftover dental antibiotic',
    expiryDate: '2026-08-20', // Expired nearly 2 months ago!
    quantity: '4 leftover capsules',
    dosageNotes: 'DO NOT USE LEFTOVER ANTIBIOTICS',
    location: 'First Aid Kit',
    assignedTo: 'Self',
    isPrescription: true,
    notes: 'Leftover from root canal in August. Must be safely disposed of.',
    createdAt: '2026-08-15'
  },
  {
    id: 'med-7',
    name: 'Betadine 10% Antiseptic Ointment',
    brandOrGeneric: 'Povidone Iodine',
    category: 'First Aid & Skin',
    purpose: 'Cuts, scrapes, minor burns, wound disinfection',
    expiryDate: '2026-12-15', // Expires in ~65 days
    quantity: '1 tube (mostly full)',
    dosageNotes: 'Clean wound first, apply thin layer and cover with sterile bandage',
    location: 'First Aid Kit',
    assignedTo: 'Family Shared',
    isPrescription: false,
    notes: 'Standard household first aid',
    createdAt: '2025-12-10'
  },
  {
    id: 'med-8',
    name: 'Vitamin D3 60,000 IU (Calcirol)',
    brandOrGeneric: 'Cholecalciferol Chewable',
    category: 'Vitamins & Supplements',
    purpose: 'Bone strength, immunity, vitamin D deficiency',
    expiryDate: '2027-08-10', // Safe, expires next year
    quantity: '12 chewable tablets',
    dosageNotes: '1 tablet once a week on Sundays after breakfast',
    location: 'Kitchen / Fridge',
    assignedTo: 'Dad',
    isPrescription: false,
    notes: 'Doctor recommended weekly dose',
    createdAt: '2026-07-01'
  }
];
