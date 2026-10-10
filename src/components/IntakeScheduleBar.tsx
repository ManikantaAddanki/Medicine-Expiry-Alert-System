import React from 'react';
import { UserMedicine } from '../types/userMedicine';
import { soundEffects } from '../services/soundEffects';
import { Pill, Sun, Moon, Check, Clock, Sparkles } from 'lucide-react';

interface IntakeScheduleBarProps {
  medicines: UserMedicine[];
  onToggleTaken: (medId: string) => void;
}

export const IntakeScheduleBar: React.FC<IntakeScheduleBarProps> = ({
  medicines,
  onToggleTaken
}) => {
  // Medicines that have dosage notes or daily schedules
  const scheduleMeds = medicines.filter(m => 
    m.category === 'Daily & Chronic' || 
    m.category === 'Digestion & Stomach' || 
    m.category === 'Vitamins & Supplements' ||
    m.dosageNotes?.toLowerCase().includes('morning') ||
    m.dosageNotes?.toLowerCase().includes('night') ||
    m.dosageNotes?.toLowerCase().includes('daily')
  ).slice(0, 4);

  if (scheduleMeds.length === 0) return null;

  const handleCheck = (id: string) => {
    soundEffects.playSuccessChime();
    onToggleTaken(id);
  };

  return (
    <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">Today's Dose Schedule</h3>
            <span className="text-[10px] text-slate-400">Track daily routine and family doses</span>
          </div>
        </div>
        <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
          October 10, 2026
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {scheduleMeds.map((med) => {
          const isMorning = med.dosageNotes?.toLowerCase().includes('morning') || med.dosageNotes?.toLowerCase().includes('breakfast');
          const isNight = med.dosageNotes?.toLowerCase().includes('night') || med.dosageNotes?.toLowerCase().includes('bed');

          return (
            <div
              key={med.id}
              onClick={() => handleCheck(med.id)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                med.takenToday
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 hover:border-teal-300 hover:bg-teal-50/30 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  med.takenToday
                    ? 'bg-emerald-600 text-white'
                    : isMorning
                    ? 'bg-amber-100 text-amber-700'
                    : isNight
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {med.takenToday ? (
                    <Check className="w-4 h-4" />
                  ) : isMorning ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className={`text-xs font-bold ${med.takenToday ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                    {med.name.split('(')[0]}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    For {med.assignedTo} · {isMorning ? 'Morning' : isNight ? 'Bedtime' : 'Scheduled'}
                  </div>
                </div>
              </div>

              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center text-[10px] transition-colors ${
                med.takenToday
                  ? 'bg-emerald-600 border-emerald-600 text-white font-bold'
                  : 'border-slate-300 bg-white group-hover:border-teal-400'
              }`}>
                {med.takenToday && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
