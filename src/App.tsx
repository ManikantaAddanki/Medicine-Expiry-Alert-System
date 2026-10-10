import React, { useState, useEffect, useMemo } from 'react';
import { UserMedicine } from './types/userMedicine';
import { INITIAL_USER_MEDICINES } from './data/userInitialMedicines';
import { calculateMedicineExpiryStatus, USER_CURRENT_DATE } from './services/userExpiryEngine';
import { soundEffects } from './services/soundEffects';
import { voiceAlertService } from './services/voiceAlertService';
import { emailAlertService } from './services/emailAlertService';

// Components
import { UserHeader } from './components/UserHeader';
import { UserAlertBanner } from './components/UserAlertBanner';
import { CabinetHealthScoreCard } from './components/CabinetHealthScoreCard';
import { IntakeScheduleBar } from './components/IntakeScheduleBar';
import { CabinetFilterBar, StatusFilterOption } from './components/CabinetFilterBar';
import { UserMedicineCard } from './components/UserMedicineCard';
import { AddMedicineModal } from './components/AddMedicineModal';
import { SafeDisposalModal } from './components/SafeDisposalModal';
import { UserAiAssistantDrawer } from './components/UserAiAssistantDrawer';
import { SmartScannerModal } from './components/SmartScannerModal';
import { DrugInteractionCheckerModal } from './components/DrugInteractionCheckerModal';
import { TimeTravelSimulator } from './components/TimeTravelSimulator';
import { EmergencyMedicalCard } from './components/EmergencyMedicalCard';
import { EmailAlertSettingsModal } from './components/EmailAlertSettingsModal';
import { ExpiredMedicineAlertModal } from './components/ExpiredMedicineAlertModal';
import { UploadMedicinePhotoModal } from './components/UploadMedicinePhotoModal';

import { 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Camera, 
  ShieldCheck, 
  Clock, 
  HeartPulse,
  Volume2,
  Mail
} from 'lucide-react';

const STORAGE_KEY = 'home_medicine_cabinet_v5';

