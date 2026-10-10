import { UserMedicine, DrugInteraction } from '../types/userMedicine';

interface InteractionRule {
  drugAKeywords: string[];
  drugBKeywords: string[];
  severity: 'DANGEROUS' | 'MODERATE' | 'SAFE';
  summary: string;
  clinicalAdvice: string;
}

const CLINICAL_RULES: InteractionRule[] = [
  {
    drugAKeywords: ['paracetamol', 'dolo', 'calpol', 'acetaminophen', 'crocin'],
    drugBKeywords: ['paracetamol', 'dolo', 'calpol', 'acetaminophen', 'crocin', 'cold relief', 'vicks action'],
    severity: 'DANGEROUS',
    summary: 'Accidental Paracetamol Overdose (Double Dosing)',
    clinicalAdvice: 'Both medications contain Paracetamol / Acetaminophen. Taking them together can exceed the 4,000mg/day ceiling and cause acute liver toxicity. Never combine two medicines with paracetamol.'
  },
  {
    drugAKeywords: ['ibuprofen', 'advil', 'motrin', 'brufen', 'combiflam'],
    drugBKeywords: ['aspirin', 'disprin', 'blood thinner', 'warfarin', 'clopidogrel'],
    severity: 'DANGEROUS',
    summary: 'High Risk of Stomach Ulcers & Internal Bleeding',
    clinicalAdvice: 'Combining Ibuprofen (NSAID) with Aspirin or Blood Thinners severely irritates the stomach lining and inhibits blood clotting. Consult your doctor before using together.'
  },
  {
    drugAKeywords: ['ciprofloxacin', 'ciplox', 'amoxicillin', 'azithromycin', 'doxycycline'],
    drugBKeywords: ['pantocid', 'pantoprazole', 'antacid', 'gelusil', 'digene', 'omeprazole', 'calcium', 'iron'],
    severity: 'MODERATE',
    summary: 'Reduced Antibiotic Absorption (Cheated Efficacy)',
    clinicalAdvice: 'Antacids and stomach acid reducers coat the gut and bind to antibiotics, preventing your body from absorbing the medicine. Take antibiotics at least 2 hours BEFORE or 4 hours AFTER antacids.'
  },
  {
    drugAKeywords: ['benadryl', 'diphenhydramine', 'cough syrup', 'sleep aid'],
    drugBKeywords: ['cetirizine', 'zyrtec', 'allegra', 'alcohol', 'cold'],
    severity: 'MODERATE',
    summary: 'Excessive Sedation & Impaired Motor Coordination',
    clinicalAdvice: 'Both medicines cause central nervous system depression. Combining them will cause severe drowsiness, dizziness, and slow reaction times. Avoid driving or operating machinery.'
  },
  {
    drugAKeywords: ['metformin', 'glucophage'],
    drugBKeywords: ['alcohol', 'contrast'],
    severity: 'MODERATE',
    summary: 'Lactic Acidosis Warning',
    clinicalAdvice: 'Alcohol significantly increases the risk of metformin-associated lactic acidosis, a rare but dangerous metabolic complication.'
  }
];

export function checkDrugInteractions(selectedMeds: UserMedicine[]): DrugInteraction[] {
  if (selectedMeds.length < 2) return [];

  const foundInteractions: DrugInteraction[] = [];

  for (let i = 0; i < selectedMeds.length; i++) {
    for (let j = i + 1; j < selectedMeds.length; j++) {
      const medA = selectedMeds[i];
      const medB = selectedMeds[j];

      const textA = (medA.name + ' ' + medA.brandOrGeneric + ' ' + (medA.activeIngredients?.join(' ') || '')).toLowerCase();
      const textB = (medB.name + ' ' + medB.brandOrGeneric + ' ' + (medB.activeIngredients?.join(' ') || '')).toLowerCase();

      let matched = false;

      for (const rule of CLINICAL_RULES) {
        const aMatchesA = rule.drugAKeywords.some(k => textA.includes(k));
        const bMatchesB = rule.drugBKeywords.some(k => textB.includes(k));

        const aMatchesB = rule.drugAKeywords.some(k => textB.includes(k));
        const bMatchesA = rule.drugBKeywords.some(k => textA.includes(k));

        if ((aMatchesA && bMatchesB) || (aMatchesB && bMatchesA)) {
          // If it's the exact same item, skip duplicate detection unless both are distinct paracetamols
          if (medA.id === medB.id) continue;

          foundInteractions.push({
            medicineA: medA.name,
            medicineB: medB.name,
            severity: rule.severity,
            summary: rule.summary,
            clinicalAdvice: rule.clinicalAdvice
          });
          matched = true;
          break;
        }
      }

      // If no negative clash found between these two:
      if (!matched) {
        // Can optionally flag safe combination
      }
    }
  }

  return foundInteractions;
}
