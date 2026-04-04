import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { JewelleryItem } from '../../types';
import { Plus } from 'lucide-react';
import { JewelleryForm } from './JewelleryForm';
import { AdminTableRow } from './AdminTableRow';
import { deleteDriveImages } from '../../utils/uploadUtils';
import { useCategories } from '../../hooks/useCategories';

export function AdminItemsTab() {
  const { categories } = useCategories();
  const [items, setItems] = useState<JewelleryItem[]>([]);
  
  // --- NEW: Hierarchical Filter States ---
  const [selectedParentId, setSelectedParentId] = useState<string | 'All'>('All');
  const [selectedSubCategoryName, setSelectedSubCategoryName] = useState<string | 'All'>('All');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<JewelleryItem | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const { data } = await supabase
        .from('jewellery_items')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
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
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        const itemToDelete = items.find(item => item.id === id);
        if (itemToDelete?.image_url && itemToDelete.image_url.length > 0) {
          try { await deleteDriveImages(itemToDelete.image_url); } catch (e) { console.error(e); }
        }
        const { error } = await supabase.from('jewellery_items').delete().eq('id', id);
        if (error) throw error;
        await loadItems();
      } catch (error) {
        console.error('Error deleting:', error);
        alert('Error deleting item.');
      }
    }
  };

  // --- NEW: Hierarchical Filtering Logic ---
  // 1. Compute active categories
  const topLevelCategories = categories.filter(c => !c.parent_id);
  const activeSubcategories = selectedParentId === 'All' 
    ? [] 
    : categories.filter(c => c.parent_id === selectedParentId);

  // 2. Filter the items smartly
  const filteredItems = items.filter(item => {
    // If "All Items" is selected, show absolutely everything
    if (selectedParentId === 'All') return true;

    const parentCat = categories.find(c => c.id === selectedParentId);
    if (!parentCat) return true;

    // If a specific subcategory is clicked (e.g., "Engagement Rings")
    if (selectedSubCategoryName !== 'All') {
      return item.category === selectedSubCategoryName;
    } 
    
    // If "All [Parent]" is clicked (e.g., "All Rings")
    // Show items matching the parent name OR any of its subcategories!
    const validCategoryNames = [parentCat.name, ...activeSubcategories.map(c => c.name)];
    return validCategoryNames.includes(item.category);
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

      {/* --- NEW: Hierarchical Category Filter UI --- */}
      <div className="mb-6 flex flex-col space-y-3">
        {/* Top Level Categories */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => { setSelectedParentId('All'); setSelectedSubCategoryName('All'); }}
            className={`px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
              selectedParentId === 'All' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Items
          </button>
          {topLevelCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedParentId(cat.id); setSelectedSubCategoryName('All'); }}
              className={`px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                selectedParentId === cat.id ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Subcategories (Only renders if the selected parent has children) */}
        {activeSubcategories.length > 0 && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide pt-1 border-t border-gray-100">
            <button
              onClick={() => setSelectedSubCategoryName('All')}
              className={`px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                selectedSubCategoryName === 'All' ? 'bg-yellow-600 text-white' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
              }`}
            >
              All {categories.find(c => c.id === selectedParentId)?.name}
            </button>
            {activeSubcategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedSubCategoryName(cat.name)}
                className={`px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                  selectedSubCategoryName === cat.name ? 'bg-yellow-600 text-white' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table Component */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Images</th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specs</th>
                <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diamonds</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breakdown</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <AdminTableRow 
                  key={item.id}
                  item={item}
                  onEdit={startEdit}
                  onDelete={handleDelete}
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