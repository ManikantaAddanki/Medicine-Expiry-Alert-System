import { MedicineCategory, UserMedicine } from '../types/userMedicine';

export interface ScannedMedicineData {
  name: string;
  brandOrGeneric?: string;
  category: MedicineCategory;
  purpose: string;
  expiryDate: string; // YYYY-MM-DD
  manufacturingDate?: string;
  batchNumber?: string;
  quantity?: string;
  dosageNotes?: string;
  activeIngredients?: string[];
  isPrescription?: boolean;
  discardAfterDaysOpened?: number;
  notes?: string;
  confidence?: 'high' | 'medium' | 'low';
  detectedTextSnippets?: string[];
  photoUrl?: string;
}

export interface SampleMedicinePhoto {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  imageUrl: string;
  fallbackData: ScannedMedicineData;
}

// Generate an SVG-based medicine packaging preview for zero-download demo samples
const createSampleSvg = (title: string, bNo: string, exp: string, primaryColor: string, generic: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#f1f5f9"/>
      </linearGradient>
      <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${primaryColor}"/>
        <stop offset="100%" stop-color="#0f766e"/>
      </linearGradient>
    </defs>
    <rect width="600" height="400" rx="20" fill="url(#bg)" stroke="#cbd5e1" stroke-width="4"/>
    <rect x="20" y="20" width="560" height="70" rx="12" fill="url(#headerGrad)"/>
    <text x="45" y="65" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff">${title}</text>
    <rect x="470" y="35" width="85" height="35" rx="6" fill="#ffffff" opacity="0.9"/>
    <text x="495" y="59" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#be123c">Rx</text>
    
    <!-- Medicine Foil / Strip Pattern -->
    <rect x="35" y="110" width="530" height="150" rx="10" fill="#f8fafc" stroke="#94a3b8" stroke-dasharray="6 4"/>
    <circle cx="85" cy="155" r="26" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
    <circle cx="165" cy="155" r="26" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
    <circle cx="245" cy="155" r="26" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
    <circle cx="325" cy="155" r="26" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
    <circle cx="405" cy="155" r="26" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
    <circle cx="485" cy="155" r="26" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
    
    <circle cx="85" cy="220" r="26" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
    <circle cx="165" cy="220" r="26" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
    <circle cx="245" cy="220" r="26" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
    <circle cx="325" cy="220" r="26" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
    <circle cx="405" cy="220" r="26" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
    <circle cx="485" cy="220" r="26" fill="#e2e8f0" stroke="#64748b" stroke-width="2"/>
    
    <!-- Details text box -->
    <rect x="35" y="275" width="530" height="100" rx="10" fill="#0f172a"/>
    <text x="55" y="305" font-family="Courier, monospace" font-size="14" font-weight="bold" fill="#38bdf8">COMPOSITION: ${generic}</text>
    <text x="55" y="332" font-family="Courier, monospace" font-size="16" font-weight="bold" fill="#4ade80">BATCH: ${bNo}  |  MFG: 05/2024</text>
    <text x="55" y="360" font-family="Courier, monospace" font-size="18" font-weight="bold" fill="#f43f5e">EXPIRY DATE: ${exp}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const SAMPLE_MEDICINE_PHOTOS: SampleMedicinePhoto[] = [
  {
    id: 'dolo-650',
    title: 'Dolo 650 Strip (Paracetamol)',
    subtitle: 'Blister packaging with embossed batch and expiry date',
    tag: 'Fever & Pain',
    imageUrl: createSampleSvg('Dolo 650mg Tablets', 'DL-90821', 'EXP 11/2026', '#0284c7', 'Paracetamol IP 650 mg'),
    fallbackData: {
      name: 'Dolo 650mg (Paracetamol)',
      brandOrGeneric: 'Micro Labs Ltd / Paracetamol IP',
      category: 'Fever & Pain',
      purpose: 'Fast relief from fever, headache, body aches, and mild-to-moderate pain',
      expiryDate: '2026-11-30',
      manufacturingDate: '2024-05-15',
      batchNumber: 'DL-90821',
      quantity: '15 tablets in blister strip',
      dosageNotes: '1 tablet orally every 6 to 8 hours as needed after meals. Max 4 tablets in 24 hours.',
      activeIngredients: ['Paracetamol 650mg'],
      isPrescription: false,
      notes: 'Store below 30°C in a dry place. Keep out of reach of children.',
      confidence: 'high',
      detectedTextSnippets: ['DOLO 650mg', 'Paracetamol IP 650mg', 'B.No: DL-90821', 'EXP: 11/2026', 'Micro Labs']
    }
  },
  {
    id: 'augmentin-625',
    title: 'Augmentin 625 Duo Box',
    subtitle: 'Antibiotic strip with Rx symbol & composition',
    tag: 'Daily & Chronic',
    imageUrl: createSampleSvg('Augmentin 625 Duo', 'AG-44120', 'EXP 08/2027', '#059669', 'Amoxicillin 500mg + Clavulanic Acid 125mg'),
    fallbackData: {
      name: 'Augmentin 625 Duo',
      brandOrGeneric: 'GSK / Amoxicillin and Potassium Clavulanate',
      category: 'Daily & Chronic',
      purpose: 'Broad-spectrum antibiotic for bacterial respiratory, skin, and ear/sinus infections',
      expiryDate: '2027-08-31',
      manufacturingDate: '2024-08-01',
      batchNumber: 'AG-44120',
      quantity: '10 tablets in aluminum strip',
      dosageNotes: '1 tablet twice daily with meals as prescribed by physician. Complete full course.',
      activeIngredients: ['Amoxicillin 500mg', 'Clavulanic Acid 125mg'],
      isPrescription: true,
      notes: 'Schedule H1 Prescription Drug. Protect from moisture and heat.',
      confidence: 'high',
      detectedTextSnippets: ['Augmentin 625 Duo', 'Rx Schedule H1', 'Amoxicillin + Clavulanate', 'EXP: 08/2027']
    }
  },
  {
    id: 'benadryl-syrup',
    title: 'Benadryl Cough Syrup (100ml)',
    subtitle: 'Bottle label with dosage cap & discard warning',
    tag: 'Cold & Cough',
    imageUrl: createSampleSvg('Benadryl Cough Formula', 'BN-81093', 'EXP 04/2027', '#dc2626', 'Diphenhydramine HCl + Ammonium Chloride'),
    fallbackData: {
      name: 'Benadryl Cough Formula Syrup',
      brandOrGeneric: 'Johnson & Johnson / Diphenhydramine HCl',
      category: 'Cold & Cough',
      purpose: 'Relief of wet cough, chest congestion, and throat irritation',
      expiryDate: '2027-04-30',
      manufacturingDate: '2024-04-10',
      batchNumber: 'BN-81093',
      quantity: '1 bottle (100ml)',
      dosageNotes: '10ml (2 teaspoonfuls) every 4 hours. Do not exceed 4 doses daily.',
      activeIngredients: ['Diphenhydramine HCl 14mg/5ml', 'Ammonium Chloride 138mg/5ml'],
      isPrescription: false,
      discardAfterDaysOpened: 90,
      notes: 'May cause drowsiness. Shake bottle well before use.',
      confidence: 'high',
      detectedTextSnippets: ['Benadryl Cough Formula', '100ml', 'EXP: 04/2027', 'B.No: BN-81093']
    }
  },
  {
    id: 'refresh-tears',
    title: 'Refresh Tears Lubricant Eye Drops',
    subtitle: 'Sterile ophthalmic container with 28-day discard rule',
    tag: 'Eye & Ear Drops',
    imageUrl: createSampleSvg('Refresh Tears Eye Drops', 'RT-11904', 'EXP 10/2026', '#0d9488', 'Carboxymethylcellulose Sodium 0.5%'),
    fallbackData: {
      name: 'Refresh Tears Lubricant Eye Drops',
      brandOrGeneric: 'Allergan / Carboxymethylcellulose Sodium 0.5%',
      category: 'Eye & Ear Drops',
      purpose: 'Instant relief from dry eyes, computer eye strain, burning, and irritation',
      expiryDate: '2026-10-31',
      manufacturingDate: '2024-10-01',
      batchNumber: 'RT-11904',
      quantity: '1 bottle (10ml)',
      dosageNotes: 'Instill 1 to 2 drops in the affected eye(s) as needed.',
      activeIngredients: ['Carboxymethylcellulose Sodium 0.5%'],
      isPrescription: false,
      discardAfterDaysOpened: 28,
      notes: 'Discard remaining solution within 28 days of opening. Do not touch dropper tip.',
      confidence: 'high',
      detectedTextSnippets: ['Refresh Tears 10ml', 'Carboxymethylcellulose 0.5%', 'Discard 28 days after opening', 'EXP: 10/2026']
    }
  },
  {
    id: 'expired-sample-strip',
    title: 'Expired Allergy Strip (Warning Demo)',
    subtitle: 'Historical medicine strip with past expiry date',
    tag: 'Allergy',
    imageUrl: createSampleSvg('Cetirizine 10mg [EXPIRED]', 'CZ-77201', 'EXP 01/2024', '#e11d48', 'Cetirizine Hydrochloride 10mg'),
    fallbackData: {
      name: 'Cetirizine 10mg (Allergy Relief)',
      brandOrGeneric: 'Zyrtec / Cetirizine HCl',
      category: 'Allergy',
      purpose: 'Allergy relief for runny nose, sneezing, itchy watery eyes, and hives',
      expiryDate: '2024-01-31', // Clearly expired!
      manufacturingDate: '2022-01-15',
      batchNumber: 'CZ-77201',
      quantity: '10 tablets in strip',
      dosageNotes: '1 tablet once daily in evening with water.',
      activeIngredients: ['Cetirizine HCl 10mg'],
      isPrescription: false,
      notes: 'EXPIRED PRODUCT. Do not consume. Dispose safely.',
      confidence: 'high',
      detectedTextSnippets: ['Cetirizine 10mg', 'EXP: 01/2024', 'B.No: CZ-77201', 'EXPIRED']
    }
  }
];

/**
 * Resizes and compresses image to max 1400px width/height and returns base64 string
 */
export async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => {
        // Fallback to raw base64 if not decodable as image
        const raw = reader.result as string;
        resolve({ base64: raw, mimeType: file.type || 'image/jpeg' });
      };
      img.onload = () => {
        const MAX_SIZE = 1400;
        let { width, height } = img;

        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const raw = reader.result as string;
          resolve({ base64: raw, mimeType: file.type || 'image/jpeg' });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        resolve({ base64: compressedBase64, mimeType: 'image/jpeg' });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Sends image to backend Gemini vision AI endpoint to scan medicine details
 */
export async function scanMedicineWithAI(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<ScannedMedicineData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch('/api/scan-medicine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        mimeType,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with ${response.status}`);
    }

    const json = await response.json();
    if (!json.success || !json.data) {
      throw new Error(json.error || 'Invalid scan result');
    }

    return {
      ...json.data,
      photoUrl: imageBase64,
    };
  } catch (error: any) {
    console.warn('Backend AI scanner call failed, checking fallback:', error);
    throw error;
  }
}
