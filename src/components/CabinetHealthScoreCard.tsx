import React from 'react';
import { UserMedicine } from '../types/userMedicine';
import { computeCabinetHealthScore } from '../services/healthScoreEngine';
import { soundEffects } from '../services/soundEffects';
import { ShieldCheck, Sparkles, Trash2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface CabinetHealthScoreCardProps {
  medicines: UserMedicine[];
  onAutoCleanCabinet: () => void;
  onOpenDisposalGuide: () => void;
}

export const CabinetHealthScoreCard: React.FC<CabinetHealthScoreCardProps> = ({
  medicines,
  onAutoCleanCabinet,
  onOpenDisposalGuide
}) => {
  const health = computeCabinetHealthScore(medicines);

  // Circle calculation for radial gauge
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (health.score / 100) * circumference;

  const handleClean = () => {
    soundEffects.playSuccessChime();
    onAutoCleanCabinet();
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5 mb-6">
      {/* Left: Gauge & Score */}
      <div className="flex items-center gap-4">
        {/* Radial Progress Gauge */}
        <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-slate-800"
              strokeWidth="7"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              className={`transition-all duration-700 ease-out ${
                health.score >= 90 ? 'stroke-emerald-400' : health.score >= 70 ? 'stroke-teal-400' : health.score >= 50 ? 'stroke-amber-400' : 'stroke-rose-500'
              }`}
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-extrabold tracking-tight font-mono leading-none">
              {health.score}%
            </span>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">
              Safety
            </span>
          </div>
        </div>

        {/* Status text */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-tight">Cabinet Health & Safety Index</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${health.badgeColor}`}>
              {health.label}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            {health.actionRequired}
          </p>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
            <span>• Expired: <strong className="text-rose-400">{health.expiredCount}</strong></span>
            <span>• Expiring Soon: <strong className="text-amber-300">{health.criticalCount}</strong></span>
            <span>• Active: <strong className="text-emerald-400">{medicines.length - health.expiredCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-end">
        {health.expiredCount > 0 ? (
          <button
            onClick={handleClean}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-xs shadow-md shadow-rose-900/50 flex items-center justify-center gap-1.5 transition-all hover:scale-102"
          >
            <Trash2 className="w-4 h-4" />
            <span>Safely Discard {health.expiredCount} Expired (Boost to 100%)</span>
          </button>
        ) : (
          <button
            onClick={onOpenDisposalGuide}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Cabinet Certified Safe</span>
          </button>
        )}
      </div>
    </div>
  );
};
