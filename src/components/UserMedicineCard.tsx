import React, { useState, useEffect } from 'react';
import { UserMedicine } from '../types/userMedicine';
import { calculateMedicineExpiryStatus } from '../services/userExpiryEngine';
import { voiceAlertService } from '../services/voiceAlertService';
import { soundEffects } from '../services/soundEffects';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  MapPin, 
  User, 
  Trash2, 
  Edit3, 
  Pill, 
  Volume2,
  Square,
  Sparkles,
  Flame,
  Mail,
  Send
} from 'lucide-react';
import { emailAlertService } from '../services/emailAlertService';

interface UserMedicineCardProps {
  medicine: UserMedicine;
  onEdit: (med: UserMedicine) => void;
  onDelete: (id: string) => void;
  onTakeDose: (med: UserMedicine) => void;
  onOpenDisposalGuide: () => void;
  onOpenAlertMessage?: (med: UserMedicine) => void;
  onSendEmailAlert?: (med: UserMedicine) => void;
}

export const UserMedicineCard: React.FC<UserMedicineCardProps> = ({
  medicine,
  onEdit,
  onDelete,
  onTakeDose,
  onOpenDisposalGuide,
  onOpenAlertMessage,
  onSendEmailAlert
}) => {
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isSendingLocalEmail, setIsSendingLocalEmail] = useState(false);
  const [localEmailSent, setLocalEmailSent] = useState(false);
  const [currentRecipient, setCurrentRecipient] = useState(() => emailAlertService.getSettings().recipientEmail);

  useEffect(() => {
    return emailAlertService.subscribe(() => {
      setCurrentRecipient(emailAlertService.getSettings().recipientEmail);
    });
  }, []);

  const status = calculateMedicineExpiryStatus(medicine);

  const categoryColors: Record<string, string> = {
    'Fever & Pain': 'bg-amber-100 text-amber-900 border-amber-200',
    'Cold & Cough': 'bg-blue-100 text-blue-900 border-blue-200',
    'Allergy': 'bg-purple-100 text-purple-900 border-purple-200',
    'Digestion & Stomach': 'bg-orange-100 text-orange-900 border-orange-200',
    'First Aid & Skin': 'bg-emerald-100 text-emerald-900 border-emerald-200',
    'Daily & Chronic': 'bg-indigo-100 text-indigo-900 border-indigo-200',
    'Vitamins & Supplements': 'bg-teal-100 text-teal-900 border-teal-200',
    'Eye & Ear Drops': 'bg-cyan-100 text-cyan-900 border-cyan-200',
  };

  const isExpired = status.urgency === 'EXPIRED';
  const isCritical = status.urgency === 'CRITICAL';
  const isUpcoming = status.urgency === 'UPCOMING';

  const handlePlayCardVoiceAlert = () => {
    if (isPlayingVoice) {
      voiceAlertService.stop();
      setIsPlayingVoice(false);
      return;
    }

    soundEffects.playWarningTone();
    setIsPlayingVoice(true);

    if (isExpired) {
      voiceAlertService.speakExpiredAlert(medicine.name);
    } else {
      voiceAlertService.speakExpiringSoonAlert(medicine.name, status.daysRemaining);
    }

    setTimeout(() => {
      setIsPlayingVoice(false);
    }, 4500);
  };

  const handleDirectSendEmail = () => {
    setIsSendingLocalEmail(true);
    soundEffects.playWarningTone();
    // Directly and automatically send email to recipient entered in website
    emailAlertService.dispatchExpiryEmail(medicine, currentRecipient);
    setLocalEmailSent(true);
    soundEffects.playSuccessChime();

    if (onSendEmailAlert) {
      onSendEmailAlert(medicine);
    }

    setTimeout(() => {
      setIsSendingLocalEmail(false);
      setTimeout(() => setLocalEmailSent(false), 5000);
    }, 700);
  };

  return (
    <div className={`bg-white rounded-3xl p-5 border-2 transition-all shadow-xs flex flex-col justify-between relative overflow-hidden ${
      isExpired
        ? 'border-rose-500 bg-rose-50/25 shadow-rose-200/60 shadow-lg ring-2 ring-rose-500/40'
        : isCritical
        ? 'border-red-400 bg-red-50/20 shadow-red-100 shadow-md ring-1 ring-red-400/30'
        : isUpcoming
        ? 'border-amber-300'
        : 'border-slate-200 hover:border-slate-300'
    }`}>
      {/* Animated Top Hazard Stripe Accent when Expired */}
      {isExpired && (
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 animate-pulse" />
      )}

      <div>
        {/* Top Badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${categoryColors[medicine.category] || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
            {medicine.category}
          </span>

          {/* Highly Visible Pulsing EXPIRED / CRITICAL Badge Icon */}
          {isExpired ? (
            <div className="relative inline-flex items-center">
              {/* CSS Animation Radar Ping Effect */}
              <span className="absolute -inset-1 rounded-2xl bg-rose-500/80 animate-ping opacity-75"></span>
              {/* Pulsing Core Badge Icon with Glow Animation */}
              <span className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-600/50 border-2 border-rose-300 animate-pulse-glow">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse shadow-xs"></span>
                <ShieldAlert className="w-4 h-4 text-white animate-bounce shrink-0" />
                <span className="drop-shadow-xs font-black">EXPIRED</span>
              </span>
            </div>
          ) : isCritical ? (
            <div className="relative inline-flex items-center">
              {/* CSS Animation Radar Ping Effect */}
              <span className="absolute -inset-1 rounded-2xl bg-red-500/60 animate-ping opacity-75"></span>
              {/* Pulsing Core Badge Icon for Critical Expiry */}
              <span className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-red-500/40 border-2 border-red-300 animate-pulse-glow">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse shadow-xs"></span>
                <Clock className="w-4 h-4 text-white animate-bounce shrink-0" />
                <span className="drop-shadow-xs font-black">CRITICAL ({status.daysRemaining}D)</span>
              </span>
            </div>
          ) : (
            <span className={`text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 uppercase tracking-wide ${
              isUpcoming
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {status.alertTitle}
            </span>
          )}
        </div>

        {/* Medicine Name, Photo & Purpose */}
        <div className="mb-3">
          <div className="flex items-start gap-3">
            {medicine.photoUrl && (
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative group shadow-2xs">
                <img
                  src={medicine.photoUrl}
                  alt={medicine.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
                <span className="absolute bottom-0 inset-x-0 bg-slate-950/75 text-[8px] text-teal-300 font-bold text-center py-0.5">
                  PHOTO
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                {medicine.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                {medicine.brandOrGeneric}
              </p>
              {medicine.batchNumber && (
                <span className="inline-block mt-1 text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  Batch: {medicine.batchNumber}
                </span>
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="font-semibold text-slate-900">Used for:</span> {medicine.purpose}
          </div>
        </div>

        {/* Expiry Warning Callout with Spoken Voice Trigger */}
        {(isExpired || isCritical) && (
          <div className={`p-3.5 rounded-2xl mb-3 text-xs border space-y-2 shadow-xs ${
            isExpired
              ? 'bg-rose-100/90 border-rose-300 text-rose-950'
              : 'bg-red-100/70 border-red-300 text-red-950'
          }`}>
            <div className="flex items-center justify-between">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 animate-pulse" />
                <span>{isExpired ? 'SAFETY WARNING: DO NOT TAKE' : 'EXPIRING VERY SOON'}</span>
              </div>

              {/* Individual Spoken Audio Voice Button */}
              <button
                onClick={handlePlayCardVoiceAlert}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs ${
                  isPlayingVoice
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-white hover:bg-rose-200/90 text-rose-900 border border-rose-300'
                }`}
                title="Speak voice alert out loud"
              >
                {isPlayingVoice ? <Square className="w-3 h-3 fill-current" /> : <Volume2 className="w-3.5 h-3.5 text-rose-600" />}
                <span>{isPlayingVoice ? 'Speaking...' : 'Play Voice Alert 🔊'}</span>
              </button>
            </div>

            <p className="text-[11px] leading-relaxed font-medium">
              {status.alertMessage}
            </p>
          </div>
        )}

        {/* Dedicated Email Alert Notification Section for Expired Item */}
        {isExpired && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 mb-3 text-xs space-y-2">
            <div className="flex items-center justify-between gap-1 text-[11px] text-rose-900">
              <span className="flex items-center gap-1.5 font-semibold truncate">
                <Mail className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Alert Recipient:</span>
                <span className="font-bold text-slate-900 truncate" title={currentRecipient}>
                  {currentRecipient}
                </span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                localEmailSent 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                  : 'bg-rose-100 text-rose-800 border-rose-200'
              }`}>
                {localEmailSent ? 'SENT TO INBOX ✓' : 'READY TO SEND'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-rose-200/60">
              <button
                type="button"
                onClick={() => onOpenAlertMessage?.(medicine)}
                className="px-2 py-1.5 rounded-xl bg-white hover:bg-rose-100 text-rose-900 border border-rose-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors shadow-2xs"
                title="Open urgent expiry alert message dialog"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>Alert Message 🚨</span>
              </button>

              <button
                type="button"
                onClick={handleDirectSendEmail}
                disabled={isSendingLocalEmail}
                className="px-2 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-[11px] flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                title={`Send alert email automatically to ${currentRecipient}`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingLocalEmail ? 'Sending...' : 'Send Mail ✉️'}</span>
              </button>
            </div>

            {localEmailSent && (
              <p className="text-[10px] text-emerald-800 font-medium bg-emerald-100/70 p-1.5 rounded-lg border border-emerald-200 text-center animate-in fade-in">
                ✓ Alert email sent immediately to {currentRecipient}!
              </p>
            )}
          </div>
        )}

        {/* Medicine Meta: Quantity, Location, Family Member */}
        <div className="space-y-1.5 text-xs text-slate-600 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Remaining:</span>
            <span className="font-bold text-slate-800">{medicine.quantity}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Kept in:</span>
            <span className="font-medium text-slate-700 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              {medicine.location}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Belongs to:</span>
            <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md flex items-center gap-1">
              <User className="w-3 h-3" />
              {medicine.assignedTo}
            </span>
          </div>

          {medicine.dosageNotes && (
            <div className="pt-2 text-[11px] text-slate-500 italic border-t border-slate-100">
              "{medicine.dosageNotes}"
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(medicine)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Edit details"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(medicine.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Throw away / Remove"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isExpired ? (
            <>
              <button
                onClick={() => onOpenAlertMessage?.(medicine)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1 shadow-xs"
                title="View full alert message and dispatched email"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Alert & Email</span>
              </button>
              <button
                onClick={onOpenDisposalGuide}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 transition-colors border border-rose-300"
              >
                Dispose
              </button>
            </>
          ) : (
            <button
              onClick={() => onTakeDose(medicine)}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 transition-colors flex items-center gap-1 border border-teal-200"
              title="Record dose taken"
            >
              <Pill className="w-3.5 h-3.5 text-teal-600" />
              <span>Take Dose</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
