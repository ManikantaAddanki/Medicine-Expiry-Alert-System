import React, { useState } from 'react';
import { Medicine, Batch, Supplier, UserRole } from '../types/inventory';
import { FileSpreadsheet, Download, Upload, Check, AlertCircle, X, FileText } from 'lucide-react';

interface CsvImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicines: Medicine[];
  batches: Batch[];
  suppliers: Supplier[];
  currentRole: UserRole;
  onImportBatches: (importedData: any[]) => void;
}

export const CsvImportExportModal: React.FC<CsvImportExportModalProps> = ({
  isOpen,
  onClose,
  medicines,
  batches,
  suppliers,
  currentRole,
  onImportBatches
}) => {
  const [csvText, setCsvText] = useState<string>(
`medicine_name,generic_name,category,dosage_form,strength,batch_number,expiry_date,quantity,purchase_price,supplier_name
Ciprofloxacin 500mg,Ciprofloxacin Hydrochloride,Antibiotics,Tablet,500 mg,CIP-2025-01,2027-04-15,120,4.20,MedSource Healthcare Logistics
Ibuprofen 400mg,Ibuprofen,Analgesics,Tablet,400 mg,IBU-2025-B2,2026-11-20,90,1.80,MedSource Healthcare Logistics
Omeprazole 20mg,Omeprazole,Gastrointestinal,Capsule,20 mg,OMP-2024-C9,2026-10-18,60,3.10,Apex Pharmaceutical Distributors`
  );

  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleParse = () => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      setParseErrors(['CSV must contain a header row and at least one data row.']);
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['medicine_name', 'batch_number', 'expiry_date', 'quantity', 'purchase_price'];
    const missing = requiredHeaders.filter(rh => !headers.includes(rh));
    if (missing.length > 0) {
      setParseErrors([`Missing required column headers: ${missing.join(', ')}`]);
      return;
    }

    const rows: any[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = line.split(',').map(v => v.trim());
      const rowObj: any = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });

      // Validations
      if (!rowObj.batch_number) errors.push(`Row ${i}: Missing batch number`);
      if (!rowObj.expiry_date || isNaN(new Date(rowObj.expiry_date).getTime())) {
        errors.push(`Row ${i}: Invalid expiry date "${rowObj.expiry_date}" (Must be YYYY-MM-DD)`);
      }
      const qty = Number(rowObj.quantity);
      if (isNaN(qty) || qty <= 0) errors.push(`Row ${i}: Quantity must be positive number`);
      const price = Number(rowObj.purchase_price);
      if (isNaN(price) || price < 0) errors.push(`Row ${i}: Purchase price must be valid number`);

      rows.push({ ...rowObj, quantity: qty, purchase_price: price, rowNum: i });
    }

    setParseErrors(errors);
    setParsedRows(rows);
  };

  const handleCommit = () => {
    if (parsedRows.length === 0 || parseErrors.length > 0) return;
    onImportBatches(parsedRows);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  const handleDownloadSample = () => {
    const sample = `medicine_name,generic_name,category,dosage_form,strength,batch_number,expiry_date,quantity,purchase_price,supplier_name\nCiprofloxacin 500mg,Ciprofloxacin HCl,Antibiotics,Tablet,500 mg,CIP-2025-01,2027-04-15,120,4.20,MedSource Healthcare Logistics\nIbuprofen 400mg,Ibuprofen,Analgesics,Tablet,400 mg,IBU-2025-B2,2026-11-20,90,1.80,MedSource Healthcare Logistics`;
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medicine_batch_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFullInventory = () => {
    const medMap = new Map(medicines.map(m => [m.id, m]));
    const headers = ['Batch Number,Medicine Name,Generic Name,Category,Expiry Date,Available Units,Received Units,Cost Price,Storage Location,Status'];
    const rows = batches.map(b => {
      const med = medMap.get(b.medicine_id);
      return `"${b.batch_number}","${med?.name || ''}","${med?.generic_name || ''}","${med?.category || ''}","${b.expiry_date}",${b.available_quantity},${b.quantity_received},${b.purchase_price},"${b.storage_location}","${b.status}"`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encodedUri;
    a.download = `hospital_medicine_inventory_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">CSV Bulk Import & Export Engine</h3>
              <p className="text-xs text-slate-500">Multi-batch inventory ingestion with row-level validation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 py-4 space-y-4 text-xs">
          {/* Quick Actions Bar */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
            <button
              onClick={handleDownloadSample}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template CSV</span>
            </button>

            <button
              onClick={handleExportFullInventory}
              className="px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-800 font-semibold flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export All Current Inventory ({batches.length} batches)</span>
            </button>
          </div>

          {/* Paste or Upload CSV Text */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Paste CSV Raw Data or Edit Preview</label>
              <button
                onClick={handleParse}
                className="text-teal-700 hover:text-teal-900 font-bold"
              >
                Validate & Parse Rows &rarr;
              </button>
            </div>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Parse Errors */}
          {parseErrors.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-rose-600" /> Validation Errors Found
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                {parseErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && parseErrors.length === 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Verified Rows ({parsedRows.length} batches ready for ingestion)
                </span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Batch Number</th>
                      <th className="py-2 px-3">Medicine Name</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Expiry Date</th>
                      <th className="py-2 px-3">Quantity</th>
                      <th className="py-2 px-3">Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{r.batch_number}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{r.medicine_name}</td>
                        <td className="py-2 px-3 text-slate-600">{r.category}</td>
                        <td className="py-2 px-3 font-mono font-medium">{r.expiry_date}</td>
                        <td className="py-2 px-3 font-mono font-bold">{r.quantity}</td>
                        <td className="py-2 px-3 font-mono">${r.purchase_price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleParse}
            className="px-3.5 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
          >
            Check Format
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCommit}
              disabled={parsedRows.length === 0 || parseErrors.length > 0 || isSuccess}
              className={`px-4 py-2 rounded-lg font-semibold text-white shadow-xs ${
                parsedRows.length > 0 && parseErrors.length === 0
                  ? isSuccess ? 'bg-emerald-600' : 'bg-teal-600 hover:bg-teal-700'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isSuccess ? 'Import Successful!' : `Commit Import (${parsedRows.length} Rows)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
