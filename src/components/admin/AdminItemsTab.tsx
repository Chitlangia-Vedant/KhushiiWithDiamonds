import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { JewelleryItem } from '../../types';
import { Plus, Filter, Home, ChevronRight } from 'lucide-react';
import { JewelleryForm } from './JewelleryForm';
import { AdminTableRow } from './AdminTableRow';
import { deleteDriveImages } from '../../utils/uploadUtils';
import { useCategories } from '../../hooks/useCategories';

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

  // 1. Calculate the Breadcrumb Trail for the UI
  const getBreadcrumbs = (categoryId: string) => {
    if (categoryId === 'All') return [];
    const trail = [];
    let currentId: string | null = categoryId;
    while (currentId) {
      const cat = categories.find(c => c.id === currentId);
      if (cat) {
        trail.unshift(cat); // Push to the front of the array
        currentId = cat.parent_id;
      } else {
        break;
      }
    }
    return trail;
  };

  // 2. Recursively find ALL descendant names (so "Rings" shows level 3, 4, 5+ rings)
  const getValidCategoryNames = (categoryId: string): string[] => {
    const parentCat = categories.find(c => c.id === categoryId);
    if (!parentCat) return [];

    let names = [parentCat.name];
    const children = categories.filter(c => c.parent_id === categoryId);

    children.forEach(child => {
      names = [...names, ...getValidCategoryNames(child.id)];
    });

    return names;
  };

  // Derived states for rendering
  const breadcrumbs = getBreadcrumbs(activeCategoryId);
  const currentChildren = activeCategoryId === 'All'
    ? categories.filter(c => !c.parent_id) // Top-level categories
    : categories.filter(c => c.parent_id === activeCategoryId); // Direct subcategories

  // Filter the items using the recursive names array
  const filteredItems = items.filter(item => {
    if (activeCategoryId === 'All') return true;
    const validNames = getValidCategoryNames(activeCategoryId);
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

      {/* --- NEW: Infinite Depth Filter UI --- */}
      <div className="mb-6 flex flex-col space-y-3 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        
        {/* Row 1: Breadcrumb Path */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveCategoryId('All')}
            className={`flex items-center space-x-1 font-medium transition-colors hover:text-yellow-600 ${activeCategoryId === 'All' ? 'text-gray-900 font-bold' : ''}`}
          >
            <Home className="h-4 w-4" />
            <span className="whitespace-nowrap">All Items</span>
          </button>

          {breadcrumbs.map((bc) => (
            <React.Fragment key={bc.id}>
              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <button
                onClick={() => setActiveCategoryId(bc.id)}
                className={`font-medium whitespace-nowrap transition-colors hover:text-yellow-600 ${activeCategoryId === bc.id ? 'text-gray-900 font-bold' : ''}`}
              >
                {bc.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Row 2: Contextual Drill-Down Pills */}
        {currentChildren.length > 0 && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-hide border-t border-gray-100 pt-3">
            {activeCategoryId !== 'All' && (
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2 whitespace-nowrap flex-shrink-0">
                Subcategories:
              </span>
            )}
            {currentChildren.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className="px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-medium bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-100 transition-colors shadow-sm"
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