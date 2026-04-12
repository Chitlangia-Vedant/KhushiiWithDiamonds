import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { JewelleryItem } from '../../types';
import { Plus, Search, Filter, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { JewelleryForm } from './item-tab/JewelleryForm';

// --- NEW IMPORTS: Moved Drive logic to the parent! ---
import { deleteDriveImages, uploadJewelleryImages, updateJewelleryDriveMetadata } from '../../utils/uploadUtils';

import { useCategories } from '../../hooks/useCategories';
import { getValidCategoryNames } from '../../utils/categoryUtils';
import { CategoryDropdown } from '../shared/CategoryDropdown';

import { useGoldPrice } from '../../hooks/useGoldPrice';
import { useAdminSettings } from '../../hooks/useAdminSettings';
import { useQualityContext } from '../../context/QualityContext';
import { getPriceBreakdownItem } from '../../lib/goldPrice';
import { DiamondQuality } from '../../constants/jewellery';

import { AdminItemsBulkActions } from './item-tab/AdminItemsBulkActions';
import { AdminItemsAdvancedFilters, AdminItemFilters, initialFilters } from './item-tab/AdminItemsAdvancedFilters';
import { AdminItemsTable } from './item-tab/AdminItemsTable';

const ITEMS_PER_PAGE = 20;

export function AdminItemsTab() {
  const { categories } = useCategories();
  const [items, setItems] = useState<JewelleryItem[]>([]);
  
  const { goldPrice } = useGoldPrice();
  const { fallbackGoldPrice, overrideLiveGoldPrice, gstRate, globalGoldMakingCharges, diamondBaseCosts, diamondTiers } = useAdminSettings();
  const { globalGoldPurity, globalDiamondQuality } = useQualityContext();
  const effectiveGoldPrice = overrideLiveGoldPrice ? fallbackGoldPrice : goldPrice;

  const [activeCategoryName, setActiveCategoryName] = useState<string | 'All'>('All');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(''); 
  
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AdminItemFilters>(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true); 
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<JewelleryItem | null>(null);

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [bulkCategoryName, setBulkCategoryName] = useState<string>('');

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'created_at', 
    direction: 'desc' 
  });

  useEffect(() => { loadItems(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearchQuery(searchQuery); }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  useEffect(() => { 
    setCurrentPage(1); 
    setSelectedItemIds([]); 
  }, [debouncedSearchQuery, activeCategoryName, filters]); 

  useEffect(() => {
    setCurrentPage(1);
  }, [sortConfig]);

  const loadItems = async () => {
    setIsLoading(true); 
    try {
      const { data } = await supabase.from('jewellery_items').select('*').order('created_at', { ascending: false });
      if (data) setItems(data);
    } catch (error) { console.error('Error loading items:', error); } finally { setIsLoading(false); }
  };

  const resetForm = () => { setShowAddForm(false); setEditingItem(null); };
  const startEdit = (item: JewelleryItem) => { setEditingItem(item); setShowAddForm(true); };

  // --- BACKGROUND SAVING LOGIC ---
  const handleSubmit = async (payload: any) => {
    
    // 1. Instantly close the form! The user can now continue using the dashboard.
    resetForm(); 

    // 2. Warn the user not to close the browser tab while the background save is running
    const loadingToastId = toast.loading(
      payload.isEditing ? 'Updating item in background (Do not close page)...' : 'Saving new item in background (Do not close page)...'
    );
    
    let newlyUploadedUrls: string[] = [];

    try {
      // 3. Update Existing Google Drive Metadata
      if (payload.isEditing && payload.currentImages.length > 0 && payload.hasTextDataChanged) {
        try { 
          await updateJewelleryDriveMetadata(
            payload.currentImages, payload.itemData.name, payload.itemData.category, categories, payload.itemDescription
          ); 
        } catch (updateError) { console.error('Drive metadata update failed:', updateError); }
      }

      // 4. Upload New Google Drive Images
      if (payload.selectedImages.length > 0) {
        newlyUploadedUrls = await uploadJewelleryImages(
          payload.selectedImages, payload.itemData.name, payload.itemData.category, categories, payload.itemDescription
        ); 
      }

      // 5. Compile Final URLs based on drag-and-drop order
      let finalImageUrls: string[] = [];
      if (payload.combinedOrder.length > 0) {
        const newUrlMap: Record<string, string> = {};
        
        // --- THE FIX IS HERE: Use the unique ID instead of name-size ---
        payload.selectedImages.forEach((file: any, index: number) => { 
          const uniqueId = file.uniqueId; 
          newUrlMap[uniqueId] = newlyUploadedUrls[index]; 
        });
        
        finalImageUrls = payload.combinedOrder.map((id: string) => 
          payload.currentImages.includes(id) ? id : newUrlMap[id]
        ).filter(Boolean) as string[];
      } else {
        finalImageUrls = [...payload.currentImages, ...newlyUploadedUrls];
      }
      
      const finalItemData = { ...payload.itemData, image_url: finalImageUrls };

      // 6. Push to Supabase Database FIRST (The Gatekeeper)
      if (payload.isEditing) {
        const { error } = await supabase.from('jewellery_items').update({ ...finalItemData, updated_at: new Date().toISOString() }).eq('id', payload.itemId);
        if (error) throw error; // Fails safely to catch block!
      } else {
        const { error } = await supabase.from('jewellery_items').insert([finalItemData]);
        if (error) throw error; // Fails safely to catch block!
      }

      // 7. SAFE DELETION: Only delete from Drive if the Database was 100% successful
      if (payload.imagesToDelete.length > 0) {
        try { 
          await deleteDriveImages(payload.imagesToDelete); 
        } catch (deleteError) { 
          console.error('Failed to delete trashed images from Drive, but database is safe:', deleteError); 
        }
      }
      
      // 8. Silent refresh of the table and display success!
      await loadItems();
      toast.success(payload.isEditing ? 'Item updated successfully!' : 'Item added successfully!', { id: loadingToastId });
      
    } catch (error) {
      // The Rollback Safety Net: Reverts the NEW images if DB fails
      if (newlyUploadedUrls.length > 0) {
        console.warn("Rolling back Google Drive uploads due to Database failure...");
        try { await deleteDriveImages(newlyUploadedUrls); } catch (e) {}
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Error saving item: ${errorMessage}`, { id: loadingToastId, duration: 6000 });
    }
  };

  const handleDelete = (id: string) => {
    toast((t) => (
      <div className="flex flex-col p-1 min-w-[300px]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0 border border-red-100"><Trash2 className="h-5 w-5 text-red-600" /></div>
          <h3 className="font-extrabold text-gray-900 text-lg">Delete Item?</h3>
        </div>
        <div className="text-sm text-gray-800 mb-5 pl-[52px] leading-relaxed">
          <p className="mb-2 font-medium">Permanently delete this item?</p>
        </div>
        <div className="flex justify-end gap-2 mt-1">
          <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg">Cancel</button>
          <button onClick={async () => {
              toast.dismiss(t.id);
              const loadingToastId = toast.loading('Deleting...');
              try {
                const itemToDelete = items.find(item => item.id === id);
                if (itemToDelete?.image_url?.length) { try { await deleteDriveImages(itemToDelete.image_url); } catch (e) {} }
                await supabase.from('jewellery_items').delete().eq('id', id);
                await loadItems();
                setSelectedItemIds(prev => prev.filter(selectedId => selectedId !== id)); 
                toast.success('Deleted successfully!', { id: loadingToastId });
              } catch (error) { toast.error('Error deleting.', { id: loadingToastId }); }
            }} className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg">Yes, delete</button>
        </div>
      </div>
    ), { duration: Infinity, style: { maxWidth: '400px', padding: '16px' } });
  };

  const handleBulkDelete = () => {
    toast((t) => (
      <div className="flex flex-col p-1 min-w-[300px]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0 border border-red-100"><Trash2 className="h-5 w-5 text-red-600" /></div>
          <h3 className="font-extrabold text-gray-900 text-lg">Delete {selectedItemIds.length} Items?</h3>
        </div>
        <div className="flex justify-end gap-2 mt-1 pl-[52px]">
          <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg">Cancel</button>
          <button onClick={async () => {
              toast.dismiss(t.id);
              const loadingToastId = toast.loading(`Deleting...`);
              try {
                const itemsToDelete = items.filter(item => selectedItemIds.includes(item.id));
                const allImageUrls = itemsToDelete.flatMap(item => item.image_url || []);
                if (allImageUrls.length > 0) { try { await deleteDriveImages(allImageUrls); } catch (e) {} }
                await supabase.from('jewellery_items').delete().in('id', selectedItemIds);
                await loadItems(); setSelectedItemIds([]);
                toast.success(`Deleted successfully!`, { id: loadingToastId });
              } catch (error) { toast.error('Error during bulk deletion.', { id: loadingToastId }); }
            }} className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg">Yes, delete all</button>
        </div>
      </div>
    ), { duration: Infinity, style: { maxWidth: '400px', padding: '16px' } });
  };

  const handleBulkMove = async () => {
    if (!bulkCategoryName) return toast.error('Select a destination category first.');
    const loadingToastId = toast.loading(`Moving items and Drive folders...`);
    
    try {
      const itemsToMove = items.filter(item => selectedItemIds.includes(item.id));

      for (const item of itemsToMove) {
        if (item.image_url && item.image_url.length > 0) {
          try {
            await updateJewelleryDriveMetadata(
              item.image_url,
              item.name,
              bulkCategoryName, 
              categories,
              item.description || 'Bulk moved item' 
            );
          } catch (driveError) {
            console.error(`Failed to move Drive folder for ${item.name}`, driveError);
          }
        }
      }

      await supabase.from('jewellery_items').update({ category: bulkCategoryName }).in('id', selectedItemIds);
      
      await loadItems(); 
      setSelectedItemIds([]); 
      setBulkCategoryName('');
      toast.success(`Moved successfully!`, { id: loadingToastId });
      
    } catch (error) { 
      toast.error('Error moving items.', { id: loadingToastId }); 
    }
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const toggleSelection = (id: string) => setSelectedItemIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const updateFilter = (key: keyof AdminItemFilters, value: any) => setFilters(prev => ({ ...prev, [key]: value }));
  const clearFilters = () => { setFilters(initialFilters); setSearchQuery(''); setDebouncedSearchQuery(''); setActiveCategoryName('All'); };
  const handleSelectAll = (checked: boolean, pageIds: string[]) => { checked ? setSelectedItemIds(Array.from(new Set([...selectedItemIds, ...pageIds]))) : setSelectedItemIds(selectedItemIds.filter(id => !pageIds.includes(id))); };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (debouncedSearchQuery && !item.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) return false;
      if (activeCategoryName !== 'All') {
        const selectedCat = categories.find(c => c.name === activeCategoryName);
        if (selectedCat) { if (!getValidCategoryNames(selectedCat.id, categories).includes(item.category)) return false; } 
        else { if (item.category !== activeCategoryName) return false; }
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
  }, [items, debouncedSearchQuery, activeCategoryName, filters, globalGoldPurity, globalDiamondQuality, globalGoldMakingCharges, effectiveGoldPrice, gstRate, diamondBaseCosts, diamondTiers, categories]);

  const sortedItems = useMemo(() => {
    const sortable = filteredItems.map(item => ({
      ...item,
      _sortPrice: getPriceBreakdownItem(item, globalGoldPurity, globalDiamondQuality as DiamondQuality, globalGoldMakingCharges, effectiveGoldPrice, gstRate, diamondBaseCosts, diamondTiers).total,
      _sortDiamonds: item.diamonds?.reduce((sum, d) => sum + (d.carat || 0), 0) || 0
    }));

    sortable.sort((a, b) => {
      let aValue: any = a.created_at;
      let bValue: any = b.created_at;

      if (sortConfig.key === 'price') {
        aValue = a._sortPrice; bValue = b._sortPrice;
      } else if (sortConfig.key === 'diamonds') {
        aValue = a._sortDiamonds; bValue = b._sortDiamonds;
      } else if (sortConfig.key === 'gold') {
        aValue = a.gold_weight || 0; bValue = b.gold_weight || 0;
      } else if (sortConfig.key === 'name') {
        aValue = (a.name || '').toLowerCase(); bValue = (b.name || '').toLowerCase();
      } else if (sortConfig.key === 'category') {
        aValue = (a.category || '').toLowerCase(); bValue = (b.category || '').toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sortable;
  }, [filteredItems, sortConfig, globalGoldPurity, globalDiamondQuality, globalGoldMakingCharges, effectiveGoldPrice, gstRate, diamondBaseCosts, diamondTiers]);


  const totalPages = Math.max(1, Math.ceil(sortedItems.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = sortedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <>
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            Inventory <span className="text-gray-500 text-lg sm:text-xl font-medium">({items.length})</span>
          </h2>
          <p className="text-[10px] sm:text-sm text-gray-500 mt-0.5 sm:mt-1 hidden sm:block">Manage your catalogue, pricing, and stock.</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="bg-yellow-600 text-white p-2 sm:px-4 sm:py-2 rounded-lg hover:bg-yellow-700 flex items-center shadow-sm flex-shrink-0">
          <Plus className="h-5 w-5" /> <span className="hidden sm:inline ml-1.5 font-medium">Add Item</span>
        </button>
      </div>

      {selectedItemIds.length > 0 && (
        <AdminItemsBulkActions selectedCount={selectedItemIds.length} bulkCategoryName={bulkCategoryName} setBulkCategoryName={setBulkCategoryName} onMove={handleBulkMove} onDelete={handleBulkDelete} />
      )}

      <div className="flex flex-col md:flex-row gap-2 sm:gap-3 mb-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search item name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-yellow-500 outline-none text-sm shadow-sm" />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex-grow md:w-56">
            <CategoryDropdown valueLabel={activeCategoryName === 'All' ? 'All Categories' : activeCategoryName} onSelect={(id, name) => setActiveCategoryName(name)} onClear={() => setActiveCategoryName('All')} clearLabel="All Categories" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`p-2 sm:px-4 sm:py-2 border rounded-lg text-sm font-medium flex items-center justify-center transition-colors flex-shrink-0 ${showFilters ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'}`}>
            <Filter className="h-4 w-4" /> <span className="hidden sm:inline ml-1.5">Advanced</span>
          </button>
        </div>
      </div>

      <AdminItemsAdvancedFilters showFilters={showFilters} filters={filters} updateFilter={updateFilter} clearFilters={clearFilters} />

      <AdminItemsTable 
        isLoading={isLoading} 
        paginatedItems={paginatedItems} 
        filteredItemsLength={sortedItems.length} 
        selectedItemIds={selectedItemIds} 
        onToggleSelection={toggleSelection} 
        onSelectAll={handleSelectAll} 
        onEdit={startEdit} 
        onDelete={handleDelete} 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        totalPages={totalPages} 
        startIndex={startIndex} 
        itemsPerPage={ITEMS_PER_PAGE} 
        clearFilters={clearFilters} 
        sortConfig={sortConfig}    
        onSort={handleSort}        
      />

      {showAddForm && <JewelleryForm editingItem={editingItem} onSubmit={handleSubmit} onCancel={resetForm} />}
    </>
  );
}