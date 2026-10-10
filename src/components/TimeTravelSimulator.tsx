import React, { useState } from 'react';
import { UserMedicine } from '../types/userMedicine';
import { USER_CURRENT_DATE } from '../services/userExpiryEngine';
import { Clock, Calendar, Sparkles, AlertTriangle, ArrowRight, X } from 'lucide-react';

interface TimeTravelSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  medicines: UserMedicine[];
}

export const TimeTravelSimulator: React.FC<TimeTravelSimulatorProps> = ({
  isOpen,
  onClose,
  medicines
}) => {
  const [offsetDays, setOffsetDays] = useState<number>(30);

  if (!isOpen) return null;

  // Calculate projected date
  const baseDate = new Date(USER_CURRENT_DATE + 'T00:00:00');
  const projectedDate = new Date(baseDate);
  projectedDate.setDate(projectedDate.getDate() + offsetDays);
  const projectedDateStr = projectedDate.toISOString().split('T')[0];

  // Evaluate which medicines will be expired on that future date
  const futureExpired = medicines.filter(m => {
    const medExp = new Date(m.expiryDate + 'T00:00:00');
    return medExp <= projectedDate;
  });

  const futureActive = medicines.filter(m => {
    const medExp = new Date(m.expiryDate + 'T00:00:00');
    return medExp > projectedDate;
  });

  const presets = [
    { label: 'Today', days: 0 },
    { label: '+15 Days', days: 15 },
    { label: '+30 Days (Next Month)', days: 30 },
    { label: '+60 Days (2 Months)', days: 60 },
    { label: '+90 Days (Quarterly)', days: 90 },
    { label: '+180 Days (Half Year)', days: 180 },
    { label: '+365 Days (1 Year)', days: 365 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Future Expiry Simulator & Forecast</h3>
              <p className="text-xs text-slate-500">Fast-forward into the future to see what medicines will expire</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 py-4 space-y-4 text-xs">
          {/* Slider & Presets */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Simulate Calendar Fast-Forward:</span>
              <span className="text-xs font-mono font-bold bg-indigo-100 text-indigo-900 px-2.5 py-1 rounded-lg">
                Projected Date: {projectedDateStr} (+{offsetDays} days)
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="365"
              step="5"
              value={offsetDays}
              onChange={(e) => setOffsetDays(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />

            <div className="flex flex-wrap gap-1.5 pt-1">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setOffsetDays(p.days)}
                  className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                    offsetDays === p.days
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary Strip */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
              <span className="text-[10px] font-bold text-rose-700 uppercase">Expired by {projectedDateStr}</span>
              <div className="text-2xl font-bold text-rose-600 mt-1">{futureExpired.length} medicines</div>
              <span className="text-[10px] text-rose-500">Will be past safe expiration</span>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Still Good to Use</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1">{futureActive.length} medicines</div>
              <span className="text-[10px] text-emerald-600">Fresh and usable</span>
            </div>
          </div>

          {/* List of Medicines Expired on That Date */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900">
              Medicines Expiring Before {projectedDateStr} ({futureExpired.length} items):
            </h4>

            {futureExpired.length === 0 ? (
              <p className="text-slate-400 italic">No medicines will expire within this timeframe.</p>
            ) : (
              <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                {futureExpired.map((m) => (
                  <div key={m.id} className="p-3 bg-white flex items-center justify-between text-xs hover:bg-slate-50">
                    <div>
                      <div className="font-bold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-500">{m.purpose} · {m.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-rose-600">Expires: {m.expiryDate}</div>
                      <div className="text-[10px] text-slate-400">Kept in {m.location}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
