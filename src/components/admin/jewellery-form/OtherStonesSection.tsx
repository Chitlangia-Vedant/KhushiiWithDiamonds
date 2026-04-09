import React from 'react';
import { StoneSlot } from '../../../types';
import { Plus, Trash2, Hexagon } from 'lucide-react';
import { formatCurrency } from '../../../lib/goldPrice';

interface OtherStonesSectionProps {
  otherStones: StoneSlot[];
  setOtherStones: (slots: StoneSlot[]) => void;
  uploading: boolean;
}

export function OtherStonesSection({ otherStones, setOtherStones, uploading }: OtherStonesSectionProps) {
  
  const addStone = () => {
    setOtherStones([...otherStones, { name: `Stone ${otherStones.length + 1}`, carat: 0, cost_per_carat: 0 }]);
  };

  const updateStone = (index: number, field: keyof StoneSlot, value: string | number) => {
    const updated = otherStones.map((stone, i) => i === index ? { ...stone, [field]: value } : stone);
    setOtherStones(updated);
  };

  const removeStone = (index: number) => {
    setOtherStones(otherStones.filter((_, i) => i !== index));
  };

  const getTotalCost = () => otherStones.reduce((sum, stone) => sum + (stone.carat * stone.cost_per_carat), 0);

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-emerald-800 flex items-center">
          <Hexagon className="h-5 w-5 mr-2" />
          Other Stones ({otherStones.length})
        </h3>
        <button
          type="button" onClick={addStone} disabled={uploading}
          className="bg-emerald-600 text-white px-3 py-1 rounded-md hover:bg-emerald-700 flex items-center space-x-1 text-sm"
        >
          <Plus className="h-4 w-4" /> <span>Add Stone</span>
        </button>
      </div>

      {otherStones.length === 0 ? null : (
        <div className="space-y-3 mt-3">
          {otherStones.map((stone, index) => (
            <div key={index} className="bg-white border border-emerald-200 rounded-md p-3 flex flex-wrap md:flex-nowrap items-end gap-3">
              <div className="w-full md:w-1/3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Stone Name</label>
                <input
                  type="text" value={stone.name} onChange={(e) => updateStone(index, 'name', e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm"
                  placeholder="e.g. Center Ruby" disabled={uploading}
                />
              </div>
              <div className="w-1/2 md:w-1/4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Carat</label>
                <input
                  type="number" step="0.01" value={stone.carat} onChange={(e) => updateStone(index, 'carat', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm" disabled={uploading}
                />
              </div>
              <div className="w-1/2 md:w-1/4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Cost/Carat (₹)</label>
                <input
                  type="number" value={stone.cost_per_carat} onChange={(e) => updateStone(index, 'cost_per_carat', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-sm" disabled={uploading}
                />
              </div>
              <div className="w-full md:w-auto flex items-center justify-between md:justify-end flex-grow">
                <div className="text-sm font-bold text-emerald-700">
                  {formatCurrency(stone.carat * stone.cost_per_carat)}
                </div>
                <button type="button" onClick={() => removeStone(index)} className="text-red-500 hover:text-red-700 p-1 md:ml-3" disabled={uploading}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <div className="text-right text-sm font-bold text-emerald-800 pr-2 pt-2">
            Total Other Stones: {formatCurrency(getTotalCost())}
          </div>
        </div>
      )}
    </div>
  );
}