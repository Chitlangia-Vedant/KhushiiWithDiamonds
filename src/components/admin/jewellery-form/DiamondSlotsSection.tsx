import React from 'react';
import { DiamondSlot } from '../../../types';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../../lib/goldPrice';
import { DIAMOND_QUALITIES, DEFAULT_DIAMOND_COSTS, DiamondQuality } from '../../../constants/jewellery';

interface DiamondSlotsSectionProps {
  diamondSlots: DiamondSlot[];
  setDiamondSlots: (slots: DiamondSlot[]) => void;
  uploading: boolean;
  overrideDiamondCosts?: boolean;
  setOverrideDiamondCosts: (override: boolean) => void;
  pricing?: any;
  previewDiamondQuality?: string;
}

export function DiamondSlotsSection({ 
  diamondSlots, setDiamondSlots, uploading, overrideDiamondCosts, setOverrideDiamondCosts, pricing, previewDiamondQuality
}: DiamondSlotsSectionProps) {
  
  const addDiamondSlot = () => setDiamondSlots([...diamondSlots, { name: `Diamond ${diamondSlots.length + 1}`, carat: 0, costs: { ...DEFAULT_DIAMOND_COSTS } }]);
  const updateDiamondSlot = (index: number, field: keyof DiamondSlot, value: number | string) => setDiamondSlots(diamondSlots.map((slot, i) => i === index ? { ...slot, [field]: value } : slot));
  const updateDiamondCost = (index: number, quality: DiamondQuality, cost: number) => setDiamondSlots(diamondSlots.map((slot, i) => i === index ? { ...slot, costs: { ...slot.costs, [quality]: cost } } : slot));
  const removeDiamondSlot = (index: number) => setDiamondSlots(diamondSlots.filter((_, i) => i !== index));

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center">
          <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span> Diamond Config
        </h3>
        <button type="button" onClick={addDiamondSlot} disabled={uploading} className="text-blue-600 hover:text-blue-800 flex items-center text-xs font-semibold">
          <Plus className="h-3 w-3 mr-1" /> Add Diamond
        </button>
      </div>

      {diamondSlots.length > 0 && (
        <div className="space-y-4">
          {diamondSlots.map((slot, index) => (
            <div key={index} className="border border-gray-100 bg-gray-50/50 rounded p-3">
              
              {/* PRIMARY ROW: Name, Carat, Toggle, Delete */}
              <div className="flex flex-wrap md:flex-nowrap items-end gap-3">
                <div className="flex-grow">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                  <input type="text" value={slot.name || ''} onChange={(e) => updateDiamondSlot(index, 'name', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 text-sm" placeholder="e.g. Center Stone" disabled={uploading} />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Carat</label>
                  <input type="number" step="0.01" value={slot.carat} onChange={(e) => updateDiamondSlot(index, 'carat', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 text-sm" disabled={uploading} />
                </div>
                <div className="w-auto flex items-center mb-2 px-2">
                  <input type="checkbox" id={`override-${index}`} checked={overrideDiamondCosts !== false} onChange={(e) => setOverrideDiamondCosts(e.target.checked)} className="h-3.5 w-3.5 text-gray-800 rounded border-gray-300" />
                  <label htmlFor={`override-${index}`} className="text-xs text-gray-600 ml-1.5 cursor-pointer whitespace-nowrap">Manual Cost</label>
                </div>
                <button type="button" onClick={() => removeDiamondSlot(index)} className="mb-2 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>

              {/* OVERRIDE GRID (Only visible if manually entering costs) */}
              {overrideDiamondCosts !== false && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-200">
                  {DIAMOND_QUALITIES.map((quality) => (
                    <div key={quality}>
                      <label className="block text-[10px] text-gray-500 mb-0.5">{quality} (₹/ct)</label>
                      <input type="number" value={slot.costs[quality]} onChange={(e) => updateDiamondCost(index, quality, parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-gray-400" disabled={uploading} />
                    </div>
                  ))}
                </div>
              )}

              {/* BREAKDOWN */}
              {slot.carat > 0 && pricing?.diamonds?.[index] && (
                <div className="mt-3 text-[11px] text-gray-500 flex justify-end">
                  <span className="font-semibold text-gray-700 mr-1">{previewDiamondQuality}:</span> {slot.carat}ct × {formatCurrency(pricing.diamonds[index].cost_per_carat)} = {formatCurrency(slot.carat * pricing.diamonds[index].cost_per_carat)}
                </div>
              )}
            </div>
          ))}
          
          {/* TOTAL */}
          <div className="pt-2 border-t border-gray-200 flex justify-between text-xs font-bold text-gray-800">
            <span>Total Diamonds ({previewDiamondQuality}):</span> 
            <span>{formatCurrency(pricing?.diamondCost || 0)}</span>
          </div>
        </div>
      )}
    </div>
  );
}