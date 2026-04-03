import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Category, JewelleryItem } from '../../types';
import { Plus, Folder } from 'lucide-react';
import { CategoryForm } from './CategoryForm';
import { CategoryCard } from './CategoryCard';

interface AdminCategoriesTabProps {
  items: JewelleryItem[];
  onCategoriesChange: () => void;
}

export function AdminCategoriesTab({ items, onCategoriesChange }: AdminCategoriesTabProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (data) {
        setCategories(data);
        onCategoriesChange();
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const resetCategoryForm = () => {
    setShowAddCategoryForm(false);
    setEditingCategory(null);
  };

  const startEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowAddCategoryForm(true);
  };

  const handleCategorySubmit = async (categoryData: Partial<Category>, imageUrls: string[]) => {
    const submitData = {
      ...categoryData,
      parent_id: categoryData.parent_id || null,
      image_url: imageUrls.join(', '), // Store multiple URLs as comma-separated string
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
    
    await loadCategories();
    resetCategoryForm();
  };

  const handleDeleteCategory = async (id: string, categoryName: string) => {
    // Check for items in this category
    const itemCount = items.filter(item => item.category === categoryName).length;
    
    // Check for subcategories
    const subcategories = categories.filter(cat => cat.parent_id === id);
    
    if (itemCount > 0) {
      alert(`Cannot delete category "${categoryName}" because it contains ${itemCount} items. Please move or delete the items first.`);
      return;
    }

    if (subcategories.length > 0) {
      alert(`Cannot delete category "${categoryName}" because it has ${subcategories.length} subcategories. Please delete the subcategories first.`);
      return;
    }

    if (confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        await loadCategories();
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

  // Organize categories into hierarchy
  const topLevelCategories = categories.filter(cat => !cat.parent_id);
  const getSubcategories = (parentId: string) => 
    categories.filter(cat => cat.parent_id === parentId);

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
          categories={categories}
          editingCategory={editingCategory}
          onSubmit={handleCategorySubmit}
          onCancel={resetCategoryForm}
        />
      )}
    </>
  );
}