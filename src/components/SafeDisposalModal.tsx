import React from 'react';
import { X, Trash2, AlertTriangle, ShieldCheck, CheckCircle2, Droplets } from 'lucide-react';

interface SafeDisposalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafeDisposalModal: React.FC<SafeDisposalModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">How to Safely Throw Away Expired Medicine</h3>
              <p className="text-xs text-slate-500">Official FDA & Medical Household Safety Guidelines</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 py-4 space-y-4 text-xs text-slate-700">
          {/* Warning Banner */}
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Why You Should Never Take Expired Medicine
            </div>
            <p className="text-[11px] leading-relaxed text-rose-800">
              Over time, active ingredients break down. Expired medicines can become sub-potent (failing to treat your illness) or turn into toxic byproducts. Opened syrups and eye drops also harbor dangerous bacterial contamination.
            </p>
          </div>

          {/* 4-Step Household Trash Rule */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">
              Standard 4-Step Home Disposal (Trash Can):
            </h4>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                1
              </span>
              <div>
                <strong className="text-slate-900">Mix with an unappealing substance</strong>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Take the pills or liquid out of their original bottle and mix them with used coffee grounds, dirt, or cat litter. (Do not crush tablets).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                2
              </span>
              <div>
                <strong className="text-slate-900">Seal in a container</strong>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Place the mixture in a sealable plastic bag, empty can, or leak-proof container so pets or children cannot get into it.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                3
              </span>
              <div>
                <strong className="text-slate-900">Scratch out your personal details</strong>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Black out your name, prescription number, and doctor details on the empty medicine bottle with a marker to protect privacy.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                4
              </span>
              <div>
                <strong className="text-slate-900">Throw in household garbage</strong>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Throw the sealed mixture and the empty bottle directly into your outdoor trash bin.
                </p>
              </div>
            </div>
          </div>

          {/* DO NOT FLUSH Warning */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-[11px] flex items-start gap-2.5">
            <Droplets className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Do Not Flush Down the Sink or Toilet:</strong> Flushing medicines puts active chemicals into our rivers, lakes, and drinking water sources.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
