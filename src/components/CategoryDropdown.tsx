import React, { useState } from 'react';
import { Category } from '../types';
import { ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { useClickOutside } from '../hooks/useClickOutside';

interface CategoryDropdownProps {
  valueLabel: string;
  onSelect: (categoryId: string, categoryName: string) => void;
  onClear?: () => void;
  clearLabel?: string;
  excludeCategoryId?: string;
  disabled?: boolean;
  triggerClassName?: string;
}

export function CategoryDropdown({
  valueLabel,
  onSelect,
  onClear,
  clearLabel = 'Clear Selection',
  excludeCategoryId,
  disabled,
  triggerClassName
}: CategoryDropdownProps) {
  const { topLevelCategories, getSubcategories } = useCategories();
  const { ref: dropdownRef, isOpen: showDropdown, setIsOpen: setShowDropdown } = useClickOutside<HTMLDivElement>();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) newExpanded.delete(categoryId);
    else newExpanded.add(categoryId);
    setExpandedCategories(newExpanded);
  };

  const handleSelect = (categoryId: string, categoryName: string) => {
    onSelect(categoryId, categoryName);
    setShowDropdown(false);
    setExpandedCategories(new Set());
  };

  const handleClear = () => {
    if (onClear) onClear();
    setShowDropdown(false);
    setExpandedCategories(new Set());
  };

  const CategoryMenuItem = ({ category, level = 0 }: { category: Category; level?: number }) => {
    // Prevent self-nesting if an exclude ID is provided
    if (excludeCategoryId && category.id === excludeCategoryId) return null;

    const subcategories = getSubcategories(category.id);
    const hasSubcategories = subcategories.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const paddingLeft = level * 16;

    return (
      <div key={category.id}>
        <div className="flex items-center hover:bg-gray-50">
          <button
            type="button"
            onClick={() => handleSelect(category.id, category.name)}
            className="flex-1 text-left px-4 py-2 text-sm text-gray-700 hover:text-yellow-600 transition-colors"
            style={{ paddingLeft: `${16 + paddingLeft}px` }}
          >
            {/* Changed to items-start and added text wrapping classes */}
            <div className="flex items-start space-x-2">
              <div className="mt-0.5 flex-shrink-0">
                {hasSubcategories ? <Folder className="h-4 w-4 text-blue-500" /> : <div className="h-4 w-4" />}
              </div>
              <span className="break-words whitespace-normal leading-tight">{category.name}</span>
            </div>
          </button>
          {hasSubcategories && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                toggleExpanded(category.id);
              }}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>
        
        {hasSubcategories && isExpanded && (
          <div className="bg-gray-50">
            {subcategories.map((subcategory) => (
              <CategoryMenuItem key={subcategory.id} category={subcategory} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Determine styling based on whether a real value is selected
  const isPlaceholder = !valueLabel || valueLabel.includes('Select') || valueLabel.includes('None');

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        className={triggerClassName || "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 text-left flex items-center justify-between bg-white disabled:opacity-50 disabled:cursor-not-allowed"}
        disabled={disabled}
      >
        <span className={isPlaceholder ? 'text-gray-500' : 'text-gray-900'}>
          {valueLabel}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        /* Added z-50, min-w-[260px], and overflow-x-hidden */
        <div className="absolute z-50 mt-1 w-full min-w-[260px] bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto overflow-x-hidden">
          <div className="py-1">
            {onClear && (
              <>
                <button
                  type="button"
                  onClick={handleClear}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-yellow-600 italic"
                >
                  {clearLabel}
                </button>
                <div className="border-t border-gray-100 my-1"></div>
              </>
            )}
            
            {topLevelCategories.map((category) => (
              <CategoryMenuItem key={category.id} category={category} />
            ))}
            
            {topLevelCategories.length === 0 && (
              <div className="px-4 py-2 text-sm text-gray-500">No categories available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}