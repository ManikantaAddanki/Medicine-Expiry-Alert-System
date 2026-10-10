import React, { useState, useRef, useEffect } from 'react';
import { 
  UserMedicine, 
  MedicineCategory, 
  StorageLocation, 
  FamilyMember 
} from '../types/userMedicine';
import { 
  X, 
  Upload, 
  Camera, 
  Sparkles, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  Layers, 
  Calendar, 
  ShieldCheck, 
  Eye,
  Info,
  CheckCircle2,
  ScanLine
} from 'lucide-react';
import { 
  fileToBase64, 
  scanMedicineWithAI, 
  SAMPLE_MEDICINE_PHOTOS, 
  ScannedMedicineData,
  SampleMedicinePhoto 
} from '../services/medicineScannerService';
import { soundEffects } from '../services/soundEffects';

interface UploadMedicinePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMedicine: (medicine: Omit<UserMedicine, 'id' | 'createdAt'>) => void;
}

export const UploadMedicinePhotoModal: React.FC<UploadMedicinePhotoModalProps> = ({
  isOpen,
  onClose,
  onSaveMedicine,
}) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepText, setScanStepText] = useState('Analyzing medicine packaging...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Scanned / editable fields
  const [scannedData, setScannedData] = useState<ScannedMedicineData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    brandOrGeneric: '',
    category: 'Fever & Pain' as MedicineCategory,
    purpose: '',
    expiryDate: '',
    manufacturingDate: '',
    batchNumber: '',
    quantity: '10 tablets',
    dosageNotes: '',
    location: 'Bathroom Cabinet' as StorageLocation,
    assignedTo: 'Self' as FamilyMember,
    isPrescription: false,
    discardAfterDaysOpened: 28,
    isOpened: false,
    notes: '',
  });

  // Stop camera when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setPhotoPreview(null);
    setIsScanning(false);
    setErrorMessage(null);
    setScannedData(null);
    setFormData({
      name: '',
      brandOrGeneric: '',
      category: 'Fever & Pain',
      purpose: '',
      expiryDate: '',
      manufacturingDate: '',
      batchNumber: '',
      quantity: '10 tablets',
      dosageNotes: '',
      location: 'Bathroom Cabinet',
      assignedTo: 'Self',
      isPrescription: false,
      discardAfterDaysOpened: 28,
      isOpened: false,
      notes: '',
    });
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setErrorMessage('Could not open camera. Please upload an image file or choose a sample photo below.');
      setIsCameraActive(false);
    }
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopCamera();
    handleAnalyzePhoto(dataUrl, 'image/jpeg');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);

    try {
      const { base64, mimeType } = await fileToBase64(file);
      handleAnalyzePhoto(base64, mimeType);
    } catch (err: any) {
      setErrorMessage('Error reading uploaded image. Please try another file.');
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setErrorMessage(null);

    try {
      const { base64, mimeType } = await fileToBase64(file);
      handleAnalyzePhoto(base64, mimeType);
    } catch (err: any) {
      setErrorMessage('Error reading dropped image file.');
    }
  };

  const handleSelectSample = (sample: SampleMedicinePhoto) => {
    stopCamera();
    setErrorMessage(null);
    setPhotoPreview(sample.imageUrl);
    setIsScanning(true);
    soundEffects.playScanBeep();

    setScanStepText('Analyzing medicine packaging with Gemini Multimodal AI...');
    setTimeout(() => {
      setScanStepText('Reading embossed expiry date, batch number & composition...');
    }, 600);

    setTimeout(() => {
      setIsScanning(false);
      populateExtractedData(sample.fallbackData, sample.imageUrl);
      soundEffects.playSuccessChime();
    }, 1200);
  };

  const handleAnalyzePhoto = async (base64Image: string, mimeType: string) => {
    setPhotoPreview(base64Image);
    setIsScanning(true);
    setErrorMessage(null);
    soundEffects.playScanBeep();

    // Visual step sequence
    setScanStepText('Uploading photo to Gemini Multimodal AI scanner...');
    const t1 = setTimeout(() => {
      setScanStepText('Reading packaging labels, active salt, & strength...');
    }, 800);
    const t2 = setTimeout(() => {
      setScanStepText('Detecting Expiry Date, Batch / Lot #, & Schedule info...');
    }, 1800);

    try {
      const data = await scanMedicineWithAI(base64Image, mimeType);
      clearTimeout(t1);
      clearTimeout(t2);
      setIsScanning(false);
      populateExtractedData(data, base64Image);
      soundEffects.playSuccessChime();
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      setIsScanning(false);
      console.error('Scan error:', err);
      setErrorMessage(
        'AI scan was unable to read the label clearly. You can still type details manually or pick a sample photo to test!'
      );
      // Give fallback default form so user can still complete adding
      setFormData(prev => ({
        ...prev,
        name: 'Scanned Medicine',
        expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      }));
    }
  };

  const populateExtractedData = (data: ScannedMedicineData, photoUrl: string) => {
    setScannedData(data);
    setFormData({
      name: data.name || '',
      brandOrGeneric: data.brandOrGeneric || data.name || '',
      category: data.category || 'Fever & Pain',
      purpose: data.purpose || 'Medication relief',
      expiryDate: data.expiryDate || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      manufacturingDate: data.manufacturingDate || '',
      batchNumber: data.batchNumber || '',
      quantity: data.quantity || '10 units',
      dosageNotes: data.dosageNotes || '',
      location: 'Bathroom Cabinet',
      assignedTo: 'Self',
      isPrescription: Boolean(data.isPrescription),
      discardAfterDaysOpened: data.discardAfterDaysOpened || 28,
      isOpened: false,
      notes: data.notes || '',
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.expiryDate) {
      setErrorMessage('Please ensure medicine name and expiry date are filled.');
      return;
    }

    onSaveMedicine({
      name: formData.name,
      brandOrGeneric: formData.brandOrGeneric || formData.name,
      category: formData.category,
      purpose: formData.purpose || 'Health treatment',
      expiryDate: formData.expiryDate,
      openedDate: formData.isOpened ? new Date().toISOString().split('T')[0] : undefined,
      discardAfterDaysOpened: formData.isOpened ? Number(formData.discardAfterDaysOpened) : undefined,
      quantity: formData.quantity || '1 pack',
      dosageNotes: formData.dosageNotes,
      location: formData.location,
      assignedTo: formData.assignedTo,
      isPrescription: formData.isPrescription,
      notes: formData.notes,
      activeIngredients: scannedData?.activeIngredients,
      photoUrl: photoPreview || undefined,
      batchNumber: formData.batchNumber || undefined,
      manufacturingDate: formData.manufacturingDate || undefined,
      scanConfidence: scannedData?.confidence || 'high'
    });

    onClose();
  };

  if (!isOpen) return null;

  // Compute expiry warning flag for review preview
  const isExpired = formData.expiryDate && new Date(formData.expiryDate).getTime() < Date.now();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 via-emerald-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">Upload Medicine Photo & Auto-Scan</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  Gemini Vision AI
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Snap or upload a photo of your tablet strip, bottle, or box to automatically extract expiry date, name, and details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Options: Upload, Camera, or Sample */}
          {!photoPreview && !isCameraActive && (
            <div className="space-y-6">
              {/* Drag and Drop Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-teal-300 hover:border-teal-500 rounded-3xl p-8 sm:p-10 text-center bg-teal-50/30 hover:bg-teal-50/60 transition-all cursor-pointer group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:scale-105 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Click to Browse or Drag & Drop Medicine Photo
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                  Supports medicine blister strips, bottle labels, syrup packaging, ointment tubes, and prescription boxes (JPG, PNG, WEBP)
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                  >
                    Select File from Device
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startCamera();
                    }}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-teal-300" />
                    Open Camera
                  </button>
                </div>
              </div>

              {/* Instant One-Click Demo Samples */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Try 1-Click Sample Medicine Photos
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">Test scanner immediately without physical box</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {SAMPLE_MEDICINE_PHOTOS.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleSelectSample(sample)}
                      className="p-3 text-left rounded-xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-sm transition-all flex items-start gap-3 group"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <img src={sample.imageUrl} alt={sample.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate group-hover:text-teal-700">
                          {sample.title}
                        </div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{sample.subtitle}</div>
                        <span className="inline-block mt-1 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {sample.tag}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Live Camera View */}
          {isCameraActive && (
            <div className="relative rounded-3xl overflow-hidden bg-black aspect-video max-h-[380px] flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Camera Guide Target Reticle */}
              <div className="absolute inset-8 border-2 border-dashed border-teal-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-4">
                <div className="text-center text-xs font-bold text-white bg-black/60 px-3 py-1 rounded-full self-center">
                  Align medicine strip or label within frame
                </div>
                <div className="text-center text-[11px] text-teal-300 bg-black/60 px-3 py-1 rounded-full self-center">
                  Ensure EXP date & medicine name are clearly lit
                </div>
              </div>

              {/* Camera Controls */}
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold backdrop-blur-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={captureCameraPhoto}
                  className="px-6 py-2.5 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-teal-500/50 hover:scale-105 transition-all"
                >
                  <Camera className="w-4 h-4 text-slate-950" />
                  Capture Photo
                </button>
              </div>
            </div>
          )}

          {/* Scanning Animation Overlay */}
          {isScanning && photoPreview && (
            <div className="relative rounded-3xl overflow-hidden bg-slate-950 aspect-video max-h-[340px] flex flex-col items-center justify-center text-white border border-teal-500/40 shadow-xl">
              <img
                src={photoPreview}
                alt="Scanning medicine"
                className="absolute inset-0 w-full h-full object-contain opacity-40 filter blur-xs"
              />
              
              {/* Animated Laser Scanning Line */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_15px_#2dd4bf] animate-[bounce_2.5s_infinite]" />

              <div className="relative z-10 text-center p-6 space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-500/20 border border-teal-400 flex items-center justify-center animate-pulse">
                  <ScanLine className="w-8 h-8 text-teal-300 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
                <h4 className="text-base font-extrabold text-teal-300 tracking-wide">
                  Gemini AI Optical Analysis in Progress
                </h4>
                <p className="text-xs text-slate-300 font-medium max-w-sm mx-auto animate-pulse">
                  {scanStepText}
                </p>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-teal-200/80">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                  Reading packaging expiry, dosage, and composition...
                </div>
              </div>
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Results Review & Form */}
          {!isScanning && photoPreview && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Photo Preview & Scanned Chips */}
              <div className="lg:col-span-5 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-900 overflow-hidden relative group">
                  <img
                    src={photoPreview}
                    alt="Scanned medicine"
                    className="w-full max-h-[260px] object-contain bg-slate-950"
                  />
                  <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-teal-400" />
                    Photo Analyzed
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview(null);
                      setScannedData(null);
                    }}
                    className="absolute top-2 right-2 bg-slate-900/80 hover:bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retake / Change
                  </button>
                </div>

                {/* Detected Optical Snippets */}
                {scannedData?.detectedTextSnippets && scannedData.detectedTextSnippets.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-teal-600" />
                      Text Read from Packaging Label
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {scannedData.detectedTextSnippets.map((snip, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-white border border-slate-300 text-slate-800"
                        >
                          {snip}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active ingredients */}
                {scannedData?.activeIngredients && scannedData.activeIngredients.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-200">
                    <div className="text-[11px] font-bold text-teal-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                      Identified Active Formulation
                    </div>
                    <p className="text-xs text-teal-800 font-medium">
                      {scannedData.activeIngredients.join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Editable Details Form */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Expiry Alert Callout if Expired */}
                {isExpired && (
                  <div className="p-3.5 rounded-2xl bg-rose-100 border border-rose-300 text-rose-950 text-xs flex items-center gap-2.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-bounce" />
                    <div>
                      <span>SAFETY WARNING: This scanned medicine is EXPIRED ({formData.expiryDate}). </span>
                      <span className="font-normal">Saving it will trigger safety voice and email warnings.</span>
                    </div>
                  </div>
                )}

                {/* Medicine Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Medicine / Brand Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Dolo 650, Augmentin 625 Duo"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>

                {/* Generic Salt / Composition */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Generic Salt / Active Ingredient
                  </label>
                  <input
                    type="text"
                    value={formData.brandOrGeneric}
                    onChange={(e) => setFormData(prev => ({ ...prev, brandOrGeneric: e.target.value }))}
                    placeholder="e.g. Paracetamol 650mg, Amoxicillin"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Expiry Date & Category Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Expiry Date (EXP) *</span>
                      {isExpired ? (
                        <span className="text-[10px] font-bold text-rose-600">EXPIRED</span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600">VALID</span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                      className={`w-full px-3.5 py-2 text-xs rounded-xl border font-bold ${
                        isExpired 
                          ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-rose-500' 
                          : 'border-slate-300 focus:ring-teal-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as MedicineCategory }))}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
                    >
                      <option value="Fever & Pain">Fever & Pain</option>
                      <option value="Cold & Cough">Cold & Cough</option>
                      <option value="Allergy">Allergy</option>
                      <option value="Digestion & Stomach">Digestion & Stomach</option>
                      <option value="First Aid & Skin">First Aid & Skin</option>
                      <option value="Daily & Chronic">Daily & Chronic</option>
                      <option value="Vitamins & Supplements">Vitamins & Supplements</option>
                      <option value="Eye & Ear Drops">Eye & Ear Drops</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Batch No & Manufacturing Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Batch / Lot # (B.No)
                    </label>
                    <input
                      type="text"
                      value={formData.batchNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                      placeholder="e.g. DL-90821"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Quantity / Package Size
                    </label>
                    <input
                      type="text"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="e.g. 10 tablets, 1 bottle 100ml"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Purpose / Used For */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Therapeutic Purpose (Used for)
                  </label>
                  <input
                    type="text"
                    value={formData.purpose}
                    onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                    placeholder="e.g. Fever, headache, body aches"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Dosage Directions */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dosage & Directions
                  </label>
                  <input
                    type="text"
                    value={formData.dosageNotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, dosageNotes: e.target.value }))}
                    placeholder="e.g. 1 tablet every 6 hours after food"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Location & Family Member */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cabinet Storage Location
                    </label>
                    <select
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value as StorageLocation }))}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
                    >
                      <option value="Bathroom Cabinet">Bathroom Cabinet</option>
                      <option value="Kitchen / Fridge">Kitchen / Fridge</option>
                      <option value="Bedroom Nightstand">Bedroom Nightstand</option>
                      <option value="First Aid Kit">First Aid Kit</option>
                      <option value="Travel Bag">Travel Bag</option>
                      <option value="Living Room">Living Room</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Assigned To
                    </label>
                    <select
                      value={formData.assignedTo}
                      onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value as FamilyMember }))}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
                    >
                      <option value="Self">Self</option>
                      <option value="Family Shared">Family Shared</option>
                      <option value="Mom">Mom</option>
                      <option value="Dad">Dad</option>
                      <option value="Kids">Kids</option>
                      <option value="Grandparents">Grandparents</option>
                      <option value="Pet">Pet</option>
                    </select>
                  </div>
                </div>

                {/* Prescription & Opened Bottle Checkboxes */}
                <div className="pt-2 flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPrescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, isPrescription: e.target.checked }))}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                    />
                    <span>Requires Doctor Prescription (Rx / Schedule H)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isOpened}
                      onChange={(e) => setFormData(prev => ({ ...prev, isOpened: e.target.checked }))}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                    />
                    <span>Bottle/Seal Opened (Track discard timer)</span>
                  </label>
                </div>

                {formData.isOpened && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">Discard after days opened:</span>
                    <input
                      type="number"
                      value={formData.discardAfterDaysOpened}
                      onChange={(e) => setFormData(prev => ({ ...prev, discardAfterDaysOpened: Number(e.target.value) }))}
                      className="w-20 px-2.5 py-1 text-xs rounded-lg border border-slate-300 font-bold"
                      min={1}
                      max={365}
                    />
                    <span className="text-xs text-slate-500">(e.g. 28 days for eye drops)</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>

          {photoPreview && !isScanning && (
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 text-xs font-black rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md shadow-teal-500/25 flex items-center gap-2 transition-all hover:scale-102"
            >
              <Check className="w-4 h-4" />
              <span>✓ Save Scanned Medicine to Cabinet</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
