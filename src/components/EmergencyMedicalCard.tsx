import React from 'react';
import { UserMedicine } from '../types/userMedicine';
import { AlertTriangle, PhoneCall, ShieldAlert, MapPin, X, HeartPulse } from 'lucide-react';

interface EmergencyMedicalCardProps {
  isOpen: boolean;
  onClose: () => void;
  medicines: UserMedicine[];
}

export const EmergencyMedicalCard: React.FC<EmergencyMedicalCardProps> = ({
  isOpen,
  onClose,
  medicines
}) => {
  if (!isOpen) return null;

  // Emergency categories
  const emergencyMeds = medicines.filter(m => 
    m.category === 'Fever & Pain' || 
    m.category === 'Allergy' || 
    m.category === 'First Aid & Skin' ||
    m.category === 'Cold & Cough'
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border-2 border-red-300 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-200">
              <HeartPulse className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-red-950">Emergency Quick-Access First-Aid</h3>
                <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full uppercase">
                  Rapid Home Search
                </span>
              </div>
              <p className="text-xs text-red-700">Instant home medicine locator for sudden symptoms</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emergency Hotlines Strip */}
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-red-900">
          <div className="flex items-center gap-2 font-bold">
            <PhoneCall className="w-4 h-4 text-red-600" />
            <span>Emergency Services: 911 / 112</span>
          </div>
          <div className="flex items-center gap-2 font-semibold text-red-800">
            <span>Poison Control Hotline: 1-800-222-1222</span>
          </div>
        </div>

        {/* List of Emergency Medicines and Their Exact Locations */}
        <div className="overflow-y-auto flex-1 py-4 space-y-3 text-xs">
          <div className="text-xs font-bold text-slate-900">
            Urgent Relief Medicines in Your Home:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {emergencyMeds.map((m) => (
              <div key={m.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-slate-900 text-sm">{m.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                      {m.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 font-medium">
                    {m.purpose}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/80 space-y-1 text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold text-teal-800">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Location: {m.location}</span>
                  </div>
                  <div className="text-slate-500">
                    Dose: {m.dosageNotes || 'Follow package instructions'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
          >
            Exit Emergency Mode
          </button>
        </div>
      </div>
    </div>
  );
};
