import React from 'react';
import { StoneSlot } from '../../../types';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../../lib/goldPrice';

interface OtherStonesSectionProps {
  otherStones: StoneSlot[];
  setOtherStones: (slots: StoneSlot[]) => void;
  uploading: boolean;
}

export function OtherStonesSection({ otherStones, setOtherStones, uploading }: OtherStonesSectionProps) {
  
  const addStone = () => setOtherStones([...otherStones, { name: `Stone ${otherStones.length + 1}`, carat: 0, cost_per_carat: 0 }]);
  const updateStone = (index: number, field: keyof StoneSlot, value: string | number) => setOtherStones(otherStones.map((stone, i) => i === index ? { ...stone, [field]: value } : stone));
  const removeStone = (index: number) => setOtherStones(otherStones.filter((_, i) => i !== index));
  const getTotalCost = () => otherStones.reduce((sum, stone) => sum + (stone.carat * stone.cost_per_carat), 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center">
          <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span> Other Stones
        </h3>
        <button type="button" onClick={addStone} disabled={uploading} className="text-emerald-600 hover:text-emerald-800 flex items-center text-xs font-semibold">
          <Plus className="h-3 w-3 mr-1" /> Add Stone
        </button>
      </div>

      {otherStones.length > 0 && (
        <div className="space-y-4">
          {otherStones.map((stone, index) => (
            <div key={index} className="border border-gray-100 bg-gray-50/50 rounded p-3">
              <div className="flex flex-wrap md:flex-nowrap items-end gap-3">
                <div className="flex-grow">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                  <input type="text" value={stone.name} onChange={(e) => updateStone(index, 'name', e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 text-sm" placeholder="e.g. Ruby" disabled={uploading} />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Carat</label>
                  <input type="number" step="0.01" value={stone.carat} onChange={(e) => updateStone(index, 'carat', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 text-sm" disabled={uploading} />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cost (₹/ct)</label>
                  <input type="number" value={stone.cost_per_carat} onChange={(e) => updateStone(index, 'cost_per_carat', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 text-sm" disabled={uploading} />
                </div>
                <button type="button" onClick={() => removeStone(index)} className="mb-2 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
              
              {/* BREAKDOWN */}
              {stone.carat > 0 && (
                <div className="mt-3 text-[11px] text-gray-500 flex justify-end">
                  <span className="font-semibold text-gray-700 mr-1">Cost:</span> {stone.carat}ct × {formatCurrency(stone.cost_per_carat)} = {formatCurrency(stone.carat * stone.cost_per_carat)}
                </div>
              )}
            </div>
          ))}

          {/* TOTAL */}
          <div className="pt-2 border-t border-gray-200 flex justify-between text-xs font-bold text-gray-800">
            <span>Total Other Stones:</span>
            <span>{formatCurrency(getTotalCost())}</span>
          </div>
        </div>
      )}
    </div>
  );
}