import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { JewelleryItem } from '../../types';
import { Plus } from 'lucide-react';
import { JewelleryForm } from './JewelleryForm';
import { AdminTableRow } from './AdminTableRow';
import { deleteDriveImages } from '../../utils/uploadUtils';

export function AdminItemsTab() {
  const [items, setItems] = useState<JewelleryItem[]>([]);
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

      if (data) {
        setItems(data);
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
        // 1. --- NEW: DRIVE CLEANUP LOGIC ---
        // Find the item to get its image URLs
        const itemToDelete = items.find(item => item.id === id);
        
        if (itemToDelete?.image_url && itemToDelete.image_url.length > 0) {
          try {
            // Delete the array of URLs from Google Drive
            await deleteDriveImages(itemToDelete.image_url);
            console.log('Successfully deleted jewellery images from Google Drive');
          } catch (deleteError) {
            console.error('Failed to delete jewellery images from Drive:', deleteError);
            // Don't throw - we still want the item to delete from the database!
          }
        }

        // 2. --- EXISTING SUPABASE DELETION ---
        const { error } = await supabase.from('jewellery_items').delete().eq('id', id);
        if (error) throw error;
        
        await loadItems(); // (Or refetchItems() if you upgrade this tab to a hook later!)
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item. Please check your permissions and try again.');
      }
    }
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
              {items.map((item) => (
                <AdminTableRow 
                  key={item.id}
                  item={item}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <JewelleryForm
          editingItem={editingItem}
          onSubmit={handleSubmit}
          onCancel={resetForm}
        />
      )}
    </>
  );
}