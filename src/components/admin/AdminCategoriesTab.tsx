import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Category } from '../../types';
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { CategoryForm } from './CategoryForm';
import { deleteDriveImages } from '../../utils/uploadUtils';
import { useCategories } from '../../hooks/useCategories';
import { getCategoryDisplayName, getValidCategoryNames } from '../../utils/categoryUtils';
import { CategoryFilter } from '../CategoryFilter';

export function AdminCategoriesTab() {
  // We pull refetchCategories to immediately update the app when you add/delete!
  const { categories, refetchCategories } = useCategories();
  
  const [activeCategoryId, setActiveCategoryId] = useState<string | 'All'>('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const resetForm = () => {
    setShowAddForm(false);
    setEditingCategory(null);
  };

  const startEdit = (category: Category) => {
    setEditingCategory(category);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this category? (Note: Ensure no items are using it first!)')) {
      try {
        const catToDelete = categories.find(c => c.id === id);
        
        // Cleanup images from Google Drive if they exist
        if (catToDelete?.image_url) {
          try { await deleteDriveImages([catToDelete.image_url]); } catch (e) { console.error(e); }
        }

        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        
        // Refresh the global category state!
        await refetchCategories();
      } catch (error: any) {
        console.error('Error deleting:', error);
        alert('Error deleting category. It might have subcategories or items attached to it.');
      }
    }
  };

  // Filter categories using our universal logic
  const filteredCategories = categories.filter(cat => {
    if (activeCategoryId === 'All') return true;
    const validNames = getValidCategoryNames(activeCategoryId, categories);
    return validNames.includes(cat.name);
  });

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">Add Category</span>
        </button>
      </div>

      {/* 1. Universal Category Filter */}
      <CategoryFilter 
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelect={setActiveCategoryId}
      />

      {/* 2. Responsive Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                {/* Hide the full path column on mobile */}
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Path Structure</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.map((category) => {
                // Generate the infinite-depth breadcrumb string (e.g., "Rings → Engagement → Solitaire")
                const fullPath = getCategoryDisplayName(categories, category.name);
                
                return (
                  <tr key={category.id} className="hover:bg-gray-50">
                    
                    {/* Category Name & Image */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {category.image_url ? (
                          <img
                            className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                            src={category.image_url}
                            alt=""
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div className="ml-3">
                          <div className="text-sm font-bold text-gray-900">{category.name}</div>
                          {/* Mobile-only path preview since the main column is hidden */}
                          <div className="md:hidden mt-0.5 text-xs text-gray-500 truncate max-w-[180px]">
                            {fullPath}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Full Path Structure (Hidden on mobile) */}
                    <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {fullPath.split(' → ').map((part, index, array) => (
                          <React.Fragment key={index}>
                            <span className={index === array.length - 1 ? 'font-bold text-gray-900' : ''}>
                              {part}
                            </span>
                            {index < array.length - 1 && <span className="mx-1 text-gray-400">→</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => startEdit(category)} className="text-yellow-600 hover:text-yellow-900 mr-3 p-1">
                        <Edit className="h-4 w-4 md:h-5 md:w-5" />
                      </button>
                      <button onClick={() => handleDelete(category.id)} className="text-red-600 hover:text-red-900 p-1">
                        <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredCategories.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No categories found.
            </div>
          )}
        </div>
      </div>

      {showAddForm && (
        <CategoryForm 
          editingCategory={editingCategory} 
          onSuccess={() => {
            refetchCategories();
            resetForm();
          }} 
          onCancel={resetForm} 
        />
      )}
    </>
  );
}