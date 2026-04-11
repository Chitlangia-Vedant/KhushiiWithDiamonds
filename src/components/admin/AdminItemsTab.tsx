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

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [bulkCategoryName, setBulkCategoryName] = useState<string>('');

  // --- NEW: Auto-dismiss toasts when leaving this tab ---
  useEffect(() => {
    return () => { toast.dismiss(); };
  }, []);

  useEffect(() => { loadItems(); }, []);
  
  useEffect(() => { 
    setCurrentPage(1); 
    setSelectedItemIds([]); 
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

  // --- UNIFIED SINGLE DELETE CONFIRMATION ---
  const handleDelete = (id: string) => {
    toast((t) => (
      <div className="flex flex-col p-1 min-w-[320px]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0 border border-red-100">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="font-extrabold text-gray-900 text-lg">Delete Item?</h3>
        </div>
        <div className="text-sm text-gray-800 mb-5 pl-[52px] leading-relaxed">
          <p className="mb-2 font-medium">Are you sure you want to permanently delete this item?</p>
          <p className="bg-red-50/80 p-2 border border-red-100 rounded text-red-800 text-xs">
            <span className="font-bold text-red-600">Warning:</span> This action cannot be undone and its images will be removed.
          </p>
        </div>
        <div className="flex justify-end gap-3 mt-1">
          <button onClick={() => toast.dismiss(t.id)} className="px-5 py-2 text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-300 shadow-sm">
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const loadingToastId = toast.loading('Deleting item...');
              try {
                const itemToDelete = items.find(item => item.id === id);
                if (itemToDelete?.image_url && itemToDelete.image_url.length > 0) {
                  try { await deleteDriveImages(itemToDelete.image_url); } catch (e) { console.error(e); }
                }
                const { error } = await supabase.from('jewellery_items').delete().eq('id', id);
                if (error) throw error;
                await loadItems();
                setSelectedItemIds(prev => prev.filter(selectedId => selectedId !== id)); 
                toast.success('Item deleted successfully!', { id: loadingToastId });
              } catch (error) {
                toast.error('Error deleting item.', { id: loadingToastId });
              }
            }}
            className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm border border-red-700"
          >
            Yes, delete
          </button>
        </div>
      </div>
    ), { duration: Infinity, style: { maxWidth: '450px', padding: '16px', backgroundColor: '#ffffff', border: '1px solid #fecaca' } });
  };

  // --- UNIFIED BULK DELETE CONFIRMATION ---
  const handleBulkDelete = () => {
    toast((t) => (
      <div className="flex flex-col p-1 min-w-[320px]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0 border border-red-100">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="font-extrabold text-gray-900 text-lg">Delete {selectedItemIds.length} Items?</h3>
        </div>
        <div className="text-sm text-gray-800 mb-5 pl-[52px] leading-relaxed">
          <p className="mb-2 font-medium">Are you sure you want to permanently delete these {selectedItemIds.length} items?</p>
          <p className="bg-red-50/80 p-2 border border-red-100 rounded text-red-800 text-xs">
            <span className="font-bold text-red-600">Warning:</span> All associated images will also be permanently removed.
          </p>
        </div>
        <div className="flex justify-end gap-3 mt-1">
          <button onClick={() => toast.dismiss(t.id)} className="px-5 py-2 text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-300 shadow-sm">
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const loadingToastId = toast.loading(`Deleting ${selectedItemIds.length} items...`);
              try {
                const itemsToDelete = items.filter(item => selectedItemIds.includes(item.id));
                const allImageUrls = itemsToDelete.flatMap(item => item.image_url || []);
                if (allImageUrls.length > 0) {
                  try { await deleteDriveImages(allImageUrls); } catch (e) { console.error('Bulk image delete error:', e); }
                }

                const { error } = await supabase.from('jewellery_items').delete().in('id', selectedItemIds);
                if (error) throw error;

                await loadItems();
                setSelectedItemIds([]);
                toast.success(`${selectedItemIds.length} items deleted successfully!`, { id: loadingToastId });
              } catch (error) {
                toast.error('Error during bulk deletion.', { id: loadingToastId });
              }
            }}
            className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm border border-red-700"
          >
            Yes, delete all
          </button>
        </div>
      </div>
    ), { duration: Infinity, style: { maxWidth: '450px', padding: '16px', backgroundColor: '#ffffff', border: '1px solid #fecaca' } });
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

      const numDiamonds = item.diamonds?.length || 0;
      const totalDiamondCarat = item.diamonds?.reduce((sum, d) => sum + (d.carat || 0), 0) || 0;
      if (filters.diamondsCountMin && numDiamonds < Number(filters.diamondsCountMin)) return false;
      if (filters.diamondsCountMax && numDiamonds > Number(filters.diamondsCountMax)) return false;
      if (filters.totalDiamondCaratMin && totalDiamondCarat < Number(filters.totalDiamondCaratMin)) return false;
      if (filters.totalDiamondCaratMax && totalDiamondCarat > Number(filters.totalDiamondCaratMax)) return false;
      
      if (filters.hasCustomDiamondName && !item.diamonds?.some(d => !(d.name || '').toLowerCase().startsWith('diamond'))) return false;
      if (filters.diamondNameQuery && !item.diamonds?.some(d => (d.name || '').toLowerCase().includes(filters.diamondNameQuery.toLowerCase()))) return false;

      const hasStones = item.other_stones && item.other_stones.length > 0;
      const totalStoneCarat = item.other_stones?.reduce((sum, s) => sum + (s.carat || 0), 0) || 0;
      if (filters.hasOtherStones && !hasStones) return false;
      if (filters.totalStoneCaratMin && totalStoneCarat < Number(filters.totalStoneCaratMin)) return false;
      if (filters.totalStoneCaratMax && totalStoneCarat > Number(filters.totalStoneCaratMax)) return false;
      if (filters.stoneNameQuery && !item.other_stones?.some(s => (s.name || '').toLowerCase().includes(filters.stoneNameQuery.toLowerCase()))) return false;

      if (filters.singleStoneCaratMin || filters.singleStoneCaratMax) {
        const min = filters.singleStoneCaratMin ? Number(filters.singleStoneCaratMin) : 0;
        const max = filters.singleStoneCaratMax ? Number(filters.singleStoneCaratMax) : Infinity;
        const allStones = [...(item.diamonds || []), ...(item.other_stones || [])];
        if (!allStones.some(s => (s.carat || 0) >= min && (s.carat || 0) <= max)) return false;
      }

      if (filters.priceMin || filters.priceMax) {
        const pricing = getPriceBreakdownItem(item, globalGoldPurity, globalDiamondQuality as DiamondQuality, globalGoldMakingCharges, effectiveGoldPrice, gstRate, diamondBaseCosts, diamondTiers);
        if (filters.priceMin && pricing.total < Number(filters.priceMin)) return false;
        if (filters.priceMax && pricing.total > Number(filters.priceMax)) return false;
      }

      return true;
    });
  }, [items, searchQuery, activeCategoryName, filters, globalGoldPurity, globalDiamondQuality, globalGoldMakingCharges, effectiveGoldPrice, gstRate, diamondBaseCosts, diamondTiers, categories]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const inputCss = "w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-yellow-500 outline-none";

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

      {selectedItemIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex flex-col sm:flex-row items-center justify-between shadow-sm transition-all">
          <div className="flex items-center mb-3 sm:mb-0">
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full mr-3">
              {selectedItemIds.length}
            </span>
            <span className="text-blue-900 font-medium text-sm">Items Selected</span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
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

      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800">Advanced Filters</h3>
            <button onClick={clearFilters} className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center"><X className="h-3 w-3 mr-1"/> Clear All</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-3 p-3 bg-gray-50 rounded border border-gray-100">
              <h4 className="text-xs font-bold text-gray-500 uppercase">Core & Pricing</h4>
              <div className="flex gap-2">
                <div><label className="text-[10px] text-gray-500">Min Price (₹)</label><input type="number" value={filters.priceMin} onChange={e=>updateFilter('priceMin', e.target.value)} className={inputCss}/></div>
                <div><label className="text-[10px] text-gray-500">Max Price (₹)</label><input type="number" value={filters.priceMax} onChange={e=>updateFilter('priceMax', e.target.value)} className={inputCss}/></div>
              </div>
              <div className="flex gap-2">
                <div><label className="text-[10px] text-gray-500">Min Gold (g)</label><input type="number" value={filters.goldWeightMin} onChange={e=>updateFilter('goldWeightMin', e.target.value)} className={inputCss}/></div>
                <div><label className="text-[10px] text-gray-500">Max Gold (g)</label><input type="number" value={filters.goldWeightMax} onChange={e=>updateFilter('goldWeightMax', e.target.value)} className={inputCss}/></div>
              </div>
              <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer"><input type="checkbox" checked={filters.overriddenMaking} onChange={e=>updateFilter('overriddenMaking', e.target.checked)} className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"/><span>Custom Making Charge</span></label>
            </div>

            <div className="space-y-3 p-3 bg-blue-50/50 rounded border border-blue-100">
              <h4 className="text-xs font-bold text-blue-800 uppercase">Diamonds</h4>
              <div className="flex gap-2">
                <div><label className="text-[10px] text-gray-500">Min Count</label><input type="number" value={filters.diamondsCountMin} onChange={e=>updateFilter('diamondsCountMin', e.target.value)} className={inputCss}/></div>
                <div><label className="text-[10px] text-gray-500">Max Count</label><input type="number" value={filters.diamondsCountMax} onChange={e=>updateFilter('diamondsCountMax', e.target.value)} className={inputCss}/></div>
              </div>
              <div className="flex gap-2">
                <div><label className="text-[10px] text-gray-500">Total Ct Min</label><input type="number" step="0.01" value={filters.totalDiamondCaratMin} onChange={e=>updateFilter('totalDiamondCaratMin', e.target.value)} className={inputCss}/></div>
                <div><label className="text-[10px] text-gray-500">Total Ct Max</label><input type="number" step="0.01" value={filters.totalDiamondCaratMax} onChange={e=>updateFilter('totalDiamondCaratMax', e.target.value)} className={inputCss}/></div>
              </div>
              <div><label className="text-[10px] text-gray-500">Specific Diamond Name</label><input type="text" placeholder="e.g. Center Solitaire" value={filters.diamondNameQuery} onChange={e=>updateFilter('diamondNameQuery', e.target.value)} className={inputCss}/></div>
              <div className="flex gap-2">
                <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer"><input type="checkbox" checked={filters.hasCustomDiamondName} onChange={e=>updateFilter('hasCustomDiamondName', e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/><span>Has Custom Name</span></label>
                <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer"><input type="checkbox" checked={filters.overriddenDiamond} onChange={e=>updateFilter('overriddenDiamond', e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/><span>Custom Pricing</span></label>
              </div>
            </div>

            <div className="space-y-3 p-3 bg-emerald-50/50 rounded border border-emerald-100">
              <h4 className="text-xs font-bold text-emerald-800 uppercase">Other Stones</h4>
              <label className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer"><input type="checkbox" checked={filters.hasOtherStones} onChange={e=>updateFilter('hasOtherStones', e.target.checked)} className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"/><span>Contains Other Stones</span></label>
              <div><label className="text-[10px] text-gray-500">Specific Stone Name</label><input type="text" placeholder="e.g. Ruby" value={filters.stoneNameQuery} onChange={e=>updateFilter('stoneNameQuery', e.target.value)} className={inputCss}/></div>
              <div className="flex gap-2">
                <div><label className="text-[10px] text-gray-500">Total Ct Min</label><input type="number" step="0.01" value={filters.totalStoneCaratMin} onChange={e=>updateFilter('totalStoneCaratMin', e.target.value)} className={inputCss}/></div>
                <div><label className="text-[10px] text-gray-500">Total Ct Max</label><input type="number" step="0.01" value={filters.totalStoneCaratMax} onChange={e=>updateFilter('totalStoneCaratMax', e.target.value)} className={inputCss}/></div>
              </div>
            </div>

            <div className="space-y-3 p-3 bg-purple-50/50 rounded border border-purple-100">
              <h4 className="text-xs font-bold text-purple-800 uppercase">Any Stone Target</h4>
              <p className="text-[10px] text-gray-500 leading-tight mb-2">Find items containing AT LEAST ONE diamond or other stone within this carat range:</p>
              <div className="flex gap-2">
                <div><label className="text-[10px] text-gray-500">Single Stone Min Ct</label><input type="number" step="0.01" value={filters.singleStoneCaratMin} onChange={e=>updateFilter('singleStoneCaratMin', e.target.value)} className={inputCss}/></div>
                <div><label className="text-[10px] text-gray-500">Single Stone Max Ct</label><input type="number" step="0.01" value={filters.singleStoneCaratMax} onChange={e=>updateFilter('singleStoneCaratMax', e.target.value)} className={inputCss}/></div>
              </div>
            </div>

          </div>
        </div>
      )}

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 w-12 text-left">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
                    checked={paginatedItems.length > 0 && paginatedItems.every(item => selectedItemIds.includes(item.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const newIds = new Set([...selectedItemIds, ...paginatedItems.map(i => i.id)]);
                        setSelectedItemIds(Array.from(newIds));
                      } else {
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
                  isSelected={selectedItemIds.includes(item.id)}
                  onSelect={() => toggleSelection(item.id)}
                />
              ))}
            </tbody>
          </table>
          
          {paginatedItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 font-medium">No items found matching your filters.</p>
              <button onClick={clearFilters} className="text-yellow-600 text-sm font-semibold mt-2 hover:underline">Clear All Filters</button>
            </div>
          )}
        </div>

        {filteredItems.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-700 hidden sm:block">
              Showing <span className="font-semibold">{startIndex + 1}</span> to <span className="font-semibold">{Math.min(startIndex + ITEMS_PER_PAGE, filteredItems.length)}</span> of <span className="font-semibold">{filteredItems.length}</span> items
            </p>
            <div className="flex justify-between sm:justify-end space-x-2 w-full sm:w-auto">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center"><ChevronLeft className="h-4 w-4 mr-1" /> Prev</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center">Next <ChevronRight className="h-4 w-4 ml-1" /></button>
            </div>
          </div>
        )}
      </div>

      {showAddForm && <JewelleryForm editingItem={editingItem} onSubmit={handleSubmit} onCancel={resetForm} />}
    </>
  );
}