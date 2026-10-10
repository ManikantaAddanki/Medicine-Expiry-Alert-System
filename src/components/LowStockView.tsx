import React, { useState } from 'react';
import { Medicine, Batch, Supplier, UserRole } from '../types/inventory';
import { TrendingDown, AlertCircle, ShoppingCart, Check, Truck, Building } from 'lucide-react';

interface LowStockViewProps {
  medicines: Medicine[];
  batches: Batch[];
  suppliers: Supplier[];
  currentRole: UserRole;
}

export const LowStockView: React.FC<LowStockViewProps> = ({
  medicines,
  batches,
  suppliers,
  currentRole
}) => {
  const [poCreated, setPoCreated] = useState<number | null>(null);

  const supplierMap = new Map(suppliers.map(s => [s.id, s]));

  // Calculate medicines with active stock below minimum reorder level
  const lowStockItems = medicines.map(m => {
    const activeBatches = batches.filter(b => b.medicine_id === m.id && b.status === 'ACTIVE');
    const totalActiveUnits = activeBatches.reduce((sum, b) => sum + b.available_quantity, 0);
    const deficit = Math.max(0, m.minimum_reorder_level - totalActiveUnits);
    const isLow = totalActiveUnits < m.minimum_reorder_level;
    const avgPrice = activeBatches.length > 0
      ? activeBatches.reduce((sum, b) => sum + b.purchase_price, 0) / activeBatches.length
      : 3.50;

    return {
      medicine: m,
      totalActiveUnits,
      deficit,
      isLow,
      suggestedReorder: deficit + 50, // Reorder back to safety buffer
      estimatedCost: (deficit + 50) * avgPrice,
      activeBatchesCount: activeBatches.length
    };
  }).filter(item => item.isLow);

  const handleGeneratePo = (medId: number) => {
    setPoCreated(medId);
    setTimeout(() => {
      setPoCreated(null);
    }, 3000);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Low Stock & Reorder Advisor</h2>
        <p className="text-xs text-slate-500">
          Proactively flags formulations falling below statutory safety buffers to prevent stockouts
        </p>
      </div>

      {lowStockItems.length === 0 ? (
        <div className="bg-white rounded-xl p-8 border border-slate-200 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">All Medications Healthy</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Every active formulation currently has sufficient stock above its required minimum safety threshold.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowStockItems.map((item) => {
            const m = item.medicine;
            const isOrdered = poCreated === m.id;

            return (
              <div key={m.id} className="bg-white rounded-xl p-5 border border-amber-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Deficit: {item.deficit} {m.unit_of_measure}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1.5">{m.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {m.generic_name} · {m.dosage_form} ({m.strength})
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-amber-600">{item.totalActiveUnits}</div>
                      <div className="text-[10px] text-slate-400">Available / Min: {m.minimum_reorder_level}</div>
                    </div>
                  </div>

                  {/* Progress bar to threshold */}
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Stock Fill Rate</span>
                      <span className="font-semibold text-slate-700">
                        {Math.round((item.totalActiveUnits / m.minimum_reorder_level) * 100)}% of buffer
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${Math.min(100, (item.totalActiveUnits / m.minimum_reorder_level) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Suggested Reorder Qty:</span>
                      <span className="font-bold text-slate-900 font-mono">+{item.suggestedReorder} {m.unit_of_measure}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Estimated Reorder Cost:</span>
                      <span className="font-bold text-slate-900 font-mono">${item.estimatedCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Recommended Vendor:</span>
                      <span className="font-medium text-slate-800">{m.manufacturer} Logistics</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Active Batches: {item.activeBatchesCount}
                  </span>
                  <button
                    onClick={() => handleGeneratePo(m.id)}
                    disabled={isOrdered}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                      isOrdered
                        ? 'bg-emerald-600 text-white'
                        : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                    }`}
                  >
                    {isOrdered ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>PO Draft Created!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Draft Reorder PO</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
