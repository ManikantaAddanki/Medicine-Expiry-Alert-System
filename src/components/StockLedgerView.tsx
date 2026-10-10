import React, { useState } from 'react';
import { StockTransaction, TransactionType, UserRole } from '../types/inventory';
import { History, Search, Download, Filter, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

interface StockLedgerViewProps {
  transactions: StockTransaction[];
  currentRole: UserRole;
}

export const StockLedgerView: React.FC<StockLedgerViewProps> = ({
  transactions,
  currentRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filtered = transactions.filter(t => {
    const matchesSearch = 
      t.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.reference_id && t.reference_id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'ALL' || t.transaction_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleExportCsv = () => {
    const headers = ['Transaction ID,Timestamp,Type,Medicine,Batch,Previous Qty,Change,Resulting Qty,User,Role,Reference,Reason'];
    const rows = transactions.map(t => 
      `${t.id},"${t.timestamp}","${t.transaction_type}","${t.medicine_name}","${t.batch_number}",${t.previous_quantity},${t.quantity_change},${t.resulting_quantity},"${t.user_name}","${t.user_role}","${t.reference_id || ''}","${t.reason}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stock_transaction_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const types: { id: string; label: string }[] = [
    { id: 'ALL', label: 'All Transactions' },
    { id: 'RECEIVE', label: 'Stock Receive' },
    { id: 'DISPENSE', label: 'Dispense' },
    { id: 'QUARANTINE', label: 'Quarantine Lock' },
    { id: 'RELEASE', label: 'Release' },
    { id: 'ADJUSTMENT', label: 'Adjustments' },
    { id: 'DAMAGE', label: 'Damage Report' },
    { id: 'RETURN', label: 'Supplier Return' },
  ];

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Stock Movement & Audit Ledger</h2>
          <p className="text-xs text-slate-500">
            Immutable transaction record tracking every physical inventory debit, credit, quarantine lock, and adjustment
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-xs flex items-center gap-1.5 self-start md:self-auto transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by medicine, batch, reference ID, staff member..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto">
          {types.map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                typeFilter === t.id
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tx ID & Timestamp</th>
                <th className="py-3 px-4">Movement Type</th>
                <th className="py-3 px-4">Medicine & Batch</th>
                <th className="py-3 px-4 text-center">Previous Qty</th>
                <th className="py-3 px-4 text-center">Quantity Delta</th>
                <th className="py-3 px-4 text-center">Resulting Qty</th>
                <th className="py-3 px-4">Operator / Staff</th>
                <th className="py-3 px-4">Reason & Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No transactions found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const isPositive = tx.quantity_change > 0;
                  const isZero = tx.quantity_change === 0;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">#TX-{tx.id.toString().padStart(4, '0')}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{tx.timestamp}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          tx.transaction_type === 'RECEIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.transaction_type === 'DISPENSE'
                            ? 'bg-blue-100 text-blue-800'
                            : tx.transaction_type === 'QUARANTINE'
                            ? 'bg-purple-100 text-purple-800'
                            : tx.transaction_type === 'RELEASE'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{tx.medicine_name}</div>
                        <div className="font-mono text-slate-500 text-[11px]">Batch: {tx.batch_number}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium text-slate-600">
                        {tx.previous_quantity}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {isZero ? (
                          <span className="text-slate-500">0</span>
                        ) : isPositive ? (
                          <span className="text-emerald-700 flex items-center justify-center gap-0.5">
                            <ArrowUpRight className="w-3.5 h-3.5" /> +{tx.quantity_change}
                          </span>
                        ) : (
                          <span className="text-rose-700 flex items-center justify-center gap-0.5">
                            <ArrowDownRight className="w-3.5 h-3.5" /> {tx.quantity_change}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                        {tx.resulting_quantity}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{tx.user_name}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{tx.user_role}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{tx.reason}</div>
                        {tx.reference_id && (
                          <div className="font-mono text-[10px] text-teal-700 mt-0.5">
                            Ref: {tx.reference_id}
                          </div>
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
