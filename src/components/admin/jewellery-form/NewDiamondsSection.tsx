import React from 'react';
import { Diamond, DiamondQuality } from '../../../types';
import { Gem, Plus, Trash2, ChevronRight } from 'lucide-react';
import { formatCurrency, getTotalDiamondWeight } from '../../../lib/goldPrice';

interface NewDiamondsSectionProps {
  diamondQualities: Record<DiamondQuality, Diamond[]>;
  setDiamondQualities: (qualities: Record<DiamondQuality, Diamond[]>) => void;
  uploading: boolean;
}

const DIAMOND_QUALITY_OPTIONS: DiamondQuality[] = ['Lab Grown', 'GH/VS-SI', 'FG/VVS-SI', 'EF/VVS'];

export function NewDiamondsSection({ 
  diamondQualities, 
  setDiamondQualities, 
  uploading 
}: NewDiamondsSectionProps) {
  const [expandedQualities, setExpandedQualities] = React.useState<Set<DiamondQuality>>(new Set());

  const addDiamond = (quality: DiamondQuality) => {
    setDiamondQualities({
      ...diamondQualities,
      [quality]: [...diamondQualities[quality], { carat: 0, cost_per_carat: 25000 }]
    });
  };

  const updateDiamond = (quality: DiamondQuality, index: number, field: keyof Diamond, value: string | number) => {
    const updatedDiamonds = diamondQualities[quality].map((diamond, i) => 
      i === index ? { ...diamond, [field]: value } : diamond
    );
    setDiamondQualities({
      ...diamondQualities,
      [quality]: updatedDiamonds
    });
  };

  const removeDiamond = (quality: DiamondQuality, index: number) => {
    setDiamondQualities({
      ...diamondQualities,
      [quality]: diamondQualities[quality].filter((_, i) => i !== index)
    });
  };

  const toggleExpanded = (quality: DiamondQuality) => {
    const newExpanded = new Set(expandedQualities);
    if (newExpanded.has(quality)) {
      newExpanded.delete(quality);
    } else {
      newExpanded.add(quality);
    }
    setExpandedQualities(newExpanded);
  };

  const getTotalDiamondsCount = () => {
    return Object.values(diamondQualities).reduce((total, diamonds) => total + diamonds.length, 0);
  };

  const getTotalDiamondsWeight = () => {
    return Object.values(diamondQualities).reduce((total, diamonds) => 
      total + getTotalDiamondWeight(diamonds), 0
    );
  };

  const getTotalDiamondsCost = () => {
    return Object.values(diamondQualities).reduce((total, diamonds) => 
      total + diamonds.reduce((sum, d) => sum + (d.carat * d.cost_per_carat), 0), 0
    );
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-blue-800 flex items-center">
          <Gem className="h-5 w-5 mr-2" />
          Diamonds by Quality ({getTotalDiamondsCount()})
        </h3>
      </div>

      {getTotalDiamondsCount() === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <Gem className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="mb-4">No diamonds added. Choose a quality and add diamonds to this jewellery item.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {DIAMOND_QUALITY_OPTIONS.map((quality) => (
              <button
                key={quality}
                type="button"
                onClick={() => addDiamond(quality)}
                className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 flex items-center space-x-1 text-sm"
                disabled={uploading}
              >
                <Plus className="h-3 w-3" />
                <span>Add {quality}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {DIAMOND_QUALITY_OPTIONS.map((quality) => {
            const diamonds = diamondQualities[quality];
            const isExpanded = expandedQualities.has(quality);
            const qualityWeight = getTotalDiamondWeight(diamonds);
            const qualityCost = diamonds.reduce((sum, d) => sum + (d.carat * d.cost_per_carat), 0);

            return (
              <div key={quality} className="bg-white border border-blue-200 rounded-md">
                <div className="p-3 border-b border-blue-100">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(quality)}
                        className="flex items-center space-x-2 text-blue-800 hover:text-blue-900"
                      >
                        <ChevronRight 
                          className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                        />
                        <span className="font-medium">{quality}</span>
                      </button>
                      <span className="text-sm text-blue-600">
                        ({diamonds.length} diamonds)
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      {qualityWeight > 0 && (
                        <div className="text-sm text-blue-700">
                          {qualityWeight.toFixed(2)}ct • {formatCurrency(qualityCost)}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => addDiamond(quality)}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 flex items-center space-x-1"
                        disabled={uploading}
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && diamonds.length > 0 && (
                  <div className="p-3 space-y-3">
                    {diamonds.map((diamond, index) => (
                      <div key={index} className="bg-gray-50 border border-gray-200 rounded-md p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium text-gray-800">Diamond {index + 1}</h5>
                          <button
                            type="button"
                            onClick={() => removeDiamond(quality, index)}
                            className="text-red-500 hover:text-red-700"
                            disabled={uploading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Carat Weight</label>
                            <input
                              type="number"
                              step="0.01"
                              value={diamond.carat}
                              onChange={(e) => updateDiamond(quality, index, 'carat', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                              placeholder="0.50"
                              disabled={uploading}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Cost per Carat (₹)</label>
                            <input
                              type="number"
                              value={diamond.cost_per_carat}
                              onChange={(e) => updateDiamond(quality, index, 'cost_per_carat', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                              placeholder="25000"
                              disabled={uploading}
                            />
                          </div>
                        </div>
                        {diamond.carat > 0 && (
                          <div className="mt-2 text-xs text-blue-600">
                            Total cost: {formatCurrency(diamond.carat * diamond.cost_per_carat)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          
          {getTotalDiamondsWeight() > 0 && (
            <div className="bg-blue-100 border border-blue-300 rounded-md p-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-blue-800">Total Diamond Weight:</span>
                <span className="text-blue-700">{getTotalDiamondsWeight().toFixed(2)} carats</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-blue-800">Total Diamond Cost:</span>
                <span className="text-blue-700">{formatCurrency(getTotalDiamondsCost())}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}