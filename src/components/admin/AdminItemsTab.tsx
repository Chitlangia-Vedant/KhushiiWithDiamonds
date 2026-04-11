import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { JewelleryItem } from '../../types';
import { Plus, Search, ChevronLeft, ChevronRight, Filter, X, Trash2, FolderSymlink } from 'lucide-react';
import toast from 'react-hot-toast';
import { JewelleryForm } from './JewelleryForm';
import { AdminTableRow } from './AdminTableRow';
import { deleteDriveImages } from '../../utils/uploadUtils';
import { useCategories } from '../../hooks/useCategories';
import { getValidCategoryNames } from '../../utils/categoryUtils';
import { CategoryDropdown } from '../CategoryDropdown';

import { useGoldPrice } from '../../hooks/useGoldPrice';
import { useAdminSettings } from '../../hooks/useAdminSettings';
import { useQualityContext } from '../../context/QualityContext';
import { getPriceBreakdownItem } from '../../lib/goldPrice';
import { DiamondQuality } from '../../constants/jewellery';

const ITEMS_PER_PAGE = 20;

const initialFilters = {
  priceMin: '', priceMax: '', goldWeightMin: '', goldWeightMax: '',
  overriddenMaking: false, overriddenDiamond: false,
  diamondsCountMin: '', diamondsCountMax: '', totalDiamondCaratMin: '', totalDiamondCaratMax: '',
  hasCustomDiamondName: false, diamondNameQuery: '',
  hasOtherStones: false, totalStoneCaratMin: '', totalStoneCaratMax: '', stoneNameQuery: '',
  singleStoneCaratMin: '', singleStoneCaratMax: ''
};

