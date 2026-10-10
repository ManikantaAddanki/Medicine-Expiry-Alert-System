import { UserMedicine } from '../types/userMedicine';
import { calculateMedicineExpiryStatus } from './userExpiryEngine';
import { emailAlertService, EmailNotificationLog } from './emailAlertService';
import { sendDirectGmail, getAccessToken } from './gmailApiService';
import { soundEffects } from './soundEffects';

export interface AutoDispatchConfig {
  enabled: boolean;
  expiringThresholdDays: number; // e.g. 15 days
  alertExpired: boolean;
  alertExpiringSoon: boolean;
  checkIntervalSeconds: number; // e.g. 60 seconds
  lastAuditTimestamp: string | null;
  totalAutomatedSent: number;
}

export interface AutoDispatchResult {
  triggered: boolean;
  expiredCount: number;
  expiringSoonCount: number;
  emailsSent: number;
  recipient: string;
  summary: string;
  logs: EmailNotificationLog[];
}

const CONFIG_STORAGE_KEY = 'home_medicine_auto_email_config_v1';
const DEDUPE_STORAGE_KEY = 'home_medicine_alerted_meds_cache_v1';

class AutoEmailDispatcher {
  private config: AutoDispatchConfig = {
    enabled: true,
    expiringThresholdDays: 15,
    alertExpired: true,
    alertExpiringSoon: true,
    checkIntervalSeconds: 60,
    lastAuditTimestamp: null,
    totalAutomatedSent: 0
  };

  private listeners: (() => void)[] = [];
  private timerId: any = null;

