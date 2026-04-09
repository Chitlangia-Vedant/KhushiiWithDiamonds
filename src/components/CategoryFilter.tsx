import React from 'react';
import { Home, ChevronRight } from 'lucide-react';
import { Category } from '../types';

interface CategoryFilterProps {
  categories: Category[];
  activeCategoryId: string | 'All';
  onSelect: (categoryId: string) => void;
}

export function CategoryFilter({ categories, activeCategoryId, onSelect }: CategoryFilterProps) {
  // 1. Calculate the Breadcrumb Trail
  const getBreadcrumbs = (categoryId: string) => {
    if (categoryId === 'All') return [];
    const trail = [];
    let currentId: string | null = categoryId;
    
    while (currentId) {
      const cat = categories.find(c => c.id === currentId);
      if (cat) {
        trail.unshift(cat);
        currentId = cat.parent_id;
      } else {
        break;
      }
    }
    return trail;
  };

  const breadcrumbs = getBreadcrumbs(activeCategoryId);
  
  // 2. Calculate current drill-down children
  const currentChildren = activeCategoryId === 'All'
    ? categories.filter(c => !c.parent_id)
    : categories.filter(c => c.parent_id === activeCategoryId);

  return (
    <div className="mb-6 flex flex-col space-y-3 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      {/* Row 1: Breadcrumb Path */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => onSelect('All')}
          className={`flex items-center space-x-1 font-medium transition-colors hover:text-yellow-600 ${activeCategoryId === 'All' ? 'text-gray-900 font-bold' : ''}`}
        >
          <Home className="h-4 w-4" />
          <span className="whitespace-nowrap">All Items</span>
        </button>

        {breadcrumbs.map((bc) => (
          <React.Fragment key={bc.id}>
            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <button
              onClick={() => onSelect(bc.id)}
              className={`font-medium whitespace-nowrap transition-colors hover:text-yellow-600 ${activeCategoryId === bc.id ? 'text-gray-900 font-bold' : ''}`}
            >
              {bc.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Row 2: Contextual Drill-Down Pills */}
      {currentChildren.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-hide border-t border-gray-100 pt-3">
          {activeCategoryId !== 'All' && (
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2 whitespace-nowrap flex-shrink-0">
              Subcategories:
            </span>
          )}
          {currentChildren.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className="px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-medium bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-100 transition-colors shadow-sm"
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}