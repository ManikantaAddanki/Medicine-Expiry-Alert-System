import React from 'react';
import { UserRole, Branch } from '../types/inventory';
import { Shield, Bell, Sparkles, Building2, UserCircle2, RefreshCw } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  branches: Branch[];
  currentBranchId: number;
  onBranchChange: (id: number) => void;
  activeAlertCount: number;
  onOpenAiAssistant: () => void;
  onRunScan: () => void;
  isScanning: boolean;
  lastScanTime: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  branches,
  currentBranchId,
  onBranchChange,
  activeAlertCount,
  onOpenAiAssistant,
  onRunScan,
  isScanning,
  lastScanTime
}) => {
  const roleLabels: Record<UserRole, { label: string; color: string; desc: string }> = {
    admin: { label: 'Administrator', color: 'bg-purple-100 text-purple-800 border-purple-200', desc: 'Full System Access' },
    pharmacist: { label: 'Pharmacist', color: 'bg-teal-100 text-teal-800 border-teal-200', desc: 'Inventory & Quarantine' },
    staff: { label: 'Staff Member', color: 'bg-blue-100 text-blue-800 border-blue-200', desc: 'Dispensing & Scanning' },
    auditor: { label: 'Auditor (Read-Only)', color: 'bg-amber-100 text-amber-800 border-amber-200', desc: 'Inspection & Logs Only' }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-6 py-2.5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Brand & Organization */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-200">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Medicine Expiry Alert System</h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Hospital Edition
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Building2 className="w-3.5 h-3.5" />
              <select
                aria-label="Select Pharmacy Branch"
                value={currentBranchId}
                onChange={(e) => onBranchChange(Number(e.target.value))}
                className="bg-transparent font-medium text-slate-700 hover:text-teal-700 focus:outline-none cursor-pointer"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                ))}
              </select>
              <span>·</span>
              <span className="text-slate-400">Scan: {lastScanTime.split(' ')[1] || '06:00:00'}</span>
            </div>
          </div>
        </div>

        {/* Right: Controls, Role Switcher, AI, Scan */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Scan Button */}
          <button
            onClick={onRunScan}
            disabled={isScanning}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              isScanning 
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                : 'bg-white hover:bg-teal-50 text-teal-700 border-teal-200 hover:border-teal-300 shadow-xs'
            }`}
            title="Trigger automated background expiry scan"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-teal-600' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Run Scan'}</span>
          </button>

          {/* AI Inventory Assistant Button */}
          <button
            onClick={onOpenAiAssistant}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-xs transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Assistant</span>
          </button>

          {/* Role Switcher (RBAC interactive selector) */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <UserCircle2 className="w-4 h-4 text-slate-500 ml-1" />
            <select
              aria-label="Current Role"
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="text-xs font-medium bg-transparent text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              <option value="admin">Role: Admin</option>
              <option value="pharmacist">Role: Pharmacist</option>
              <option value="staff">Role: Staff Member</option>
              <option value="auditor">Role: Auditor (Read-Only)</option>
            </select>
          </div>

          {/* Active Alerts Bell */}
          <div className="relative">
            <div className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer">
              <Bell className="w-4 h-4" />
            </div>
            {activeAlertCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeAlertCount > 9 ? '9+' : activeAlertCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
