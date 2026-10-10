import React from 'react';
import { Search, Filter, User, MapPin, X } from 'lucide-react';
import { FamilyMember, StorageLocation } from '../types/userMedicine';

export type StatusFilterOption = 'ALL' | 'EXPIRED' | 'SOON' | 'SAFE';

interface CabinetFilterBarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: StatusFilterOption;
  onStatusFilterChange: (val: StatusFilterOption) => void;
  familyFilter: string;
  onFamilyFilterChange: (val: string) => void;
  locationFilter: string;
  onLocationFilterChange: (val: string) => void;
  counts: {
    all: number;
    expired: number;
    soon: number;
    safe: number;
  };
}

export const CabinetFilterBar: React.FC<CabinetFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  familyFilter,
  onFamilyFilterChange,
  locationFilter,
  onLocationFilterChange,
  counts
}) => {
  const familyOptions = ['All Members', 'Self', 'Family Shared', 'Mom', 'Dad', 'Kids', 'Grandparents', 'Pet'];
  const locationOptions = [
    'All Locations',
    'Bathroom Cabinet',
    'Kitchen / Fridge',
    'Bedroom Nightstand',
    'First Aid Kit',
    'Travel Bag'
  ];

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'ALL' || familyFilter !== 'All Members' || locationFilter !== 'All Locations';

  const clearAllFilters = () => {
    onSearchChange('');
    onStatusFilterChange('ALL');
    onFamilyFilterChange('All Members');
    onLocationFilterChange('All Locations');
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3.5 mb-6">
      {/* Top Search + Status Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by medicine name, brand, or purpose (e.g., 'fever', 'cough', 'eye drops', 'headache')..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-slate-50/50"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => onStatusFilterChange('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Medicines ({counts.all})
          </button>

          <button
            onClick={() => onStatusFilterChange('EXPIRED')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
              statusFilter === 'EXPIRED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <span>🚨 Expired</span>
            <span className="text-[10px] bg-rose-200/80 text-rose-950 px-1.5 py-0.2 rounded-full font-bold">
              {counts.expired}
            </span>
          </button>

          <button
            onClick={() => onStatusFilterChange('SOON')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
              statusFilter === 'SOON'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <span>⚠️ Expiring Soon</span>
            <span className="text-[10px] bg-amber-200/80 text-amber-950 px-1.5 py-0.2 rounded-full font-bold">
              {counts.soon}
            </span>
          </button>

          <button
            onClick={() => onStatusFilterChange('SAFE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === 'SAFE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            ✅ Safe ({counts.safe})
          </button>
        </div>
      </div>

      {/* Sub-Filters: Family Member & Storage Location */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Family Member Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-700">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 text-[11px]">For:</span>
            <select
              aria-label="Filter by Family Member"
              value={familyFilter}
              onChange={(e) => onFamilyFilterChange(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              {familyOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 text-[11px]">Where:</span>
            <select
              aria-label="Filter by Storage Location"
              value={locationFilter}
              onChange={(e) => onLocationFilterChange(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              {locationOptions.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-slate-500 hover:text-slate-900 font-medium underline flex items-center gap-1"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
};