  constructor() {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (e) {}
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => {
      try { fn(); } catch (e) {}
    });
  }

  public getConfig(): AutoDispatchConfig {
    return { ...this.config };
  }

  public updateConfig(partial: Partial<AutoDispatchConfig>) {
    this.config = { ...this.config, ...partial };
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {}
    this.notify();
  }

  private getDedupeCache(): Record<string, number> {
    try {
      const raw = localStorage.getItem(DEDUPE_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  }

  private saveDedupeCache(cache: Record<string, number>) {
    try {
      localStorage.setItem(DEDUPE_STORAGE_KEY, JSON.stringify(cache));
    } catch (e) {}
  }

  /**
   * Run automated inspection of the user's medicine cabinet
   * and automatically send emails to the user for expiring and expired medicines.
   */
  public async runAutoCheck(
    medicines: UserMedicine[],
    targetRecipient?: string,
    force = false
  ): Promise<AutoDispatchResult> {
    const now = new Date();
    const nowIso = now.toISOString();
    const recipient = (targetRecipient || emailAlertService.getSettings().recipientEmail).trim();
    const dedupeCache = this.getDedupeCache();
    const cooldownMs = 12 * 60 * 60 * 1000; // 12 hours cooldown per item unless force

    // Identify expired and expiring soon medicines
    const expiredMeds: UserMedicine[] = [];
    const expiringSoonMeds: UserMedicine[] = [];

    for (const med of medicines) {
      const status = calculateMedicineExpiryStatus(med);
      if (status.urgency === 'EXPIRED') {
        const cacheKey = `expired_${med.id}_${med.expiryDate}`;
        const lastSent = dedupeCache[cacheKey] || 0;
        if (force || now.getTime() - lastSent > cooldownMs) {
          expiredMeds.push(med);
          dedupeCache[cacheKey] = now.getTime();
        }
      } else if (
        status.daysRemaining >= 0 && 
        status.daysRemaining <= this.config.expiringThresholdDays
      ) {
        const cacheKey = `soon_${med.id}_${med.expiryDate}`;
        const lastSent = dedupeCache[cacheKey] || 0;
        if (force || now.getTime() - lastSent > cooldownMs) {
          expiringSoonMeds.push(med);
          dedupeCache[cacheKey] = now.getTime();
        }
      }
    }

    this.saveDedupeCache(dedupeCache);

    const generatedLogs: EmailNotificationLog[] = [];

    // 1. Dispatch Automated Expired Medicines Alert if any
    if (this.config.alertExpired && expiredMeds.length > 0) {
      const expiredLog = this.createAndSendExpiredAlert(expiredMeds, recipient);
      generatedLogs.push(expiredLog);
    }

    // 2. Dispatch Automated Expiring Soon Alert if any
    if (this.config.alertExpiringSoon && expiringSoonMeds.length > 0) {
      const soonLog = this.createAndSendExpiringSoonAlert(expiringSoonMeds, recipient);
      generatedLogs.push(soonLog);
    }

    const totalSent = generatedLogs.length;

    this.updateConfig({
      lastAuditTimestamp: nowIso,
      totalAutomatedSent: this.config.totalAutomatedSent + totalSent
    });

    if (totalSent > 0) {
      soundEffects.playNotificationPing();
    }

    return {
      triggered: totalSent > 0,
      expiredCount: expiredMeds.length,
      expiringSoonCount: expiringSoonMeds.length,
      emailsSent: totalSent,
      recipient,
      summary: totalSent > 0
        ? `Automated safety emails dispatched for ${expiredMeds.length} expired & ${expiringSoonMeds.length} expiring medicines.`
        : 'Safety check completed: All medicines are within safe date limits or already alerted.',
      logs: generatedLogs
    };
  }

  /**
   * Generates and dispatches an automated alert for expired medicines
   */
  private createAndSendExpiredAlert(medicines: UserMedicine[], recipient: string): EmailNotificationLog {
    const medNames = medicines.map(m => m.name);
    const count = medicines.length;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const subject = count === 1 
      ? `🚨 [AUTOMATED HEALTH ALERT] ${medicines[0].name} has Expired (Do Not Consume)`
      : `🚨 [AUTOMATED HEALTH ALERT] ${count} Expired Medicines Detected in Cabinet (Do Not Consume)`;

    const medRows = medicines.map(m => {
      const status = calculateMedicineExpiryStatus(m);
      const daysAgo = Math.abs(status.daysRemaining);
      return `
        <div style="background-color: #ffffff; padding: 16px; border-radius: 12px; border: 1px solid #fecdd3; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <p style="margin: 0; font-size: 16px; font-weight: bold; color: #111827;">${m.name}</p>
              <p style="margin: 3px 0 0 0; font-size: 13px; color: #6b7280;">Generic / Formula: ${m.brandOrGeneric} · ${m.category}</p>
            </div>
            <span style="background-color: #ffe4e6; color: #e11d48; font-weight: bold; font-size: 11px; padding: 4px 8px; border-radius: 8px;">
              EXPIRED
            </span>
          </div>
          <p style="margin: 8px 0 0 0; color: #dc2626; font-weight: bold; font-size: 14px;">
            ⚠️ Expiration Date: ${m.expiryDate} (${daysAgo} day${daysAgo === 1 ? '' : 's'} ago)
          </p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #4b5563;">
            📍 <strong>Storage Location:</strong> ${m.location} | 👤 <strong>Assigned To:</strong> ${m.assignedTo}
          </p>
          ${m.dosageNotes ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280; font-style: italic;">"${m.dosageNotes}"</p>` : ''}
        </div>
      `;
    }).join('');

    const bodyHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 2px solid #f43f5e; border-radius: 18px; background-color: #fff1f2;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h2 style="color: #9f1239; margin: 0; font-size: 20px;">🚨 AUTOMATED SAFETY ALERT: Medicine Expired</h2>
        </div>
        <p style="color: #4c0519; font-size: 14px; margin-top: 8px; line-height: 1.5;">
          This is an automated safety alert dispatched by your <strong>Home Medicine Cabinet System</strong>. An automated audit detected <strong>${count} expired medication${count > 1 ? 's' : ''}</strong> that require immediate removal.
        </p>

        <div style="margin: 16px 0;">
          ${medRows}
        </div>

        <div style="background-color: #ffe4e6; padding: 14px; border-radius: 12px; border-left: 4px solid #e11d48; margin-bottom: 16px;">
          <p style="margin: 0; font-weight: bold; color: #9f1239; font-size: 14px;">⚠️ SAFETY DIRECTIVE: DO NOT CONSUME</p>
          <p style="margin: 4px 0 0 0; color: #881337; font-size: 13px; line-height: 1.4;">
            Expired medications can lose efficacy, change chemical composition, or become toxic. In liquid syrups, eye drops, and suspensions, preservative systems degrade, inviting harmful bacterial contamination.
          </p>
        </div>

        <div style="background-color: #ffffff; padding: 14px; border-radius: 12px; border: 1px solid #fecdd3; margin-bottom: 16px;">
          <p style="margin: 0; font-weight: bold; color: #4c0519; font-size: 13px;">Safe Household Disposal Protocol:</p>
          <ol style="margin: 6px 0 0 0; padding-left: 20px; color: #4b5563; font-size: 12px; line-height: 1.5;">
            <li>Mix medicines with coffee grounds, cat litter, or dirt.</li>
            <li>Seal tightly in a zip-top plastic bag or leak-proof container.</li>
            <li>Black out personal prescription details on packaging.</li>
            <li>Discard in regular household trash (do NOT flush down sink or toilet).</li>
          </ol>
        </div>

        <p style="margin: 16px 0 0 0; font-size: 11px; color: #9ca3af; text-align: center;">
          Dispatched automatically to <strong>${recipient}</strong> · Medicine Expiry Alert System
        </p>
      </div>
    `;

    const bodyText = `🚨 AUTOMATED HEALTH ALERT: ${count} MEDICINE(S) EXPIRED

This is an automated notification from your Home Medicine Cabinet System.

EXPIRED MEDICATIONS:
${medicines.map((m, i) => `${i + 1}. ${m.name} (Expired on: ${m.expiryDate}) - Location: ${m.location}, Assigned: ${m.assignedTo}`).join('\n')}

SAFETY DIRECTIVE:
DO NOT CONSUME OR INGEST THESE MEDICATIONS.
Chemical decomposition or loss of sterility may pose health risks. Please safely dispose of them immediately according to safe household disposal protocols.

Sent to: ${recipient}
Timestamp: ${nowStr}`;

    const log: EmailNotificationLog = {
      id: `auto-expired-${Date.now()}`,
      recipientEmail: recipient,
      subject,
      medicineNames: medNames,
      sentAt: nowStr,
      status: 'DELIVERED',
      bodyText,
      bodyHtml
    };

    // Record to general email logs
    emailAlertService.recordLog(log);

    // Deliver via Gmail API if connected
    getAccessToken().then(token => {
      if (token) {
        sendDirectGmail(recipient, subject, bodyHtml).then(res => {
          if (res.success) {
            console.log('✓ Automated Expired Alert sent directly via Gmail API:', res.id);
          }
        });
      }
    });

    // Native browser push notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`🚨 Automated Alert: ${count} Medicine(s) Expired`, {
          body: `DO NOT USE: ${medNames.slice(0, 2).join(', ')} expired! Alert email sent to ${recipient}.`,
          icon: '/favicon.ico'
        });
      } catch (e) {}
    }

    return log;
  }

  /**
   * Generates and dispatches an automated alert for medicines expiring soon
   */
  private createAndSendExpiringSoonAlert(medicines: UserMedicine[], recipient: string): EmailNotificationLog {
    const medNames = medicines.map(m => m.name);
    const count = medicines.length;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const subject = count === 1
      ? `⚠️ [AUTOMATED NOTICE] ${medicines[0].name} is Expiring Soon in Your Cabinet`
      : `⚠️ [AUTOMATED NOTICE] ${count} Medicines Expiring Soon in Your Cabinet`;

    const medRows = medicines.map(m => {
      const status = calculateMedicineExpiryStatus(m);
      const daysLeft = status.daysRemaining;
      return `
        <div style="background-color: #ffffff; padding: 16px; border-radius: 12px; border: 1px solid #fed7aa; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <p style="margin: 0; font-size: 16px; font-weight: bold; color: #111827;">${m.name}</p>
              <p style="margin: 3px 0 0 0; font-size: 13px; color: #6b7280;">Generic / Formula: ${m.brandOrGeneric} · ${m.category}</p>
            </div>
            <span style="background-color: #fff7ed; color: #ea580c; font-weight: bold; font-size: 11px; padding: 4px 8px; border-radius: 8px;">
              EXPIRING SOON
            </span>
          </div>
          <p style="margin: 8px 0 0 0; color: #d97706; font-weight: bold; font-size: 14px;">
            ⏳ Expiration Date: ${m.expiryDate} (${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining)
          </p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #4b5563;">
            📍 <strong>Storage Location:</strong> ${m.location} | 👤 <strong>Assigned To:</strong> ${m.assignedTo}
          </p>
          ${m.dosageNotes ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280; font-style: italic;">"${m.dosageNotes}"</p>` : ''}
        </div>
      `;
    }).join('');

    const bodyHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 2px solid #f97316; border-radius: 18px; background-color: #fff7ed;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h2 style="color: #9a3412; margin: 0; font-size: 20px;">⚠️ AUTOMATED ADVANCE NOTICE: Medicines Expiring Soon</h2>
        </div>
        <p style="color: #7c2d12; font-size: 14px; margin-top: 8px; line-height: 1.5;">
          This is an automated safety reminder from your <strong>Home Medicine Cabinet System</strong>. The following <strong>${count} medication${count > 1 ? 's' : ''}</strong> will reach their expiration date within the next ${this.config.expiringThresholdDays} days.
        </p>

        <div style="margin: 16px 0;">
          ${medRows}
        </div>

        <div style="background-color: #ffedd5; padding: 14px; border-radius: 12px; border-left: 4px solid #ea580c; margin-bottom: 16px;">
          <p style="margin: 0; font-weight: bold; color: #9a3412; font-size: 14px;">Recommended Next Steps:</p>
          <ul style="margin: 6px 0 0 0; padding-left: 20px; color: #7c2d12; font-size: 13px; line-height: 1.4;">
            <li>If taking ongoing daily prescriptions, contact your doctor or pharmacy for a refill.</li>
            <li>Inspect the packaging for color change, precipitate, or broken seals.</li>
            <li>Prepare for timely quarantine when the expiration date arrives.</li>
          </ul>
        </div>

        <p style="margin: 16px 0 0 0; font-size: 11px; color: #9ca3af; text-align: center;">
          Dispatched automatically to <strong>${recipient}</strong> · Medicine Expiry Alert System
        </p>
      </div>
    `;

    const bodyText = `⚠️ AUTOMATED NOTICE: ${count} MEDICINE(S) EXPIRING SOON

This is an automated reminder from your Home Medicine Cabinet System.

EXPIRING MEDICATIONS:
${medicines.map((m, i) => `${i + 1}. ${m.name} (Expires: ${m.expiryDate}) - Location: ${m.location}, Assigned: ${m.assignedTo}`).join('\n')}

ACTION ADVICE:
Review remaining doses and order a pharmacy refill if this is a chronic prescription. Verify packaging condition.

Sent to: ${recipient}
Timestamp: ${nowStr}`;

    const log: EmailNotificationLog = {
      id: `auto-soon-${Date.now()}`,
      recipientEmail: recipient,
      subject,
      medicineNames: medNames,
      sentAt: nowStr,
      status: 'DELIVERED',
      bodyText,
      bodyHtml
    };

    emailAlertService.recordLog(log);

    // Deliver via Gmail API if connected
    getAccessToken().then(token => {
      if (token) {
        sendDirectGmail(recipient, subject, bodyHtml).then(res => {
          if (res.success) {
            console.log('✓ Automated Expiring Soon Notice sent directly via Gmail API:', res.id);
          }
        });
      }
    });

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`⚠️ Notice: ${count} Medicine(s) Expiring Soon`, {
          body: `${medNames.slice(0, 2).join(', ')} expire soon! Reminder sent to ${recipient}.`,
          icon: '/favicon.ico'
        });
      } catch (e) {}
    }

    return log;
  }
}

export const autoEmailDispatcher = new AutoEmailDispatcher();
