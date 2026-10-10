import React, { useState, useEffect } from 'react';
import { UserMedicine } from '../types/userMedicine';
import { emailAlertService } from '../services/emailAlertService';
import { soundEffects } from '../services/soundEffects';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ExternalLink, 
  Copy, 
  ShieldAlert, 
  Sparkles,
  Inbox,
  ArrowRight
} from 'lucide-react';

interface DirectEmailDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMedicine?: UserMedicine | null;
  expiredMedicines: UserMedicine[];
}

export const DirectEmailDispatchModal: React.FC<DirectEmailDispatchModalProps> = ({
  isOpen,
  onClose,
  targetMedicine,
  expiredMedicines
}) => {
  const [recipientEmail, setRecipientEmail] = useState(() => emailAlertService.getSettings().recipientEmail);
  const [isGenerated, setIsGenerated] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Sync recipientEmail when modal opens
  useEffect(() => {
    if (isOpen) {
      setRecipientEmail(emailAlertService.getSettings().recipientEmail);
      setIsGenerated(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const medsToAlert = targetMedicine ? [targetMedicine] : expiredMedicines;
  const isMultiple = medsToAlert.length > 1;

  const trimmedEmail = recipientEmail.trim();

  // Dynamic URLs
  const gmailUrl = isMultiple
    ? emailAlertService.getBatchGmailComposeUrl(medsToAlert, trimmedEmail)
    : targetMedicine
      ? emailAlertService.getGmailComposeUrl(targetMedicine, trimmedEmail)
      : '';

  const mailtoUrl = isMultiple
    ? emailAlertService.getBatchMailtoUrl(medsToAlert, trimmedEmail)
    : targetMedicine
      ? emailAlertService.getMailtoUrl(targetMedicine, trimmedEmail)
      : '';

  const plainText = isMultiple
    ? emailAlertService.getBatchPlainTextAlert(medsToAlert, trimmedEmail)
    : targetMedicine
      ? emailAlertService.getPlainTextAlert(targetMedicine, trimmedEmail)
      : '';

  const handleSendMailNow = () => {
    if (!trimmedEmail) return;

    soundEffects.playWarningTone();

    // Update persisted settings so other components immediately know this email
    emailAlertService.updateSettings({ recipientEmail: trimmedEmail });

    // Directly generate and launch email composer
    if (isMultiple) {
      emailAlertService.generateAndOpenBatchEmail(medsToAlert, trimmedEmail);
    } else if (targetMedicine) {
      emailAlertService.generateAndOpenEmail(targetMedicine, trimmedEmail);
    }

    setIsGenerated(true);
    soundEffects.playSuccessChime();
  };

  const handleCopyAlert = () => {
    if (!plainText) return;
    try {
      navigator.clipboard.writeText(plainText);
      setCopiedText(true);
      soundEffects.playSuccessChime();
      setTimeout(() => setCopiedText(false), 2500);
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border-2 border-rose-500 relative overflow-hidden my-auto">
        {/* Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 animate-pulse" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-rose-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-200 shrink-0">
              <Mail className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-300 px-2 py-0.5 rounded-full">
                  Direct Inbox Dispatch
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  Real Email Generator
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                Generate Alert Mail to Your Inbox 📨
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

        {/* Main Content */}
        <div className="py-4 space-y-4 text-xs">
          {/* Medication Summary */}
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-rose-950 text-xs flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Expired Medicine Safety Notice</span>
              </span>
              <span className="text-[10px] font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full">
                DO NOT CONSUME
              </span>
            </div>

            <div className="space-y-1 text-slate-800">
              {medsToAlert.slice(0, 3).map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-rose-100">
                  <span className="font-bold">{m.name}</span>
                  <span className="text-[11px] text-rose-600 font-mono font-bold">Expired: {m.expiryDate}</span>
                </div>
              ))}
              {medsToAlert.length > 3 && (
                <p className="text-[11px] text-slate-500 italic pl-1">
                  ... plus {medsToAlert.length - 3} more expired medications
                </p>
              )}
            </div>
          </div>

          {/* Recipient Email Address Input */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-900 text-xs">
              Enter Email Address to Receive This Alert:
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={recipientEmail}
                onChange={(e) => {
                  setRecipientEmail(e.target.value);
                  emailAlertService.updateSettings({ recipientEmail: e.target.value });
                }}
                placeholder="e.g. yourname@gmail.com"
                className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              💡 The email alert will be generated directly addressed to <strong className="text-slate-900">{trimmedEmail || 'your email'}</strong>.
            </p>
          </div>

          {/* Primary Action Button */}
          {!isGenerated ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleSendMailNow}
                disabled={!trimmedEmail}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-200 transition-all hover:scale-101 active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Click Here to Send Alert Mail Directly to {trimmedEmail || 'My Email'} 🚀</span>
              </button>

              <p className="text-[11px] text-center text-slate-500">
                Clicking above immediately generates the official medical advisory email and opens your email composer addressed to <strong className="text-rose-700 font-bold">{trimmedEmail}</strong>.
              </p>
            </div>
          ) : (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2.5 text-emerald-900 font-black text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Email Generated & Launched for {trimmedEmail}!</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                We generated the safety alert email pre-addressed to <strong>{trimmedEmail}</strong> and launched your email composer. Simply press <strong>"Send"</strong> in your mail window to deliver it straight into your personal inbox!
              </p>

              {/* Direct Re-Launch Buttons */}
              <div className="pt-2 flex items-center gap-2 flex-wrap">
                <a
                  href={gmailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Re-open in Gmail 🔴</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <a
                  href={mailtoUrl}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <span>Open in Mail App 📱</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="button"
                  onClick={handleCopyAlert}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedText ? 'Copied to Clipboard ✓' : 'Copy Message Text 📋'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Guidance Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[11px] text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Why does it open in your email composer?</strong>
              <p className="mt-0.5 text-amber-800/90 leading-relaxed">
                Sending directly through your personal email client guarantees the message reaches your real inbox immediately without being rejected by spam filters or discarded by simulated servers.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            Recipient: <span className="text-slate-700 font-bold">{trimmedEmail}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
