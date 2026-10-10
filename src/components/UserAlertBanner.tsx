import React, { useState, useEffect } from 'react';
import { UserMedicine } from '../types/userMedicine';
import { calculateMedicineExpiryStatus } from '../services/userExpiryEngine';
import { voiceAlertService } from '../services/voiceAlertService';
import { soundEffects } from '../services/soundEffects';
import { emailAlertService } from '../services/emailAlertService';
import { 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  Volume2, 
  Square, 
  Sparkles,
  Mail,
  Send,
  CheckCircle2
} from 'lucide-react';

interface UserAlertBannerProps {
  medicines: UserMedicine[];
  onFilterExpired: () => void;
  onFilterExpiringSoon: () => void;
  onOpenDisposalGuide: () => void;
  onOpenAlertMessage?: () => void;
  onTriggerAllEmails?: () => void;
}

export const UserAlertBanner: React.FC<UserAlertBannerProps> = ({
  medicines,
  onFilterExpired,
  onFilterExpiringSoon,
  onOpenDisposalGuide,
  onOpenAlertMessage,
  onTriggerAllEmails
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [batchEmailSent, setBatchEmailSent] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(() => emailAlertService.getSettings().recipientEmail);

  useEffect(() => {
    return emailAlertService.subscribe(() => {
      setRecipientEmail(emailAlertService.getSettings().recipientEmail);
    });
  }, []);

  const expiredMeds = medicines.filter(m => {
    const s = calculateMedicineExpiryStatus(m);
    return s.urgency === 'EXPIRED';
  });

  const criticalMeds = medicines.filter(m => {
    const s = calculateMedicineExpiryStatus(m);
    return s.urgency === 'CRITICAL' || s.urgency === 'UPCOMING';
  });

  if (expiredMeds.length === 0 && criticalMeds.length === 0) {
    return null;
  }

  const handlePlayVoiceAlert = () => {
    if (isSpeaking) {
      voiceAlertService.stop();
      setIsSpeaking(false);
      return;
    }

    soundEffects.playWarningTone();
    setIsSpeaking(true);
    voiceAlertService.speakMultipleExpiredAlert(expiredMeds.map(m => m.name));

    setTimeout(() => {
      setIsSpeaking(false);
    }, 6000);
  };

  const handleSendAllEmails = () => {
    if (expiredMeds.length === 0) return;
    setIsSendingEmails(true);
    soundEffects.playWarningTone();

    // Directly and automatically dispatch email for recipient entered in website
    emailAlertService.dispatchMultipleExpiryEmail(expiredMeds, recipientEmail);
    setBatchEmailSent(true);
    soundEffects.playSuccessChime();

    if (onTriggerAllEmails) {
      onTriggerAllEmails();
    }

    setTimeout(() => {
      setIsSendingEmails(false);
      setTimeout(() => setBatchEmailSent(false), 5000);
    }, 700);
  };

  return (
    <div className="space-y-2 mb-6">
      {/* Red Alert: Expired Medications */}
      {expiredMeds.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-400 rounded-3xl p-5 shadow-sm text-rose-950 animate-in fade-in duration-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-rose-600 text-white rounded-2xl shadow-md shadow-rose-200 shrink-0 mt-0.5 lg:mt-0 animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-base text-rose-950 tracking-tight">
                    CRITICAL WARNING: {expiredMeds.length} Medicine{expiredMeds.length === 1 ? '' : 's'} Expired!
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-200 text-rose-900 px-2.5 py-0.5 rounded-full">
                    Do Not Consume
                  </span>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-100/90 border border-teal-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Mail className="w-3 h-3 text-teal-700" />
                    <span>Target Email: <strong className="text-slate-900">{recipientEmail}</strong></span>
                  </span>
                </div>
                <p className="text-xs text-rose-900 mt-1 leading-relaxed">
                  <strong>{expiredMeds.map(m => m.name).join(', ')}</strong> {expiredMeds.length === 1 ? 'has' : 'have'} expired. Chemical breakdown or bacterial growth can cause health complications.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap self-end lg:self-auto">
              {/* Emergency Alert Message Dialog Button */}
              {onOpenAlertMessage && (
                <button
                  type="button"
                  onClick={onOpenAlertMessage}
                  className="px-3.5 py-2 text-xs font-black rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200 flex items-center gap-1.5 transition-all hover:scale-102 cursor-pointer"
                  title="Open urgent expiry alert message dialog"
                >
                  <ShieldAlert className="w-4 h-4 text-white animate-bounce" />
                  <span>View Alert Message 🚨</span>
                </button>
              )}

              {/* Direct Send Mail to Inbox Button */}
              <button
                type="button"
                onClick={handleSendAllEmails}
                disabled={isSendingEmails}
                className="px-3.5 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white flex items-center gap-1.5 transition-all shadow-md shadow-red-200 hover:scale-102 cursor-pointer disabled:opacity-50"
                title={`Send alert email automatically to ${recipientEmail}`}
              >
                <Send className="w-3.5 h-3.5 text-white" />
                <span>{isSendingEmails ? 'Sending...' : 'Send Alert Mail to Inbox ✉️'}</span>
              </button>

              {/* Spoken Audio Voice Button */}
              <button
                type="button"
                onClick={handlePlayVoiceAlert}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  isSpeaking
                    ? 'bg-rose-700 text-white animate-pulse'
                    : 'bg-white hover:bg-rose-100 border border-rose-300 text-rose-900'
                }`}
                title="Hear spoken voice warning alert out loud"
              >
                {isSpeaking ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Speaking...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-rose-600" />
                    <span>Voice Alert 🔊</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenDisposalGuide}
                className="text-xs font-bold text-rose-800 hover:text-rose-950 underline px-2 py-1"
              >
                Disposal
              </button>

              <button
                type="button"
                onClick={onFilterExpired}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <span>Filter Expired ({expiredMeds.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Feedback banner when batch email is sent */}
          {batchEmailSent && (
            <div className="mt-3 bg-emerald-100/90 border border-emerald-300 rounded-xl p-2.5 text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                ✓ Alert email sent immediately to your inbox ({recipientEmail})!
              </span>
            </div>
          )}
        </div>
      )}

      {/* Orange Alert: Expiring Within 30 Days */}
      {criticalMeds.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-amber-500 text-white rounded-xl shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-amber-950">
                {criticalMeds.length} medicine{criticalMeds.length === 1 ? '' : 's'} expiring soon:
              </span>
              <span className="text-xs text-amber-800 ml-1.5">
                {criticalMeds.slice(0, 2).map(m => m.name).join(', ')}
                {criticalMeds.length > 2 && ` and ${criticalMeds.length - 2} more`}. Plan to replace them.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onFilterExpiringSoon}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 self-end sm:self-auto transition-colors flex items-center gap-1"
          >
            <span>Review Items</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
