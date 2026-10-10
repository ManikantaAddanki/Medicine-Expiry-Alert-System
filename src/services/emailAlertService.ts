import { UserMedicine } from '../types/userMedicine';
import { getAccessToken, sendDirectGmail } from './gmailApiService';

export interface EmailNotificationLog {
  id: string;
  recipientEmail: string;
  subject: string;
  medicineNames: string[];
  sentAt: string;
  status: 'DELIVERED' | 'SENT';
  bodyText: string;
  bodyHtml: string;
}

export interface EmailSettings {
  recipientEmail: string;
  instantAlertsOnExpiry: boolean;
  upcomingAlerts7Days: boolean;
  dailyDigest: boolean;
  browserPushEnabled: boolean;
}

const DEFAULT_USER_EMAIL = 'addankimanikantapramod29@gmail.com';

class EmailAlertService {
  private settings: EmailSettings = {
    recipientEmail: DEFAULT_USER_EMAIL,
    instantAlertsOnExpiry: true,
    upcomingAlerts7Days: true,
    dailyDigest: false,
    browserPushEnabled: true
  };

  private sentLogs: EmailNotificationLog[] = [
    {
      id: 'email-101',
      recipientEmail: DEFAULT_USER_EMAIL,
      subject: '🚨 URGENT HEALTH ALERT: Benadryl Cough Syrup Expired (Do Not Consume)',
      medicineNames: ['Benadryl Dry Cough Formula Syrup'],
      sentAt: '2026-10-09 18:30:00',
      status: 'DELIVERED',
      bodyText: 'Your medicine Benadryl Dry Cough Formula Syrup expired on 2026-10-02. Do not consume this medication.',
      bodyHtml: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fda4af; border-radius: 16px; background-color: #fff1f2;">
          <h2 style="color: #9f1239; margin-top: 0;">🚨 URGENT HEALTH ALERT: Medicine Expired</h2>
          <p style="color: #4c0519; font-size: 15px;">This is an automated safety alert from your <strong>Home Medicine Cabinet</strong>.</p>
          <div style="background-color: #ffffff; padding: 16px; border-radius: 12px; border: 1px solid #fecdd3; margin: 16px 0;">
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #111827;">Benadryl Dry Cough Formula Syrup</p>
            <p style="margin: 4px 0; color: #dc2626; font-weight: bold;">Expired on: 2026-10-02 (8 days ago)</p>
            <p style="margin: 4px 0; color: #4b5563;">Location: Kitchen / Fridge · Assigned to: Kids</p>
          </div>
          <p style="color: #9f1239; font-weight: bold;">⚠️ SAFETY DIRECTIVE: DO NOT CONSUME</p>
          <p style="color: #4b5563; font-size: 14px;">Expired liquid syrups lose potency and risk harmful bacterial colonization. Please dispose of this medicine safely.</p>
        </div>
      `
    }
  ];

  private listeners: (() => void)[] = [];

  constructor() {
    try {
      const saved = localStorage.getItem('medicine_email_settings');
      if (saved) {
        this.settings = JSON.parse(saved);
      }
      const savedLogs = localStorage.getItem('medicine_email_logs');
      if (savedLogs) {
        this.sentLogs = JSON.parse(savedLogs);
      }
    } catch (e) {
      // Ignore storage errors
    }
  }

  subscribe(listener: () => void): () => void {
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

  getSettings(): EmailSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<EmailSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem('medicine_email_settings', JSON.stringify(this.settings));
    } catch (e) {}
    this.notify();
  }

  getLogs(): EmailNotificationLog[] {
    return [...this.sentLogs];
  }

  // Trigger browser push notification if permitted
  requestBrowserPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission();
    }
  }

  // Dispatches an email alert & logs it
  dispatchExpiryEmail(medicine: UserMedicine, targetRecipient?: string): EmailNotificationLog {
    const recipient = (targetRecipient || this.settings.recipientEmail).trim();
    if (targetRecipient && targetRecipient.trim() !== this.settings.recipientEmail) {
      this.updateSettings({ recipientEmail: targetRecipient.trim() });
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const subject = `🚨 URGENT HEALTH ALERT: ${medicine.name} Expired in your Cabinet (Do Not Consume)`;

    const bodyHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 2px solid #f43f5e; border-radius: 16px; background-color: #fff1f2;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h2 style="color: #9f1239; margin: 0; font-size: 20px;">🚨 URGENT HEALTH ALERT: Medicine Expired</h2>
        </div>
        <p style="color: #4c0519; font-size: 14px; margin-top: 8px;">
          An automated safety inspection detected an expired medication in your home medicine cabinet.
        </p>

        <div style="background-color: #ffffff; padding: 18px; border-radius: 14px; border: 1px solid #fecdd3; margin: 16px 0;">
          <p style="margin: 0; font-size: 17px; font-weight: bold; color: #111827;">${medicine.name}</p>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">Generic: ${medicine.brandOrGeneric}</p>
          <p style="margin: 8px 0 0 0; color: #e11d48; font-weight: bold; font-size: 15px;">
            ⚠️ Expired on: ${medicine.expiryDate}
          </p>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #374151;">
            <strong>Room Storage:</strong> ${medicine.location} | <strong>Assigned to:</strong> ${medicine.assignedTo}
          </p>
          ${medicine.dosageNotes ? `<p style="margin: 6px 0 0 0; font-size: 12px; color: #6b7280; font-style: italic;">"${medicine.dosageNotes}"</p>` : ''}
        </div>

        <div style="background-color: #ffe4e6; padding: 14px; border-radius: 12px; border-left: 4px solid #e11d48; margin-bottom: 16px;">
          <p style="margin: 0; font-weight: bold; color: #9f1239; font-size: 14px;">DO NOT CONSUME THIS MEDICATION</p>
          <p style="margin: 4px 0 0 0; color: #881337; font-size: 13px;">
            Expired pharmaceuticals break down chemically into sub-potent or toxic byproducts. Please safely dispose of this medication immediately.
          </p>
        </div>

        <div style="border-top: 1px solid #fecdd3; padding-top: 14px;">
          <p style="margin: 0; font-weight: bold; color: #4c0519; font-size: 13px;">Safe Household Disposal Steps:</p>
          <ol style="margin: 6px 0 0 0; padding-left: 20px; color: #4b5563; font-size: 12px; line-height: 1.5;">
            <li>Mix with unpalatable substance (coffee grounds or cat litter).</li>
            <li>Seal in a leak-proof plastic container or bag.</li>
            <li>Scratch out your personal name and prescription labels.</li>
            <li>Throw into household outdoor garbage (do NOT flush down sink or toilet).</li>
          </ol>
        </div>

        <p style="margin: 16px 0 0 0; font-size: 11px; color: #9ca3af; text-align: center;">
          Sent to <strong>${recipient}</strong> by Medicine Expiry Alert System.
        </p>
      </div>
    `;

    const log: EmailNotificationLog = {
      id: `email-${Date.now()}`,
      recipientEmail: recipient,
      subject,
      medicineNames: [medicine.name],
      sentAt: nowStr,
      status: 'DELIVERED',
      bodyText: `URGENT ALERT: Your medicine "${medicine.name}" has expired (${medicine.expiryDate}). Do not consume this medication. Check your Home Medicine Cabinet for safe disposal.`,
      bodyHtml
    };

    this.sentLogs = [log, ...this.sentLogs];
    try {
      localStorage.setItem('medicine_email_logs', JSON.stringify(this.sentLogs));
    } catch (e) {}
    this.notify();

    // Deliver directly to Gmail inbox via Google Workspace API if authenticated
    getAccessToken().then(token => {
      if (token) {
        sendDirectGmail(recipient, subject, bodyHtml).then(res => {
          if (res.success) {
            console.log('✓ Email delivered directly to inbox via Gmail API:', res.id);
          } else {
            console.warn('Gmail API delivery attempt:', res.error);
          }
        }).catch(err => {
          console.warn('Gmail API error:', err);
        });
      }
    });

    // Show native browser desktop notification if allowed
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`🚨 Expired: ${medicine.name}`, {
          body: `DO NOT USE: ${medicine.name} has expired! An alert email was generated for ${recipient}.`,
          icon: '/favicon.ico'
        });
      } catch (err) {}
    }

    return log;
  }

  // Dispatches grouped email alert for multiple expired medicines
  dispatchMultipleExpiryEmail(medicines: UserMedicine[], targetRecipient?: string): EmailNotificationLog {
    if (medicines.length === 0) {
      throw new Error('No medicines provided');
    }
    if (medicines.length === 1) {
      return this.dispatchExpiryEmail(medicines[0], targetRecipient);
    }

    const recipient = (targetRecipient || this.settings.recipientEmail).trim();
    if (targetRecipient && targetRecipient.trim() !== this.settings.recipientEmail) {
      this.updateSettings({ recipientEmail: targetRecipient.trim() });
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const medNames = medicines.map(m => m.name);
    const subject = `🚨 URGENT HEALTH ALERT: ${medicines.length} Medicines Expired in your Cabinet (Do Not Consume)`;

    const medicineRows = medicines.map(m => `
      <div style="background-color: #ffffff; padding: 14px; border-radius: 12px; border: 1px solid #fecdd3; margin-bottom: 10px;">
        <p style="margin: 0; font-size: 15px; font-weight: bold; color: #111827;">${m.name}</p>
        <p style="margin: 2px 0 0 0; font-size: 12px; color: #6b7280;">Generic: ${m.brandOrGeneric} · Category: ${m.category}</p>
        <p style="margin: 6px 0 0 0; color: #e11d48; font-weight: bold; font-size: 13px;">
          ⚠️ Expired on: ${m.expiryDate}
        </p>
        <p style="margin: 2px 0 0 0; font-size: 12px; color: #374151;">
          <strong>Stored in:</strong> ${m.location} | <strong>Belongs to:</strong> ${m.assignedTo}
        </p>
      </div>
    `).join('');

    const bodyHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 2px solid #f43f5e; border-radius: 16px; background-color: #fff1f2;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h2 style="color: #9f1239; margin: 0; font-size: 20px;">🚨 URGENT HEALTH ALERT: ${medicines.length} Medicines Expired</h2>
        </div>
        <p style="color: #4c0519; font-size: 14px; margin-top: 8px;">
          Our scheduled safety check detected <strong>${medicines.length} expired medications</strong> in your home medicine cabinet.
        </p>

        <div style="margin: 16px 0;">
          ${medicineRows}
        </div>

        <div style="background-color: #ffe4e6; padding: 14px; border-radius: 12px; border-left: 4px solid #e11d48; margin-bottom: 16px;">
          <p style="margin: 0; font-weight: bold; color: #9f1239; font-size: 14px;">CRITICAL SAFETY DIRECTIVE: DO NOT CONSUME</p>
          <p style="margin: 4px 0 0 0; color: #881337; font-size: 13px;">
            Expired pharmaceuticals break down chemically into sub-potent or toxic byproducts. Please immediately quarantine these medicines to protect yourself and your family.
          </p>
        </div>

        <div style="border-top: 1px solid #fecdd3; padding-top: 14px;">
          <p style="margin: 0; font-weight: bold; color: #4c0519; font-size: 13px;">Safe Disposal Protocol:</p>
          <ol style="margin: 6px 0 0 0; padding-left: 20px; color: #4b5563; font-size: 12px; line-height: 1.5;">
            <li>Mix medicines with coffee grounds, sawdust, or cat litter.</li>
            <li>Place inside an airtight, puncture-resistant plastic bag.</li>
            <li>Scratch off personal and family identification labels.</li>
            <li>Discard in municipal household waste (do NOT flush down sink or toilet).</li>
          </ol>
        </div>

        <p style="margin: 16px 0 0 0; font-size: 11px; color: #9ca3af; text-align: center;">
          Sent to <strong>${recipient}</strong> by Medicine Expiry Alert System.
        </p>
      </div>
    `;

    const log: EmailNotificationLog = {
      id: `email-${Date.now()}`,
      recipientEmail: recipient,
      subject,
      medicineNames: medNames,
      sentAt: nowStr,
      status: 'DELIVERED',
      bodyText: `URGENT ALERT: You have ${medicines.length} expired medicines (${medNames.slice(0, 3).join(', ')}). Do not consume them! Check your Cabinet for safe disposal.`,
      bodyHtml
    };

    this.sentLogs = [log, ...this.sentLogs];
    try {
      localStorage.setItem('medicine_email_logs', JSON.stringify(this.sentLogs));
    } catch (e) {}
    this.notify();

    // Deliver directly to Gmail inbox via Google Workspace API if authenticated
    getAccessToken().then(token => {
      if (token) {
        sendDirectGmail(recipient, subject, bodyHtml).then(res => {
          if (res.success) {
            console.log('✓ Batch email delivered directly to inbox via Gmail API:', res.id);
          } else {
            console.warn('Gmail API batch delivery attempt:', res.error);
          }
        }).catch(err => {
          console.warn('Gmail API error:', err);
        });
      }
    });

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`🚨 ${medicines.length} Expired Medicines Detected`, {
          body: `DO NOT USE: ${medNames.slice(0, 2).join(', ')} are expired! Safety email generated for ${recipient}.`,
          icon: '/favicon.ico'
        });
      } catch (err) {}
    }

    return log;
  }

  // Get last email sent for a specific medicine name
  getLastLogForMedicine(medicineName: string): EmailNotificationLog | undefined {
    return this.sentLogs.find(l => 
      l.medicineNames.some(n => n.toLowerCase().includes(medicineName.toLowerCase()) || medicineName.toLowerCase().includes(n.toLowerCase()))
    );
  }

  // Generate plain-text formatted email body for real email clients
  getPlainTextAlert(medicine: UserMedicine, recipient?: string): string {
    const targetEmail = (recipient || this.settings.recipientEmail).trim();
    return `🚨 URGENT HEALTH ALERT: MEDICINE EXPIRED (DO NOT CONSUME)

An automated safety inspection detected an expired medication in your home medicine cabinet.

MEDICATION DETAILS:
• Medicine: ${medicine.name}
• Generic / Brand: ${medicine.brandOrGeneric}
• Category: ${medicine.category}
• Expiration Date: ${medicine.expiryDate} (EXPIRED)
• Stored In: ${medicine.location}
• Assigned Family Member: ${medicine.assignedTo}
${medicine.dosageNotes ? `• Dosage Notes: ${medicine.dosageNotes}\n` : ''}

⚠️ CRITICAL SAFETY DIRECTIVE:
DO NOT CONSUME OR INGEST THIS MEDICATION.
Expired pharmaceuticals lose active potency and break down chemically into sub-potent or toxic byproducts. Opened liquid syrups and eye drops risk harmful bacterial colonization.

SAFE HOUSEHOLD DISPOSAL PROTOCOL (FDA / WHO Guidelines):
1. Mix whole or crushed medicine with an unpalatable substance (coffee grounds, dirt, or cat litter).
2. Seal inside a leak-proof container or zip-top plastic bag.
3. Black out or scratch off personal identifying details on any prescription labels.
4. Place in your regular outdoor household trash. DO NOT flush down household sinks or toilets.

Alert Recipient: ${targetEmail}
Generated by: Medicine Expiry Alert System
Timestamp: ${new Date().toISOString()}`;
  }

  // Generate Web Gmail compose URL directly targeting the user's inbox
  getGmailComposeUrl(medicine: UserMedicine, recipient?: string): string {
    const targetEmail = (recipient || this.settings.recipientEmail).trim();
    const subject = `🚨 URGENT HEALTH ALERT: ${medicine.name} Expired in your Cabinet (Do Not Consume)`;
    const body = this.getPlainTextAlert(medicine, targetEmail);
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  // Generate standard mailto URI for desktop/mobile email clients
  getMailtoUrl(medicine: UserMedicine, recipient?: string): string {
    const targetEmail = (recipient || this.settings.recipientEmail).trim();
    const subject = `🚨 URGENT HEALTH ALERT: ${medicine.name} Expired (Do Not Consume)`;
    const body = this.getPlainTextAlert(medicine, targetEmail);
    return `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  // Generate multi-medicine batch plain-text alert
  getBatchPlainTextAlert(medicines: UserMedicine[], recipient?: string): string {
    const targetEmail = (recipient || this.settings.recipientEmail).trim();
    const itemsList = medicines.map((m, idx) => `
[${idx + 1}] ${m.name}
• Generic / Category: ${m.brandOrGeneric} · ${m.category}
• Expiry Date: ${m.expiryDate} (EXPIRED)
• Location: ${m.location} | Belongs to: ${m.assignedTo}
`).join('');

    return `🚨 URGENT HEALTH ALERT: ${medicines.length} MEDICINES EXPIRED IN CABINET

Our safety inspection detected ${medicines.length} expired medications in your home medicine cabinet.

EXPIRED MEDICINES LIST:
${itemsList}

⚠️ CRITICAL SAFETY DIRECTIVE:
DO NOT CONSUME OR INGEST THESE MEDICATIONS.
Expired pharmaceuticals lose chemical efficacy and can cause serious health hazards. Please immediately quarantine these items.

SAFE HOUSEHOLD DISPOSAL INSTRUCTIONS:
1. Mix medicine with coffee grounds or cat litter.
2. Seal in a sturdy plastic bag.
3. Throw into outdoor household trash.

Alert Recipient: ${targetEmail}
Generated by: Medicine Expiry Alert System`;
  }

  // Generate Web Gmail compose URL for multiple expired items
  getBatchGmailComposeUrl(medicines: UserMedicine[], recipient?: string): string {
    const targetEmail = (recipient || this.settings.recipientEmail).trim();
    const subject = `🚨 URGENT HEALTH ALERT: ${medicines.length} Medicines Expired in Cabinet (Do Not Consume)`;
    const body = this.getBatchPlainTextAlert(medicines, targetEmail);
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  // Generate standard mailto URI for multiple expired items
  getBatchMailtoUrl(medicines: UserMedicine[], recipient?: string): string {
    const targetEmail = (recipient || this.settings.recipientEmail).trim();
    const subject = `🚨 URGENT HEALTH ALERT: ${medicines.length} Medicines Expired`;
    const body = this.getBatchPlainTextAlert(medicines, targetEmail);
    return `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  // Direct Execution: Generates real email to the entered address and immediately triggers composer
  generateAndOpenEmail(medicine: UserMedicine, customRecipient?: string): { 
    gmailUrl: string; 
    mailtoUrl: string; 
    recipient: string;
    subject: string;
    bodyText: string;
  } {
    const recipient = (customRecipient || this.settings.recipientEmail).trim();
    if (customRecipient && customRecipient.trim() !== this.settings.recipientEmail) {
      this.updateSettings({ recipientEmail: recipient });
    }

    const gmailUrl = this.getGmailComposeUrl(medicine, recipient);
    const mailtoUrl = this.getMailtoUrl(medicine, recipient);
    const subject = `🚨 URGENT HEALTH ALERT: ${medicine.name} Expired in your Cabinet (Do Not Consume)`;
    const bodyText = this.getPlainTextAlert(medicine, recipient);

    // Record internal log
    this.dispatchExpiryEmail(medicine, recipient);

    // Immediately launch Gmail composer in new window/tab
    if (typeof window !== 'undefined') {
      try {
        const opened = window.open(gmailUrl, '_blank');
        if (!opened || opened.closed || typeof opened.closed === 'undefined') {
          // If popup blocked, window.open returns null; can trigger mailto
          window.location.href = mailtoUrl;
        }
      } catch (err) {
        window.location.href = mailtoUrl;
      }
    }

    return { gmailUrl, mailtoUrl, recipient, subject, bodyText };
  }

  // Direct Execution: Generates batch email to the entered address and immediately triggers composer
  generateAndOpenBatchEmail(medicines: UserMedicine[], customRecipient?: string): {
    gmailUrl: string;
    mailtoUrl: string;
    recipient: string;
    subject: string;
    bodyText: string;
  } {
    const recipient = (customRecipient || this.settings.recipientEmail).trim();
    if (customRecipient && customRecipient.trim() !== this.settings.recipientEmail) {
      this.updateSettings({ recipientEmail: recipient });
    }

    const gmailUrl = this.getBatchGmailComposeUrl(medicines, recipient);
    const mailtoUrl = this.getBatchMailtoUrl(medicines, recipient);
    const subject = `🚨 URGENT HEALTH ALERT: ${medicines.length} Medicines Expired in Cabinet (Do Not Consume)`;
    const bodyText = this.getBatchPlainTextAlert(medicines, recipient);

    // Record internal log
    this.dispatchMultipleExpiryEmail(medicines, recipient);

    if (typeof window !== 'undefined') {
      try {
        const opened = window.open(gmailUrl, '_blank');
        if (!opened || opened.closed || typeof opened.closed === 'undefined') {
          window.location.href = mailtoUrl;
        }
      } catch (err) {
        window.location.href = mailtoUrl;
      }
    }

    return { gmailUrl, mailtoUrl, recipient, subject, bodyText };
  }
}

export const emailAlertService = new EmailAlertService();
