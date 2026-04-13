import React from 'react';
import { formatCurrency } from '../../../../lib/goldPrice';

interface GoldSpecificationsSectionProps {
  formData: { gold_weight: number; making_charges_per_gram: number; };
  setFormData: (data: Record<string, unknown>) => void;
  uploading: boolean;
  pricing?: any;
  previewGoldPurity?: string;
}

export function GoldSpecificationsSection({ 
  formData, setFormData, uploading, pricing, previewGoldPurity 
}: GoldSpecificationsSectionProps) {
  
  const goldRate = formData.gold_weight > 0 ? pricing?.goldValue / formData.gold_weight : 0;
  const makingRate = formData.gold_weight > 0 ? pricing?.makingCharges / formData.gold_weight : 0;
  const isOverridden = formData.making_charges_per_gram !== undefined && formData.making_charges_per_gram !== -1;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider flex items-center">
        <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span> Gold Config
      </h3>
      
      <div className="flex flex-wrap md:flex-nowrap items-end gap-4">
        {/* Weight */}
        <div className="w-full md:w-1/3">
          <label className="block text-xs font-medium text-gray-500 mb-1">Weight (g)</label>
          <input
            type="number" step="0.1" value={formData.gold_weight}
            onChange={(e) => setFormData({ ...formData, gold_weight: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 text-sm" 
            disabled={uploading}
          />
        </div>

        {/* Override Toggle */}
        <div className="w-full md:w-1/3 flex items-center mb-1.5">
          <input
            type="checkbox" id="overrideMakingCharges" checked={isOverridden}
            onChange={(e) => setFormData({ ...formData, making_charges_per_gram: e.target.checked ? 0 : -1 })}
            className="h-3.5 w-3.5 text-gray-800 rounded border-gray-300 focus:ring-gray-400"
          />
          <label htmlFor="overrideMakingCharges" className="text-xs text-gray-600 ml-2 cursor-pointer">
            Manual Making Charge
          </label>
        </div>

        {/* Custom Input (If toggled) */}
        {isOverridden && (
          <div className="w-full md:w-1/3">
             <label className="block text-xs font-medium text-gray-500 mb-1">Custom Cost (₹/g)</label>
             <input
              type="number" min="0" step="0.01" value={formData.making_charges_per_gram}
              onChange={(e) => setFormData({ ...formData, making_charges_per_gram: parseFloat(e.target.value) || 0 })}
              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 text-sm"
             />
          </div>
        )}
      </div>

      {/* Breakdowns */}
      {formData.gold_weight > 0 && pricing && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col md:flex-row md:justify-between text-xs text-gray-500 space-y-1 md:space-y-0">
          <div><span className="font-semibold text-gray-700">Gold ({previewGoldPurity}):</span> {formData.gold_weight}g × {formatCurrency(goldRate)} = {formatCurrency(pricing.goldValue)}</div>
          <div><span className="font-semibold text-gray-700">Making:</span> {formData.gold_weight}g × {formatCurrency(makingRate)} = {formatCurrency(pricing.makingCharges)}</div>
        </div>
      )}
    </div>
  );
}