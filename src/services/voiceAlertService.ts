// Web Speech Synthesis API - Real Spoken Voice Alerts

class VoiceAlertService {
  public enabled: boolean = true;
  private synth: SpeechSynthesis | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  // Speak single expired medicine warning
  speakExpiredAlert(medicineName: string = 'this medicine') {
    if (!this.enabled || !this.synth) return;

    this.stop();

    const text = `Warning! Your medicine, ${medicineName}, is expired. Do not use this medicine!`;
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = 0.95; // Slightly measured, authoritative clinical pace
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    // Pick a natural English voice if available
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.synth.speak(utterance);
  }

  // Speak summary when multiple medicines are expired
  speakMultipleExpiredAlert(medicineNames: string[]) {
    if (!this.enabled || !this.synth) return;

    this.stop();

    let text = '';
    if (medicineNames.length === 1) {
      text = `Attention! Your medicine, ${medicineNames[0]}, has expired! Do not use this medicine.`;
    } else {
      const list = medicineNames.slice(0, 3).join(', ');
      text = `Attention! You have ${medicineNames.length} expired medicines in your cabinet, including ${list}. They are expired! Do not use these medicines. Please dispose of them safely.`;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.synth.speak(utterance);
  }

  // Speak urgent refill reminder
  speakExpiringSoonAlert(medicineName: string, daysLeft: number) {
    if (!this.enabled || !this.synth) return;

    this.stop();

    const text = `Notice: Your medicine, ${medicineName}, will expire in ${daysLeft} days. Please purchase a replacement soon.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.volume = 0.9;

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
  }

  isSpeaking(): boolean {
    return Boolean(this.synth && this.synth.speaking);
  }
}

export const voiceAlertService = new VoiceAlertService();
