import React from 'react';
import { X } from 'lucide-react';

export interface AdminItemFilters {
  priceMin: string; priceMax: string; goldWeightMin: string; goldWeightMax: string;
  overriddenMaking: boolean; overriddenDiamond: boolean;
  diamondsCountMin: string; diamondsCountMax: string; totalDiamondCaratMin: string; totalDiamondCaratMax: string;
  hasCustomDiamondName: boolean; diamondNameQuery: string;
  hasOtherStones: boolean; totalStoneCaratMin: string; totalStoneCaratMax: string; stoneNameQuery: string;
  singleStoneCaratMin: string; singleStoneCaratMax: string;
}

export const initialFilters: AdminItemFilters = {
  priceMin: '', priceMax: '', goldWeightMin: '', goldWeightMax: '',
  overriddenMaking: false, overriddenDiamond: false,
  diamondsCountMin: '', diamondsCountMax: '', totalDiamondCaratMin: '', totalDiamondCaratMax: '',
  hasCustomDiamondName: false, diamondNameQuery: '',
  hasOtherStones: false, totalStoneCaratMin: '', totalStoneCaratMax: '', stoneNameQuery: '',
  singleStoneCaratMin: '', singleStoneCaratMax: ''
};

interface Props {
  showFilters: boolean;
  filters: AdminItemFilters;
  updateFilter: (key: keyof AdminItemFilters, value: any) => void;
  clearFilters: () => void;
}

export function AdminItemsAdvancedFilters({ showFilters, filters, updateFilter, clearFilters }: Props) {
  if (!showFilters) return null;

  const inputCss = "w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-yellow-500 outline-none";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-800">Advanced Filters</h3>
        <button onClick={clearFilters} className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center"><X className="h-3 w-3 mr-1"/> Clear All</button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Group 1: Core & Pricing */}
        <div className="space-y-3 p-3 bg-gray-50 rounded border border-gray-100">
          <h4 className="text-xs font-bold text-gray-500 uppercase">Core & Pricing</h4>
          <div className="flex gap-2">
            <div><label className="text-[10px] text-gray-500">Min Price (₹)</label><input type="number" value={filters.priceMin} onChange={e=>updateFilter('priceMin', e.target.value)} className={inputCss}/></div>
            <div><label className="text-[10px] text-gray-500">Max Price (₹)</label><input type="number" value={filters.priceMax} onChange={e=>updateFilter('priceMax', e.target.value)} className={inputCss}/></div>
          </div>
          <div className="flex gap-2">
            <div><label className="text-[10px] text-gray-500">Min Gold (g)</label><input type="number" value={filters.goldWeightMin} onChange={e=>updateFilter('goldWeightMin', e.target.value)} className={inputCss}/></div>
            <div><label className="text-[10px] text-gray-500">Max Gold (g)</label><input type="number" value={filters.goldWeightMax} onChange={e=>updateFilter('goldWeightMax', e.target.value)} className={inputCss}/></div>
          </div>
          <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer"><input type="checkbox" checked={filters.overriddenMaking} onChange={e=>updateFilter('overriddenMaking', e.target.checked)} className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"/><span>Custom Making Charge</span></label>
        </div>

        {/* Group 2: Diamonds */}
        <div className="space-y-3 p-3 bg-blue-50/50 rounded border border-blue-100">
          <h4 className="text-xs font-bold text-blue-800 uppercase">Diamonds</h4>
          <div className="flex gap-2">
            <div><label className="text-[10px] text-gray-500">Min Count</label><input type="number" value={filters.diamondsCountMin} onChange={e=>updateFilter('diamondsCountMin', e.target.value)} className={inputCss}/></div>
            <div><label className="text-[10px] text-gray-500">Max Count</label><input type="number" value={filters.diamondsCountMax} onChange={e=>updateFilter('diamondsCountMax', e.target.value)} className={inputCss}/></div>
          </div>
          <div className="flex gap-2">
            <div><label className="text-[10px] text-gray-500">Total Ct Min</label><input type="number" step="0.01" value={filters.totalDiamondCaratMin} onChange={e=>updateFilter('totalDiamondCaratMin', e.target.value)} className={inputCss}/></div>
            <div><label className="text-[10px] text-gray-500">Total Ct Max</label><input type="number" step="0.01" value={filters.totalDiamondCaratMax} onChange={e=>updateFilter('totalDiamondCaratMax', e.target.value)} className={inputCss}/></div>
          </div>
          <div><label className="text-[10px] text-gray-500">Specific Diamond Name</label><input type="text" placeholder="e.g. Center Solitaire" value={filters.diamondNameQuery} onChange={e=>updateFilter('diamondNameQuery', e.target.value)} className={inputCss}/></div>
          <div className="flex gap-2">
            <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer"><input type="checkbox" checked={filters.hasCustomDiamondName} onChange={e=>updateFilter('hasCustomDiamondName', e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/><span>Has Custom Name</span></label>
            <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer"><input type="checkbox" checked={filters.overriddenDiamond} onChange={e=>updateFilter('overriddenDiamond', e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/><span>Custom Pricing</span></label>
          </div>
        </div>

        {/* Group 3: Other Stones */}
        <div className="space-y-3 p-3 bg-emerald-50/50 rounded border border-emerald-100">
          <h4 className="text-xs font-bold text-emerald-800 uppercase">Other Stones</h4>
          <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer"><input type="checkbox" checked={filters.hasOtherStones} onChange={e=>updateFilter('hasOtherStones', e.target.checked)} className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"/><span>Contains Other Stones</span></label>
          <div><label className="text-[10px] text-gray-500">Specific Stone Name</label><input type="text" placeholder="e.g. Ruby" value={filters.stoneNameQuery} onChange={e=>updateFilter('stoneNameQuery', e.target.value)} className={inputCss}/></div>
          <div className="flex gap-2">
            <div><label className="text-[10px] text-gray-500">Total Ct Min</label><input type="number" step="0.01" value={filters.totalStoneCaratMin} onChange={e=>updateFilter('totalStoneCaratMin', e.target.value)} className={inputCss}/></div>
            <div><label className="text-[10px] text-gray-500">Total Ct Max</label><input type="number" step="0.01" value={filters.totalStoneCaratMax} onChange={e=>updateFilter('totalStoneCaratMax', e.target.value)} className={inputCss}/></div>
          </div>
        </div>

        {/* Group 4: Deep Specs */}
        <div className="space-y-3 p-3 bg-purple-50/50 rounded border border-purple-100">
          <h4 className="text-xs font-bold text-purple-800 uppercase">Any Stone Target</h4>
          <p className="text-[10px] text-gray-500 leading-tight mb-2">Find items containing AT LEAST ONE diamond or other stone within this carat range:</p>
          <div className="flex gap-2">
            <div><label className="text-[10px] text-gray-500">Single Stone Min Ct</label><input type="number" step="0.01" value={filters.singleStoneCaratMin} onChange={e=>updateFilter('singleStoneCaratMin', e.target.value)} className={inputCss}/></div>
            <div><label className="text-[10px] text-gray-500">Single Stone Max Ct</label><input type="number" step="0.01" value={filters.singleStoneCaratMax} onChange={e=>updateFilter('singleStoneCaratMax', e.target.value)} className={inputCss}/></div>
          </div>
        </div>

      </div>
    </div>
  );
}