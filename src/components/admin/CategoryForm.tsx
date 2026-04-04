import React, { useState } from 'react';
import { Category } from '../../types';
import { Save, X, Upload, FileImage, Loader } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import { uploadCategoryImages } from '../../utils/uploadUtils';

interface CategoryFormProps {
  editingCategory: Category | null;
  onSubmit: (categoryData: Partial<Category>, imageUrls: string[]) => Promise<void>;
  onCancel: () => void;
}

export function CategoryForm({ editingCategory, onSubmit, onCancel }: CategoryFormProps) {
  const { categories, topLevelCategories } = useCategories();
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
      const fileArray = Array.from(files);
      setSelectedImages(fileArray);
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

      await onSubmit(categoryFormData, imageUrls);
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category. Please check your permissions and try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {editingCategory ? 'Edit Category' : 'Add New Category'}
          </h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
            <select
              value={categoryFormData.parent_id}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, parent_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
              disabled={uploading}
            >
              <option value="">None (Top-level category)</option>
              {topLevelCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to create a top-level category, or select a parent to create a subcategory.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={categoryFormData.description}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
              rows={3}
              placeholder="Brief description of the category"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Images
            </label>
            <div className="space-y-3">
              <div className="flex items-center justify-center w-full">
                <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> category images
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 10MB each)</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>

              {/* Display selected images */}
              {selectedImages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Selected Images:</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedImages.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                        <div className="flex items-center space-x-2">
                          <FileImage className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500">
                Images will be uploaded to: <code>WebCatalog(DO NOT EDIT)/</code>
                <br />
                File names will be based on the category name.
              </p>
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={uploading}
              className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{editingCategory ? 'Update' : 'Add'} Category</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={uploading}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}