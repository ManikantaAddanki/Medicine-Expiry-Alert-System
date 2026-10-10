import React from 'react';
import { 
  LayoutDashboard, 
  Pill, 
  Boxes, 
  AlertTriangle, 
  ArrowRightLeft, 
  History, 
  TrendingDown, 
  Truck, 
  QrCode, 
  FileSpreadsheet, 
  Database, 
  Settings 
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'medicines'
  | 'batches'
  | 'alerts'
  | 'fefo'
  | 'ledger'
  | 'low_stock'
  | 'suppliers'
  | 'scanner'
  | 'csv'
  | 'architecture'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  urgentAlertCount: number;
  lowStockCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  urgentAlertCount,
  lowStockCount
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard & KPIs', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'medicines', label: 'Medicine Catalog', icon: <Pill className="w-4 h-4" /> },
    { id: 'batches', label: 'Batch Inventory', icon: <Boxes className="w-4 h-4" /> },
    { 
      id: 'alerts', 
      label: 'Expiry Alert Center', 
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: urgentAlertCount,
      badgeColor: 'bg-rose-500 text-white'
    },
    { id: 'fefo', label: 'FEFO Dispensing', icon: <ArrowRightLeft className="w-4 h-4" /> },
    { id: 'ledger', label: 'Stock Ledger', icon: <History className="w-4 h-4" /> },
    { 
      id: 'low_stock', 
      label: 'Low Stock & Reorders', 
      icon: <TrendingDown className="w-4 h-4" />,
      badge: lowStockCount,
      badgeColor: 'bg-amber-500 text-white'
    },
    { id: 'suppliers', label: 'Suppliers Directory', icon: <Truck className="w-4 h-4" /> },
    { id: 'scanner', label: 'Barcode & QR Scanner', icon: <QrCode className="w-4 h-4" /> },
    { id: 'csv', label: 'CSV Import & Export', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'architecture', label: 'Database & Schema', icon: <Database className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings & Thresholds', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Inventory Modules</span>
        <span className="text-[10px] text-teal-400 font-mono bg-teal-950 px-1.5 py-0.5 rounded border border-teal-800">v1.2.0</span>
      </div>

      <nav className="p-2 space-y-1 overflow-y-auto flex-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                isActive
                  ? 'bg-teal-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${item.badgeColor || 'bg-slate-700 text-white'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-3 m-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span className="text-slate-300 font-medium">Scheduler Status</span>
          <span className="inline-flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Active
          </span>
        </div>
        <div className="text-[10px] text-slate-400 truncate">
          Engine: MySQL 8.0 + APScheduler
        </div>
      </div>
    </aside>
  );
};
