import React, { useState, useRef } from 'react';
import { UserMedicine, MedicineCategory, StorageLocation, FamilyMember } from '../types/userMedicine';
import { X, Plus, Calendar, Clock, Sparkles, Check, Camera, Upload, RefreshCw, CheckCircle2 } from 'lucide-react';
import { fileToBase64, scanMedicineWithAI } from '../services/medicineScannerService';
import { soundEffects } from '../services/soundEffects';

interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (medicine: Omit<UserMedicine, 'id' | 'createdAt'>) => void;
  editingMedicine?: UserMedicine | null;
  onOpenFullScanner?: () => void;
}

export const AddMedicineModal: React.FC<AddMedicineModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingMedicine,
  onOpenFullScanner
}) => {
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [isScanningPhoto, setIsScanningPhoto] = useState(false);
  const [photoScanSuccess, setPhotoScanSuccess] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(editingMedicine?.photoUrl || null);

  const [formData, setFormData] = useState({
    name: editingMedicine?.name || '',
    brandOrGeneric: editingMedicine?.brandOrGeneric || '',
    category: (editingMedicine?.category || 'Fever & Pain') as MedicineCategory,
    purpose: editingMedicine?.purpose || '',
    expiryDate: editingMedicine?.expiryDate || '2027-06-30',
    openedDate: editingMedicine?.openedDate || '',
    discardAfterDaysOpened: editingMedicine?.discardAfterDaysOpened || 28,
    isBottleOpened: Boolean(editingMedicine?.openedDate),
    quantity: editingMedicine?.quantity || '10 tablets',
    dosageNotes: editingMedicine?.dosageNotes || '',
    location: (editingMedicine?.location || 'Bathroom Cabinet') as StorageLocation,
    assignedTo: (editingMedicine?.assignedTo || 'Self') as FamilyMember,
    isPrescription: editingMedicine?.isPrescription || false,
    notes: editingMedicine?.notes || '',
    batchNumber: editingMedicine?.batchNumber || '',
    manufacturingDate: editingMedicine?.manufacturingDate || ''
  });

  if (!isOpen) return null;

  // Preset Shortcuts for Everyday Users
  const presets = [
    {
      label: 'Paracetamol / Dolo',
      name: 'Dolo 650mg (Paracetamol)',
      brand: 'Paracetamol / Acetaminophen',
      category: 'Fever & Pain' as MedicineCategory,
      purpose: 'Fever, headache, body pain',
      dosage: '1 tablet after meals (max 3/day)',
      quantity: '10 tablets'
    },
    {
      label: 'Cough Syrup',
      name: 'Benadryl Cough Syrup',
      brand: 'Dextromethorphan + Diphenhydramine',
      category: 'Cold & Cough' as MedicineCategory,
      purpose: 'Dry cough and throat irritation',
      dosage: '10ml at night before bed',
      quantity: '1 bottle (100ml)'
    },
    {
      label: 'Eye Drops',
      name: 'Refresh Tears Eye Drops',
      brand: 'Carboxymethylcellulose 0.5%',
      category: 'Eye & Ear Drops' as MedicineCategory,
      purpose: 'Dry eyes, burning, eye fatigue',
      dosage: '1-2 drops in each eye as needed',
      quantity: '1 bottle (10ml)',
      openedDays: 28
    },
    {
      label: 'Acidity / Antacid',
      name: 'Pantocid 40mg (Pantoprazole)',
      brand: 'Pantoprazole 40mg',
      category: 'Digestion & Stomach' as MedicineCategory,
      purpose: 'Heartburn, acid reflux, stomach gas',
      dosage: '1 tablet in morning before breakfast',
      quantity: '15 tablets'
    },
    {
      label: 'Allergy (Cetirizine)',
      name: 'Cetirizine 10mg',
      brand: 'Cetirizine Hydrochloride',
      category: 'Allergy' as MedicineCategory,
      purpose: 'Sneezing, runny nose, seasonal allergy',
      dosage: '1 tablet at bedtime if needed',
      quantity: '10 tablets'
    },
    {
      label: 'Antiseptic Ointment',
      name: 'Betadine Antiseptic 10%',
      brand: 'Povidone Iodine',
      category: 'First Aid & Skin' as MedicineCategory,
      purpose: 'Minor cuts, scrapes, burns, wound care',
      dosage: 'Apply thin layer and cover with bandage',
      quantity: '1 tube (20g)'
    }
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setFormData(prev => ({
      ...prev,
      name: p.name,
      brandOrGeneric: p.brand,
      category: p.category,
      purpose: p.purpose,
      dosageNotes: p.dosage,
      quantity: p.quantity,
      discardAfterDaysOpened: p.openedDays || 28
    }));
  };

  // Date shortcut helpers
  const setExpiryOffsetMonths = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    const dateStr = d.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, expiryDate: dateStr }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningPhoto(true);
    setPhotoScanSuccess(false);
    soundEffects.playScanBeep();

    try {
      const { base64, mimeType } = await fileToBase64(file);
      setPhotoPreview(base64);
      const scanned = await scanMedicineWithAI(base64, mimeType);

      setFormData(prev => ({
        ...prev,
        name: scanned.name || prev.name,
        brandOrGeneric: scanned.brandOrGeneric || prev.brandOrGeneric,
        category: scanned.category || prev.category,
        purpose: scanned.purpose || prev.purpose,
        expiryDate: scanned.expiryDate || prev.expiryDate,
        quantity: scanned.quantity || prev.quantity,
        dosageNotes: scanned.dosageNotes || prev.dosageNotes,
        batchNumber: scanned.batchNumber || prev.batchNumber,
        manufacturingDate: scanned.manufacturingDate || prev.manufacturingDate,
        notes: scanned.notes || prev.notes,
        isPrescription: scanned.isPrescription ?? prev.isPrescription
      }));

      setPhotoScanSuccess(true);
      soundEffects.playSuccessChime();
    } catch (err) {
      console.error('Scan photo error in modal:', err);
    } finally {
      setIsScanningPhoto(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.expiryDate) return;

    onSave({
      name: formData.name,
      brandOrGeneric: formData.brandOrGeneric || formData.name,
      category: formData.category,
      purpose: formData.purpose || 'General health',
      expiryDate: formData.expiryDate,
      openedDate: formData.isBottleOpened ? (formData.openedDate || new Date().toISOString().split('T')[0]) : undefined,
      discardAfterDaysOpened: formData.isBottleOpened ? Number(formData.discardAfterDaysOpened) : undefined,
      quantity: formData.quantity || '1 unit',
      dosageNotes: formData.dosageNotes,
      location: formData.location,
      assignedTo: formData.assignedTo,
      isPrescription: formData.isPrescription,
      notes: formData.notes,
      photoUrl: photoPreview || undefined,
      batchNumber: formData.batchNumber || undefined,
      manufacturingDate: formData.manufacturingDate || undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {editingMedicine ? 'Edit Medicine' : 'Add Medicine to Your Cabinet'}
            </h3>
            <p className="text-xs text-slate-500">Track expiration date, quantity, and safety rules</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 py-4 space-y-4 text-xs">
          
          {/* Quick Photo Upload & Auto-Scan Banner */}
          {!editingMedicine && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-teal-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
              <input
                type="file"
                ref={photoInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>Have a photo of the medicine?</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-200 text-teal-800">
                      AI Auto-Scan
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Upload box or strip photo to auto-fill all fields in 1 second
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isScanningPhoto}
                  onClick={() => photoInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isScanningPhoto ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Upload Photo
                    </>
                  )}
                </button>
                {onOpenFullScanner && (
                  <button
                    type="button"
                    onClick={onOpenFullScanner}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-teal-300" />
                    Scan Camera
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Photo Scan Success Toast */}
          {photoScanSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Photo scanned successfully! Details auto-filled below.
              </span>
              {photoPreview && (
                <img src={photoPreview} alt="Scanned" className="w-7 h-7 rounded object-cover border border-emerald-300" />
              )}
            </div>
          )}
          {/* Quick Preset Buttons (only when creating new) */}
          {!editingMedicine && (
            <div>
              <span className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                Quick Presets (Common Home Medicines):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 font-medium transition-colors text-[11px]"
                  >
                    + {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Medicine Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Medicine Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dolo 650mg, Cough Syrup"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
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

          {/* Purpose */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">What is this medicine for? *</label>
            <input
              type="text"
              required
              placeholder="e.g. Headache, fever, sore throat, acidity"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Expiry Date Section with Quick Buttons */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-900">Expiration Date on Package *</label>
              <span className="text-[11px] text-slate-500">Printed on box or strip</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="flex-1 p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            {/* Expiry Quick Buttons */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 font-medium">Quick add:</span>
              <button
                type="button"
                onClick={() => setExpiryOffsetMonths(3)}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold"
              >
                +3 Months
              </button>
              <button
                type="button"
                onClick={() => setExpiryOffsetMonths(6)}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold"
              >
                +6 Months
              </button>
              <button
                type="button"
                onClick={() => setExpiryOffsetMonths(12)}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold"
              >
                +1 Year
              </button>
              <button
                type="button"
                onClick={() => setExpiryOffsetMonths(24)}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold"
              >
                +2 Years
              </button>
            </div>
          </div>

          {/* Opened Bottle Discard Reminder (Important for eye drops & syrups) */}
          <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-950">
              <input
                type="checkbox"
                checked={formData.isBottleOpened}
                onChange={(e) => setFormData({ ...formData, isBottleOpened: e.target.checked })}
                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
              <span>Has this bottle / tube already been opened?</span>
            </label>

            {formData.isBottleOpened && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-amber-900 mb-1">Date First Opened</label>
                  <input
                    type="date"
                    value={formData.openedDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, openedDate: e.target.value })}
                    className="w-full p-2 border border-amber-300 rounded-xl bg-white text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-amber-900 mb-1">Discard After (Days)</label>
                  <input
                    type="number"
                    min="7"
                    max="180"
                    value={formData.discardAfterDaysOpened}
                    onChange={(e) => setFormData({ ...formData, discardAfterDaysOpened: Number(e.target.value) })}
                    className="w-full p-2 border border-amber-300 rounded-xl bg-white text-xs font-bold font-mono"
                  />
                  <span className="text-[10px] text-amber-800">e.g. 28 days for eye drops</span>
                </div>
              </div>
            )}
          </div>

          {/* Location & Family Member */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kept in Room / Storage</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value as any })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
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
              <label className="block font-semibold text-slate-700 mb-1">Belongs To / For</label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value as any })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
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

          {/* Quantity & Dosage Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantity Left</label>
              <input
                type="text"
                placeholder="e.g. 8 tablets, 1 bottle half full"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Dosage Instructions / Advice</label>
              <input
                type="text"
                placeholder="e.g. 1 pill after food twice daily"
                value={formData.dosageNotes}
                onChange={(e) => setFormData({ ...formData, dosageNotes: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md shadow-teal-200 transition-all"
            >
              {editingMedicine ? 'Save Updates' : 'Add to Cabinet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
