import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Category } from '../../types';
import { Plus, Edit, Trash2, Image as ImageIcon, ChevronRight, Folder } from 'lucide-react';
import { CategoryForm } from './CategoryForm';
import { useCategories } from '../../hooks/useCategories';
import { getValidCategoryNames } from '../../utils/categoryUtils'; 
import toast from 'react-hot-toast';
import { deleteDriveImages, deleteDriveFolder, uploadCategoryImages, moveDriveCategoryFolder } from '../../utils/uploadUtils';

export function AdminCategoriesTab() {
  const { categories, topLevelCategories, getSubcategories, refetchCategories } = useCategories();
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // --- FIX: Removed the toast.dismiss() unmount bug from here! ---
  useEffect(() => { loadItemCounts(); }, []);

  const loadItemCounts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('jewellery_items').select('category');
      if (error) throw error; 
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach(item => { counts[item.category] = (counts[item.category] || 0) + 1; });
        setItemCounts(counts);
      }
    } catch (error) { toast.error('Failed to sync category counts.'); } finally { setIsLoading(false); }
  };

  const resetForm = () => { setShowAddForm(false); setEditingCategory(null); };
  const startEdit = (category: Category) => { setEditingCategory(category); setShowAddForm(true); };
  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    newExpanded.has(categoryId) ? newExpanded.delete(categoryId) : newExpanded.add(categoryId);
    setExpandedCategories(newExpanded);
  };

  // --- NEW: BACKGROUND SAVING LOGIC ---
  const handleSubmit = async (payload: any) => {
    // 1. Instantly close modal!
    resetForm();

    const loadingToastId = toast.loading(
      payload.isEditing ? 'Updating category in background...' : 'Saving new category in background...'
    );

    let newlyUploadedUrls: string[] = [];

    try {
      let finalImageUrl = payload.oldCategory?.image_url || null;

      // 2. Upload images to Drive
      if (payload.selectedImages.length > 0) {
        newlyUploadedUrls = await uploadCategoryImages(payload.selectedImages, payload.categoryData.name, payload.itemDescription);
        if (newlyUploadedUrls.length > 0) finalImageUrl = newlyUploadedUrls[0];
      }

      const finalData = { ...payload.categoryData, image_url: finalImageUrl };

      // 3. Move Folders & Update Database
      if (payload.isEditing) {
        const oldParentCat = categories.find(c => c.id === payload.oldCategory.parent_id);
        const newParentCat = categories.find(c => c.id === payload.categoryData.parent_id);
        
        try {
          await moveDriveCategoryFolder(payload.oldCategory.name, oldParentCat?.name, payload.categoryData.name, newParentCat?.name);
        } catch (folderError) {
          console.error("Failed to move folder in Drive:", folderError);
        }

        const { error } = await supabase.from('categories').update(finalData).eq('id', payload.categoryId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert([finalData]);
        if (error) throw error;
      }

      await refetchCategories(); 
      toast.success(payload.isEditing ? 'Category updated successfully!' : 'Category added successfully!', { id: loadingToastId });
      
    } catch (error: any) {
      if (newlyUploadedUrls.length > 0) {
        console.warn("Rolling back Google Drive uploads due to Database failure...");
        try { await deleteDriveImages(newlyUploadedUrls); } catch (rollbackError) { }
      }
      toast.error(error.message || 'Error saving category. Please check your connection.', { id: loadingToastId, duration: 4000 });
    }
  };

  const handleDelete = async (id: string) => {
    toast((t) => (
      <div className="flex flex-col p-1 min-w-[320px]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0 border border-red-100"><Trash2 className="h-5 w-5 text-red-600" /></div>
          <h3 className="font-extrabold text-gray-900 text-lg">Delete Category?</h3>
        </div>
        <div className="flex justify-end gap-3 mt-1">
          <button onClick={() => toast.dismiss(t.id)} className="px-5 py-2 text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-300 shadow-sm">Cancel</button>
          <button onClick={async () => {
              toast.dismiss(t.id); 
              const loadingToastId = toast.loading('Deleting category...');
              try {
                const catToDelete = categories.find(c => c.id === id);
                
                if (catToDelete?.image_url) { 
                  try { await deleteDriveImages([catToDelete.image_url]); } catch (e) { } 
                }

                if (catToDelete) {
                  const parentCat = categories.find(c => c.id === catToDelete.parent_id);
                  try { await deleteDriveFolder(catToDelete.name, parentCat?.name); } catch (e) { }
                }

                const { error } = await supabase.from('categories').delete().eq('id', id);
                if (error) throw error;
                
                await refetchCategories();
                toast.success('Category deleted successfully!', { id: loadingToastId });
              } catch (error: any) { 
                toast.error('Error deleting category. It might have attached items.', { id: loadingToastId }); 
              }
            }} className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm border border-red-700">Yes, delete</button>
        </div>
      </div>
    ), { duration: Infinity, style: { maxWidth: '450px', padding: '16px', backgroundColor: '#ffffff', border: '1px solid #fecaca' } });
  };

  const CategoryTableRow = ({ category, level = 0 }: { category: Category; level?: number }) => {
    const subcategories = getSubcategories(category.id);
    const hasSubcategories = subcategories.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const validNames = getValidCategoryNames(category.id, categories);
    const totalItems = validNames.reduce((sum, name) => sum + (itemCounts[name] || 0), 0);
    const paddingLeft = level * 32;

    return (
      <React.Fragment key={category.id}>
        <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100">
          <td className="px-4 py-3 whitespace-nowrap">
            <div className="flex items-center" style={{ paddingLeft: `${paddingLeft}px` }}>
              <div className="w-6 flex-shrink-0 flex items-center justify-center mr-2">
                {hasSubcategories ? <button onClick={() => toggleExpanded(category.id)} className="p-1 rounded-md hover:bg-gray-200 text-gray-500 transition-colors"><ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} /></button> : <span className="w-4"></span>}
              </div>
              {category.image_url ? <img className="h-8 w-8 rounded-lg object-cover border border-gray-200 flex-shrink-0" src={category.image_url} alt="" /> : <div className="h-8 w-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">{hasSubcategories ? <Folder className="h-4 w-4 text-blue-500" /> : <ImageIcon className="h-4 w-4 text-gray-300" />}</div>}
              <div className="ml-3 font-semibold text-gray-900 text-sm">{category.name}</div>
            </div>
          </td>
          <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap text-sm text-gray-500">
            {hasSubcategories ? <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">{subcategories.length} folders</span> : <span className="text-gray-400 text-xs italic">-</span>}
          </td>
          <td className="px-4 py-3 whitespace-nowrap text-sm">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${totalItems > 0 ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-50 text-gray-400'}`}>{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
          </td>
          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
            <button onClick={() => startEdit(category)} className="text-yellow-600 hover:text-yellow-900 mr-3 p-1"><Edit className="h-4 w-4 md:h-5 md:w-5" /></button>
            {hasSubcategories || totalItems > 0 ? <button disabled title="Cannot delete: Move or delete all items and subcategories first." className="p-1 text-gray-300 cursor-not-allowed"><Trash2 className="h-4 w-4 md:h-5 md:w-5" /></button> : <button onClick={() => handleDelete(category.id)} title="Delete Category" className="p-1 text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4 md:h-5 md:w-5" /></button>}
          </td>
        </tr>
        {hasSubcategories && isExpanded && ( subcategories.map(sub => <CategoryTableRow key={sub.id} category={sub} level={level + 1} />) )}
      </React.Fragment>
    );
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Categories</h2>
          <p className="text-[10px] sm:text-sm text-gray-500 mt-0.5 sm:mt-1 hidden sm:block">Organize your inventory structure.</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="bg-yellow-600 text-white p-2 sm:px-4 sm:py-2 rounded-lg hover:bg-yellow-700 flex items-center shadow-sm flex-shrink-0 transition-colors">
          <Plus className="h-5 w-5" /> <span className="hidden sm:inline ml-1.5 font-medium">Add Category</span>
        </button>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-10 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Categories</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contents</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jewellery</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse border-b border-gray-100">
                    <td className="px-4 py-4 whitespace-nowrap"><div className="flex items-center pl-4"><div className="h-8 w-8 bg-gray-200 rounded-lg flex-shrink-0 mr-3"></div><div className="h-4 w-32 bg-gray-200 rounded"></div></div></td>
                    <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap"><div className="h-5 w-20 bg-gray-200 rounded-full"></div></td>
                    <td className="px-4 py-4 whitespace-nowrap"><div className="h-5 w-16 bg-gray-200 rounded-full"></div></td>
                    <td className="px-4 py-4 whitespace-nowrap text-right"><div className="h-8 w-16 bg-gray-200 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : (
                topLevelCategories.map((category) => <CategoryTableRow key={category.id} category={category} level={0} />)
              )}
              {!isLoading && topLevelCategories.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-gray-500">No categories found. Click "Add Category" to start building your hierarchy!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddForm && <CategoryForm editingCategory={editingCategory} onSubmit={handleSubmit} onCancel={resetForm} />}
    </>
  );
}