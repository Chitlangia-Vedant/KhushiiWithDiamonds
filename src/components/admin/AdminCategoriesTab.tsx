import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Category } from '../../types';
import { Plus, Edit, Trash2, Image as ImageIcon, ChevronRight, Folder } from 'lucide-react';
import { CategoryForm } from './CategoryForm';
import { deleteDriveImages } from '../../utils/uploadUtils';
import { useCategories } from '../../hooks/useCategories';

export function AdminCategoriesTab() {
  // Pull topLevelCategories and getSubcategories to build our tree!
  const { categories, topLevelCategories, getSubcategories, refetchCategories } = useCategories();
  
  // Track which folders are toggled open
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
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

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) newExpanded.delete(categoryId);
    else newExpanded.add(categoryId);
    setExpandedCategories(newExpanded);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this category? (Note: Ensure no items are using it first!)')) {
      try {
        const catToDelete = categories.find(c => c.id === id);
        
        if (catToDelete?.image_url) {
          try { await deleteDriveImages([catToDelete.image_url]); } catch (e) { console.error(e); }
        }

        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        
        await refetchCategories();
      } catch (error: any) {
        console.error('Error deleting:', error);
        alert('Error deleting category. It might have subcategories or items attached to it.');
      }
    }
  };

  // --- NEW: Recursive Table Row Component ---
  const CategoryTableRow = ({ category, level = 0 }: { category: Category; level?: number }) => {
    const subcategories = getSubcategories(category.id);
    const hasSubcategories = subcategories.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    
    // Indent 32px for every level deep we go!
    const paddingLeft = level * 32;

    return (
      <React.Fragment key={category.id}>
        <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100">
          
          {/* 1. Category Name & Hierarchy Indentation */}
          <td className="px-4 py-3 whitespace-nowrap">
            <div className="flex items-center" style={{ paddingLeft: `${paddingLeft}px` }}>
              
              {/* Expand/Collapse Chevron */}
              <div className="w-6 flex-shrink-0 flex items-center justify-center mr-2">
                {hasSubcategories ? (
                  <button
                    onClick={() => toggleExpanded(category.id)}
                    className="p-1 rounded-md hover:bg-gray-200 text-gray-500 transition-colors"
                  >
                    <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                ) : (
                  <span className="w-4"></span> // Spacer for alignment if no children
                )}
              </div>

              {/* Icon/Image */}
              {category.image_url ? (
                <img className="h-8 w-8 rounded-lg object-cover border border-gray-200 flex-shrink-0" src={category.image_url} alt="" />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                  {hasSubcategories ? <Folder className="h-4 w-4 text-blue-500" /> : <ImageIcon className="h-4 w-4 text-gray-300" />}
                </div>
              )}

              {/* Name */}
              <div className="ml-3 font-semibold text-gray-900 text-sm">{category.name}</div>
            </div>
          </td>

          {/* 2. Meta Info (Hidden on mobile) */}
          <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap text-sm text-gray-500">
            {hasSubcategories ? (
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                {subcategories.length} subcategories
              </span>
            ) : (
              <span className="text-gray-400 text-xs italic">-</span>
            )}
          </td>

          {/* 3. Actions */}
          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
            <button onClick={() => startEdit(category)} className="text-yellow-600 hover:text-yellow-900 mr-3 p-1">
              <Edit className="h-4 w-4 md:h-5 md:w-5" />
            </button>
            <button onClick={() => handleDelete(category.id)} className="text-red-600 hover:text-red-900 p-1">
              <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          </td>
        </tr>

        {/* RECURSION: If this folder is open, immediately render its children right below it! */}
        {hasSubcategories && isExpanded && (
          subcategories.map(sub => (
            <CategoryTableRow key={sub.id} category={sub} level={level + 1} />
          ))
        )}
      </React.Fragment>
    );
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2 shadow-sm"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">Add Category</span>
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-10 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Hierarchy Structure</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contents</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {/* We ONLY map over top-level categories here. The component handles the rest! */}
              {topLevelCategories.map((category) => (
                <CategoryTableRow key={category.id} category={category} level={0} />
              ))}
              
              {topLevelCategories.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-gray-500">
                    No categories found. Click "Add Category" to start building your hierarchy!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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