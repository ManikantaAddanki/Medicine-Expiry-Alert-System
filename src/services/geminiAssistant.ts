import { Medicine, Batch, ExpiryAlert } from '../types/inventory';
import { GoogleGenAI } from '@google/genai';

export async function askInventoryAssistant(
  prompt: string,
  medicines: Medicine[],
  batches: Batch[],
  alerts: ExpiryAlert[]
): Promise<string> {
  const expiredCount = alerts.filter(a => a.severity === 'EXPIRED').length;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const totalValueAtRisk = alerts.reduce((sum, a) => sum + a.estimated_value_at_risk, 0);
  const quarantinedBatches = batches.filter(b => b.status === 'QUARANTINED');

  const contextData = `
System Reference Date: 2026-10-10
Total Medicines in Catalog: ${medicines.length}
Total Active Batches: ${batches.length}
Total Expired Batches: ${expiredCount}
Total Critical Batches (<= 7 days): ${criticalCount}
Total Value at Risk: $${totalValueAtRisk.toFixed(2)}
Quarantined Batches: ${quarantinedBatches.length} (${quarantinedBatches.map(b => `${b.batch_number} - ${b.quarantine_reason || 'Quarantined'}`).join(', ')})

Top Expiring Batches:
${alerts.slice(0, 8).map(a => `- ${a.medicine_name} [Batch ${a.batch_number}]: Expiry ${a.expiry_date} (${a.days_remaining} days, Severity: ${a.severity}, Qty: ${a.units_affected}, Value: $${a.estimated_value_at_risk})`).join('\n')}

Low Stock Items:
${medicines.map(m => {
  const totalUnits = batches.filter(b => b.medicine_id === m.id && b.status === 'ACTIVE').reduce((sum, b) => sum + b.available_quantity, 0);
  return { name: m.name, units: totalUnits, min: m.minimum_reorder_level };
}).filter(m => m.units < m.min).map(m => `- ${m.name}: Available ${m.units} units (Min threshold: ${m.min})`).join('\n')}
`;

  try {
    const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
                   (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY);
    
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are the clinical inventory expert for the Medicine Expiry Alert System.
Answer the user's question accurately using ONLY the live inventory data provided below.
Provide a concise, professional pharmaceutical answer with bullet points if helpful.

Live System Context:
${contextData}

User Question:
${prompt}`
      });
      if (response && response.text) {
        return response.text;
      }
    }
  } catch (err) {
    console.warn('Gemini API call skipped or encountered error, using analytical rule responder:', err);
  }

  // Analytical heuristic fallback if offline or no key configured
  const p = prompt.toLowerCase();
  if (p.includes('expire') || p.includes('expiry') || p.includes('this month')) {
    const expiringSoon = alerts.filter(a => a.days_remaining <= 30);
    return `### 🚨 Expiry Status Report (Within 30 Days)
There are currently **${expiringSoon.length} batches** requiring urgent action:
${expiringSoon.map(a => `• **${a.medicine_name}** (Batch \`${a.batch_number}\`): Expires in **${a.days_remaining} days** (${a.expiry_date}) | **${a.units_affected} units** at risk ($${a.estimated_value_at_risk})`).join('\n')}

**Action Item:** Prioritize dispensing via FEFO or initiate supplier return credit notes immediately.`;
  }

  if (p.includes('quarantine') || p.includes('recalled') || p.includes('defect')) {
    if (quarantinedBatches.length === 0) return 'No batches are currently held in quarantine.';
    return `### 🔒 Quarantined Inventory
There are currently **${quarantinedBatches.length} batch(es)** locked from dispensing:
${quarantinedBatches.map(b => {
  const m = medicines.find(med => med.id === b.medicine_id);
  return `• **${m ? m.name : 'Medicine'}** (Batch \`${b.batch_number}\`): ${b.available_quantity} units locked. Reason: *${b.quarantine_reason || 'Pending inspection'}*`;
}).join('\n')}

**Safety Policy:** Quarantined items are strictly excluded from all FEFO dispensing recommendations.`;
  }

  if (p.includes('low stock') || p.includes('reorder') || p.includes('shortage')) {
    const lowStock = medicines.map(m => {
      const units = batches.filter(b => b.medicine_id === m.id && b.status === 'ACTIVE').reduce((s, b) => s + b.available_quantity, 0);
      return { medicine: m, units };
    }).filter(x => x.units < x.medicine.minimum_reorder_level);

    if (lowStock.length === 0) return 'All medications currently meet their minimum safety reorder thresholds.';
    return `### 📦 Low Stock & Reorder Notice
The following medicines have fallen below their safety threshold:
${lowStock.map(x => `• **${x.medicine.name}**: Current active stock is **${x.units} ${x.medicine.unit_of_measure}** (Threshold: ${x.medicine.minimum_reorder_level}). Reorder draft recommended with ${x.medicine.manufacturer}.`).join('\n')}`;
  }

  if (p.includes('value') || p.includes('risk') || p.includes('cost') || p.includes('financial')) {
    return `### 💰 Financial Exposure Analysis
- **Total Capital at Expiry Risk**: **$${totalValueAtRisk.toFixed(2)}** across ${alerts.length} batches.
- **Immediate Loss (Already Expired)**: **$${alerts.filter(a => a.severity === 'EXPIRED').reduce((s, a) => s + a.estimated_value_at_risk, 0).toFixed(2)}**
- **Critical Risk (1-7 Days Remaining)**: **$${alerts.filter(a => a.severity === 'CRITICAL').reduce((s, a) => s + a.estimated_value_at_risk, 0).toFixed(2)}**
- **High Risk (8-30 Days Remaining)**: **$${alerts.filter(a => a.severity === 'HIGH').reduce((s, a) => s + a.estimated_value_at_risk, 0).toFixed(2)}**`;
  }

  return `### 🏥 Pharmacy Inventory Assistant
Based on the live database audit for **2026-10-10**:
- **Total Medicines tracked**: ${medicines.length} formulations
- **Total Batches in stock**: ${batches.length}
- **Total Expired Batches**: ${expiredCount} (Locked from dispensing)
- **Critical Batches ($\le$ 7 days)**: ${criticalCount}
- **Total Value at Risk**: $${totalValueAtRisk.toFixed(2)}

You can ask me questions like:
- *"Which medicines expire this month?"*
- *"Show all quarantined batches"*
- *"What is our total financial risk?"*
- *"Which items need immediate reorder?"*`;
}
