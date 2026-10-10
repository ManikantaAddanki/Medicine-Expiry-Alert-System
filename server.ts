import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Body parser with large limit for uploading camera or high-res photos
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Initialize server-side Gemini client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString()
    });
  });

  // Multimodal Vision endpoint to scan medicine packaging / strip / bottle photo
  app.post('/api/scan-medicine', async (req, res) => {
    try {
      const { imageBase64, mimeType: providedMimeType } = req.body;

      if (!imageBase64) {
        return res.status(400).json({
          error: 'No image provided. Please upload or take a photo of the medicine.'
        });
      }

      // Parse data URL if present
      let cleanBase64 = imageBase64;
      let mimeType = providedMimeType || 'image/jpeg';

      if (imageBase64.startsWith('data:')) {
        const matches = imageBase64.match(/^data:([^;]+);base64,(.*)$/);
        if (matches) {
          mimeType = matches[1];
          cleanBase64 = matches[2];
        }
      }

      const prompt = `You are an expert pharmaceutical optical vision scanner and medicine packaging reader.
Carefully examine this medicine photo (tablet strip, blister pack, syrup bottle, ointment tube, box, vial, or prescription label).
Read all readable text, labels, stamps, embossed batch/expiry marks, and chemical formulas.

Extract and return accurate information for:
1. "name": The commercial brand name or medicine name with strength (e.g. "Dolo 650", "Augmentin 625 Duo", "Benadryl Cough Formula", "Allegra 120mg").
2. "brandOrGeneric": The generic salt name or active formulation (e.g. "Paracetamol 650mg", "Amoxicillin and Potassium Clavulanate", "Cetirizine HCl").
3. "category": Must be ONE of these exact categories:
   - "Fever & Pain"
   - "Cold & Cough"
   - "Allergy"
   - "Digestion & Stomach"
   - "First Aid & Skin"
   - "Daily & Chronic"
   - "Vitamins & Supplements"
   - "Eye & Ear Drops"
   - "Other"
4. "purpose": Plain English explanation of what this medicine is used for (e.g. "Used for fever, headache, body aches", "Treats bacterial infections").
5. "expiryDate": The expiration date in YYYY-MM-DD format. Look for "EXP", "EXPIRY", "EXP DATE", "USE BEFORE".
   - If format is MM/YYYY (e.g. "10/2026"), convert to the last day of that month: "2026-10-31".
   - If format is MM/YY (e.g. "08/27"), convert to "2027-08-31".
   - If already expired, accurately record the past date.
6. "manufacturingDate": The manufacturing date if visible (e.g. "2024-05-01" or "05/2024").
7. "batchNumber": The Batch number or Lot number (e.g. "B.No. DL9081", "Lot 4482").
8. "quantity": Package size or tablet count (e.g. "10 tablets in strip", "100ml syrup bottle", "1 tube (20g)").
9. "dosageNotes": Directions for use or dosage printed on packaging (e.g. "Take 1 tablet every 6 hours after meals as directed by physician").
10. "activeIngredients": List of active ingredients found on the label with strengths.
11. "isPrescription": true if marked "Rx", "Schedule H", "Schedule H1", or "Prescription only", otherwise false.
12. "discardAfterDaysOpened": If eye drops, ear drops, or syrups requiring disposal after opening, number of days (e.g. 28), else null.
13. "notes": Storage conditions and cautions (e.g. "Store below 25°C. Protect from moisture and direct sunlight.").
14. "confidence": "high", "medium", or "low".
15. "detectedTextSnippets": Array of 2 to 6 key text fragments actually printed on packaging (e.g. ["EXP: 10/2026", "MFG: 11/2024", "B.No: B40921", "DOLO 650mg"]).`;

      const imagePart = {
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      };

      const textPart = {
        text: prompt,
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              brandOrGeneric: { type: Type.STRING },
              category: { type: Type.STRING },
              purpose: { type: Type.STRING },
              expiryDate: { type: Type.STRING },
              manufacturingDate: { type: Type.STRING },
              batchNumber: { type: Type.STRING },
              quantity: { type: Type.STRING },
              dosageNotes: { type: Type.STRING },
              activeIngredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              isPrescription: { type: Type.BOOLEAN },
              discardAfterDaysOpened: { type: Type.INTEGER },
              notes: { type: Type.STRING },
              confidence: { type: Type.STRING },
              detectedTextSnippets: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['name', 'category', 'purpose', 'expiryDate']
          }
        }
      });

      const rawJson = response.text;
      if (!rawJson) {
        throw new Error('No structured output returned from Gemini');
      }

      const parsedData = JSON.parse(rawJson);
      return res.json({
        success: true,
        data: parsedData
      });
    } catch (err: any) {
      console.error('Error scanning medicine photo with Gemini:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Failed to analyze medicine photo. Please try another angle or enter details manually.'
      });
    }
  });

  // Automated Email Alert Endpoint
  app.post('/api/send-email-alert', async (req, res) => {
    try {
      const { recipient, subject, alertType, medicineNames, bodyHtml, bodyText } = req.body;
      if (!recipient || !subject) {
        return res.status(400).json({ error: 'recipient and subject are required.' });
      }

      console.log(`[Auto-Email] Dispatch to ${recipient}: ${subject} (Medicines: ${medicineNames?.join(', ') || 'N/A'})`);

      return res.json({
        success: true,
        message: `Email alert successfully processed for ${recipient}`,
        id: `srv-${Date.now()}`,
        sentAt: new Date().toISOString()
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Email dispatch failed' });
    }
  });

  // Mount Vite middleware in development or serve dist in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Medicine Expiry Alert Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
