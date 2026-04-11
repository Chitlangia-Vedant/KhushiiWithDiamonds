import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { JewelleryItem } from '../../types';
import { Plus } from 'lucide-react';
import { JewelleryForm } from './JewelleryForm';
import { AdminTableRow } from './AdminTableRow';
import { deleteDriveImages } from '../../utils/uploadUtils';
import { useCategories } from '../../hooks/useCategories';
import { CategoryFilter } from '../CategoryFilter';
import { getValidCategoryNames } from '../../utils/categoryUtils';
import toast from 'react-hot-toast';

export function AdminItemsTab() {
  const { categories } = useCategories();
  const [items, setItems] = useState<JewelleryItem[]>([]);
  
  // --- NEW: Hierarchical Filter States ---
  const [activeCategoryId, setActiveCategoryId] = useState<string | 'All'>('All');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<JewelleryItem | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      // Added 'error' extraction here
      const { data, error } = await supabase
        .from('jewellery_items')
        .select('*')
        .order('created_at', { ascending: false });
        
      // Force the catch block to run if Supabase returns an error
      if (error) throw error; 
      
      if (data) setItems(data);
      
    } catch (error) {
      console.error('Error loading items:', error);
      
      // Add the silent failure warning!
      toast.error('Failed to load inventory. Please check your connection or refresh the page.', {
        duration: 5000
      });
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingItem(null);
  };

  const startEdit = (item: JewelleryItem) => {
    setEditingItem(item);
    setShowAddForm(true);
  };

  const handleSubmit = async (itemData: Partial<JewelleryItem>, imageUrls: string[]) => {
    // The success/error toasts for this are handled inside JewelleryForm.tsx!
    const finalItemData = { ...itemData, image_url: imageUrls };
    if (editingItem) {
      const { error } = await supabase.from('jewellery_items').update({ ...finalItemData, updated_at: new Date().toISOString() }).eq('id', editingItem.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('jewellery_items').insert([finalItemData]);
      if (error) throw error;
    }
    await loadItems();
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      
      // 1. Trigger the loading toast
      const loadingToastId = toast.loading('Deleting item...');
      
      try {
        const itemToDelete = items.find(item => item.id === id);
        
        // Clean up Google Drive images silently
        if (itemToDelete?.image_url && itemToDelete.image_url.length > 0) {
          try { await deleteDriveImages(itemToDelete.image_url); } catch (e) { console.error(e); }
        }
        
        // Delete from database
        const { error } = await supabase.from('jewellery_items').delete().eq('id', id);
        if (error) throw error;
        
        await loadItems();
        
        // 2. Transform into success toast!
        toast.success('Item deleted successfully!', { id: loadingToastId });
        
      } catch (error) {
        console.error('Error deleting:', error);
        
        // 3. Transform into error toast!
        toast.error('Error deleting item. Please try again.', { 
          id: loadingToastId,
          duration: 4000
        });
      }
    }
  };

  // Filter the items using the recursive names array
  const filteredItems = items.filter(item => {
    if (activeCategoryId === 'All') return true;
    const validNames = getValidCategoryNames(activeCategoryId, categories);
    return validNames.includes(item.category);
  });

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">Add Item</span>
        </button>
      </div>

      <CategoryFilter 
        categories={categories} 
        activeCategoryId={activeCategoryId} 
        onSelect={setActiveCategoryId} 
      />

      {/* Table Component */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gold</th>
                <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diamonds</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item,index) => (
                <AdminTableRow 
                  key={item.id}
                  item={item}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                  index={index}
                  totalRows={filteredItems.length}
                />
              ))}
            </tbody>
          </table>
          
          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No items found in this category.
            </div>
          )}
        </div>
      </div>

      {showAddForm && (
        <JewelleryForm editingItem={editingItem} onSubmit={handleSubmit} onCancel={resetForm} />
      )}
    </>
  );
}