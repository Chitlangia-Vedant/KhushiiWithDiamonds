import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { JewelleryItem, Category, DiamondQuality } from '../../types';
import { Plus, Edit, Trash2, Image, ChevronRight, Gem, ChevronDown } from 'lucide-react';
import { formatCurrency, calculateJewelleryPriceSync, formatDiamondSummary } from '../../lib/goldPrice';
import { JewelleryForm } from './JewelleryForm';
import { getCategoryDisplayName } from '../../utils/categoryUtils.ts';

interface AdminItemsTabProps {
  categories: Category[];
  goldPrice: number;
  gstRate: number;
}

interface ItemDiamondQuality {
  [itemId: string]: DiamondQuality;
}

export function AdminItemsTab({ categories, goldPrice, gstRate }: AdminItemsTabProps) {
  const [items, setItems] = useState<JewelleryItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<JewelleryItem | null>(null);
  const [selectedDiamondQualities, setSelectedDiamondQualities] = useState<ItemDiamondQuality>({});
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const { data } = await supabase
        .from('jewellery_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setItems(data);
        // Initialize diamond quality selection for each item
        const initialQualities: ItemDiamondQuality = {};
        data.forEach(item => {
          const availableQualities = getAvailableDiamondQualities(item);
          if (availableQualities.length > 0) {
            initialQualities[item.id] = availableQualities[0];
          }
        });
        setSelectedDiamondQualities(initialQualities);
      }
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
    const finalItemData = {
      ...itemData,
      image_url: imageUrls, // Use actual Google Drive URLs
    };

    if (editingItem) {
      const { error } = await supabase
        .from('jewellery_items')
        .update({ ...finalItemData, updated_at: new Date().toISOString() })
        .eq('id', editingItem.id);
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
        const { error } = await supabase.from('jewellery_items').delete().eq('id', id);
        if (error) throw error;
        await loadItems();
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item. Please check your permissions and try again.');
      }
    }
  };

  // Get available diamond qualities for an item
  const getAvailableDiamondQualities = (item: JewelleryItem): DiamondQuality[] => {
    const qualities: DiamondQuality[] = [];
    if (item.diamonds_lab_grown && item.diamonds_lab_grown.length > 0) qualities.push('Lab Grown');
    if (item.diamonds_gh_vs_si && item.diamonds_gh_vs_si.length > 0) qualities.push('GH/VS-SI');
    if (item.diamonds_fg_vvs_si && item.diamonds_fg_vvs_si.length > 0) qualities.push('FG/VVS-SI');
    if (item.diamonds_ef_vvs && item.diamonds_ef_vvs.length > 0) qualities.push('EF/VVS');
    return qualities;
  };

  // Get diamonds for selected quality
  const getDiamondsForQuality = (item: JewelleryItem, quality: DiamondQuality) => {
    switch (quality) {
      case 'Lab Grown':
        return { diamonds: item.diamonds_lab_grown || [], quality };
      case 'GH/VS-SI':
        return { diamonds: item.diamonds_gh_vs_si || [], quality };
      case 'FG/VVS-SI':
        return { diamonds: item.diamonds_fg_vvs_si || [], quality };
      case 'EF/VVS':
        return { diamonds: item.diamonds_ef_vvs || [], quality };
      default:
        return { diamonds: [], quality: null };
    }
  };

  const calculateTotalCost = (item: JewelleryItem): number => {
    const selectedQuality = selectedDiamondQualities[item.id];
    const availableQualities = getAvailableDiamondQualities(item);
    
    // Use selected quality or first available quality
    const qualityToUse = selectedQuality || availableQualities[0];
    
    if (!qualityToUse) {
      // No diamonds, use empty diamonds data
      const diamondsData = { diamonds: [], quality: null };
      return calculateJewelleryPriceSync(
        item.base_price, item.gold_weight, item.gold_quality,
        diamondsData, item.making_charges_per_gram, goldPrice, gstRate
      );
    }

    const diamondsData = getDiamondsForQuality(item, qualityToUse);
    return calculateJewelleryPriceSync(
      item.base_price, item.gold_weight, item.gold_quality,
      diamondsData, item.making_charges_per_gram, goldPrice, gstRate
    );
  };

  const toggleDropdown = (itemId: string) => {
    const newOpenDropdowns = new Set(openDropdowns);
    if (newOpenDropdowns.has(itemId)) {
      newOpenDropdowns.delete(itemId);
    } else {
      newOpenDropdowns.add(itemId);
    }
    setOpenDropdowns(newOpenDropdowns);
  };

  const selectDiamondQuality = (itemId: string, quality: DiamondQuality) => {
    setSelectedDiamondQualities(prev => ({
      ...prev,
      [itemId]: quality
    }));
    setOpenDropdowns(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Jewellery Items</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add New Item</span>
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Item', 'Category', 'Images', 'Specifications', 'Diamond Quality', 'Cost Components (₹)', 'Total Cost (₹)', 'Actions'].map(header => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => {
                const totalCost = calculateTotalCost(item);
                const categoryDisplay = getCategoryDisplayName(categories, item.category);
                const availableQualities = getAvailableDiamondQualities(item);
                const selectedQuality = selectedDiamondQualities[item.id];
                const isDropdownOpen = openDropdowns.has(item.id);
                
                // Get diamond data for selected quality
                const diamondsData = selectedQuality 
                  ? getDiamondsForQuality(item, selectedQuality)
                  : { diamonds: [], quality: null };
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={item.image_url[0] || 'https://drive.google.com/thumbnail?id=1KRTxnA-gFSbg6R5EfBhu-y-tAxElt_AO&sz=w625-h340'}
                          alt=""
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.description.substring(0, 50)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 mb-1">
                          {item.category}
                        </span>
                        {categoryDisplay.includes('→') && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <ChevronRight className="h-3 w-3 mr-1" />
                            {categoryDisplay}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <Image className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{item.image_url.length}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>Gold: {item.gold_weight}g ({item.gold_quality})</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {availableQualities.length > 0 ? (
                        <div className="relative">
                          <button
                            onClick={() => toggleDropdown(item.id)}
                            className="flex items-center space-x-1 text-sm bg-blue-50 border border-blue-200 rounded px-2 py-1 hover:bg-blue-100"
                          >
                            <Gem className="h-3 w-3 text-blue-500" />
                            <span className="font-medium">{selectedQuality || availableQualities[0]}</span>
                            <ChevronDown className="h-3 w-3" />
                          </button>
                          
                          {isDropdownOpen && (
                            <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-32">
                              {availableQualities.map((quality) => (
                                <button
                                  key={quality}
                                  onClick={() => selectDiamondQuality(item.id, quality)}
                                  className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                                    (selectedQuality || availableQualities[0]) === quality 
                                      ? 'bg-blue-50 text-blue-600' 
                                      : 'text-gray-700'
                                  }`}
                                >
                                  {quality}
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {diamondsData.diamonds.length > 0 && (
                            <div className="text-xs text-blue-600 mt-1">
                              {formatDiamondSummary(diamondsData.diamonds, diamondsData.quality)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">No diamonds</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div>Making: {formatCurrency(item.making_charges_per_gram)}/g</div>
                        <div>Base: {formatCurrency(item.base_price)}</div>
                        {diamondsData.diamonds.length > 0 && (
                          <div>Diamonds: {formatCurrency(diamondsData.diamonds.reduce((sum, d) => sum + (d.carat * d.cost_per_carat), 0))}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(totalCost)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Including GST & Live Gold
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => startEdit(item)}
                        className="text-yellow-600 hover:text-yellow-900 mr-4"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dropdown Overlays */}
      {openDropdowns.size > 0 && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setOpenDropdowns(new Set())}
        />
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <JewelleryForm
          categories={categories}
          editingItem={editingItem}
          goldPrice={goldPrice}
          gstRate={gstRate}
          onSubmit={handleSubmit}
          onCancel={resetForm}
        />
      )}
    </>
  );
}