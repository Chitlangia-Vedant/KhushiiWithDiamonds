import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { JewelleryItem } from '../../types';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { JewelleryForm } from './JewelleryForm';
import { AdminTableRow } from './AdminTableRow';
import { deleteDriveImages } from '../../utils/uploadUtils';
import { useCategories } from '../../hooks/useCategories';
import { getValidCategoryNames } from '../../utils/categoryUtils';

const ITEMS_PER_PAGE = 20;

export function AdminItemsTab() {
  const { categories } = useCategories();
  const [items, setItems] = useState<JewelleryItem[]>([]);
  
  // --- SEARCH, FILTER & PAGINATION STATES ---
  const [activeCategoryId, setActiveCategoryId] = useState<string | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<JewelleryItem | null>(null);

  useEffect(() => { loadItems(); }, []);

  // Reset to page 1 whenever the user types a search or changes the category filter
  useEffect(() => { setCurrentPage(1); }, [searchQuery, activeCategoryId]);

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
    if (window.confirm('Are you sure you want to delete this item?')) {
      const loadingToastId = toast.loading('Deleting item...');
      try {
        const itemToDelete = items.find(item => item.id === id);
        if (itemToDelete?.image_url && itemToDelete.image_url.length > 0) {
          try { await deleteDriveImages(itemToDelete.image_url); } catch (e) { console.error(e); }
        }
        const { error } = await supabase.from('jewellery_items').delete().eq('id', id);
        if (error) throw error;
        await loadItems();
        toast.success('Item deleted successfully!', { id: loadingToastId });
      } catch (error) {
        console.error('Error deleting:', error);
        toast.error('Error deleting item.', { id: loadingToastId });
      }
    }
  };

  // --- 1. FILTER & SEARCH LOGIC ---
  const filteredItems = items.filter(item => {
    // Check Category
    const matchesCategory = activeCategoryId === 'All' || getValidCategoryNames(activeCategoryId, categories).includes(item.category);
    // Check Search Query
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // --- 2. PAGINATION LOGIC ---
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your catalogue, pricing, and stock.</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2 shadow-sm transition-colors w-full md:w-auto justify-center"
        >
          <Plus className="h-5 w-5" />
          <span>Add Item</span>
        </button>
      </div>

      {/* --- NEW SEARCH & FILTER BAR --- */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        {/* Search Bar */}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search items by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all shadow-sm text-sm"
          />
        </div>
        
        {/* Category Dropdown */}
        <select
          value={activeCategoryId}
          onChange={(e) => setActiveCategoryId(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none shadow-sm text-sm font-medium text-gray-700 min-w-[200px] cursor-pointer"
        >
          <option value="All">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Table Component */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Gold</th>
                <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Diamonds</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price (₹)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {/* NOTE: We now map over 'paginatedItems' instead of 'filteredItems' */}
              {paginatedItems.map((item, index) => (
                <AdminTableRow 
                  key={item.id}
                  item={item}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                  index={index}
                  totalRows={paginatedItems.length}
                />
              ))}
            </tbody>
          </table>
          
          {paginatedItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 font-medium">No items found matching your search.</p>
              <button onClick={() => { setSearchQuery(''); setActiveCategoryId('All'); }} className="text-yellow-600 text-sm font-semibold mt-2 hover:underline">
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* --- PAGINATION FOOTER --- */}
        {filteredItems.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between sm:px-6">
            <div className="hidden sm:block">
              <p className="text-sm text-gray-700">
                Showing <span className="font-semibold">{startIndex + 1}</span> to <span className="font-semibold">{Math.min(startIndex + ITEMS_PER_PAGE, filteredItems.length)}</span> of <span className="font-semibold">{filteredItems.length}</span> results
              </p>
            </div>
            <div className="flex flex-1 justify-between sm:justify-end space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showAddForm && (
        <JewelleryForm editingItem={editingItem} onSubmit={handleSubmit} onCancel={resetForm} />
      )}
    </>
  );
}