export default function App() {
  // Load from localStorage or use initial default dataset
  const [medicines, setMedicines] = useState<UserMedicine[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read from localStorage, using defaults');
    }
    return INITIAL_USER_MEDICINES;
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(medicines));
    } catch (e) {
      console.warn('Could not write to localStorage');
    }
  }, [medicines]);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('ALL');
  const [familyFilter, setFamilyFilter] = useState('All Members');
  const [locationFilter, setLocationFilter] = useState('All Locations');

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<UserMedicine | null>(null);
  const [isDisposalModalOpen, setIsDisposalModalOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isPhotoUploadModalOpen, setIsPhotoUploadModalOpen] = useState(false);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  const [isTimeTravelModalOpen, setIsTimeTravelModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isExpiredAlertModalOpen, setIsExpiredAlertModalOpen] = useState(false);
  const [selectedExpiredMedicine, setSelectedExpiredMedicine] = useState<UserMedicine | null>(null);

  // Sound toggle & toast
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEffects.enabled = next;
    voiceAlertService.enabled = next;
    showToast(next ? 'Voice alerts and sound effects enabled' : 'Voice alerts and sounds muted');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Status counts
  const counts = useMemo(() => {
    let expired = 0;
    let soon = 0;
    let safe = 0;

    medicines.forEach(m => {
      const s = calculateMedicineExpiryStatus(m);
      if (s.urgency === 'EXPIRED') expired++;
      else if (s.urgency === 'CRITICAL' || s.urgency === 'UPCOMING') soon++;
      else safe++;
    });

    return { all: medicines.length, expired, soon, safe };
  }, [medicines]);

  // Automated proactive detection on initial load: warn user immediately if cabinet holds expired medicine
  useEffect(() => {
    const hasAlerted = sessionStorage.getItem('medicine_cabinet_initial_alert_shown');
    const expiredList = medicines.filter(m => calculateMedicineExpiryStatus(m).urgency === 'EXPIRED');

    if (!hasAlerted && expiredList.length > 0) {
      sessionStorage.setItem('medicine_cabinet_initial_alert_shown', 'true');
      try {
        emailAlertService.dispatchMultipleExpiryEmail(expiredList);
      } catch (e) {}

      const timer = setTimeout(() => {
        soundEffects.playWarningTone();
        voiceAlertService.speakMultipleExpiredAlert(expiredList.map(m => m.name));
        setSelectedExpiredMedicine(expiredList[0]);
        setIsExpiredAlertModalOpen(true);
        const recipient = emailAlertService.getSettings().recipientEmail;
        showToast(`🚨 ATTENTION: ${expiredList.length} expired medicine(s) detected! Safety email alert dispatched to ${recipient}.`);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  // Filtered List
  const filteredMedicines = useMemo(() => {
    return medicines.filter(m => {
      const status = calculateMedicineExpiryStatus(m);

      const q = searchTerm.toLowerCase();
      const matchesSearch = 
        m.name.toLowerCase().includes(q) ||
        m.brandOrGeneric.toLowerCase().includes(q) ||
        m.purpose.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q);

      let matchesStatus = true;
      if (statusFilter === 'EXPIRED') matchesStatus = status.urgency === 'EXPIRED';
      else if (statusFilter === 'SOON') matchesStatus = status.urgency === 'CRITICAL' || status.urgency === 'UPCOMING';
      else if (statusFilter === 'SAFE') matchesStatus = status.urgency === 'WARNING' || status.urgency === 'SAFE';

      const matchesFamily = familyFilter === 'All Members' || m.assignedTo === familyFilter;
      const matchesLocation = locationFilter === 'All Locations' || m.location === locationFilter;

      return matchesSearch && matchesStatus && matchesFamily && matchesLocation;
    });
  }, [medicines, searchTerm, statusFilter, familyFilter, locationFilter]);

  // Open full expiry alert message
  const handleOpenAlertMessage = (med?: UserMedicine) => {
    soundEffects.playWarningTone();
    setSelectedExpiredMedicine(med || null);
    setIsExpiredAlertModalOpen(true);
    if (med) {
      voiceAlertService.speakExpiredAlert(med.name);
    } else {
      const expiredList = medicines.filter(m => calculateMedicineExpiryStatus(m).urgency === 'EXPIRED');
      if (expiredList.length > 0) {
        voiceAlertService.speakMultipleExpiredAlert(expiredList.map(m => m.name));
      }
    }
  };

  // Dispatch individual email alert for an expired medicine
  const handleSendMedicineEmail = (med: UserMedicine) => {
    soundEffects.playWarningTone();
    const recipient = emailAlertService.getSettings().recipientEmail;
    // Automatically dispatch email alert without popping up mail content modal
    emailAlertService.dispatchExpiryEmail(med, recipient);
    voiceAlertService.speakExpiredAlert(med.name);
    soundEffects.playSuccessChime();
    showToast(`✓ Alert email sent immediately to your inbox (${recipient})!`);
  };

  // Dispatch batch email alerts for all expired medicines
  const handleSendAllExpiredEmails = () => {
    const expiredList = medicines.filter(m => calculateMedicineExpiryStatus(m).urgency === 'EXPIRED');
    if (expiredList.length === 0) {
      showToast('No expired medicines found in your cabinet.');
      return;
    }
    soundEffects.playWarningTone();
    const recipient = emailAlertService.getSettings().recipientEmail;
    // Automatically dispatch batch email alerts without showing mail content
    emailAlertService.dispatchMultipleExpiryEmail(expiredList, recipient);
    voiceAlertService.speakMultipleExpiredAlert(expiredList.map(m => m.name));
    soundEffects.playSuccessChime();
    showToast(`✓ Alert email sent immediately to your inbox (${recipient}) for ${expiredList.length} medicines!`);
  };

  // Handlers
  const handleSaveMedicine = (data: Omit<UserMedicine, 'id' | 'createdAt'>) => {
    soundEffects.playSuccessChime();

    // Check if the medicine being added/edited is expired
    const isPast = new Date(data.expiryDate).getTime() < new Date(USER_CURRENT_DATE).getTime();

    if (editingMed) {
      setMedicines(prev => prev.map(m => m.id === editingMed.id ? { ...m, ...data } : m));
      showToast(`Updated "${data.name}" in your cabinet.`);
      setEditingMed(null);
    } else {
      const newMed: UserMedicine = {
        id: `med-${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString()
      };
      setMedicines(prev => [newMed, ...prev]);

      if (isPast) {
        soundEffects.playWarningTone();
        voiceAlertService.speakExpiredAlert(newMed.name);
        const recipient = emailAlertService.getSettings().recipientEmail;
        emailAlertService.dispatchExpiryEmail(newMed);
        setSelectedExpiredMedicine(newMed);
        setIsExpiredAlertModalOpen(true);
        showToast(`🚨 Expired item added: Alert Message displayed & Email dispatched to ${recipient}!`);
      } else {
        showToast(`Added "${newMed.name}" to your cabinet.`);
      }
    }
  };

  const handleDeleteMedicine = (id: string) => {
    const med = medicines.find(m => m.id === id);
    setMedicines(prev => prev.filter(m => m.id !== id));
    showToast(`Removed "${med?.name || 'Medicine'}" from cabinet.`);
  };

  const handleTakeDose = (med: UserMedicine) => {
    soundEffects.playSuccessChime();
    setMedicines(prev => prev.map(m => {
      if (m.id === med.id) {
        return { ...m, takenToday: true, lastTakenTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      }
      return m;
    }));
    showToast(`Dose recorded for ${med.name}! Stay healthy.`);
  };

  const handleToggleScheduleTaken = (medId: string) => {
    setMedicines(prev => prev.map(m => {
      if (m.id === medId) {
        const nextState = !m.takenToday;
        return { 
          ...m, 
          takenToday: nextState, 
          lastTakenTime: nextState ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined 
        };
      }
      return m;
    }));
  };

  // 1-Click Clean Cabinet (Safely discards expired items)
  const handleAutoCleanCabinet = () => {
    const expiredIds = medicines
      .filter(m => calculateMedicineExpiryStatus(m).urgency === 'EXPIRED')
      .map(m => m.id);

    setMedicines(prev => prev.filter(m => !expiredIds.includes(m.id)));
    showToast(`Safely discarded ${expiredIds.length} expired items. Cabinet health restored to 100%!`);
  };

  // Add demo expired test item AND trigger immediate spoken voice alert AND email alert!
  const handleAddTestExpired = () => {
    soundEffects.playWarningTone();
    const testExpired: UserMedicine = {
      id: `med-test-${Date.now()}`,
      name: 'Advil Pain Relief (Ibuprofen 400mg)',
      brandOrGeneric: 'Pfizer / Ibuprofen',
      category: 'Fever & Pain',
      purpose: 'Muscle ache, toothache, inflammation',
      expiryDate: '2026-10-01', // Expired 9 days ago
      quantity: '4 tablets left',
      dosageNotes: '1 tablet with food (Expired - Do not take)',
      location: 'Bathroom Cabinet',
      assignedTo: 'Self',
      isPrescription: false,
      notes: 'Test expired medication sample',
      createdAt: new Date().toISOString()
    };
    setMedicines(prev => [testExpired, ...prev]);
    setStatusFilter('EXPIRED');

    // 1. Spoken Voice Alert
    voiceAlertService.speakExpiredAlert('Advil Pain Relief');

    // 2. Automatically dispatch email alert directly to inbox
    const recipient = emailAlertService.getSettings().recipientEmail;
    emailAlertService.dispatchExpiryEmail(testExpired, recipient);
    soundEffects.playSuccessChime();

    showToast(`🚨 Expired alert triggered: email sent automatically to ${recipient}!`);
  };

  const handleStatusFilterChange = (val: StatusFilterOption) => {
    setStatusFilter(val);
    if (val === 'EXPIRED') {
      const expiredList = medicines.filter(m => calculateMedicineExpiryStatus(m).urgency === 'EXPIRED');
      if (expiredList.length > 0) {
        soundEffects.playWarningTone();
        voiceAlertService.speakMultipleExpiredAlert(expiredList.map(m => m.name));
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-teal-500 selection:text-white">
      {/* Top Header */}
      <UserHeader
        totalCount={counts.all}
        expiredCount={counts.expired}
        expiringSoonCount={counts.soon}
        safeCount={counts.safe}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onOpenAddModal={() => {
          setEditingMed(null);
          setIsAddModalOpen(true);
        }}
        onOpenPhotoUpload={() => setIsPhotoUploadModalOpen(true)}
        onOpenScannerModal={() => setIsScannerModalOpen(true)}
        onOpenInteractionChecker={() => setIsInteractionModalOpen(true)}
        onOpenTimeTravel={() => setIsTimeTravelModalOpen(true)}
        onOpenEmergencyMode={() => setIsEmergencyModalOpen(true)}
        onOpenEmailModal={() => setIsEmailModalOpen(true)}
        onOpenAiAssistant={() => setIsAiDrawerOpen(true)}
        onOpenDisposalGuide={() => setIsDisposalModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 flex-1">
        {/* Prominent Emergency Expiry Alert Banner */}
        <UserAlertBanner
          medicines={medicines}
          onFilterExpired={() => handleStatusFilterChange('EXPIRED')}
          onFilterExpiringSoon={() => setStatusFilter('SOON')}
          onOpenDisposalGuide={() => setIsDisposalModalOpen(true)}
          onOpenAlertMessage={() => handleOpenAlertMessage()}
          onTriggerAllEmails={handleSendAllExpiredEmails}
        />

        {/* High-Tech Cabinet Health & Safety Score Card */}
        <CabinetHealthScoreCard
          medicines={medicines}
          onAutoCleanCabinet={handleAutoCleanCabinet}
          onOpenDisposalGuide={() => setIsDisposalModalOpen(true)}
        />

        {/* Today's Daily Dose Routine Tracker */}
        <IntakeScheduleBar
          medicines={medicines}
          onToggleTaken={handleToggleScheduleTaken}
        />

        {/* Filter Bar */}
        <CabinetFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          familyFilter={familyFilter}
          onFamilyFilterChange={setFamilyFilter}
          locationFilter={locationFilter}
          onLocationFilterChange={setLocationFilter}
          counts={counts}
        />

        {/* Action Header above Cards */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {statusFilter === 'EXPIRED' && '🚨 Expired Medicines (Voice & Email Alerts Active)'}
              {statusFilter === 'SOON' && '⚠️ Medicines Expiring Soon (Next 30 Days)'}
              {statusFilter === 'SAFE' && '✅ Safe & Active Medicines'}
              {statusFilter === 'ALL' && 'All Medicines in Home Cabinet'}
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              ({filteredMedicines.length} items)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenAlertMessage()}
              className="text-xs text-rose-800 hover:text-rose-950 font-bold bg-rose-50 hover:bg-rose-100 border border-rose-300 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Open Expiry Alert Message Dialog"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span>Expiry Alert Message 🚨</span>
            </button>

            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="text-xs text-teal-800 hover:text-teal-950 font-bold bg-teal-50 hover:bg-teal-100 border border-teal-300 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Open Email Notification Dispatch Center"
            >
              <Mail className="w-3.5 h-3.5 text-teal-600" />
              <span>Email Inbox Logs</span>
            </button>

            <button
              onClick={handleAddTestExpired}
              className="text-xs text-rose-700 hover:text-rose-900 font-bold bg-rose-50 hover:bg-rose-100 border border-rose-300 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Add a test expired item and trigger voice alert + email dispatch"
            >
              <Volume2 className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span>+ Test Expired Alert</span>
            </button>

            <button
              onClick={() => setIsPhotoUploadModalOpen(true)}
              className="text-xs text-white hover:text-white font-extrabold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 px-3.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              title="Upload photo of medicine packaging to auto-scan details"
            >
              <Camera className="w-3.5 h-3.5 text-teal-200" />
              <span>Upload Photo & Scan 📸</span>
            </button>

            <button
              onClick={() => {
                setEditingMed(null);
                setIsAddModalOpen(true);
              }}
              className="text-xs text-slate-700 hover:text-slate-900 font-bold bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Manual Add</span>
            </button>
          </div>
        </div>

        {/* Grid of Medicines */}
        {filteredMedicines.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-lg mx-auto mt-6">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No medicines found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm 
                ? `No items match "${searchTerm}". Try checking your spelling or clearing filters.` 
                : 'No medicines found in this view.'}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setFamilyFilter('All Members');
                  setLocationFilter('All Locations');
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Reset Filters
              </button>
              <button
                onClick={() => setIsPhotoUploadModalOpen(true)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-xs flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                Upload Photo & Scan
              </button>
              <button
                onClick={() => {
                  setEditingMed(null);
                  setIsAddModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300"
              >
                + Manual Add
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMedicines.map((med) => (
              <UserMedicineCard
                key={med.id}
                medicine={med}
                onEdit={(m) => {
                  setEditingMed(m);
                  setIsAddModalOpen(true);
                }}
                onDelete={handleDeleteMedicine}
                onTakeDose={handleTakeDose}
                onOpenDisposalGuide={() => setIsDisposalModalOpen(true)}
                onOpenAlertMessage={handleOpenAlertMessage}
                onSendEmailAlert={handleSendMedicineEmail}
              />
            ))}
          </div>
        )}
      </main>

      {/* Advanced Interactive Modals */}
      <ExpiredMedicineAlertModal
        isOpen={isExpiredAlertModalOpen}
        onClose={() => setIsExpiredAlertModalOpen(false)}
        targetMedicine={selectedExpiredMedicine}
        allMedicines={medicines}
        onDiscardMedicine={handleDeleteMedicine}
        onOpenDisposalGuide={() => setIsDisposalModalOpen(true)}
      />

      <AddMedicineModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingMed(null);
        }}
        onSave={handleSaveMedicine}
        editingMedicine={editingMed}
        onOpenFullScanner={() => {
          setIsAddModalOpen(false);
          setIsPhotoUploadModalOpen(true);
        }}
      />

      <UploadMedicinePhotoModal
        isOpen={isPhotoUploadModalOpen}
        onClose={() => setIsPhotoUploadModalOpen(false)}
        onSaveMedicine={handleSaveMedicine}
      />

      <SmartScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onAddMedicine={handleSaveMedicine}
      />

      <DrugInteractionCheckerModal
        isOpen={isInteractionModalOpen}
        onClose={() => setIsInteractionModalOpen(false)}
        medicines={medicines}
      />

      <TimeTravelSimulator
        isOpen={isTimeTravelModalOpen}
        onClose={() => setIsTimeTravelModalOpen(false)}
        medicines={medicines}
      />

      <EmergencyMedicalCard
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        medicines={medicines}
      />

      <EmailAlertSettingsModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        medicines={medicines}
        onTriggerEmailSuccess={(email, medName) => {
          showToast(`📧 Safety alert email dispatched to ${email} for ${medName}!`);
        }}
      />

      <SafeDisposalModal
        isOpen={isDisposalModalOpen}
        onClose={() => setIsDisposalModalOpen(false)}
      />

      <UserAiAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        medicines={medicines}
      />

      {/* Floating AI Safety Assistant Trigger */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5">
        <button
          onClick={() => setIsAiDrawerOpen(true)}
          className="p-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl flex items-center gap-2 transition-all hover:scale-105"
          title="Ask AI Pharmacist"
        >
          <Sparkles className="w-5 h-5 text-teal-300" />
          <span className="text-xs font-bold hidden sm:inline">Ask AI Safety</span>
        </button>
      </div>

      {/* Live Audio / Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom-2 duration-150 max-w-md">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
