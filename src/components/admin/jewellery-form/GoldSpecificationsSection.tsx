import React from 'react';

interface GoldSpecificationsSectionProps {
  formData: {
    gold_weight: number;
    making_charges_per_gram: number;
  };
  setFormData: (data: Record<string, unknown>) => void;
  uploading: boolean;
}

export function GoldSpecificationsSection({ 
  formData, 
  setFormData, 
  uploading 
}: GoldSpecificationsSectionProps) {
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
            type="number"
            step="0.1"
            value={formData.gold_weight}
            onChange={(e) => setFormData({ ...formData, gold_weight: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
            disabled={uploading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Making Charges per Gram (₹)</label>
          <input
            type="number"
            value={formData.making_charges_per_gram}
            onChange={(e) => setFormData({ ...formData, making_charges_per_gram: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
            placeholder="500"
            disabled={uploading}
          />
        </div>
      </div>
      
      <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Gold quality selection has been moved to the customer interface. 
          Customers can now choose between 14K, 18K, and 24K gold and see live price updates.
        </p>
      </div>
    </div>
  );
}