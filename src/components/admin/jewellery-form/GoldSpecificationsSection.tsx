import React from 'react';
import { formatCurrency } from '../../../lib/goldPrice'; // <-- Add this import

interface GoldSpecificationsSectionProps {
  formData: { gold_weight: number; making_charges_per_gram: number; };
  setFormData: (data: Record<string, unknown>) => void;
  uploading: boolean;
  pricing?: any; // <-- Add this
  previewGoldPurity?: string; // <-- Add this
}

export function GoldSpecificationsSection({ 
  formData, setFormData, uploading, pricing, previewGoldPurity 
}: GoldSpecificationsSectionProps) {
  
  // Safe math to prevent NaN if weight is 0
  const goldRate = formData.gold_weight > 0 ? pricing?.goldValue / formData.gold_weight : 0;
  const makingRate = formData.gold_weight > 0 ? pricing?.makingCharges / formData.gold_weight : 0;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
        Gold Specifications
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gold Weight (grams)</label>
          <input
            type="number" step="0.1" value={formData.gold_weight}
            onChange={(e) => setFormData({ ...formData, gold_weight: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500" disabled={uploading}
          />
          {/* THE NEW BREAKDOWN BAR */}
          {formData.gold_weight > 0 && pricing && (
            <div className="mt-2 text-xs font-medium text-yellow-800 bg-yellow-100/50 border border-yellow-200 p-2 rounded flex justify-between">
              <span>Gold Cost ({previewGoldPurity}):</span>
              <span>{formData.gold_weight}g × {formatCurrency(goldRate)}/g = {formatCurrency(pricing.goldValue)}</span>
            </div>
          )}
        </div>

        <div className="space-y-3 bg-gray-50 p-3 rounded-md border border-gray-100">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox" id="overrideMakingCharges"
              checked={formData.making_charges_per_gram !== undefined && formData.making_charges_per_gram !== -1}
              onChange={(e) => setFormData({ ...formData, making_charges_per_gram: e.target.checked ? 0 : -1 })}
              className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="overrideMakingCharges" className="text-sm font-semibold text-gray-800 cursor-pointer">
              Override Global Gold Making Charges
            </label>
          </div>
          
          {formData.making_charges_per_gram !== undefined && formData.making_charges_per_gram !== -1 ? (
            <div className="pl-6 transition-all duration-300">
              <label className="block text-xs font-medium text-gray-600 mb-1">Custom Making Charges (₹/g)</label>
              <input
                type="number" min="0" step="0.01" required value={formData.making_charges_per_gram}
                onChange={(e) => setFormData({ ...formData, making_charges_per_gram: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 bg-white shadow-sm"
              />
            </div>
          ) : (
            <div className="pl-6"><span className="text-xs text-gray-500 italic">Currently using the universal price.</span></div>
          )}

          {/* THE NEW BREAKDOWN BAR */}
          {formData.gold_weight > 0 && pricing && (
            <div className="mt-2 text-xs font-medium text-yellow-800 bg-yellow-100/50 border border-yellow-200 p-2 rounded flex justify-between">
              <span>Total Making:</span>
              <span>{formData.gold_weight}g × {formatCurrency(makingRate)}/g = {formatCurrency(pricing.makingCharges)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}