export function AdminItemsTab() {
  const { categories } = useCategories();
  const [items, setItems] = useState<JewelleryItem[]>([]);
  
  const { goldPrice } = useGoldPrice();
  const { fallbackGoldPrice, overrideLiveGoldPrice, gstRate, globalGoldMakingCharges, diamondBaseCosts, diamondTiers } = useAdminSettings();
  const { globalGoldPurity, globalDiamondQuality } = useQualityContext();
  const effectiveGoldPrice = overrideLiveGoldPrice ? fallbackGoldPrice : goldPrice;

  const [activeCategoryName, setActiveCategoryName] = useState<string | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<JewelleryItem | null>(null);

  // --- NEW: BULK SELECTION STATE ---
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [bulkCategoryName, setBulkCategoryName] = useState<string>('');

  useEffect(() => { loadItems(); }, []);
  
  useEffect(() => { 
    setCurrentPage(1); 
    setSelectedItemIds([]); // Clear selection if filters change
  }, [searchQuery, activeCategoryName, filters]);

  const loadItems = async () => {
    try {
      const { data } = await supabase.from('jewellery_items').select('*').order('created_at', { ascending: false });
      if (data) setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const resetForm = () => { setShowAddForm(false); setEditingItem(null); };
  const startEdit = (item: JewelleryItem) => { setEditingItem(item); setShowAddForm(true); };

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
        setSelectedItemIds(prev => prev.filter(selectedId => selectedId !== id)); // Remove from selection
        toast.success('Item deleted successfully!', { id: loadingToastId });
      } catch (error) {
        toast.error('Error deleting item.', { id: loadingToastId });
      }
    }
  };

  // --- NEW: BULK ACTIONS ---
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedItemIds.length} items?`)) return;
    
    const loadingToastId = toast.loading(`Deleting ${selectedItemIds.length} items...`);
    try {
      // 1. Delete all associated images from Drive silently
      const itemsToDelete = items.filter(item => selectedItemIds.includes(item.id));
      const allImageUrls = itemsToDelete.flatMap(item => item.image_url || []);
      if (allImageUrls.length > 0) {
        try { await deleteDriveImages(allImageUrls); } catch (e) { console.error('Bulk image delete error:', e); }
      }

      // 2. Delete from Supabase
      const { error } = await supabase.from('jewellery_items').delete().in('id', selectedItemIds);
      if (error) throw error;

      await loadItems();
      setSelectedItemIds([]);
      toast.success(`${selectedItemIds.length} items deleted successfully!`, { id: loadingToastId });
    } catch (error) {
      toast.error('Error during bulk deletion.', { id: loadingToastId });
    }
  };

  const handleBulkMove = async () => {
    if (!bulkCategoryName) return toast.error('Please select a destination category first.');
    
    const loadingToastId = toast.loading(`Moving ${selectedItemIds.length} items...`);
    try {
      const { error } = await supabase.from('jewellery_items').update({ category: bulkCategoryName }).in('id', selectedItemIds);
      if (error) throw error;

      await loadItems();
      setSelectedItemIds([]);
      setBulkCategoryName('');
      toast.success(`${selectedItemIds.length} items moved to ${bulkCategoryName}!`, { id: loadingToastId });
    } catch (error) {
      toast.error('Error moving items.', { id: loadingToastId });
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedItemIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const updateFilter = (key: keyof typeof filters, value: any) => setFilters(prev => ({ ...prev, [key]: value }));
  const clearFilters = () => { setFilters(initialFilters); setSearchQuery(''); setActiveCategoryName('All'); };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (activeCategoryName !== 'All') {
        const selectedCat = categories.find(c => c.name === activeCategoryName);
        if (selectedCat) {
          const validNames = getValidCategoryNames(selectedCat.id, categories);
          if (!validNames.includes(item.category)) return false;
        } else {
          if (item.category !== activeCategoryName) return false;
        }
      }
      if (filters.goldWeightMin && item.gold_weight < Number(filters.goldWeightMin)) return false;
      if (filters.goldWeightMax && item.gold_weight > Number(filters.goldWeightMax)) return false;
      if (filters.overriddenMaking && item.making_charges_per_gram === -1) return false;
      if (filters.overriddenDiamond && item.override_diamond_costs === false) return false;
      // ... (rest of filtering logic)
      return true;
    });
  }, [items, searchQuery, activeCategoryName, filters, globalGoldPurity, globalDiamondQuality, globalGoldMakingCharges, effectiveGoldPrice, gstRate, diamondBaseCosts, diamondTiers, categories]);

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
        <button onClick={() => setShowAddForm(true)} className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2 shadow-sm w-full md:w-auto justify-center">
          <Plus className="h-5 w-5" /> <span>Add Item</span>
        </button>
      </div>

      {/* --- FLOATING BULK ACTIONS BAR --- */}
      {selectedItemIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex flex-col sm:flex-row items-center justify-between shadow-sm transition-all">
          <div className="flex items-center mb-3 sm:mb-0">
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full mr-3">
              {selectedItemIds.length}
            </span>
            <span className="text-blue-900 font-medium text-sm">Items Selected</span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            {/* Hierarchical Bulk Move */}
            <div className="flex items-center space-x-2 w-full sm:w-auto bg-white p-1 rounded-md border border-blue-100">
              <div className="w-48">
                <CategoryDropdown 
                  valueLabel={bulkCategoryName || 'Move to...'} 
                  onSelect={(id, name) => setBulkCategoryName(name)} 
                  onClear={() => setBulkCategoryName('')}
                  clearLabel="Cancel"
                />
              </div>
              <button onClick={handleBulkMove} className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors flex items-center shadow-sm">
                <FolderSymlink className="h-4 w-4 mr-1.5" /> Move
              </button>
            </div>
            
            <div className="w-px h-6 bg-blue-200 hidden sm:block"></div>
            
            <button onClick={handleBulkDelete} className="w-full sm:w-auto px-3 py-2 bg-white border border-red-200 text-red-600 text-sm font-bold rounded-md hover:bg-red-50 hover:border-red-300 transition-colors flex items-center justify-center shadow-sm">
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Top Bar: Search & Filter (Truncated for brevity) */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search item name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-sm shadow-sm" />
        </div>
        <div className="w-full md:w-64">
          <CategoryDropdown valueLabel={activeCategoryName === 'All' ? 'All Categories' : activeCategoryName} onSelect={(id, name) => setActiveCategoryName(name)} onClear={() => setActiveCategoryName('All')} clearLabel="All Categories" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-2 border rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${showFilters ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'}`}>
          <Filter className="h-4 w-4 mr-2" /> Advanced
        </button>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* --- NEW: SELECT ALL CHECKBOX --- */}
                <th className="px-4 py-3 w-12 text-left">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
                    checked={paginatedItems.length > 0 && paginatedItems.every(item => selectedItemIds.includes(item.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // Add all items on current page to selection
                        const newIds = new Set([...selectedItemIds, ...paginatedItems.map(i => i.id)]);
                        setSelectedItemIds(Array.from(newIds));
                      } else {
                        // Remove all items on current page from selection
                        const pageIds = paginatedItems.map(i => i.id);
                        setSelectedItemIds(selectedItemIds.filter(id => !pageIds.includes(id)));
                      }
                    }}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Gold</th>
                <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Diamonds</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price (₹)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedItems.map((item, index) => (
                <AdminTableRow 
                  key={item.id} 
                  item={item} 
                  onEdit={startEdit} 
                  onDelete={handleDelete} 
                  index={index} 
                  totalRows={paginatedItems.length}
                  
                  // --- NEW PROPS FOR SELECTION ---
                  isSelected={selectedItemIds.includes(item.id)}
                  onSelect={() => toggleSelection(item.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination controls... */}
      </div>

      {showAddForm && <JewelleryForm editingItem={editingItem} onSubmit={handleSubmit} onCancel={resetForm} />}
    </>
  );
}