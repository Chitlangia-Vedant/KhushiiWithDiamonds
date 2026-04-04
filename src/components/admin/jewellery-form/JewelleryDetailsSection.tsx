import React, { useState } from 'react';
import { Category } from '../../../types';
import { getCategoryDisplayName } from '../../../utils/categoryUtils';
import { useCategories } from '../../../hooks/useCategories';
import { CategoryDropdown } from '../../CategoryDropdown';


interface JewelleryDetailsSectionProps {
  formData: {
    name: string;
    description: string;
    category: string;
  };
  setFormData: (data: Record<string, unknown>) => void;
  categories: Category[];
  uploading: boolean;
}

export function JewelleryDetailsSection({ 
  formData, 
  setFormData, 
  uploading 
}: JewelleryDetailsSectionProps) {
  const { categories } = useCategories();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
            disabled={uploading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <CategoryDropdown
            valueLabel={formData.category || 'Select Category'}
            onSelect={(categoryId, categoryName) => setFormData({ ...formData, category: categoryName })}
            disabled={uploading}
          />
          
          {/* Category Preview */}
          {formData.category && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Selected:</strong> {getCategoryDisplayName(categories, formData.category)}
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          rows={3}
          disabled={uploading}
        />
      </div>
    </>
  );
}