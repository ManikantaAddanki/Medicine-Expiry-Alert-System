import React, { useState } from 'react';
import { Medicine, Batch, UserRole } from '../types/inventory';
import { Search, Plus, Filter, Pill, AlertCircle, Check, X } from 'lucide-react';

interface MedicineCatalogViewProps {
  medicines: Medicine[];
  batches: Batch[];
  currentRole: UserRole;
  onAddMedicine: (newMed: Omit<Medicine, 'id'>) => void;
  onUpdateMedicine: (med: Medicine) => void;
  onSelectMedicineForBatches: (medId: number) => void;
}

export const MedicineCatalogView: React.FC<MedicineCatalogViewProps> = ({
  medicines,
  batches,
  currentRole,
  onAddMedicine,
  onUpdateMedicine,
  onSelectMedicineForBatches
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);

  const canEdit = currentRole === 'admin' || currentRole === 'pharmacist';

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(medicines.map(m => m.category)))];

  // Filter medicines
  const filtered = medicines.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.generic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    brand_name: '',
    category: 'Analgesics',
    dosage_form: 'Tablet' as Medicine['dosage_form'],
    strength: '500 mg',
    manufacturer: '',
    barcode: '',
    storage_instructions: 'Store below 25°C in a dry place',
    is_prescription_required: false,
    minimum_reorder_level: 50,
    unit_of_measure: 'tablets'
  });

  const handleOpenAdd = () => {
    setEditingMed(null);
    setFormData({
      name: '',
      generic_name: '',
      brand_name: '',
      category: 'Analgesics',
      dosage_form: 'Tablet',
      strength: '500 mg',
      manufacturer: '',
      barcode: `890100${Math.floor(1000 + Math.random() * 9000)}`,
      storage_instructions: 'Store below 25°C in a dry place',
      is_prescription_required: false,
      minimum_reorder_level: 50,
      unit_of_measure: 'tablets'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: Medicine) => {
    setEditingMed(m);
    setFormData({
      name: m.name,
      generic_name: m.generic_name,
      brand_name: m.brand_name || '',
      category: m.category,
      dosage_form: m.dosage_form,
      strength: m.strength,
      manufacturer: m.manufacturer,
      barcode: m.barcode,
      storage_instructions: m.storage_instructions,
      is_prescription_required: m.is_prescription_required,
      minimum_reorder_level: m.minimum_reorder_level,
      unit_of_measure: m.unit_of_measure
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMed) {
      onUpdateMedicine({
        ...editingMed,
        ...formData
      });
    } else {
      onAddMedicine(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Controls: Title, Search, Category Tabs, Add Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Medicine Master Catalog</h2>
          <p className="text-xs text-slate-500">
            Approved pharmaceutical formulations, strengths, dosage classifications, and minimum stock boundaries
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xs flex items-center gap-1.5 self-start md:self-auto transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Formulation</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by brand name, generic name, barcode, manufacturer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        {/* Category Pill Filters (Segmented Filter Bar) */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Medicine & Generic Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Dosage / Strength</th>
                <th className="py-3 px-4">Manufacturer</th>
                <th className="py-3 px-4">Barcode / SKU</th>
                <th className="py-3 px-4 text-center">Batches Tracked</th>
                <th className="py-3 px-4 text-center">Active Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No medicine formulations found matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const medBatches = batches.filter(b => b.medicine_id === m.id);
                  const activeStock = medBatches
                    .filter(b => b.status === 'ACTIVE')
                    .reduce((sum, b) => sum + b.available_quantity, 0);
                  const isLow = activeStock < m.minimum_reorder_level;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {m.generic_name} {m.brand_name && `· (${m.brand_name})`}
                        </div>
                        {m.is_prescription_required && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                            Rx Prescription Required
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700">{m.category}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{m.dosage_form}</div>
                        <div className="text-slate-500">{m.strength}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">{m.manufacturer}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{m.barcode}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onSelectMedicineForBatches(m.id)}
                          className="font-bold text-teal-700 hover:text-teal-800 hover:underline"
                          title="Click to view all batches for this medicine"
                        >
                          {medBatches.length} batches
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className={`font-bold ${isLow ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {activeStock} {m.unit_of_measure}
                        </div>
                        {isLow && (
                          <span className="text-[10px] text-amber-600 font-medium">
                            Min: {m.minimum_reorder_level}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => onSelectMedicineForBatches(m.id)}
                          className="text-teal-700 hover:text-teal-800 font-medium"
                        >
                          Batches &rarr;
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="text-slate-500 hover:text-slate-800 font-medium"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Formulation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {editingMed ? 'Edit Medicine Formulation' : 'Register New Formulation Master'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Medicine Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol 500mg"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Generic / Scientific Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acetaminophen"
                    value={formData.generic_name}
                    onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Therapeutic Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Antibiotics"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosage Form *</label>
                  <select
                    value={formData.dosage_form}
                    onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                    <option value="Drops">Drops</option>
                    <option value="Inhaler">Inhaler</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Strength *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500 mg"
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Manufacturer *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pfizer Inc / GSK"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Barcode / SKU Identifier</label>
                  <input
                    type="text"
                    placeholder="e.g. 890123456789"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Minimum Safety Reorder Level</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minimum_reorder_level}
                    onChange={(e) => setFormData({ ...formData, minimum_reorder_level: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_prescription_required}
                      onChange={(e) => setFormData({ ...formData, is_prescription_required: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-700">Requires Doctor Prescription (Rx)</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingMed ? 'Save Changes' : 'Create Formulation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
