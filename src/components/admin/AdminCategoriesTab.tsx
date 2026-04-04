import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Category, JewelleryItem } from '../../types';
import { Plus, Folder } from 'lucide-react';
import { CategoryForm } from './CategoryForm';
import { CategoryCard } from './CategoryCard';
import { useCategories } from '../../hooks/useCategories';
import { deleteDriveImages } from '../../utils/uploadUtils';

interface AdminCategoriesTabProps {
  items: JewelleryItem[];
}

export function AdminCategoriesTab({ items }: AdminCategoriesTabProps) {
  const { categories, topLevelCategories, getSubcategories, refetchCategories } = useCategories();
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const resetCategoryForm = () => {
    setShowAddCategoryForm(false);
    setEditingCategory(null);
  };

  const startEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowAddCategoryForm(true);
  };

  const handleCategorySubmit = async (categoryData: Partial<Category>, newImageUrls: string[]) => {
    // Default to the existing image string
    let finalImageUrl = editingCategory?.image_url || '';

    // If new images were uploaded, overwrite the old ones AND delete them from Drive
    if (newImageUrls.length > 0) {
      finalImageUrl = newImageUrls.join(', ');

      // --- NEW DRIVE CLEANUP LOGIC ---
      if (editingCategory?.image_url) {
        // Split the old string and remove any blank spaces
        const oldUrls = editingCategory.image_url.split(',').map(url => url.trim()).filter(Boolean);
        
        if (oldUrls.length > 0) {
          try {
            await deleteDriveImages(oldUrls);
            console.log('Successfully cleaned up old category images from Google Drive');
          } catch (deleteError) {
            console.error('Failed to delete old images from Drive:', deleteError);
            // We intentionally do not 'throw' here. 
            // If Drive fails to delete the old file, we still want the database to save the new one!
          }
        }
      }
    }

    const submitData = {
      ...categoryData,
      parent_id: categoryData.parent_id || null,
      image_url: finalImageUrl, 
    };

    if (editingCategory) {
      const { error } = await supabase
        .from('categories')
        .update(submitData)
        .eq('id', editingCategory.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('categories').insert([submitData]);
      if (error) throw error;
    }
    
    // Using your shiny new custom hook to reload!
    refetchCategories(); 
    resetCategoryForm();
  };

  const handleDeleteCategory = async (id: string, categoryName: string) => {
    // ... (Keep your existing checks for itemCount and subcategories at the top)

    if (confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      try {
        // 1. --- NEW: DRIVE CLEANUP LOGIC ---
        // Find the category we are about to delete
        const categoryToDelete = categories.find(c => c.id === id);
        
        if (categoryToDelete?.image_url) {
          // Extract the URLs into an array
          const urlsToDelete = categoryToDelete.image_url.split(',').map(url => url.trim()).filter(Boolean);
          
          if (urlsToDelete.length > 0) {
            try {
              // Delete them from Drive!
              await deleteDriveImages(urlsToDelete);
              console.log('Successfully deleted category images from Google Drive');
            } catch (deleteError) {
              console.error('Failed to delete images from Drive:', deleteError);
              // We don't throw here so the category still deletes from Supabase even if Drive glitches
            }
          }
        }

        // 2. --- EXISTING SUPABASE DELETION ---
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        
        refetchCategories(); // Using the hook we set up earlier!
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category. Please check your permissions and try again.');
      }
    }
  };

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Categories & Subcategories</h2>
          <p className="text-gray-600">Manage your hierarchical category structure</p>
        </div>
        <button
          onClick={() => setShowAddCategoryForm(true)}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="space-y-6">
        {topLevelCategories.map((category) => (
          <CategoryCard 
            key={category.id} 
            category={category}
            items={items}
            subcategories={getSubcategories(category.id)}
            expandedCategories={expandedCategories}
            onToggleExpanded={toggleExpanded}
            onEdit={startEditCategory}
            onDelete={handleDeleteCategory}
          />
        ))}
        
        {topLevelCategories.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600">Create your first category to get started.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Category Form Modal */}
      {showAddCategoryForm && (
        <CategoryForm
          editingCategory={editingCategory}
          onSubmit={handleCategorySubmit}
          onCancel={resetCategoryForm}
        />
      )}
    </>
  );
}