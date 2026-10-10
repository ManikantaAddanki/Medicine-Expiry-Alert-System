import React, { useState } from 'react';
import { ExpiryAlert, AlertSeverity, UserRole } from '../types/inventory';
import { 
  AlertTriangle, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  DollarSign, 
  ShieldAlert, 
  RotateCcw, 
  Trash2, 
  Check, 
  Download
} from 'lucide-react';

interface AlertCenterViewProps {
  alerts: ExpiryAlert[];
  currentRole: UserRole;
  onRunScan: () => void;
  isScanning: boolean;
  lastScanTime: string;
  onQuarantineBatch: (batchId: number, reason: string) => void;
  onAcknowledgeAlert: (alertId: number) => void;
  onOpenFefo: () => void;
}

export const AlertCenterView: React.FC<AlertCenterViewProps> = ({
  alerts,
  currentRole,
  onRunScan,
  isScanning,
  lastScanTime,
  onQuarantineBatch,
  onAcknowledgeAlert,
  onOpenFefo
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const canAction = currentRole === 'admin' || currentRole === 'pharmacist';

  const filteredAlerts = alerts.filter(a => {
    if (selectedSeverity === 'ALL') return true;
    return a.severity === selectedSeverity;
  });

  const totalValueAtRisk = alerts.reduce((sum, a) => sum + a.estimated_value_at_risk, 0);
  const expiredCount = alerts.filter(a => a.severity === 'EXPIRED').length;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const highCount = alerts.filter(a => a.severity === 'HIGH').length;

  const handleExportCsv = () => {
    const headers = ['Medicine Name,Batch Number,Expiry Date,Days Remaining,Severity,Units,Value at Risk,Status'];
    const rows = alerts.map(a => 
      `"${a.medicine_name}","${a.batch_number}","${a.expiry_date}",${a.days_remaining},"${a.severity}",${a.units_affected},${a.estimated_value_at_risk},"${a.status}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `expiry_risk_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Scan Action */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Automated Expiry Alert Engine</h2>
            <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
              {alerts.length} Active Alerts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            APScheduler periodic scan interval: 24 hours · Last successful scan execution: <span className="font-semibold text-slate-700">{lastScanTime}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Risk CSV</span>
          </button>
          <button
            onClick={onRunScan}
            disabled={isScanning}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-all ${
              isScanning
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600 shadow-xs'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning Batches...' : 'Run Expiry Scan Now'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs">
          <span className="text-xs font-semibold text-rose-700 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" /> Expired Stock
          </span>
          <div className="text-2xl font-bold text-rose-600 mt-1">{expiredCount} batches</div>
          <div className="text-[10px] text-rose-600/80 mt-0.5">Immediate write-off / return</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-red-200 shadow-xs">
          <span className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-red-600" /> Critical (&le; 7 Days)
          </span>
          <div className="text-2xl font-bold text-red-600 mt-1">{criticalCount} batches</div>
          <div className="text-[10px] text-red-600/80 mt-0.5">Last clinical dispensing window</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
          <span className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600" /> High Priority (&le; 30 Days)
          </span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{highCount} batches</div>
          <div className="text-[10px] text-amber-600/80 mt-0.5">Prioritize via FEFO</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-slate-600" /> Total Capital at Risk
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">${totalValueAtRisk.toFixed(2)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Across all flagged horizons</div>
        </div>
      </div>

      {/* Severity Filter Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1 overflow-x-auto">
        {[
          { id: 'ALL', label: `All Alerts (${alerts.length})` },
          { id: 'EXPIRED', label: `Expired (${expiredCount})`, color: 'text-rose-600' },
          { id: 'CRITICAL', label: `Critical ≤7d (${criticalCount})`, color: 'text-red-600' },
          { id: 'HIGH', label: `High ≤30d (${highCount})`, color: 'text-amber-600' },
          { id: 'WARNING', label: `Warning ≤60d (${alerts.filter(a => a.severity === 'WARNING').length})` },
          { id: 'UPCOMING', label: `Upcoming ≤90d (${alerts.filter(a => a.severity === 'UPCOMING').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedSeverity(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              selectedSeverity === tab.id
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Severity Tier</th>
                <th className="py-3 px-4">Medicine Name</th>
                <th className="py-3 px-4">Batch Number</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Days Left / Overdue</th>
                <th className="py-3 px-4 text-center">Units at Risk</th>
                <th className="py-3 px-4">Value at Risk ($)</th>
                <th className="py-3 px-4 text-right">Operational Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No active expiry alerts in this category.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => {
                  const isExp = alert.days_remaining <= 0;
                  return (
                    <tr key={alert.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          alert.severity === 'EXPIRED'
                            ? 'bg-rose-100 text-rose-800'
                            : alert.severity === 'CRITICAL'
                            ? 'bg-red-100 text-red-800'
                            : alert.severity === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : alert.severity === 'WARNING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{alert.medicine_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{alert.batch_number}</td>
                      <td className="py-3 px-4 font-mono font-medium">{alert.expiry_date}</td>
                      <td className="py-3 px-4">
                        {isExp ? (
                          <span className="font-bold text-rose-600">
                            Expired ({Math.abs(alert.days_remaining)} days ago)
                          </span>
                        ) : (
                          <span className={`font-semibold ${
                            alert.days_remaining <= 7 
                              ? 'text-red-600' 
                              : alert.days_remaining <= 30 
                              ? 'text-amber-700' 
                              : 'text-slate-700'
                          }`}>
                            {alert.days_remaining} days remaining
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {alert.units_affected} units
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        ${alert.estimated_value_at_risk.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        {canAction && (
                          <>
                            <button
                              onClick={() => onQuarantineBatch(alert.batch_id, `Auto-flagged from Expiry Alert: ${alert.severity} (${alert.days_remaining}d)`)}
                              className="px-2 py-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium"
                              title="Immediately quarantine and freeze from stock"
                            >
                              Quarantine
                            </button>
                            {!isExp && (
                              <button
                                onClick={onOpenFefo}
                                className="px-2 py-1 rounded bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium"
                                title="Dispense via First Expiry First Out"
                              >
                                FEFO Dispense
                              </button>
                            )}
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
    </div>
  );
};
