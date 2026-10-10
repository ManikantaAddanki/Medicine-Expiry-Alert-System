import React, { useState } from 'react';
import { UserMedicine, DrugInteraction } from '../types/userMedicine';
import { checkDrugInteractions } from '../services/drugInteractionEngine';
import { ShieldCheck, AlertTriangle, X, Check, Info, Sparkles } from 'lucide-react';

interface DrugInteractionCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicines: UserMedicine[];
}

export const DrugInteractionCheckerModal: React.FC<DrugInteractionCheckerModalProps> = ({
  isOpen,
  onClose,
  medicines
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    // Default select first two items
    return medicines.slice(0, 2).map(m => m.id);
  });

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectedMedicines = medicines.filter(m => selectedIds.includes(m.id));
  const interactions: DrugInteraction[] = checkDrugInteractions(selectedMedicines);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Drug-to-Drug Interaction Checker</h3>
              <p className="text-xs text-slate-500">Check if taking multiple cabinet medicines together is safe</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 py-4 space-y-4 text-xs">
          {/* Step 1: Select Medicines */}
          <div>
            <label className="font-bold text-slate-900 block mb-1.5">
              Select Medicines from Your Cabinet ({selectedIds.length} selected):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {medicines.map((m) => {
                const isSelected = selectedIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleSelect(m.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-teal-50 border-teal-400 text-teal-950 font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{m.name}</div>
                      <div className="text-[10px] text-slate-500">{m.purpose}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs shrink-0 ${
                      isSelected ? 'bg-teal-600 text-white' : 'border border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Interaction Evaluation Results */}
          <div>
            <div className="font-bold text-slate-900 mb-2">Clinical Interaction Report:</div>

            {selectedMedicines.length < 2 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-center">
                Select at least 2 medicines above to check for interactions.
              </div>
            ) : interactions.length === 0 ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600" />
                  No Known Adverse Interactions Found
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  No direct contraindications detected between <strong>{selectedMedicines.map(m => m.name).join(' & ')}</strong>. However, always take medicines with food/water as directed and observe standard dosing intervals.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {interactions.map((inter, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border-2 space-y-1.5 ${
                      inter.severity === 'DANGEROUS'
                        ? 'bg-rose-50 border-rose-300 text-rose-950'
                        : 'bg-amber-50 border-amber-300 text-amber-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm flex items-center gap-1.5">
                        <AlertTriangle className={`w-4 h-4 ${inter.severity === 'DANGEROUS' ? 'text-rose-600' : 'text-amber-600'}`} />
                        {inter.summary}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        inter.severity === 'DANGEROUS' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {inter.severity}
                      </span>
                    </div>

                    <div className="text-[11px] font-semibold text-slate-800">
                      Between: <u>{inter.medicineA}</u> + <u>{inter.medicineB}</u>
                    </div>

                    <p className="text-[11px] leading-relaxed pt-1 border-t border-slate-200/60">
                      {inter.clinicalAdvice}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Consult a physician for chronic prescription combinations.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
