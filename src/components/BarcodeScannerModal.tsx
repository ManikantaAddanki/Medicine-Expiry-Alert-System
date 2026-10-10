import React, { useState } from 'react';
import { Batch, Medicine, UserRole } from '../types/inventory';
import { calculateDaysRemaining, CURRENT_SYSTEM_DATE } from '../services/alertEngine';
import { QrCode, Camera, Search, Check, AlertTriangle, ShieldAlert, X, Sparkles } from 'lucide-react';

interface BarcodeScannerModalProps {
  batches: Batch[];
  medicines: Medicine[];
  currentRole: UserRole;
  initialBatch?: Batch | null;
  onClose: () => void;
  onOpenFefo: () => void;
  onQuarantineBatch: (batchId: number, reason: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  batches,
  medicines,
  currentRole,
  initialBatch,
  onClose,
  onOpenFefo,
  onQuarantineBatch
}) => {
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(initialBatch || batches[1] || null);
  const [scanCodeInput, setScanCodeInput] = useState<string>('');
  const [matchedBatch, setMatchedBatch] = useState<Batch | null>(initialBatch || null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  const medMap = new Map(medicines.map(m => [m.id, m]));

  const handleSimulateScan = (batchNumber: string) => {
    const found = batches.find(b => b.batch_number.toLowerCase() === batchNumber.toLowerCase());
    if (found) {
      setMatchedBatch(found);
      setSelectedBatch(found);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = scanCodeInput.trim().toLowerCase();
    const found = batches.find(b => 
      b.batch_number.toLowerCase() === query ||
      medMap.get(b.medicine_id)?.barcode.toLowerCase() === query
    );
    if (found) {
      setMatchedBatch(found);
      setSelectedBatch(found);
    } else {
      alert(`No batch found with code or barcode "${scanCodeInput}". Try one of the test presets.`);
    }
  };

  const currentMed = selectedBatch ? medMap.get(selectedBatch.medicine_id) : null;
  const daysLeft = selectedBatch ? calculateDaysRemaining(selectedBatch.expiry_date, CURRENT_SYSTEM_DATE) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Barcode & Batch QR Code Suite</h3>
              <p className="text-xs text-slate-500">Optical batch verification, expiry inspection, and QR label generator</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 py-4 space-y-5 text-xs">
          {/* Quick Simulation Scanner Strip */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-teal-600" />
                Optical Camera Scanner / Test Simulation Barcodes
              </span>
              <span className="text-[10px] text-slate-400">Point scanner at medicine box</span>
            </div>

            {/* Quick Test Barcode Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                onClick={() => handleSimulateScan('PCM-2024-CRT')}
                className="px-2.5 py-1 rounded bg-white hover:bg-teal-50 border border-slate-200 text-teal-800 font-mono text-[11px] shadow-2xs"
              >
                Scan: PCM-2024-CRT (Critical 4d)
              </button>
              <button
                onClick={() => handleSimulateScan('PCM-2024-EXP')}
                className="px-2.5 py-1 rounded bg-white hover:bg-rose-50 border border-rose-200 text-rose-800 font-mono text-[11px] shadow-2xs"
              >
                Scan: PCM-2024-EXP (Expired)
              </button>
              <button
                onClick={() => handleSimulateScan('AMX-2025-QRN')}
                className="px-2.5 py-1 rounded bg-white hover:bg-purple-50 border border-purple-200 text-purple-800 font-mono text-[11px] shadow-2xs"
              >
                Scan: AMX-2025-QRN (Quarantined)
              </button>
              <button
                onClick={() => handleSimulateScan('SAL-2025-LOW')}
                className="px-2.5 py-1 rounded bg-white hover:bg-amber-50 border border-amber-200 text-amber-800 font-mono text-[11px] shadow-2xs"
              >
                Scan: SAL-2025-LOW (Low Stock)
              </button>
            </div>

            {/* Manual Code input fallback */}
            <form onSubmit={handleManualSearch} className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Or manually enter batch # or SKU barcode..."
                value={scanCodeInput}
                onChange={(e) => setScanCodeInput(e.target.value)}
                className="flex-1 p-2 border border-slate-300 rounded-lg bg-white font-mono text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
              >
                Verify Batch
              </button>
            </form>
          </div>

          {/* Scanned Batch Result Card */}
          {selectedBatch && (
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Visual QR Code Generator Representation */}
                <div className="p-3 bg-white border-2 border-slate-900 rounded-xl shadow-xs text-center shrink-0">
                  <div className="w-28 h-28 bg-slate-950 p-2 rounded-lg flex flex-col justify-between items-center text-white">
                    {/* Simulated SVG 2D QR Pattern */}
                    <div className="grid grid-cols-5 gap-1 w-full h-full p-1 bg-white rounded">
                      <div className="bg-black col-span-2 row-span-2 rounded-xs"></div>
                      <div className="bg-white"></div>
                      <div className="bg-black col-span-2 row-span-2 rounded-xs"></div>
                      <div className="bg-black"></div>
                      <div className="bg-white"></div>
                      <div className="bg-black"></div>
                      <div className="bg-black col-span-2 row-span-2 rounded-xs"></div>
                      <div className="bg-white"></div>
                      <div className="bg-black"></div>
                      <div className="bg-black"></div>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono font-bold text-slate-800 mt-1">
                    {selectedBatch.batch_number}
                  </div>
                </div>

                {/* Batch Information Details */}
                <div className="flex-1 space-y-1.5 w-full">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">
                      {currentMed?.name}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      selectedBatch.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedBatch.status === 'QUARANTINED'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {selectedBatch.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 font-medium">
                    {currentMed?.generic_name} · {currentMed?.dosage_form} ({currentMed?.strength})
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Expiry Date</span>
                      <div className="font-mono font-bold text-slate-900">{selectedBatch.expiry_date}</div>
                      <div className="text-[11px] font-semibold mt-0.5">
                        {daysLeft <= 0 ? (
                          <span className="text-rose-600 font-bold">Expired ({Math.abs(daysLeft)}d ago)</span>
                        ) : daysLeft <= 7 ? (
                          <span className="text-red-600 font-bold">{daysLeft} days (Critical)</span>
                        ) : (
                          <span className="text-emerald-700">{daysLeft} days remaining</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Available Units</span>
                      <div className="font-mono font-bold text-slate-900 text-sm">
                        {selectedBatch.available_quantity} units
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Rack: {selectedBatch.storage_location}
                      </div>
                    </div>
                  </div>

                  {selectedBatch.status === 'QUARANTINED' && (
                    <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 text-[11px]">
                      <strong>Quarantine Reason:</strong> {selectedBatch.quarantine_reason || 'Under inspection'}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                {selectedBatch.status === 'ACTIVE' && daysLeft > 0 && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenFefo();
                    }}
                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-xs"
                  >
                    Allocate via FEFO
                  </button>
                )}
                {selectedBatch.status === 'ACTIVE' && (
                  <button
                    onClick={() => {
                      onQuarantineBatch(selectedBatch.id, 'Quarantine triggered from optical barcode verification');
                      onClose();
                    }}
                    className="px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg font-semibold"
                  >
                    Lock into Quarantine
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
