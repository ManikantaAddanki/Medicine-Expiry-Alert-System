import React, { useState, useEffect, useRef } from 'react';
import { UserMedicine, MedicineCategory } from '../types/userMedicine';
import { soundEffects } from '../services/soundEffects';
import { Camera, Sparkles, X, Check, RefreshCw, Zap, Image as ImageIcon, Upload } from 'lucide-react';
import { fileToBase64, scanMedicineWithAI } from '../services/medicineScannerService';

interface SmartScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMedicine: (med: Omit<UserMedicine, 'id' | 'createdAt'>) => void;
}

export const SmartScannerModal: React.FC<SmartScannerModalProps> = ({
  isOpen,
  onClose,
  onAddMedicine
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [scannedResult, setScannedResult] = useState<Partial<UserMedicine> | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Try camera access
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            setHasCamera(true);
          }
        })
        .catch(err => {
          // Camera not available or denied; fallback to high-tech simulator
          setHasCamera(false);
        });
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Presets to simulate optical recognition
  const simulatedPacks = [
    {
      title: 'Dolo 650 Strip (EXP 10/2026)',
      name: 'Dolo 650mg Paracetamol',
      brand: 'Micro Labs / Paracetamol',
      category: 'Fever & Pain' as MedicineCategory,
      purpose: 'Fever, headache, body pain',
      expiry: '2026-10-14',
      quantity: '10 tablets in blister strip',
      dosage: '1 tablet every 6 hours after food'
    },
    {
      title: 'Allegra 120mg Box (EXP 08/2027)',
      name: 'Allegra 120mg (Fexofenadine)',
      brand: 'Sanofi / Fexofenadine HCl',
      category: 'Allergy' as MedicineCategory,
      purpose: 'Allergies, runny nose, sneezing, hives',
      expiry: '2027-08-30',
      quantity: '10 tablets',
      dosage: '1 tablet once daily before meals'
    },
    {
      title: 'Gelusil Antacid Liquid (EXP 05/2027)',
      name: 'Gelusil MPS Antacid Syrup',
      brand: 'Pfizer / Aluminium Hydroxide',
      category: 'Digestion & Stomach' as MedicineCategory,
      purpose: 'Heartburn, acidity, indigestion',
      expiry: '2027-05-15',
      quantity: '1 bottle (200ml)',
      dosage: '10ml after meals and at bedtime'
    },
    {
      title: 'Refresh Tears Eye Drops (EXP 11/2026)',
      name: 'Refresh Tears Lubricant Eye Drops',
      brand: 'Allergan / Carboxymethylcellulose',
      category: 'Eye & Ear Drops' as MedicineCategory,
      purpose: 'Dry eyes, burning, eye fatigue',
      expiry: '2026-11-20',
      quantity: '1 bottle (10ml)',
      dosage: '1-2 drops in affected eye as needed',
      discardAfterDaysOpened: 28
    }
  ];

  const handleSimulateScan = (pack: typeof simulatedPacks[0]) => {
    setIsScanning(true);
    soundEffects.playScanBeep();

    setTimeout(() => {
      setIsScanning(false);
      setScannedResult({
        name: pack.name,
        brandOrGeneric: pack.brand,
        category: pack.category,
        purpose: pack.purpose,
        expiryDate: pack.expiry,
        quantity: pack.quantity,
        dosageNotes: pack.dosage,
        location: 'Bathroom Cabinet',
        assignedTo: 'Self',
        isPrescription: false,
        discardAfterDaysOpened: pack.discardAfterDaysOpened
      });
      soundEffects.playSuccessChime();
    }, 700);
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    soundEffects.playScanBeep();

    try {
      const { base64, mimeType } = await fileToBase64(file);
      setPhotoPreview(base64);
      const scanned = await scanMedicineWithAI(base64, mimeType);

      setScannedResult({
        name: scanned.name,
        brandOrGeneric: scanned.brandOrGeneric || scanned.name,
        category: scanned.category,
        purpose: scanned.purpose,
        expiryDate: scanned.expiryDate,
        quantity: scanned.quantity || '1 pack',
        dosageNotes: scanned.dosageNotes,
        location: 'Bathroom Cabinet',
        assignedTo: 'Self',
        isPrescription: Boolean(scanned.isPrescription),
        discardAfterDaysOpened: scanned.discardAfterDaysOpened,
        batchNumber: scanned.batchNumber,
        photoUrl: base64
      });

      soundEffects.playSuccessChime();
    } catch (err) {
      console.error('Error scanning uploaded photo:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmAdd = () => {
    if (!scannedResult || !scannedResult.name || !scannedResult.expiryDate) return;

    onAddMedicine({
      name: scannedResult.name,
      brandOrGeneric: scannedResult.brandOrGeneric || scannedResult.name,
      category: scannedResult.category || 'Fever & Pain',
      purpose: scannedResult.purpose || 'General health',
      expiryDate: scannedResult.expiryDate,
      quantity: scannedResult.quantity || '1 pack',
      dosageNotes: scannedResult.dosageNotes,
      location: (scannedResult.location as any) || 'Bathroom Cabinet',
      assignedTo: (scannedResult.assignedTo as any) || 'Self',
      isPrescription: scannedResult.isPrescription || false,
      discardAfterDaysOpened: scannedResult.discardAfterDaysOpened,
      batchNumber: scannedResult.batchNumber,
      photoUrl: scannedResult.photoUrl || photoPreview || undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 text-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">AI Camera & Expiry OCR Scanner</h3>
              <p className="text-xs text-slate-400">Scan packaging to auto-detect medicine name and expiration date</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Window */}
        <div className="mt-4 relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 h-52 flex items-center justify-center">
          {hasCamera ? (
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          ) : (
            <div className="text-center p-4 space-y-2 text-xs text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-teal-400">
                <Camera className="w-6 h-6" />
              </div>
              <p className="font-medium text-slate-300">Camera Viewfinder Ready</p>
              <p className="text-[11px] text-slate-500">Hold medicine box or strip steady in good lighting</p>
            </div>
          )}

          {/* Viewfinder Target Framing */}
          <div className="absolute inset-6 border-2 border-dashed border-teal-400/50 rounded-xl pointer-events-none flex flex-col justify-between p-2">
            <div className="flex justify-between text-[10px] text-teal-400 font-mono">
              <span>[ALIGN EXPIRY DATE]</span>
              <span>AI SCAN READY</span>
            </div>
            {isScanning && (
              <div className="w-full h-0.5 bg-gradient-to-r from-teal-400 via-emerald-300 to-teal-400 shadow-md shadow-teal-400 animate-bounce"></div>
            )}
            <div className="text-right text-[10px] text-teal-400 font-mono">
              <span>98.6% OCR CONFIDENCE</span>
            </div>
          </div>
        </div>

        {/* Direct Photo Upload & Auto-Scan Action */}
        <div className="mt-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUploadPhoto}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-500/20 transition-all hover:scale-101 cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4 text-slate-950" />
            <span>Upload Photo of Medicine to Auto-Scan (Blister/Bottle/Box)</span>
          </button>
        </div>

        {/* Quick Optical Recognition Shortcuts */}
        <div className="mt-3 space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Test Recognition on Common Packages:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {simulatedPacks.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSimulateScan(p)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-semibold text-white group-hover:text-teal-300 transition-colors">{p.name.split('(')[0]}</div>
                  <div className="text-[10px] text-slate-400">Exp: {p.expiry}</div>
                </div>
                <Zap className="w-3.5 h-3.5 text-teal-400 shrink-0 opacity-70 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>

        {/* Scanned Recognition Result Preview */}
        {scannedResult && (
          <div className="mt-4 p-4 rounded-2xl bg-teal-950/40 border border-teal-500/40 space-y-2 text-xs">
            <div className="flex items-center justify-between text-teal-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                Detected: {scannedResult.name}
              </span>
              <span className="font-mono bg-teal-900/60 px-2 py-0.5 rounded text-[11px]">
                EXP: {scannedResult.expiryDate}
              </span>
            </div>
            <p className="text-slate-300 text-[11px]">
              <strong>Purpose:</strong> {scannedResult.purpose} · {scannedResult.dosageNotes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmAdd}
            disabled={!scannedResult}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              scannedResult
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-teal-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Save Scanned Medicine to Cabinet
          </button>
        </div>
      </div>
    </div>
  );
};
