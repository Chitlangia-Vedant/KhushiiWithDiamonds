import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Category } from '../../types';
import { Plus, Edit, Trash2, Image as ImageIcon, ChevronRight, Folder } from 'lucide-react';
import { CategoryForm } from './CategoryForm';
import { deleteDriveImages } from '../../utils/uploadUtils';
import { useCategories } from '../../hooks/useCategories';
import { getValidCategoryNames } from '../../utils/categoryUtils'; // <-- Import our utility!
import toast from 'react-hot-toast';

export function AdminCategoriesTab() {
  const { categories, topLevelCategories, getSubcategories, refetchCategories } = useCategories();
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // --- NEW: State to hold item counts ---
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});

  // Fetch all item categories on mount
  useEffect(() => {
    loadItemCounts();
  }, []);

  const loadItemCounts = async () => {
    try {
      // We only need to fetch the category column, making this extremely fast!
      const { data, error } = await supabase.from('jewellery_items').select('category');
      
      // FIX: You must throw the error so the catch block actually runs if Supabase fails!
      if (error) throw error; 

      if (data) {
        const counts: Record<string, number> = {};
        data.forEach(item => {
          counts[item.category] = (counts[item.category] || 0) + 1;
        });
        setItemCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching item counts:', error);
      
      // Let the admin know the background sync failed
      toast.error('Failed to sync category counts. Please refresh the page.', {
        duration: 4000
      });
    }
  };

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
    // We keep window.confirm as it's the safest, native way to prevent accidental clicks
    if (window.confirm('Are you sure you want to delete this category? (Note: Ensure no items are using it first!)')) {
      
      // 1. Trigger a loading toast so the user knows it's working
      const loadingToastId = toast.loading('Deleting category...');
      
      try {
        const catToDelete = categories.find(c => c.id === id);
        
        // Clean up Google Drive images silently
        if (catToDelete?.image_url) {
          try { await deleteDriveImages([catToDelete.image_url]); } catch (e) { console.error(e); }
        }

        // Delete from database
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        
        await refetchCategories();
        
        // 2. Replace the loading toast with a success message!
        toast.success('Category deleted successfully!', { id: loadingToastId });
        
      } catch (error: any) {
        console.error('Error deleting:', error);
        
        // 3. Replace the loading toast with an error message!
        toast.error('Error deleting category. It might have subcategories or items attached to it.', { 
          id: loadingToastId,
          duration: 5000 // Give them a little extra time to read the error
        });
      }
    }
  };

  const CategoryTableRow = ({ category, level = 0 }: { category: Category; level?: number }) => {
    const subcategories = getSubcategories(category.id);
    const hasSubcategories = subcategories.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    
    // --- NEW: Calculate recursive item count ---
    // This finds every valid subcategory name under this folder and sums their items!
    const validNames = getValidCategoryNames(category.id, categories);
    const totalItems = validNames.reduce((sum, name) => sum + (itemCounts[name] || 0), 0);

    const paddingLeft = level * 32;

    return (
      <React.Fragment key={category.id}>
        <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100">
          
          <td className="px-4 py-3 whitespace-nowrap">
            <div className="flex items-center" style={{ paddingLeft: `${paddingLeft}px` }}>
              <div className="w-6 flex-shrink-0 flex items-center justify-center mr-2">
                {hasSubcategories ? (
                  <button onClick={() => toggleExpanded(category.id)} className="p-1 rounded-md hover:bg-gray-200 text-gray-500 transition-colors">
                    <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                ) : <span className="w-4"></span>}
              </div>

              {category.image_url ? (
                <img className="h-8 w-8 rounded-lg object-cover border border-gray-200 flex-shrink-0" src={category.image_url} alt="" />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                  {hasSubcategories ? <Folder className="h-4 w-4 text-blue-500" /> : <ImageIcon className="h-4 w-4 text-gray-300" />}
                </div>
              )}
              <div className="ml-3 font-semibold text-gray-900 text-sm">{category.name}</div>
            </div>
          </td>

          <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap text-sm text-gray-500">
            {hasSubcategories ? (
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                {subcategories.length} folders
              </span>
            ) : <span className="text-gray-400 text-xs italic">-</span>}
          </td>

          {/* --- NEW: No. of Jewellery Column --- */}
          <td className="px-4 py-3 whitespace-nowrap text-sm">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              totalItems > 0 ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-50 text-gray-400'
            }`}>
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </span>
          </td>

          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
            <button onClick={() => startEdit(category)} className="text-yellow-600 hover:text-yellow-900 mr-3 p-1">
              <Edit className="h-4 w-4 md:h-5 md:w-5" />
            </button>
            
            {/* --- SMART DELETE BUTTON --- */}
            {hasSubcategories || totalItems > 0 ? (
              <button 
                disabled
                title="Cannot delete: Move or delete all items and subcategories first."
                className="p-1 text-gray-300 cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            ) : (
              <button 
                onClick={() => handleDelete(category.id)} 
                title="Delete Category"
                className="p-1 text-red-600 hover:text-red-900"
              >
                <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            )}
          </td>
        </tr>

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
                {/* --- NEW: Header Column --- */}
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">No. of Jewellery</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {topLevelCategories.map((category) => (
                <CategoryTableRow key={category.id} category={category} level={0} />
              ))}
              
              {topLevelCategories.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-500">
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