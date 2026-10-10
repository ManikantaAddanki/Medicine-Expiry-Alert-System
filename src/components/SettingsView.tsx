import React, { useState } from 'react';
import { SystemSettings, UserRole } from '../types/inventory';
import { Settings, Shield, Bell, Check, Save } from 'lucide-react';

interface SettingsViewProps {
  settings: SystemSettings;
  currentRole: UserRole;
  onUpdateSettings: (newSettings: SystemSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  currentRole,
  onUpdateSettings
}) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [isSaved, setIsSaved] = useState(false);

  const canEdit = currentRole === 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">System Settings & Thresholds</h2>
        <p className="text-xs text-slate-500">
          Configure automated expiry horizon boundaries, background scheduler intervals, and notification policies
        </p>
      </div>

      {!canEdit && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            You are logged in as <strong>{currentRole}</strong>. System settings can only be altered by an Administrator.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6 text-xs">
        {/* Expiry Horizon Thresholds */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">Expiry Horizon Thresholds (Days)</h3>
          <p className="text-slate-500 mb-4">
            Defines the exact calendar day boundaries used by the alert engine to classify batch risks.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-red-700 mb-1">Critical Tier (&le; days)</label>
              <input
                type="number"
                min="1"
                max="30"
                disabled={!canEdit}
                value={formData.threshold_critical_days}
                onChange={(e) => setFormData({ ...formData, threshold_critical_days: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:bg-slate-100"
              />
              <span className="text-[10px] text-slate-400">Default: 7 days</span>
            </div>

            <div>
              <label className="block font-semibold text-amber-700 mb-1">High Priority (&le; days)</label>
              <input
                type="number"
                min="10"
                max="60"
                disabled={!canEdit}
                value={formData.threshold_high_days}
                onChange={(e) => setFormData({ ...formData, threshold_high_days: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:bg-slate-100"
              />
              <span className="text-[10px] text-slate-400">Default: 30 days</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Warning Tier (&le; days)</label>
              <input
                type="number"
                min="30"
                max="90"
                disabled={!canEdit}
                value={formData.threshold_warning_days}
                onChange={(e) => setFormData({ ...formData, threshold_warning_days: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:bg-slate-100"
              />
              <span className="text-[10px] text-slate-400">Default: 60 days</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Upcoming Tier (&le; days)</label>
              <input
                type="number"
                min="60"
                max="180"
                disabled={!canEdit}
                value={formData.threshold_upcoming_days}
                onChange={(e) => setFormData({ ...formData, threshold_upcoming_days: Number(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:bg-slate-100"
              />
              <span className="text-[10px] text-slate-400">Default: 90 days</span>
            </div>
          </div>
        </div>

        {/* Quarantine & Safety Automations */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Safety & Compliance Automations</h3>
          <p className="text-slate-500 mb-3">Enforce statutory patient safety standards</p>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={formData.auto_quarantine_expired}
                onChange={(e) => setFormData({ ...formData, auto_quarantine_expired: e.target.checked })}
                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 mt-0.5 disabled:opacity-50"
              />
              <div>
                <span className="font-semibold text-slate-800">Auto-Quarantine Expired Stock during Daily Scan</span>
                <p className="text-slate-500 text-[11px]">
                  When enabled, any batch whose expiry date has passed is immediately locked with status <code className="text-rose-700 font-mono">EXPIRED</code> and forbidden from all FEFO dispensing.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Email & Notifications */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Notification Dispatch</h3>
          <p className="text-slate-500 mb-3">Daily summary emails sent to the Chief Pharmacist</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={formData.email_notifications_enabled}
                  onChange={(e) => setFormData({ ...formData, email_notifications_enabled: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 disabled:opacity-50"
                />
                <span className="font-semibold text-slate-800">Enable Daily SMTP Expiry Digest</span>
              </label>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alert Recipient Email</label>
              <input
                type="email"
                disabled={!canEdit}
                value={formData.alert_email_recipient}
                onChange={(e) => setFormData({ ...formData, alert_email_recipient: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:bg-slate-100 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Changes apply to next scan cycle.</span>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Settings Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
