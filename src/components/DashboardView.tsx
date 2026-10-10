import React from 'react';
import { Medicine, Batch, ExpiryAlert, SystemSettings, UserRole } from '../types/inventory';
import { 
  AlertTriangle, 
  Clock, 
  Pill, 
  Boxes, 
  DollarSign, 
  ShieldAlert, 
  TrendingDown, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface DashboardViewProps {
  medicines: Medicine[];
  batches: Batch[];
  alerts: ExpiryAlert[];
  settings: SystemSettings;
  currentRole: UserRole;
  onNavigate: (tab: any) => void;
  onOpenFefo: () => void;
  onOpenAiAssistant: () => void;
  onRunScan: () => void;
  isScanning: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  medicines,
  batches,
  alerts,
  settings,
  currentRole,
  onNavigate,
  onOpenFefo,
  onOpenAiAssistant,
  onRunScan,
  isScanning
}) => {
  // Compute Key Metrics
  const totalAvailableUnits = batches.reduce((sum, b) => sum + (b.status === 'ACTIVE' ? b.available_quantity : 0), 0);
  const expiredAlerts = alerts.filter(a => a.severity === 'EXPIRED');
  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL');
  const highAlerts = alerts.filter(a => a.severity === 'HIGH');
  const warningAlerts = alerts.filter(a => a.severity === 'WARNING');
  const upcomingAlerts = alerts.filter(a => a.severity === 'UPCOMING');

  const quarantinedBatches = batches.filter(b => b.status === 'QUARANTINED');
  const totalValueAtRisk = alerts.reduce((sum, a) => sum + a.estimated_value_at_risk, 0);

  // Compute low stock medicines
  const lowStockMedicines = medicines.filter(m => {
    const activeUnits = batches
      .filter(b => b.medicine_id === m.id && b.status === 'ACTIVE')
      .reduce((s, b) => s + b.available_quantity, 0);
    return activeUnits < m.minimum_reorder_level;
  });

  // Monthly Expiry Breakdown (simulated aggregation from batch expiry dates)
  const monthlyData = [
    { month: 'Oct 2026', count: alerts.filter(a => a.expiry_date.startsWith('2026-10')).length, units: 138, value: 720.50, color: 'bg-rose-500' },
    { month: 'Nov 2026', count: alerts.filter(a => a.expiry_date.startsWith('2026-11')).length, units: 165, value: 415.50, color: 'bg-amber-500' },
    { month: 'Dec 2026', count: alerts.filter(a => a.expiry_date.startsWith('2026-12')).length, units: 80, value: 721.00, color: 'bg-blue-500' },
    { month: 'Q1 2027', count: 2, units: 120, value: 580.00, color: 'bg-indigo-400' },
    { month: 'Mid 2027+', count: 4, units: 342, value: 1420.00, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Status & Quick Action */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Real-Time Inventory Surveillance</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            System reference calendar: <span className="font-semibold text-slate-700">October 10, 2026</span> · Daily scheduler active · Thresholds: 7d critical, 30d high, 60d warning, 90d upcoming
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenFefo}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <span>FEFO Dispenser Tool</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRunScan}
            disabled={isScanning}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-teal-600' : ''}`} />
            <span>Trigger Scan</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Expired Batches */}
        <div 
          onClick={() => onNavigate('alerts')}
          className="bg-white rounded-xl p-4 border border-rose-200 hover:border-rose-400 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Expired Batches</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 tracking-tight">{expiredAlerts.length}</div>
          <div className="text-[11px] text-rose-600/80 mt-1 flex items-center gap-1">
            <span>Zero-dispense locked</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Critical Expiry (<= 7d) */}
        <div 
          onClick={() => onNavigate('alerts')}
          className="bg-white rounded-xl p-4 border border-red-200 hover:border-red-400 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700">Critical (&le; 7 Days)</span>
            <span className="p-1.5 rounded-lg bg-red-50 text-red-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600 tracking-tight">{criticalAlerts.length}</div>
          <div className="text-[11px] text-red-600/80 mt-1 flex items-center gap-1">
            <span>Urgent vendor return window</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* High Priority (8 - 30d) */}
        <div 
          onClick={() => onNavigate('alerts')}
          className="bg-white rounded-xl p-4 border border-amber-200 hover:border-amber-400 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Expiring (&le; 30 Days)</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 tracking-tight">{highAlerts.length}</div>
          <div className="text-[11px] text-amber-600/80 mt-1 flex items-center gap-1">
            <span>Prioritize in FEFO rotation</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Total Value at Risk */}
        <div 
          onClick={() => onNavigate('alerts')}
          className="bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Capital at Risk</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">${totalValueAtRisk.toFixed(2)}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Across {alerts.length} risk batches</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Low Stock SKUs */}
        <div 
          onClick={() => onNavigate('low_stock')}
          className="bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Low Stock SKUs</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 tracking-tight">{lowStockMedicines.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Below minimum threshold</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Quarantined Stock */}
        <div 
          onClick={() => onNavigate('batches')}
          className="bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Quarantined Batches</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-700 tracking-tight">{quarantinedBatches.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Frozen from inventory pool</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Total Active Formulations */}
        <div 
          onClick={() => onNavigate('medicines')}
          className="bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Active Formulations</span>
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <Pill className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">{medicines.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>{batches.length} total batches tracked</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Total Available Units */}
        <div 
          onClick={() => onNavigate('batches')}
          className="bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Eligible Active Units</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Boxes className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 tracking-tight">{totalAvailableUnits}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Non-expired, non-quarantined</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Analytics Charts & Visual Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Monthly Expiry Risk Timeline */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Projected Expiry Timeline by Month</h3>
              <p className="text-xs text-slate-500">Scheduled batch expiries requiring disposal or utilization</p>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Total: {alerts.length} batches
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="space-y-3.5 pt-2">
            {monthlyData.map((item, idx) => {
              const maxUnits = 200;
              const pct = Math.min(100, Math.round((item.units / maxUnits) * 100));
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.month}</span>
                    <span className="text-slate-500">
                      <strong className="text-slate-800">{item.units} units</strong> ({item.count} batches) · <span className="font-mono text-slate-600">${item.value.toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Expired / Critical
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> High (30d)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Warning (60d)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Safe Stock (&gt;90d)
            </span>
          </div>
        </div>

        {/* Right: Stock Health Status Breakdown */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Batch Health Segmentation</h3>
            <p className="text-xs text-slate-500 mb-4">Inventory compliance classification</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-xs">
                <span className="font-medium text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Healthy Stock (&gt; 90d)
                </span>
                <span className="font-bold text-emerald-900">
                  {batches.filter(b => b.status === 'ACTIVE' && !alerts.some(a => a.batch_id === b.id)).length} batches
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 text-xs">
                <span className="font-medium text-blue-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" /> Upcoming (61 - 90d)
                </span>
                <span className="font-bold text-blue-900">{upcomingAlerts.length} batches</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 text-xs">
                <span className="font-medium text-amber-800 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Warning & High (8 - 60d)
                </span>
                <span className="font-bold text-amber-900">{highAlerts.length + warningAlerts.length} batches</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 text-xs">
                <span className="font-medium text-rose-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Critical & Expired (&le; 7d)
                </span>
                <span className="font-bold text-rose-900">{expiredAlerts.length + criticalAlerts.length} batches</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50 text-xs">
                <span className="font-medium text-purple-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-600" /> Quarantined / Recalled
                </span>
                <span className="font-bold text-purple-900">{quarantinedBatches.length} batches</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={onOpenAiAssistant}
              className="w-full py-2 px-3 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Ask AI for Expiry Risk Advice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Urgent Action Batches Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Urgent Batches Requiring Action</h3>
            <p className="text-xs text-slate-500">Batches expired or expiring within 7 days</p>
          </div>
          <button
            onClick={() => onNavigate('alerts')}
            className="text-xs text-teal-700 font-semibold hover:text-teal-800 flex items-center gap-1"
          >
            <span>View All {alerts.length} Alerts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Medicine Name</th>
                <th className="py-2.5 px-4">Batch No.</th>
                <th className="py-2.5 px-4">Expiry Date</th>
                <th className="py-2.5 px-4">Days Left</th>
                <th className="py-2.5 px-4">Units</th>
                <th className="py-2.5 px-4">Value at Risk</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {alerts.slice(0, 5).map((alert) => {
                const isExp = alert.days_remaining <= 0;
                return (
                  <tr key={alert.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{alert.medicine_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{alert.batch_number}</td>
                    <td className="py-3 px-4 font-mono">{alert.expiry_date}</td>
                    <td className="py-3 px-4">
                      {isExp ? (
                        <span className="font-bold text-rose-600">Expired ({Math.abs(alert.days_remaining)}d ago)</span>
                      ) : (
                        <span className={`font-semibold ${alert.days_remaining <= 7 ? 'text-red-600' : 'text-amber-600'}`}>
                          {alert.days_remaining} days left
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium">{alert.units_affected} units</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">${alert.estimated_value_at_risk.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        isExp 
                          ? 'bg-rose-100 text-rose-800' 
                          : alert.severity === 'CRITICAL' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isExp ? (
                        <span className="text-rose-600 font-medium">Disposal / Vendor Credit</span>
                      ) : (
                        <button
                          onClick={onOpenFefo}
                          className="text-teal-700 hover:text-teal-800 font-semibold"
                        >
                          Dispense via FEFO &rarr;
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
