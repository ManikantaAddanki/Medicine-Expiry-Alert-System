import React, { useState, useEffect } from 'react';
import { UserMedicine } from '../types/userMedicine';
import { calculateMedicineExpiryStatus } from '../services/userExpiryEngine';
import { voiceAlertService } from '../services/voiceAlertService';
import { emailAlertService, EmailNotificationLog } from '../services/emailAlertService';
import { soundEffects } from '../services/soundEffects';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Mail, 
  Send, 
  CheckCircle2, 
  Volume2, 
  Square, 
  X, 
  Trash2, 
  MapPin, 
  User, 
  Calendar, 
  Clock, 
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  Inbox
} from 'lucide-react';

interface ExpiredMedicineAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMedicine?: UserMedicine | null;
  allMedicines: UserMedicine[];
  onDiscardMedicine?: (id: string) => void;
  onOpenDisposalGuide: () => void;
}

export const ExpiredMedicineAlertModal: React.FC<ExpiredMedicineAlertModalProps> = ({
  isOpen,
  onClose,
  targetMedicine,
  allMedicines,
  onDiscardMedicine,
  onOpenDisposalGuide
}) => {
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentToast, setEmailSentToast] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [currentRecipient, setCurrentRecipient] = useState(() => emailAlertService.getSettings().recipientEmail);

  useEffect(() => {
    return emailAlertService.subscribe(() => {
      setCurrentRecipient(emailAlertService.getSettings().recipientEmail);
    });
  }, []);

  if (!isOpen) return null;

  // If a specific medicine was clicked, use it. Otherwise, collect all expired medicines in cabinet.
  const expiredMeds = targetMedicine 
    ? [targetMedicine]
    : allMedicines.filter(m => calculateMedicineExpiryStatus(m).urgency === 'EXPIRED');

  const primaryMed = expiredMeds[0] || targetMedicine;
  const isMultiple = expiredMeds.length > 1;

  // Find latest email log for this medicine or fallback
  const latestLog = primaryMed 
    ? emailAlertService.getLastLogForMedicine(primaryMed.name) || emailAlertService.getLogs()[0]
    : emailAlertService.getLogs()[0];

  const trimmedEmail = currentRecipient.trim();

  // Dynamic Real Email URLs
  const gmailComposeUrl = primaryMed
    ? (isMultiple 
        ? emailAlertService.getBatchGmailComposeUrl(expiredMeds, trimmedEmail) 
        : emailAlertService.getGmailComposeUrl(primaryMed, trimmedEmail))
    : '';

  const mailtoUrl = primaryMed
    ? (isMultiple
        ? emailAlertService.getBatchMailtoUrl(expiredMeds, trimmedEmail)
        : emailAlertService.getMailtoUrl(primaryMed, trimmedEmail))
    : '';

  const plainTextAlert = primaryMed
    ? (isMultiple
        ? emailAlertService.getBatchPlainTextAlert(expiredMeds, trimmedEmail)
        : emailAlertService.getPlainTextAlert(primaryMed, trimmedEmail))
    : '';

  const handlePlayVoice = () => {
    if (isPlayingVoice) {
      voiceAlertService.stop();
      setIsPlayingVoice(false);
      return;
    }

    soundEffects.playWarningTone();
    setIsPlayingVoice(true);

    if (expiredMeds.length === 1 && primaryMed) {
      voiceAlertService.speakExpiredAlert(primaryMed.name);
    } else {
      voiceAlertService.speakMultipleExpiredAlert(expiredMeds.map(m => m.name));
    }

    setTimeout(() => {
      setIsPlayingVoice(false);
    }, 5500);
  };

  const handleSendDirectEmail = () => {
    if (!primaryMed || !trimmedEmail) return;
    setIsSendingEmail(true);
    soundEffects.playWarningTone();

    // Persist email in settings
    emailAlertService.updateSettings({ recipientEmail: trimmedEmail });

    // Directly and automatically dispatch email
    if (isMultiple) {
      emailAlertService.dispatchMultipleExpiryEmail(expiredMeds, trimmedEmail);
    } else {
      emailAlertService.dispatchExpiryEmail(primaryMed, trimmedEmail);
    }

    setTimeout(() => {
      setIsSendingEmail(false);
      setEmailSentToast(true);
      soundEffects.playSuccessChime();
    }, 500);
  };

  const handleCopyAlertText = () => {
    if (!plainTextAlert) return;
    try {
      navigator.clipboard.writeText(plainTextAlert);
      setCopiedText(true);
      soundEffects.playSuccessChime();
      setTimeout(() => setCopiedText(false), 2500);
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border-2 border-rose-500 animate-in fade-in zoom-in-95 duration-150 relative overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Top Animated Hazard Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 animate-pulse" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-rose-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute -inset-1 rounded-2xl bg-rose-500/60 animate-ping opacity-75"></span>
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/40">
                <ShieldAlert className="w-7 h-7 animate-bounce" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-300 px-2.5 py-0.5 rounded-full">
                  Critical Safety Alert
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  Automated Inspection
                </span>
              </div>
              <h2 className="text-xl font-black text-rose-950 tracking-tight mt-0.5">
                🚨 MEDICINE EXPIRY ALERT MESSAGE
              </h2>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Body */}
        <div className="overflow-y-auto flex-1 py-4 space-y-4">
          {/* Urgent Warning Directive */}
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 text-rose-950 shadow-xs">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
              <span className="font-extrabold text-sm uppercase tracking-wide flex items-center gap-1.5 text-rose-700">
                <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
                SAFETY DIRECTIVE: DO NOT USE OR CONSUME
              </span>

              {/* Voice Alert Button */}
              <button
                type="button"
                onClick={handlePlayVoice}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  isPlayingVoice
                    ? 'bg-rose-700 text-white'
                    : 'bg-white hover:bg-rose-100 text-rose-900 border border-rose-300'
                }`}
              >
                {isPlayingVoice ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Speaking Alert...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-rose-600" />
                    <span>Play Voice Alert 🔊</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-rose-900/90 leading-relaxed font-medium">
              Medical authorities (FDA / WHO) warn that expired pharmaceuticals lose therapeutic potency and can degrade into hazardous chemical compounds or host microbial growth.
            </p>
          </div>

          {/* Expired Medicines Details List */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Expired Medication{expiredMeds.length > 1 ? 's' : ''} in Cabinet ({expiredMeds.length}):</span>
              <span className="text-[11px] font-normal text-rose-700 font-bold">Action Required: Quarantine</span>
            </h3>

            {expiredMeds.map((med) => {
              const status = calculateMedicineExpiryStatus(med);
              return (
                <div key={med.id} className="bg-white border-2 border-rose-200 rounded-2xl p-4 shadow-xs relative">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{med.name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300">
                          EXPIRED
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{med.brandOrGeneric} · {med.category}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-rose-600 block">
                        {status.daysRemaining < 0 
                          ? `${Math.abs(status.daysRemaining)} Days Overdue`
                          : 'Expired'
                        }
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">Date: {med.expiryDate}</span>
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span><strong>Location:</strong> {med.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-teal-600" />
                      <span><strong>Belongs to:</strong> {med.assignedTo}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span><strong>Remaining:</strong> {med.quantity}</span>
                    </div>
                  </div>

                  {onDiscardMedicine && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          onDiscardMedicine(med.id);
                          onClose();
                        }}
                        className="text-xs font-bold text-rose-700 hover:text-rose-900 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Discard & Remove from Cabinet</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Real Email Inbox Delivery Box with Direct Generator */}
          <div className="bg-gradient-to-br from-rose-50 via-white to-teal-50 border-2 border-rose-300 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-200 shrink-0">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Deliver Alert Directly to Your Inbox</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Generate the clinical alert addressed directly to your email so you receive it in your personal inbox.
                  </p>
                </div>
              </div>
            </div>

            {/* Email Address Input */}
            <div className="bg-white p-3.5 rounded-2xl border border-rose-200 space-y-2">
              <label className="block font-bold text-xs text-slate-900">
                Email Address to Receive Alert:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={currentRecipient}
                  onChange={(e) => {
                    setCurrentRecipient(e.target.value);
                    emailAlertService.updateSettings({ recipientEmail: e.target.value });
                  }}
                  placeholder="Enter your email address"
                  className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>

            {/* Direct Send Buttons (Real Inbox Delivery) */}
            <div className="p-3.5 bg-white rounded-2xl border border-rose-200 shadow-xs space-y-3">
              {/* Primary Direct Send Button */}
              <button
                type="button"
                onClick={handleSendDirectEmail}
                disabled={isSendingEmail || !trimmedEmail}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-red-200 transition-all hover:scale-101 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSendingEmail ? 'Sending...' : `Send Alert Mail Directly to ${trimmedEmail} 🚀`}</span>
              </button>

              <div className="flex items-center gap-2 flex-wrap pt-1">
                {/* 1. Open in Gmail Compose */}
                <a
                  href={gmailComposeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                  title={`Open Google Gmail compose directly addressed to ${trimmedEmail}`}
                >
                  <Mail className="w-3.5 h-3.5 text-white" />
                  <span>Open in Gmail 🔴</span>
                  <ExternalLink className="w-3 h-3 opacity-90" />
                </a>

                {/* 2. Open in Default Mail App (mailto:) */}
                <a
                  href={mailtoUrl}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                  title="Open system email application (Outlook, Apple Mail, Phone)"
                >
                  <span>Mail App 📱</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {/* 3. Copy Plain Text */}
                <button
                  type="button"
                  onClick={handleCopyAlertText}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  title="Copy full alert message to clipboard"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedText ? 'Copied ✓' : 'Copy Text 📋'}</span>
                </button>
              </div>

              {emailSentToast && (
                <div className="text-xs font-bold text-emerald-800 bg-emerald-100/90 p-2.5 rounded-xl flex items-center gap-2 border border-emerald-300 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>✓ Alert email sent immediately to {trimmedEmail}! Delivered to your inbox.</span>
                </div>
              )}

              <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-200">
                💡 Clicking <strong>"Generate & Send Alert Mail"</strong> immediately pre-fills the official alert addressed to <code className="text-rose-700 font-bold">{trimmedEmail}</code> so you can send it directly to your inbox.
              </p>
            </div>

            {/* Email Body Preview Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowEmailPreview(!showEmailPreview)}
                className="text-xs font-bold text-slate-800 hover:text-slate-900 flex items-center justify-between w-full p-1 rounded-lg"
              >
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-rose-600" />
                  <span>{showEmailPreview ? 'Hide HTML Email Layout Preview' : 'Preview Formatted HTML Email Body'}</span>
                </span>
                {showEmailPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showEmailPreview && latestLog && (
                <div className="mt-2.5 bg-white rounded-xl border border-slate-200 p-3.5 text-xs shadow-inner">
                  <div className="pb-2 mb-2 border-b border-slate-100 space-y-1 text-[11px] text-slate-500">
                    <p><strong>To:</strong> {latestLog.recipientEmail}</p>
                    <p><strong>Subject:</strong> <span className="text-slate-900 font-bold">{latestLog.subject}</span></p>
                    <p><strong>Dispatched:</strong> {latestLog.sentAt}</p>
                  </div>
                  <div 
                    className="overflow-x-auto text-xs"
                    dangerouslySetInnerHTML={{ __html: latestLog.bodyHtml }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenDisposalGuide();
            }}
            className="px-4 py-2 text-xs font-bold text-rose-900 hover:bg-rose-100/70 bg-rose-50 rounded-xl border border-rose-300 transition-colors"
          >
            How to Dispose of This Medicine Safely
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors shadow-xs"
            >
              I Understand & Acknowledge Alert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
