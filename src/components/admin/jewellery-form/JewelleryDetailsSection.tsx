import React, { useState } from 'react';
import { Category } from '../../../types';
import { ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { getCategoryDisplayName } from '../../utils/categoryUtils.ts';


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
  categories, 
  uploading 
}: JewelleryDetailsSectionProps) {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Organize categories into hierarchy
  const topLevelCategories = categories.filter(cat => !cat.parent_id);
  const getSubcategories = (parentId: string) => 
    categories.filter(cat => cat.parent_id === parentId);

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const selectCategory = (categoryName: string) => {
    setFormData({ ...formData, category: categoryName });
    setShowCategoryDropdown(false);
    setExpandedCategories(new Set());
  };

  const CategoryMenuItem = ({ category, level = 0 }: { category: Category; level?: number }) => {
    const subcategories = getSubcategories(category.id);
    const hasSubcategories = subcategories.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const paddingLeft = level * 16;

    return (
      <div key={category.id}>
        <div className="flex items-center hover:bg-gray-50">
          <button
            onClick={() => selectCategory(category.name)}
            className="flex-1 text-left px-4 py-2 text-sm text-gray-700 hover:text-yellow-600 transition-colors"
            style={{ paddingLeft: `${16 + paddingLeft}px` }}
          >
            <div className="flex items-center space-x-2">
              {hasSubcategories ? (
                <Folder className="h-4 w-4 text-blue-500" />
              ) : (
                <div className="h-4 w-4" />
              )}
              <span>{category.name}</span>
            </div>
          </button>
          {hasSubcategories && (
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleExpanded(category.id);
              }}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <ChevronRight 
                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
              />
            </button>
          )}
        </div>
        
        {hasSubcategories && isExpanded && (
          <div className="bg-gray-50">
            {subcategories.map((subcategory) => (
              <CategoryMenuItem 
                key={subcategory.id} 
                category={subcategory} 
                level={level + 1} 
              />
            ))}
          </div>
        )}
      </div>
    );
  };

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
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 text-left flex items-center justify-between bg-white"
              disabled={uploading}
            >
              <span className={formData.category ? 'text-gray-900' : 'text-gray-500'}>
                {formData.category || 'Select Category'}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showCategoryDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div className="py-1">
                  {topLevelCategories.map((category) => (
                    <CategoryMenuItem key={category.id} category={category} />
                  ))}
                  {topLevelCategories.length === 0 && (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      No categories available
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
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

      {/* Dropdown Overlay */}
      {showCategoryDropdown && (
        <div
          className="fixed inset-0 z-45"
          onClick={() => setShowCategoryDropdown(false)}
        />
      )}
    </>
  );
}