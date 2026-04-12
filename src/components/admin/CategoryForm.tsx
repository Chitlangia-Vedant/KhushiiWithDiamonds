import React, { useState, useEffect } from 'react';
import { Category } from '../../types';
import { Save, X, Upload, AlertTriangle } from 'lucide-react'; 
import { useCategories } from '../../hooks/useCategories';
import { CategoryDropdown } from '../shared/CategoryDropdown';
import toast from 'react-hot-toast';
import { getDescendantCategoryIds } from '../../utils/categoryUtils';

interface CategoryFormProps {
  editingCategory: Category | null;
  onSubmit: (payload: any) => void; 
  onCancel: () => void;
}

export function CategoryForm({ editingCategory, onSubmit, onCancel }: CategoryFormProps) {
  const { categories } = useCategories(); 
  
  const [categoryFormData, setCategoryFormData] = useState({
    name: editingCategory?.name || '', 
    description: editingCategory?.description || '', 
    parent_id: editingCategory?.parent_id || '',
  });
  
  // Strict Single-Image State
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [removeOldImage, setRemoveOldImage] = useState(false);

  const [initialDataStr] = useState(JSON.stringify(categoryFormData));

  const hasUnsavedChanges = () => {
    return JSON.stringify(categoryFormData) !== initialDataStr || selectedImages.length > 0 || removeOldImage;
  };

  useEffect(() => {
    const isDirty = hasUnsavedChanges();
    (window as any).isFormDirty = isDirty; 
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      (window as any).isFormDirty = false; 
    };
  }, [categoryFormData, selectedImages, removeOldImage, initialDataStr]);

  const handleSafeCancel = () => {
    if (hasUnsavedChanges()) {
      toast((t) => (
        <div className="flex flex-col p-1 min-w-[320px]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0 border border-orange-100">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="font-extrabold text-gray-900 text-lg">Discard Changes?</h3>
          </div>
          <div className="text-sm text-gray-800 mb-5 pl-[52px] leading-relaxed">
            <p className="mb-2 font-medium">You have unsaved changes in this category.</p>
            <p className="bg-orange-50/80 p-2 border border-orange-100 rounded text-orange-900 text-xs">
              Are you sure you want to close without saving?
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-1">
            <button onClick={() => toast.dismiss(t.id)} className="px-5 py-2 text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-300 shadow-sm">
              Keep Editing
            </button>
            <button 
              onClick={() => {
                toast.dismiss(t.id);
                (window as any).isFormDirty = false;
                onCancel();
              }} 
              className="px-5 py-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors shadow-sm border border-orange-600"
            >
              Yes, discard
            </button>
          </div>
        </div>
      ), { duration: Infinity, style: { maxWidth: '450px', padding: '16px', backgroundColor: '#ffffff', border: '1px solid #fed7aa' } });
    } else {
      (window as any).isFormDirty = false;
      onCancel();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Force the array to only ever hold the 1 most recently selected file
      setSelectedImages([files[0]]);
    }
  };

  const generateCategoryDescription = (): string => {
    let description = `Name: ${categoryFormData.name}\n`;
    description += `Description: ${categoryFormData.description || 'N/A'}\n`;
    
    if (categoryFormData.parent_id) {
      const parentCategory = categories.find(cat => cat.id === categoryFormData.parent_id);
      description += `Parent Category: ${parentCategory?.name || 'N/A'}\n`;
    } else {
      description += `Category Type: Top-level category\n`;
    }
    return description;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const itemDescription = generateCategoryDescription(); 
    (window as any).isFormDirty = false;

    onSubmit({
      isEditing: !!editingCategory,
      categoryId: editingCategory?.id,
      oldCategory: editingCategory,
      categoryData: {
        name: categoryFormData.name,
        description: categoryFormData.description,
        parent_id: categoryFormData.parent_id || null, 
      },
      selectedImages, // Now securely max length 1
      removeOldImage, // The new deletion flag
      itemDescription
    });
  };

  const invalidParentIds = editingCategory 
    ? [editingCategory.id, ...getDescendantCategoryIds(editingCategory.id, categories)]
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[95vh] relative">
        
        <div className="flex justify-between items-center p-5 border-b border-gray-200 shrink-0">
          <h2 className="text-xl font-bold text-gray-800">{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
          <button onClick={handleSafeCancel} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 flex-1 custom-scrollbar">
          <form id="category-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Parent Category (Optional)</label>
              <CategoryDropdown 
                valueLabel={categoryFormData.parent_id ? categories.find(c => c.id === categoryFormData.parent_id)?.name || 'Unknown' : 'None (Top-level category)'} 
                onSelect={(categoryId) => setCategoryFormData({ ...categoryFormData, parent_id: categoryId })} 
                onClear={() => setCategoryFormData({ ...categoryFormData, parent_id: '' })} 
                clearLabel="None (Top Level Category)" 
                excludeCategoryIds={invalidParentIds} /* <-- FIX IS HERE */
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to create a top-level category, or select a parent to create a subcategory.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Name *</label>
              <input type="text" required value={categoryFormData.name} onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500" placeholder="e.g., Heavy Rings, Light Rings" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Description</label>
              <textarea value={categoryFormData.description} onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500" rows={3} placeholder="Brief description of the category" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Category Thumbnail</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                
                {/* 1. Add Photo Button (Only shows if no image is present/selected) */}
                {selectedImages.length === 0 && (!editingCategory?.image_url || removeOldImage) && (
                  <label className="flex flex-col items-center justify-center aspect-square border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <Upload className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500 font-medium">Add Photo</span>
                    {/* The `multiple` attribute has been removed */}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}

                {/* 2. Newly Uploaded Image */}
                {selectedImages.length > 0 && (
                  <div className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-green-200">
                    <img src={URL.createObjectURL(selectedImages[0])} alt="New Thumbnail" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setSelectedImages([])} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-md">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* 3. Existing Category Image */}
                {editingCategory?.image_url && selectedImages.length === 0 && !removeOldImage && (
                  <div className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                    <img src={editingCategory.image_url} alt="Current Thumbnail" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setRemoveOldImage(true)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-md">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

              </div>
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end space-x-3 shrink-0">
          <button type="button" onClick={handleSafeCancel} className="px-4 py-2 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition-colors">Cancel</button>
          <button type="submit" form="category-form" className="bg-yellow-600 text-white px-5 py-2 rounded-md hover:bg-yellow-700 font-medium flex items-center space-x-2 transition-colors shadow-sm">
            <Save className="h-4 w-4" /><span>{editingCategory ? 'Update' : 'Add'} Category</span>
          </button>
        </div>

      </div>
    </div>
  );
}