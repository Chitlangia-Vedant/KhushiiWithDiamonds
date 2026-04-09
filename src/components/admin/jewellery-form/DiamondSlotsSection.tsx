import React from 'react';
import { DiamondSlot } from '../../../types';
import { Gem, Plus, Trash2 } from 'lucide-react';
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
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-md font-semibold text-blue-800 flex items-center">
          <Gem className="h-4 w-4 mr-2" /> Diamond Configuration
        </h3>
        <button type="button" onClick={addDiamondSlot} disabled={uploading} className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 flex items-center space-x-1 text-xs">
          <Plus className="h-3 w-3" /> <span>Add Diamond</span>
        </button>
      </div>

      {diamondSlots.length > 0 && (
        <div className="space-y-3 mt-3">
          {diamondSlots.map((slot, index) => (
            <div key={index} className="bg-white border border-blue-200 rounded p-3">
              <div className="flex justify-between items-center mb-2">
                <input
                  type="text" value={slot.name || ''} onChange={(e) => updateDiamondSlot(index, 'name', e.target.value)}
                  className="font-semibold text-blue-800 text-sm bg-transparent border-b border-transparent hover:border-blue-200 focus:border-blue-500 focus:outline-none focus:ring-0 px-1 w-1/2 md:w-1/3"
                  placeholder={`Diamond ${index + 1}`} disabled={uploading}
                />
                <button type="button" onClick={() => removeDiamondSlot(index)} className="text-red-500 hover:text-red-700 p-1" disabled={uploading}><Trash2 className="h-4 w-4" /></button>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Carat Weight</label>
                <input type="number" step="0.01" value={slot.carat} onChange={(e) => updateDiamondSlot(index, 'carat', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500" disabled={uploading} />
              </div>

              <div className="flex items-center space-x-2 bg-purple-50 px-2 py-1.5 rounded border border-purple-200 mb-2">
                <input type="checkbox" id="overrideDiamondPricing" checked={overrideDiamondCosts !== false} onChange={(e) => setOverrideDiamondCosts(e.target.checked)} className="h-3 w-3 text-purple-600 rounded" />
                <label htmlFor="overrideDiamondPricing" className="text-xs font-semibold text-purple-900 cursor-pointer">Override Global Pricing</label>
              </div>

              {overrideDiamondCosts !== false && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                  {DIAMOND_QUALITIES.map((quality) => (
                    <div key={quality}>
                      <label className="block text-[10px] font-medium text-gray-600 mb-0.5">{quality} (₹/ct)</label>
                      <input type="number" value={slot.costs[quality]} onChange={(e) => updateDiamondCost(index, quality, parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500" disabled={uploading} />
                    </div>
                  ))}
                </div>
              )}

              {/* THE NEW BREAKDOWN BAR FOR EACH DIAMOND */}
              {slot.carat > 0 && pricing?.diamonds?.[index] && (
                <div className="mt-3 text-xs font-medium text-blue-800 bg-blue-100/50 border border-blue-200 p-2 rounded flex justify-between">
                  <span>Price ({previewDiamondQuality}):</span>
                  <span>{slot.carat}ct × {formatCurrency(pricing.diamonds[index].cost_per_carat)}/ct = {formatCurrency(slot.carat * pricing.diamonds[index].cost_per_carat)}</span>
                </div>
              )}
            </div>
          ))}
          
          {/* THE NEW SECTION TOTAL BAR */}
          <div className="bg-blue-100 border border-blue-300 rounded px-3 py-2 flex justify-between text-sm font-bold text-blue-900 mt-3">
            <span>Total Diamond Cost ({previewDiamondQuality}):</span> 
            <span>{formatCurrency(pricing?.diamondCost || 0)}</span>
          </div>
        </div>
      )}
    </div>
  );
}