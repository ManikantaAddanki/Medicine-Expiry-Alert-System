import React, { useState } from 'react';
import { Medicine, Batch, Supplier, UserRole, BatchStatus } from '../types/inventory';
import { calculateDaysRemaining, CURRENT_SYSTEM_DATE } from '../services/alertEngine';
import { 
  Plus, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  SlidersHorizontal, 
  QrCode, 
  Boxes, 
  X,
  AlertTriangle,
  History
} from 'lucide-react';

interface BatchInventoryViewProps {
  batches: Batch[];
  medicines: Medicine[];
  suppliers: Supplier[];
  currentRole: UserRole;
  selectedMedicineId?: number | null;
  onClearMedicineFilter: () => void;
  onAddBatch: (newBatch: Omit<Batch, 'id' | 'received_at'>) => void;
  onQuarantineBatch: (batchId: number, reason: string) => void;
  onReleaseBatch: (batchId: number, reason: string) => void;
  onAdjustStock: (batchId: number, newQty: number, reason: string) => void;
  onShowQr: (batch: Batch) => void;
  onOpenFefo: () => void;
}

export const BatchInventoryView: React.FC<BatchInventoryViewProps> = ({
  batches,
  medicines,
  suppliers,
  currentRole,
  selectedMedicineId,
  onClearMedicineFilter,
  onAddBatch,
  onQuarantineBatch,
  onReleaseBatch,
  onAdjustStock,
  onShowQr,
  onOpenFefo
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [actionBatch, setActionBatch] = useState<Batch | null>(null);
  const [actionType, setActionType] = useState<'QUARANTINE' | 'RELEASE' | 'ADJUST' | null>(null);
  const [reasonInput, setReasonInput] = useState('');
  const [adjustmentQty, setAdjustmentQty] = useState<number>(0);

  const canMutate = currentRole === 'admin' || currentRole === 'pharmacist';

  // New Batch Form State
  const [newBatchData, setNewBatchData] = useState({
    medicine_id: medicines[0]?.id || 1,
    branch_id: 1,
    supplier_id: suppliers[0]?.id || 1,
    batch_number: '',
    manufacturing_date: '2025-06-01',
    expiry_date: '2027-06-01',
    quantity_received: 100,
    available_quantity: 100,
    purchase_price: 2.50,
    selling_price: 5.00,
    storage_location: 'Rack A-01 (Shelf 1)',
    status: 'ACTIVE' as BatchStatus
  });

  const medMap = new Map(medicines.map(m => [m.id, m]));
  const supplierMap = new Map(suppliers.map(s => [s.id, s]));

  // Filter batches
  const filteredBatches = batches.filter(b => {
    const med = medMap.get(b.medicine_id);
    const medName = med ? med.name.toLowerCase() : '';
    const matchesSearch = 
      b.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medName.includes(searchTerm.toLowerCase()) ||
      b.storage_location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMed = selectedMedicineId ? b.medicine_id === selectedMedicineId : true;
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;

    return matchesSearch && matchesMed && matchesStatus;
  });

  // Sort batches by earliest expiry date first
  const sortedBatches = [...filteredBatches].sort((a, b) => {
    return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
  });

  const handleOpenAction = (b: Batch, type: 'QUARANTINE' | 'RELEASE' | 'ADJUST') => {
    setActionBatch(b);
    setActionType(type);
    setReasonInput('');
    setAdjustmentQty(b.available_quantity);
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionBatch || !actionType) return;

    if (actionType === 'QUARANTINE') {
      onQuarantineBatch(actionBatch.id, reasonInput || 'Flagged for quality inspection');
    } else if (actionType === 'RELEASE') {
      onReleaseBatch(actionBatch.id, reasonInput || 'Quality inspection cleared; released back to active stock');
    } else if (actionType === 'ADJUST') {
      onAdjustStock(actionBatch.id, adjustmentQty, reasonInput || 'Physical stock audit adjustment');
    }

    setActionBatch(null);
    setActionType(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddBatch({
      ...newBatchData,
      available_quantity: Number(newBatchData.available_quantity),
      quantity_received: Number(newBatchData.quantity_received),
      purchase_price: Number(newBatchData.purchase_price),
      selling_price: Number(newBatchData.selling_price)
    });
    setIsAddBatchOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Batch-Level Inventory Tracking</h2>
            {selectedMedicineId && (
              <span className="text-xs bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                Filtered: {medMap.get(selectedMedicineId)?.name}
                <button onClick={onClearMedicineFilter} className="hover:text-teal-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Granular batch tracking with specific expiry dates, rack bins, unit costs, and quarantine states
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={onOpenFefo}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <span>Dispense via FEFO</span>
          </button>
          {canMutate && (
            <button
              onClick={() => setIsAddBatchOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Receive New Batch</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search batch number, medicine name, storage location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {['ALL', 'ACTIVE', 'QUARANTINED', 'EXPIRED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Medicine Details</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Days Left / Overdue</th>
                <th className="py-3 px-4 text-center">Available / Received</th>
                <th className="py-3 px-4">Cost / Retail</th>
                <th className="py-3 px-4">Storage Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sortedBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No batches found matching filter criteria.
                  </td>
                </tr>
              ) : (
                sortedBatches.map((b) => {
                  const med = medMap.get(b.medicine_id);
                  const days = calculateDaysRemaining(b.expiry_date, CURRENT_SYSTEM_DATE);
                  const isExp = days <= 0;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{b.batch_number}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Mfg: {b.manufacturing_date || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{med ? med.name : `Med #${b.medicine_id}`}</div>
                        <div className="text-[11px] text-slate-500">{med?.dosage_form} · {med?.strength}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        {b.expiry_date}
                      </td>
                      <td className="py-3 px-4">
                        {isExp ? (
                          <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Expired ({Math.abs(days)}d ago)
                          </span>
                        ) : days <= 7 ? (
                          <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            {days} days left (Critical)
                          </span>
                        ) : days <= 30 ? (
                          <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {days} days left (High)
                          </span>
                        ) : days <= 60 ? (
                          <span className="font-medium text-amber-600 bg-amber-50/60 px-2 py-0.5 rounded">
                            {days} days left (Warning)
                          </span>
                        ) : (
                          <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            {days} days left
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="font-bold text-slate-900">{b.available_quantity} units</div>
                        <div className="text-[10px] text-slate-400">of {b.quantity_received} received</div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div>Cost: ${b.purchase_price.toFixed(2)}</div>
                        <div className="text-[11px] text-slate-500">Sell: ${b.selling_price.toFixed(2)}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {b.storage_location}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          b.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'QUARANTINED'
                            ? 'bg-purple-100 text-purple-800'
                            : b.status === 'EXPIRED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {b.status}
                        </span>
                        {b.status === 'QUARANTINED' && b.quarantine_reason && (
                          <div className="text-[10px] text-purple-700 mt-0.5 max-w-[140px] truncate" title={b.quarantine_reason}>
                            {b.quarantine_reason}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {/* QR Code view */}
                        <button
                          onClick={() => onShowQr(b)}
                          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          title="Generate QR / Barcode Card"
                        >
                          <QrCode className="w-4 h-4 inline" />
                        </button>

                        {/* Mutate Controls for Admin & Pharmacist */}
                        {canMutate && (
                          <>
                            {b.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleOpenAction(b, 'QUARANTINE')}
                                className="text-purple-700 hover:text-purple-900 font-medium"
                                title="Lock batch from dispensing due to defect or check"
                              >
                                Quarantine
                              </button>
                            )}
                            {b.status === 'QUARANTINED' && (
                              <button
                                onClick={() => handleOpenAction(b, 'RELEASE')}
                                className="text-emerald-700 hover:text-emerald-900 font-semibold"
                                title="Release batch back to active dispensing"
                              >
                                Release
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenAction(b, 'ADJUST')}
                              className="text-slate-500 hover:text-slate-800 font-medium"
                              title="Audit physical count adjustment"
                            >
                              Adjust
                            </button>
                          </>
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

      {/* Receive New Batch Modal */}
      {isAddBatchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Receive & Intake New Medicine Batch</h3>
              <button 
                onClick={() => setIsAddBatchOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Formulation *</label>
                  <select
                    value={newBatchData.medicine_id}
                    onChange={(e) => setNewBatchData({ ...newBatchData, medicine_id: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    {medicines.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.dosage_form} - {m.strength})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PCM-2026-N01"
                    value={newBatchData.batch_number}
                    onChange={(e) => setNewBatchData({ ...newBatchData, batch_number: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Manufacturing Date</label>
                  <input
                    type="date"
                    value={newBatchData.manufacturing_date}
                    onChange={(e) => setNewBatchData({ ...newBatchData, manufacturing_date: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={newBatchData.expiry_date}
                    onChange={(e) => setNewBatchData({ ...newBatchData, expiry_date: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity Received *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newBatchData.quantity_received}
                    onChange={(e) => {
                      const q = Number(e.target.value);
                      setNewBatchData({ ...newBatchData, quantity_received: q, available_quantity: q });
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newBatchData.purchase_price}
                    onChange={(e) => setNewBatchData({ ...newBatchData, purchase_price: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newBatchData.selling_price}
                    onChange={(e) => setNewBatchData({ ...newBatchData, selling_price: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Storage Location Rack / Bin *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shelf A-01, Fridge B"
                    value={newBatchData.storage_location}
                    onChange={(e) => setNewBatchData({ ...newBatchData, storage_location: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier Vendor *</label>
                  <select
                    value={newBatchData.supplier_id}
                    onChange={(e) => setNewBatchData({ ...newBatchData, supplier_id: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBatchOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Receive Batch Intake
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Dialog (Quarantine / Release / Adjust) */}
      {actionBatch && actionType && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {actionType === 'QUARANTINE' && 'Quarantine Batch Lock'}
                {actionType === 'RELEASE' && 'Release Batch to Active Pool'}
                {actionType === 'ADJUST' && 'Stock Count Adjustment'}
              </h3>
              <button 
                onClick={() => { setActionBatch(null); setActionType(null); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAction} className="mt-4 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-800">
                  {medMap.get(actionBatch.medicine_id)?.name}
                </div>
                <div className="font-mono text-slate-600">
                  Batch: <strong>{actionBatch.batch_number}</strong> · Available: {actionBatch.available_quantity} units
                </div>
                <div className="text-slate-500">
                  Expiry: {actionBatch.expiry_date}
                </div>
              </div>

              {actionType === 'ADJUST' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Physical Count *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={adjustmentQty}
                    onChange={(e) => setAdjustmentQty(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg text-base font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    Difference: {adjustmentQty - actionBatch.available_quantity > 0 ? `+${adjustmentQty - actionBatch.available_quantity}` : adjustmentQty - actionBatch.available_quantity} units
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Audit Reason / Incident Justification *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={
                    actionType === 'QUARANTINE'
                      ? 'e.g. Blister foil damage, broken seal, regulatory advisory...'
                      : actionType === 'RELEASE'
                      ? 'e.g. QA testing lab report cleared, re-inspection passed...'
                      : 'e.g. Annual physical inventory reconciliation difference...'
                  }
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setActionBatch(null); setActionType(null); }}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg font-semibold text-white shadow-xs ${
                    actionType === 'QUARANTINE'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : actionType === 'RELEASE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-teal-600 hover:bg-teal-700'
                  }`}
                >
                  Confirm & Write to Audit Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
