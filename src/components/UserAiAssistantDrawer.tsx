import React, { useState } from 'react';
import { UserMedicine } from '../types/userMedicine';
import { calculateMedicineExpiryStatus } from '../services/userExpiryEngine';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, Send, X, Bot, User, Copy, Check, ShieldAlert } from 'lucide-react';

interface UserAiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  medicines: UserMedicine[];
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const UserAiAssistantDrawer: React.FC<UserAiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  medicines
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: `Hi there! I am your **Home Medicine & Safety Assistant**. I can see your ${medicines.length} cabinet medicines.

Ask me questions like:
- *"Is it safe to take expired Paracetamol?"*
- *"Why do eye drops need to be thrown away 28 days after opening?"*
- *"Which of my medicines should I throw away today?"*
- *"What medicine do I have for headache or fever?"*`,
      timestamp: 'Just now'
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const quickPrompts = [
    'Which medicines should I throw away today?',
    'Is it safe to take expired Paracetamol?',
    'What do I have for fever or headache?',
    'Why do eye drops expire 28 days after opening?'
  ];

  const handleSend = async (customText?: string) => {
    const text = (customText || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const expiredMeds = medicines.filter(m => calculateMedicineExpiryStatus(m).urgency === 'EXPIRED');
      const expiringSoon = medicines.filter(m => calculateMedicineExpiryStatus(m).urgency === 'CRITICAL' || calculateMedicineExpiryStatus(m).urgency === 'UPCOMING');

      const cabinetSummary = medicines.map(m => {
        const s = calculateMedicineExpiryStatus(m);
        return `- ${m.name} (${m.category}): Purpose "${m.purpose}". Expiry: ${m.expiryDate} (${s.daysRemaining} days left). Status: ${s.alertTitle}. Notes: ${m.dosageNotes || 'None'}`;
      }).join('\n');

      const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || 
                     (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY);

      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `You are a friendly, licensed pharmacist helping an everyday user manage their personal home medicine cabinet.
Answer the user's question clearly, warmly, and responsibly in simple language.
Remind them to never take expired medicines or opened eye drops, and consult a doctor for severe symptoms.

User's Actual Home Medicine Cabinet Data:
${cabinetSummary}

User Question:
${text}`
        });

        if (response && response.text) {
          setMessages(prev => [
            ...prev,
            {
              sender: 'assistant',
              text: response.text || '',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Gemini API call skipped, using analytical health responder:', err);
    }

    // Analytical Health Responder Fallback
    const lower = text.toLowerCase();
    let reply = '';

    if (lower.includes('throw away') || lower.includes('throw out') || lower.includes('expired')) {
      const expiredMeds = medicines.filter(m => calculateMedicineExpiryStatus(m).urgency === 'EXPIRED');
      if (expiredMeds.length > 0) {
        reply = `### 🚨 Medicines to Throw Away Immediately:\n\n${expiredMeds.map(m => {
          const s = calculateMedicineExpiryStatus(m);
          return `• **${m.name}**: ${s.alertTitle}. *(${s.alertMessage})*`;
        }).join('\n\n')}\n\n**Safety Rule:** Never consume expired medicines or eye drops opened over 4 weeks ago. Click **Disposal Rules** at the top for step-by-step instructions.`;
      } else {
        reply = 'Good news! None of your medicines are currently expired.';
      }
    } else if (lower.includes('fever') || lower.includes('headache') || lower.includes('pain')) {
      const painMeds = medicines.filter(m => m.category === 'Fever & Pain' || m.purpose.toLowerCase().includes('fever') || m.purpose.toLowerCase().includes('headache'));
      reply = `### 💊 Medicines for Fever & Pain in Your Cabinet:\n\n${painMeds.map(m => {
        const s = calculateMedicineExpiryStatus(m);
        return `• **${m.name}** (${m.quantity}): Located in *${m.location}*. Status: **${s.alertTitle}** (${m.dosageNotes || 'Take after food'}).`;
      }).join('\n')}\n\n*Always take with a full glass of water and check with your doctor if fever lasts > 3 days.*`;
    } else if (lower.includes('eye drop') || lower.includes('28 days') || lower.includes('opened')) {
      reply = `### 👁️ Why Eye Drops Expire 28 Days After Opening:\n\nEven if the expiration date printed on the bottle says next year, **once you break the sterile seal**, airborne bacteria and fungi begin entering the bottle.\n\n• After 28 to 30 days, preservatives in the drops lose their effectiveness.\n• Using contaminated eye drops can cause severe corneal ulcers and eye infections.\n\n**Always write the date opened on the bottle with a marker!**`;
    } else {
      reply = `### 🩺 Medicine Advice for Your Cabinet:\n\nBased on your cabinet inventory:\n• You have **${medicines.length} medicines** logged.\n• **Important:** Check your expired medications regularly to ensure nobody in your household accidentally takes degraded tablets or contaminated syrups.\n\nFeel free to ask me about dosage tips, storage advice, or symptom recommendations!`;
    }

    setMessages(prev => [
      ...prev,
      {
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setIsLoading(false);
  };

  const handleCopy = (t: string, idx: number) => {
    navigator.clipboard.writeText(t);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">AI Medicine Safety Assistant</h3>
            <p className="text-[11px] text-teal-300">Personal Guidance · Knows Your Home Cabinet</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              msg.sender === 'user' ? 'bg-teal-600 text-white' : 'bg-slate-900 text-teal-400'
            }`}>
              {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-xs relative group ${
              msg.sender === 'user'
                ? 'bg-teal-600 text-white rounded-tr-xs'
                : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-xs whitespace-pre-wrap'
            }`}>
              <div className="leading-relaxed">{msg.text}</div>
              <div className={`text-[10px] mt-1.5 flex items-center justify-between ${
                msg.sender === 'user' ? 'text-teal-200' : 'text-slate-400'
              }`}>
                <span>{msg.timestamp}</span>
                {msg.sender === 'assistant' && (
                  <button
                    onClick={() => handleCopy(msg.text, idx)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-slate-600"
                    title="Copy response"
                  >
                    {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic pl-9">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
            Reviewing your cabinet safety records...
          </div>
        )}
      </div>

      {/* Quick Questions */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          Common Questions
        </div>
        <div className="flex flex-wrap gap-1">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp)}
              className="text-[11px] px-2.5 py-1 bg-white hover:bg-teal-50 border border-slate-200 text-slate-700 hover:text-teal-800 rounded-lg transition-colors text-left font-medium"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about your medicine safety, expiry..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            className="flex-1 p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white disabled:bg-slate-300 transition-colors shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
