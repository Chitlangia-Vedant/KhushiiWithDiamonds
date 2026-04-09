import React, { useState } from 'react';
import { Category } from '../../types';
import { Save, X, Upload, Loader } from 'lucide-react'; 
import { useCategories } from '../../hooks/useCategories';
import { uploadCategoryImages } from '../../utils/uploadUtils';
import { CategoryDropdown } from '../CategoryDropdown';

interface CategoryFormProps {
  editingCategory: Category | null;
  // CHANGE THIS LINE:
  onSuccess: () => void;
  onCancel: () => void;
}

export function CategoryForm({ editingCategory, onSuccess, onCancel }: CategoryFormProps) {
  const { categories } = useCategories(); 
  const [uploading, setUploading] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: editingCategory?.name || '', 
    description: editingCategory?.description || '', 
    parent_id: editingCategory?.parent_id || '',
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Append new files to existing ones instead of replacing them
      const fileArray = Array.from(files);
      setSelectedImages([...selectedImages, ...fileArray]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Function to generate category description
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      let imageUrls: string[] = [];

      // Upload images to Google Drive if any are selected
      if (selectedImages.length > 0) {
        try {
          const itemDescription = generateCategoryDescription(); 
          
          // Use your new utility!
          imageUrls = await uploadCategoryImages(
            selectedImages,
            categoryFormData.name,
            itemDescription
          );
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
          alert(`Image upload failed: ${errorMessage}. The category will be saved without images.`);
        }
      }

      await onSuccess();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category. Please check your permissions and try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      
      {/* Modal Container: Fixed max height, flex column for sticky sections */}
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[95vh] relative">
        
        {/* --- STICKY HEADER --- */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 shrink-0">
          <h2 className="text-xl font-bold text-gray-800">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* --- SCROLLABLE BODY --- */}
        <div className="overflow-y-auto p-5 flex-1 custom-scrollbar">
          <form id="category-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Parent Category Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Parent Category (Optional)
              </label>
              <CategoryDropdown
                valueLabel={categoryFormData.parent_id 
                  ? categories.find(c => c.id === categoryFormData.parent_id)?.name || 'Unknown'
                  : 'None (Top-level category)'}
                onSelect={(categoryId) => setCategoryFormData({ ...categoryFormData, parent_id: categoryId })}
                onClear={() => setCategoryFormData({ ...categoryFormData, parent_id: '' })}
                clearLabel="None (Top Level Category)"
                excludeCategoryId={editingCategory?.id}
                disabled={uploading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to create a top-level category, or select a parent to create a subcategory.
              </p>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Name *</label>
              <input
                type="text"
                required
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                placeholder="e.g., Heavy Rings, Light Rings"
                disabled={uploading}
              />
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Description</label>
              <textarea
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                rows={3}
                placeholder="Brief description of the category"
                disabled={uploading}
              />
            </div>

            {/* Images Grid Section */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Category Images
              </label>
              
              <div className="grid grid-cols-3 gap-3">
                {/* Upload Button (Acts as a grid item) */}
                <label className={`flex flex-col items-center justify-center aspect-square border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Upload className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500 font-medium">Add Photo</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>

                {/* New Images Previews (Side-by-side with upload button) */}
                {selectedImages.map((file, index) => (
                  <div key={index} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-green-200">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`New ${index + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                    <button 
                      type="button" 
                      onClick={() => removeImage(index)} 
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-md" 
                      disabled={uploading}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                <p>Images will be uploaded to: <code>WebCatalog(DO NOT EDIT)/</code></p>
                <p>File names will be based on the category name.</p>
              </div>
            </div>

          </form>
        </div>

        {/* --- STICKY FOOTER --- */}
        <div className="p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end space-x-3 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            className="px-4 py-2 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="category-form"
            disabled={uploading}
            className="bg-yellow-600 text-white px-5 py-2 rounded-md hover:bg-yellow-700 font-medium flex items-center space-x-2 transition-colors disabled:opacity-70 shadow-sm"
          >
            {uploading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{editingCategory ? 'Update' : 'Add'} Category</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}