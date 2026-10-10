import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Sparkles, 
  HeartPulse, 
  Camera, 
  ShieldCheck, 
  Clock, 
  Volume2, 
  VolumeX,
  AlertOctagon,
  Megaphone,
  Mail,
  User as UserIcon,
  LogIn,
  UserPlus,
  LogOut,
  ChevronDown,
  Cloud,
  CheckCircle2
} from 'lucide-react';
import { voiceAlertService } from '../services/voiceAlertService';
import { soundEffects } from '../services/soundEffects';
import { emailAlertService } from '../services/emailAlertService';
import { googleSignIn, logout, initAuth } from '../services/gmailApiService';
import { User } from 'firebase/auth';
import { AppUserProfile } from '../services/authService';

interface UserHeaderProps {
  totalCount: number;
  expiredCount: number;
  expiringSoonCount: number;
  safeCount: number;
  soundEnabled: boolean;
  currentUser: AppUserProfile | null;
  onToggleSound: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onLogout: () => void;
  onOpenAddModal: () => void;
  onOpenPhotoUpload: () => void;
  onOpenScannerModal: () => void;
  onOpenInteractionChecker: () => void;
  onOpenTimeTravel: () => void;
  onOpenEmergencyMode: () => void;
  onOpenEmailModal: () => void;
  onOpenAiAssistant: () => void;
  onOpenDisposalGuide: () => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({
  totalCount,
  expiredCount,
  expiringSoonCount,
  safeCount,
  soundEnabled,
  currentUser,
  onToggleSound,
  onOpenLogin,
  onOpenRegister,
  onLogout,
  onOpenAddModal,
  onOpenPhotoUpload,
  onOpenScannerModal,
  onOpenInteractionChecker,
  onOpenTimeTravel,
  onOpenEmergencyMode,
  onOpenEmailModal,
  onOpenAiAssistant,
  onOpenDisposalGuide
}) => {
  const [currentEmail, setCurrentEmail] = useState(() => emailAlertService.getSettings().recipientEmail);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubEmail = emailAlertService.subscribe(() => {
      setCurrentEmail(emailAlertService.getSettings().recipientEmail);
    });
    return () => {
      unsubEmail();
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGoogleConnect = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res?.user?.email) {
        emailAlertService.updateSettings({ recipientEmail: res.user.email });
        soundEffects.playSuccessChime();
      }
    } catch (e) {
      console.error('Google Sign-in failed', e);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleTestVoiceAlert = () => {
    soundEffects.playWarningTone();
    voiceAlertService.speakExpiredAlert('Paracetamol 650');
  };

  // User initials for avatar
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-8 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        {/* Top Row: Brand & Account Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-100 shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Medicine Expiry Alert</h1>
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                  Safety System Active 🔊 📧
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Personal & family safety engine: spoken voice warnings & automated email alerts to your inbox
              </p>
            </div>
          </div>

          {/* Right Side: Authentication Status & Actions */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {currentUser ? (
              /* Signed-in User Dropdown */
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-2xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100/70 text-slate-800 transition-all cursor-pointer shadow-2xs"
                  aria-expanded={isUserMenuOpen}
                >
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="" className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      getInitials(currentUser.displayName)
                    )}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-bold text-slate-900 leading-tight max-w-[130px] truncate">
                      {currentUser.displayName || 'Member'}
                    </p>
                    <p className="text-[10px] text-teal-700 font-medium leading-tight max-w-[130px] truncate">
                      {currentUser.isDemo ? 'Demo Account' : currentUser.email || 'Cloud Synced'}
                    </p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2.5 border-b border-slate-100 mb-1">
                      <p className="text-xs font-bold text-slate-900">{currentUser.displayName || 'Member'}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email || 'Cabinet Account'}</p>
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg font-medium border border-emerald-200">
                        <Cloud className="w-3 h-3 text-emerald-600" />
                        <span>Cloud Medicine Sync Active</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenEmailModal();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-left"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>Configure Alert Email</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-left mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Not Signed-in: Login and Register buttons */
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenLogin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors cursor-pointer shadow-2xs"
                  title="Sign in to your personal medicine cabinet"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-600" />
                  <span>Log In</span>
                </button>
                <button
                  onClick={onOpenRegister}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-2xs transition-all hover:scale-101 cursor-pointer"
                  title="Create an account to securely save and sync your medicines"
                >
                  <UserPlus className="w-3.5 h-3.5 text-teal-200" />
                  <span>Register</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: Quick Action Toolbar */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Google Sign in / Gmail Connected Status */}
            <button
              onClick={handleGoogleConnect}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              title="Connect Gmail to automatically send alert emails directly to your inbox"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Gmail Link</span>
            </button>

            {/* Email Alerts Button */}
            <button
              onClick={onOpenEmailModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 transition-colors shadow-2xs"
              title={`Configure or test alert emails (Active destination: ${currentEmail})`}
            >
              <Mail className="w-3.5 h-3.5 text-teal-700" />
              <span>Inbox:</span>
              <span className="font-mono text-[11px] text-teal-800 underline max-w-[140px] truncate">{currentEmail}</span>
            </button>

            {/* Test Voice Alert Button */}
            <button
              onClick={handleTestVoiceAlert}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors shadow-2xs"
              title="Hear demo voice alert: 'Warning! Your medicine is expired. Do not use!'"
            >
              <Megaphone className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
              <span>Voice 🔊</span>
            </button>

            {/* Sound Chimes Toggle */}
            <button
              onClick={onToggleSound}
              className={`p-1.5 rounded-xl border text-xs transition-colors ${
                soundEnabled 
                  ? 'bg-slate-50 border-slate-200 text-teal-700 hover:bg-slate-100' 
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
              title={soundEnabled ? 'Chime sound effects enabled' : 'Sound effects muted'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* AI Optical Camera Scanner */}
            <button
              onClick={onOpenScannerModal}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
              title="Scan medicine packaging or barcode with camera"
            >
              <Camera className="w-3.5 h-3.5 text-teal-300" />
              <span>Barcode/Cam</span>
            </button>

            {/* Drug Interaction Checker */}
            <button
              onClick={onOpenInteractionChecker}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
              title="Check if taking 2 medicines together is safe"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
              <span>Clashes</span>
            </button>

            {/* Time Travel Forecast */}
            <button
              onClick={onOpenTimeTravel}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 transition-colors"
              title="Simulate what will expire in 30, 60, or 90 days"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Radar</span>
            </button>

            {/* Emergency First-Aid Mode */}
            <button
              onClick={onOpenEmergencyMode}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 transition-colors"
              title="Rapid room locator for fever, allergic reaction, or burns"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
              <span>Emergency</span>
            </button>

            {/* AI Assistant */}
            <button
              onClick={onOpenAiAssistant}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Ask AI</span>
            </button>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Upload Medicine Photo & Auto-Scan Primary Action */}
            <button
              onClick={onOpenPhotoUpload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-800 text-white shadow-md shadow-teal-600/25 transition-all hover:scale-102 cursor-pointer"
              title="Upload photo of medicine packaging to auto-scan expiry date, name, and details"
            >
              <Camera className="w-3.5 h-3.5 text-teal-200" />
              <span>Upload Photo & Scan</span>
              <span className="text-[9px] bg-white/20 text-white font-extrabold px-1 py-0.5 rounded-md">
                AI
              </span>
            </button>

            {/* Manual Add Medicine Action */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-all hover:scale-102"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
