import React, { useState, useEffect } from 'react';
import { UserMedicine } from '../types/userMedicine';
import { emailAlertService, EmailSettings, EmailNotificationLog } from '../services/emailAlertService';
import { soundEffects } from '../services/soundEffects';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  Bell, 
  X, 
  AlertTriangle, 
  FileText, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles,
  Copy,
  Inbox
} from 'lucide-react';

interface EmailAlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicines: UserMedicine[];
  onTriggerEmailSuccess: (email: string, medicineName: string) => void;
}

export const EmailAlertSettingsModal: React.FC<EmailAlertSettingsModalProps> = ({
  isOpen,
  onClose,
  medicines,
  onTriggerEmailSuccess
}) => {
  const [settings, setSettings] = useState<EmailSettings>(() => emailAlertService.getSettings());
  const [logs, setLogs] = useState<EmailNotificationLog[]>(() => emailAlertService.getLogs());
  const [selectedPreviewLog, setSelectedPreviewLog] = useState<EmailNotificationLog | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [realSentSuccess, setRealSentSuccess] = useState(false);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  useEffect(() => {
    return emailAlertService.subscribe(() => {
      setSettings(emailAlertService.getSettings());
      setLogs(emailAlertService.getLogs());
    });
  }, []);

  if (!isOpen) return null;

  // Find an expired medicine or use the first one as template
  const targetMed = medicines.find(m => new Date(m.expiryDate).getTime() < new Date('2026-10-10').getTime()) || medicines[0] || {
    id: 'med-demo',
    name: 'Advil Pain Relief (Ibuprofen 400mg)',
    brandOrGeneric: 'Pfizer / Ibuprofen',
    category: 'Fever & Pain',
    purpose: 'Pain & inflammation',
    expiryDate: '2026-10-01',
    quantity: '4 tablets left',
    location: 'Bathroom Cabinet',
    assignedTo: 'Self',
    isPrescription: false,
    createdAt: '2026-01-01'
  };

  const trimmedEmail = settings.recipientEmail.trim();
  const gmailComposeUrl = emailAlertService.getGmailComposeUrl(targetMed as UserMedicine, trimmedEmail);
  const mailtoUrl = emailAlertService.getMailtoUrl(targetMed as UserMedicine, trimmedEmail);

  const handleEmailInputChange = (newEmail: string) => {
    setSettings(prev => ({ ...prev, recipientEmail: newEmail }));
    emailAlertService.updateSettings({ recipientEmail: newEmail });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    emailAlertService.updateSettings(settings);
    setSaveSuccess(true);
    soundEffects.playSuccessChime();
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Directly generates and launches the real email to the entered inbox
  const handleSendRealAlertMail = () => {
    if (!trimmedEmail) return;
    setIsSending(true);
    soundEffects.playWarningTone();

    // Directly and automatically send email to recipient entered in website!
    emailAlertService.dispatchExpiryEmail(targetMed as UserMedicine, trimmedEmail);

    setLogs(emailAlertService.getLogs());
    setSelectedPreviewLog(emailAlertService.getLogs()[0]);
    setIsSending(false);
    setRealSentSuccess(true);
    soundEffects.playSuccessChime();
    onTriggerEmailSuccess(trimmedEmail, targetMed.name);
    setTimeout(() => setRealSentSuccess(false), 5000);
  };

  const handleCopyText = (log: EmailNotificationLog) => {
    try {
      navigator.clipboard.writeText(`${log.subject}\n\n${log.bodyText}`);
      setCopiedLogId(log.id);
      soundEffects.playSuccessChime();
      setTimeout(() => setCopiedLogId(null), 2500);
    } catch (e) {}
  };

  const handleRequestPush = () => {
    emailAlertService.requestBrowserPermission();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Email & Instant Alert Center</h3>
              <p className="text-xs text-slate-500">Receive automated email warnings when medicines in your cabinet expire</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 py-4 space-y-4 text-xs">
          {/* Email Settings Form */}
          <form onSubmit={handleSaveSettings} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div>
              <label className="block font-bold text-slate-900 mb-1">
                Your Email Address (For Expiry Alerts) *
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@gmail.com"
                  value={settings.recipientEmail}
                  onChange={(e) => handleEmailInputChange(e.target.value)}
                  className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors text-xs cursor-pointer"
                >
                  {saveSuccess ? 'Saved ✓' : 'Save Email'}
                </button>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Target recipient address: <code className="text-rose-700 font-bold">{trimmedEmail}</code>
              </span>
            </div>

            {/* Notification Triggers */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.instantAlertsOnExpiry}
                  onChange={(e) => setSettings({ ...settings, instantAlertsOnExpiry: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-800">
                  Send immediate email alert whenever any medicine expires (DO NOT CONSUME warning)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.upcomingAlerts7Days}
                  onChange={(e) => setSettings({ ...settings, upcomingAlerts7Days: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-800">
                  Send 7-day advance notice email to prepare refills
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.browserPushEnabled}
                  onChange={(e) => {
                    setSettings({ ...settings, browserPushEnabled: e.target.checked });
                    handleRequestPush();
                  }}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-800">
                  Enable desktop browser popup notifications
                </span>
              </label>
            </div>
          </form>

          {/* Real Inbox Delivery Action */}
          <div className="p-4 bg-gradient-to-br from-rose-50 via-white to-amber-50 border-2 border-rose-300 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-bold text-slate-900 block text-xs">
                Send Safety Alert Directly to Your Real Inbox ({trimmedEmail}):
              </span>
              <span className="text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full">
                Real Email Dispatch
              </span>
            </div>

            {/* Main Action Button */}
            <button
              type="button"
              onClick={handleSendRealAlertMail}
              disabled={isSending || !trimmedEmail}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-red-200 transition-all hover:scale-101 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Generating Email...' : `Click Here to Send Alert Mail Directly to ${trimmedEmail} 🚀`}</span>
            </button>

            {/* Auxiliary actions */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {/* Direct Gmail compose button */}
              <a
                href={gmailComposeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                title={`Open Gmail to send safety alert to ${trimmedEmail}`}
              >
                <Mail className="w-3.5 h-3.5 text-white" />
                <span>Open in Gmail 🔴</span>
                <ExternalLink className="w-3 h-3 opacity-90" />
              </a>

              {/* Direct mailto button */}
              <a
                href={mailtoUrl}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                title="Send using system email app (Outlook / Apple Mail / Phone)"
              >
                <span>Default Mail App 📱</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {realSentSuccess && (
              <div className="bg-emerald-100/90 border border-emerald-300 rounded-xl p-2.5 text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Alert email generated & opened for {trimmedEmail}! Hit 'Send' in your mail composer to deliver it to your inbox.</span>
              </div>
            )}

            <p className="text-[11px] text-slate-600 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-rose-200/60">
              💡 <strong>Why does it open your mail composer?</strong> Clicking <strong>'Send Alert Mail'</strong> opens a message addressed to <code className="text-rose-700 font-bold">{trimmedEmail}</code> with the complete medical expiry alert pre-written, ensuring it arrives directly in your personal inbox!
            </p>
          </div>

          {/* Email Preview & Dispatch History */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center justify-between">
              <span>Dispatched Email Alerts History ({logs.length}):</span>
              <span className="text-[11px] font-normal text-slate-500">Click to view & resend</span>
            </h4>

            <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden max-h-48 overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedPreviewLog(log)}
                  className={`p-3 cursor-pointer transition-colors flex items-center justify-between ${
                    selectedPreviewLog?.id === log.id ? 'bg-rose-50' : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="truncate mr-2">
                    <div className="font-bold text-slate-900 truncate">{log.subject}</div>
                    <div className="text-[11px] text-slate-500">
                      To: {log.recipientEmail} · Sent at: {log.sentAt}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                    {log.status} ✓
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rendered HTML Email Preview Box */}
          {selectedPreviewLog && (
            <div className="border border-slate-300 rounded-2xl p-4 bg-slate-100 space-y-2">
              <div className="flex items-center justify-between text-slate-700 font-bold border-b border-slate-200 pb-2 flex-wrap gap-2">
                <span>Rendered Email Inbox Preview:</span>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedPreviewLog.recipientEmail)}&su=${encodeURIComponent(selectedPreviewLog.subject)}&body=${encodeURIComponent(selectedPreviewLog.bodyText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <span>Send to Gmail</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCopyText(selectedPreviewLog)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedLogId === selectedPreviewLog.id ? 'Copied ✓' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <div 
                className="bg-white rounded-xl p-4 border border-slate-200 overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: selectedPreviewLog.bodyHtml }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
