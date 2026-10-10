import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  ShieldCheck, 
  Mail, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Settings, 
  FileText, 
  RefreshCw, 
  UserCheck, 
  Key, 
  ChevronRight,
  Shield,
  Activity,
  Zap,
  Info
} from 'lucide-react';
import { authService, AppUserProfile } from '../services/authService';
import { UserRole, ROLE_CONFIGS, UserMedicine } from '../types/userMedicine';
import { autoEmailDispatcher, AutoDispatchConfig } from '../services/autoEmailDispatcher';
import { emailAlertService, EmailNotificationLog } from '../services/emailAlertService';
import { soundEffects } from '../services/soundEffects';

interface AdminModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUserProfile | null;
  medicines: UserMedicine[];
  onRoleChanged?: (user: AppUserProfile) => void;
}

export const AdminModuleModal: React.FC<AdminModuleModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  medicines,
  onRoleChanged
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'autoEmail' | 'compliance' | 'audit'>('users');
  const [usersList, setUsersList] = useState<AppUserProfile[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Auto Email config & logs
  const [autoConfig, setAutoConfig] = useState<AutoDispatchConfig>(() => autoEmailDispatcher.getConfig());
  const [isTriggeringScan, setIsTriggeringScan] = useState(false);
  const [emailLogs, setEmailLogs] = useState<EmailNotificationLog[]>(() => emailAlertService.getLogs());
  const [selectedLogPreview, setSelectedLogPreview] = useState<EmailNotificationLog | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setEmailLogs(emailAlertService.getLogs());
      setAutoConfig(autoEmailDispatcher.getConfig());
    }
  }, [isOpen]);

  useEffect(() => {
    return autoEmailDispatcher.subscribe(() => {
      setAutoConfig(autoEmailDispatcher.getConfig());
    });
  }, []);

  useEffect(() => {
    return emailAlertService.subscribe(() => {
      setEmailLogs(emailAlertService.getLogs());
    });
  }, []);

  if (!isOpen) return null;

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const list = await authService.getAllUsers();
      setUsersList(list);
    } catch (e) {
      console.warn('Failed to load users', e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await authService.updateUserRole(userId, newRole);
      soundEffects.playSuccessChime();
      setActionMessage(`Role updated to ${ROLE_CONFIGS[newRole].label} for user ID ${userId.slice(0, 8)}...`);
      setTimeout(() => setActionMessage(null), 4000);
      loadUsers();

      if (currentUser && currentUser.uid === userId && onRoleChanged) {
        onRoleChanged({ ...currentUser, role: newRole });
      }
    } catch (e) {
      soundEffects.playWarningTone();
      setActionMessage('Failed to update user role.');
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleSwitchToUser = (user: AppUserProfile) => {
    authService.loginAsDemoUser(user.displayName || 'Switched User', user.email || 'user@example.com', user.role);
    soundEffects.playSuccessChime();
    if (onRoleChanged) {
      onRoleChanged(user);
    }
    setActionMessage(`Switched active session to ${user.displayName} (${ROLE_CONFIGS[user.role].label})`);
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleTriggerAutoScanNow = async () => {
    setIsTriggeringScan(true);
    try {
      soundEffects.playNotificationPing();
      const res = await autoEmailDispatcher.runAutoCheck(medicines, currentUser?.email || undefined, true);
      soundEffects.playSuccessChime();
      setActionMessage(`⚡ Automated Scan Finished: ${res.emailsSent} alert email(s) dispatched to ${res.recipient}!`);
      setTimeout(() => setActionMessage(null), 5000);
      setEmailLogs(emailAlertService.getLogs());
    } catch (e: any) {
      soundEffects.playWarningTone();
      setActionMessage('Auto-check error: ' + (e.message || 'Failed'));
      setTimeout(() => setActionMessage(null), 4000);
    } finally {
      setIsTriggeringScan(false);
    }
  };

  const filteredUsers = usersList.filter(u => {
    const matchesSearch = 
      (u.displayName || '').toLowerCase().includes(searchUser.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchUser.toLowerCase()) ||
      u.role.toLowerCase().includes(searchUser.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-5 sm:p-6 border-b border-purple-800/40">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Admin Governance & Automation Portal
                  </h2>
                  <span className="text-[11px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/40 px-2.5 py-0.5 rounded-full">
                    Lead Authority
                  </span>
                </div>
                <p className="text-xs text-purple-200/80 mt-0.5">
                  Manage user roles, configure automated email expiry dispatches, and review cabinet safety compliance.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action notification banner */}
          {actionMessage && (
            <div className="mt-3 py-2 px-3.5 rounded-xl bg-purple-500/30 border border-purple-300/40 text-purple-100 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-purple-300 shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-purple-900/50 overflow-x-auto">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-white/5 text-purple-200/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users & Role Management ({usersList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('autoEmail')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'autoEmail'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-white/5 text-purple-200/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Automated Email Dispatcher</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              onClick={() => setActiveTab('compliance')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'compliance'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-white/5 text-purple-200/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Cabinet Safety Oversight</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-white/5 text-purple-200/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Security & Email Logs ({emailLogs.length})</span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/70">
          {/* TAB 1: USERS & ROLE MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-5">
              {/* Top Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['admin', 'caregiver', 'pharmacist', 'patient'] as UserRole[]).map(r => {
                  const cfg = ROLE_CONFIGS[r];
                  const count = usersList.filter(u => u.role === r).length;
                  return (
                    <div 
                      key={r}
                      onClick={() => setRoleFilter(roleFilter === r ? 'all' : r)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer bg-white shadow-xs ${
                        roleFilter === r ? 'ring-2 ring-purple-500 border-purple-500' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">{cfg.emoji}</span>
                        <span className="text-lg font-black text-slate-800">{count}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-1">{cfg.label}</p>
                      <p className="text-[10px] text-slate-500">Filter by {cfg.shortLabel}</p>
                    </div>
                  );
                })}
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Search user by name, email, or role..."
                  className="w-full sm:w-72 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 cursor-pointer"
                  >
                    <option value="all">All Security Roles</option>
                    <option value="admin">👑 Admin Only</option>
                    <option value="caregiver">🛡️ Caregiver Only</option>
                    <option value="pharmacist">💊 Pharmacist Only</option>
                    <option value="patient">👤 Patient Only</option>
                  </select>

                  <button
                    onClick={loadUsers}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                    title="Refresh users list"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Users List Table / Cards */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    System Accounts ({filteredUsers.length} total)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Admins can modify roles & test privileges in real-time
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const roleCfg = ROLE_CONFIGS[u.role] || ROLE_CONFIGS.caregiver;
                    const isSelf = currentUser?.uid === u.uid;

                    return (
                      <div key={u.uid} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* User Identity */}
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                            {roleCfg.emoji}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-900">{u.displayName || 'Unnamed User'}</p>
                              {isSelf && (
                                <span className="text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.2 rounded-md">
                                  You (Active)
                                </span>
                              )}
                              {u.isDemo && (
                                <span className="text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded-md">
                                  Demo Seed
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono">{u.email || 'No email registered'}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Registered: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active Member'}
                            </p>
                          </div>
                        </div>

                        {/* Current Role Badge & Selector */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-600">Assigned Role:</span>
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1 ${roleCfg.badgeClass}`}>
                              <span>{roleCfg.emoji}</span>
                              <span>{roleCfg.label}</span>
                            </span>
                          </div>

                          {/* Quick Change Role Dropdown */}
                          <div className="flex items-center gap-1.5">
                            <label className="text-[10px] text-slate-400">Change:</label>
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                              className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl px-2 py-1 font-semibold text-slate-800 cursor-pointer focus:ring-2 focus:ring-purple-500/20"
                            >
                              <option value="admin">👑 Admin</option>
                              <option value="caregiver">🛡️ Caregiver</option>
                              <option value="pharmacist">💊 Pharmacist</option>
                              <option value="patient">👤 Patient</option>
                            </select>
                          </div>

                          {/* Switch to this account button */}
                          <button
                            onClick={() => handleSwitchToUser(u)}
                            className="px-2.5 py-1 text-[11px] font-bold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors cursor-pointer"
                            title="Log in / switch to this persona immediately"
                          >
                            Switch Session
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Roles & Permissions Reference Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-600" />
                  <span>Security Role Authority Matrix</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {(['admin', 'caregiver', 'pharmacist', 'patient'] as UserRole[]).map(r => {
                    const cfg = ROLE_CONFIGS[r];
                    return (
                      <div key={r} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{cfg.emoji}</span>
                          <span className="text-xs font-bold text-slate-900">{cfg.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-tight">{cfg.description}</p>
                        <div className="space-y-1 pt-1 border-t border-slate-200">
                          {cfg.privileges.map((p, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[10px] text-slate-700">
                              <CheckCircle2 className="w-3 h-3 text-purple-600 shrink-0" />
                              <span>{p}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUTOMATED EMAIL DISPATCHER */}
          {activeTab === 'autoEmail' && (
            <div className="space-y-5">
              {/* Engine Status Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white border border-emerald-800/50 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">Automated Expiry Email Engine</h3>
                        <span className="text-[10px] font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                          ONLINE & MONITORING
                        </span>
                      </div>
                      <p className="text-xs text-emerald-200/80 mt-0.5">
                        Automatically scans medicine expiry dates and dispatches direct alert emails to the user's inbox when medications are expiring or expired.
                      </p>
                    </div>
                  </div>

                  {/* Manual Run Now Button */}
                  <button
                    onClick={handleTriggerAutoScanNow}
                    disabled={isTriggeringScan}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-md transition-all hover:scale-102 flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTriggeringScan ? 'animate-spin' : ''}`} />
                    <span>Run Auto-Scan & Dispatch Now</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-emerald-900/50 text-xs">
                  <div>
                    <span className="text-[10px] text-emerald-300/70 block">Target Email Destination:</span>
                    <span className="font-mono text-white text-[11px] truncate block">
                      {currentUser?.email || emailAlertService.getSettings().recipientEmail}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-300/70 block">Auto-Alert Status:</span>
                    <span className="font-bold text-emerald-400">
                      {autoConfig.enabled ? 'Enabled (Active)' : 'Paused'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-300/70 block">Expiry Warning Threshold:</span>
                    <span className="font-bold text-white">
                      Within {autoConfig.expiringThresholdDays} Days
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-300/70 block">Last Automated Audit:</span>
                    <span className="font-medium text-emerald-200">
                      {autoConfig.lastAuditTimestamp ? new Date(autoConfig.lastAuditTimestamp).toLocaleTimeString() : 'Just now'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Automation Rules Configuration */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-purple-600" />
                  <span>Automated Dispatch Rules & Threshold Policies</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Master Toggle */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Master Automatic Dispatch</p>
                      <p className="text-[11px] text-slate-500">Run auto-checks whenever medicine data changes or scheduled interval expires</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoConfig.enabled}
                      onChange={(e) => autoEmailDispatcher.updateConfig({ enabled: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded-md border-slate-300 focus:ring-purple-500 cursor-pointer"
                    />
                  </div>

                  {/* Expired Notification Toggle */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">🚨 Auto-Mail on Expired Medicines</p>
                      <p className="text-[11px] text-slate-500">Immediately send urgent health warnings (Do Not Consume + Disposal Steps)</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoConfig.alertExpired}
                      onChange={(e) => autoEmailDispatcher.updateConfig({ alertExpired: e.target.checked })}
                      className="w-5 h-5 text-rose-600 rounded-md border-slate-300 focus:ring-rose-500 cursor-pointer"
                    />
                  </div>

                  {/* Expiring Soon Toggle */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">⚠️ Auto-Mail on Expiring Soon Medicines</p>
                      <p className="text-[11px] text-slate-500">Send proactive advance notices for medicines approaching expiration date</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoConfig.alertExpiringSoon}
                      onChange={(e) => autoEmailDispatcher.updateConfig({ alertExpiringSoon: e.target.checked })}
                      className="w-5 h-5 text-amber-600 rounded-md border-slate-300 focus:ring-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Days Threshold Slider */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-bold text-slate-800">Advance Notice Window</p>
                      <span className="text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        {autoConfig.expiringThresholdDays} Days Before Expiry
                      </span>
                    </div>
                    <input
                      type="range"
                      min={7}
                      max={45}
                      step={1}
                      value={autoConfig.expiringThresholdDays}
                      onChange={(e) => autoEmailDispatcher.updateConfig({ expiringThresholdDays: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>7 days (Critical)</span>
                      <span>15 days (Default)</span>
                      <span>30 days (Standard)</span>
                      <span>45 days (Early)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Content Sample Preview */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-600" />
                    <span>Automated Email Template Standard (Delivered to Inbox)</span>
                  </h3>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                    Gmail Direct + Safe HTML
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2 font-mono">
                  <p><span className="text-slate-500 font-sans font-bold">From:</span> Home Medicine Cabinet &lt;alerts@medicine-system.local&gt;</p>
                  <p><span className="text-slate-500 font-sans font-bold">To:</span> {currentUser?.email || emailAlertService.getSettings().recipientEmail}</p>
                  <p><span className="text-slate-500 font-sans font-bold">Subject:</span> 🚨 [AUTOMATED HEALTH ALERT] 2 Expired Medicines Detected in Cabinet (Do Not Consume)</p>
                  <p className="text-[11px] text-slate-600 font-sans pt-2 border-t border-slate-200">
                    Contains styled alert badges, detailed expiration dates, room storage locations, dangerous breakdown warnings, and official household disposal directives.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CABINET SAFETY & COMPLIANCE */}
          {activeTab === 'compliance' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-xs">
                  <span className="text-[11px] font-bold text-rose-700">Expired Medicines (Hazard)</span>
                  <p className="text-2xl font-black text-rose-600 mt-1">
                    {medicines.filter(m => new Date(m.expiryDate) < new Date()).length}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Chemical degradation hazard</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs">
                  <span className="text-[11px] font-bold text-amber-700">Expiring Soon (&lt;15 Days)</span>
                  <p className="text-2xl font-black text-amber-600 mt-1">
                    {medicines.filter(m => {
                      const diff = Math.round((new Date(m.expiryDate).getTime() - new Date().getTime()) / 86400000);
                      return diff >= 0 && diff <= 15;
                    }).length}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Refill action advised</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs">
                  <span className="text-[11px] font-bold text-emerald-700">Safe Medications</span>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {medicines.filter(m => {
                      const diff = Math.round((new Date(m.expiryDate).getTime() - new Date().getTime()) / 86400000);
                      return diff > 15;
                    }).length}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Valid for regular use</p>
                </div>
              </div>

              {/* Medicine Inventory by Storage Location */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900">Inventory Distribution by Storage Room</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['Bathroom Cabinet', 'Kitchen / Fridge', 'Bedroom Nightstand', 'First Aid Kit', 'Travel Bag'].map(loc => {
                    const count = medicines.filter(m => m.location === loc).length;
                    return (
                      <div key={loc} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-xs font-bold text-slate-800">{loc}</span>
                        <p className="text-sm font-black text-purple-700 mt-0.5">{count} item{count === 1 ? '' : 's'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT TRAIL & LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">
                  Automated Dispatches & Email Delivery Logs ({emailLogs.length})
                </h3>
                <span className="text-[10px] text-slate-500">
                  Real-time transmission records to inbox
                </span>
              </div>

              {emailLogs.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                  <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No Dispatches Recorded Yet</p>
                  <p className="text-[11px] text-slate-500 mt-1">Trigger an automated check above to record activity.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
                  {emailLogs.map((log) => (
                    <div 
                      key={log.id} 
                      onClick={() => setSelectedLogPreview(log)}
                      className="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                            {log.status}
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate max-w-md">
                            {log.subject}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          To: <span className="font-mono text-slate-700">{log.recipientEmail}</span> · Meds: {log.medicineNames.join(', ')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="text-[10px] text-slate-400 font-mono">{log.sentAt}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-600 font-medium">
              Logged in as <strong className="text-slate-900">{currentUser?.displayName || 'Admin'}</strong> ({ROLE_CONFIGS[currentUser?.role || 'admin'].label})
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors cursor-pointer"
          >
            Close Admin Portal
          </button>
        </div>
      </div>
    </div>
  );
};
