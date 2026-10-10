import React, { useState } from 'react';
import { Medicine, Batch, UserRole } from '../types/inventory';
import { calculateFefoDispense, FEFOResult } from '../services/fefoEngine';
import { CURRENT_SYSTEM_DATE } from '../services/alertEngine';
import { ArrowRightLeft, CheckCircle2, AlertTriangle, ShieldAlert, X, Sparkles } from 'lucide-react';

interface FefoDispenserModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicines: Medicine[];
  batches: Batch[];
  currentBranchId: number;
  currentRole: UserRole;
  onExecuteDispense: (allocations: { batch_id: number; units: number }[], medicineName: string, reason: string) => void;
}

export const FefoDispenserModal: React.FC<FefoDispenserModalProps> = ({
  isOpen,
  onClose,
  medicines,
  batches,
  currentBranchId,
  currentRole,
  onExecuteDispense
}) => {
  const [selectedMedId, setSelectedMedId] = useState<number>(medicines[0]?.id || 1);
  const [requestedUnits, setRequestedUnits] = useState<number>(50);
  const [dispenseReason, setDispenseReason] = useState<string>('Inpatient Ward 3 prescription fulfillment');

  if (!isOpen) return null;

  const selectedMed = medicines.find(m => m.id === selectedMedId);

  // Calculate FEFO Allocation
  const fefoResult: FEFOResult = calculateFefoDispense(
    batches,
    selectedMedId,
    currentBranchId,
    requestedUnits,
    CURRENT_SYSTEM_DATE
  );

  const canDispense = currentRole !== 'auditor';

  const handleConfirm = () => {
    if (!fefoResult.allocations.length) return;
    const allocationPayload = fefoResult.allocations.map(a => ({
      batch_id: a.batch_id,
      units: a.allocated_units
    }));
    onExecuteDispense(allocationPayload, selectedMed?.name || 'Medicine', dispenseReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">FEFO Stock Rotation Dispensing Engine</h3>
              <p className="text-xs text-slate-500">First Expiry, First Out algorithmic stock allocation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 py-4 space-y-4 text-xs">
          {/* Inputs: Medicine Selection & Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Formulation *</label>
              <select
                value={selectedMedId}
                onChange={(e) => setSelectedMedId(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                {medicines.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.dosage_form} - {m.strength})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Required Quantity Units *</label>
              <input
                type="number"
                min="1"
                value={requestedUnits}
                onChange={(e) => setRequestedUnits(Math.max(1, Number(e.target.value)))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold font-mono focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Prescription / Ward Dispense Reference</label>
              <input
                type="text"
                value={dispenseReason}
                onChange={(e) => setDispenseReason(e.target.value)}
                placeholder="e.g. Rx-2026-9041 or Surgery Ward 2 Requisition"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Allocation Recommendation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                FEFO Recommended Picking Order
              </span>
              <span className="text-[11px] font-semibold text-slate-600">
                Fulfilled: <strong className={fefoResult.is_fully_fulfilled ? 'text-teal-700' : 'text-amber-600'}>
                  {fefoResult.total_allocated} / {fefoResult.requested_units} units
                </strong>
              </span>
            </div>

            {fefoResult.allocations.length === 0 ? (
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-center">
                <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-rose-600" />
                <div className="font-semibold">Insufficient Active Stock</div>
                <div className="text-[11px]">No active, non-expired, and non-quarantined batches available to fulfill this request.</div>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Priority #</th>
                      <th className="py-2.5 px-3">Batch Number</th>
                      <th className="py-2.5 px-3">Expiry Date</th>
                      <th className="py-2.5 px-3">Days Left</th>
                      <th className="py-2.5 px-3">Rack Location</th>
                      <th className="py-2.5 px-3 text-right">Units to Pick</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fefoResult.allocations.map((item, idx) => (
                      <tr key={item.batch_id} className="bg-teal-50/40">
                        <td className="py-2.5 px-3 font-bold text-teal-800">#{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{item.batch_number}</td>
                        <td className="py-2.5 px-3 font-mono">{item.expiry_date}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-red-600">{item.days_remaining} days</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-medium">{item.storage_location}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-800 text-sm">
                          {item.allocated_units} units
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Excluded Batches (Safety Isolation) */}
          {fefoResult.excluded_batches.length > 0 && (
            <div className="border border-amber-200 bg-amber-50/60 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Excluded from Dispensing Pool ({fefoResult.excluded_batches.length} batches bypassed)</span>
              </div>
              <p className="text-[11px] text-amber-800">
                The algorithm automatically excludes batches that are expired, quarantined, or recalled to protect patient safety.
              </p>
              <div className="space-y-1 pt-1">
                {fefoResult.excluded_batches.map((ex, idx) => (
                  <div key={idx} className="bg-white/80 p-2 rounded-lg border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900">{ex.batch_number}</span>
                      <span className="text-slate-500 ml-2">· {ex.reason}</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 uppercase">
                      {ex.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Dispensing records will be permanently logged to the stock audit ledger.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canDispense || fefoResult.allocations.length === 0}
              className={`px-4 py-2 rounded-lg font-semibold text-white shadow-xs ${
                canDispense && fefoResult.allocations.length > 0
                  ? 'bg-teal-600 hover:bg-teal-700'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              Confirm & Execute Dispense
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
