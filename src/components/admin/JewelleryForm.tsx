import React, { useState } from 'react';
import { JewelleryItem, Category, DiamondSlot, DiamondQuality, Diamond, DIAMOND_QUALITIES } from '../../types';
import { Save, X, Loader } from 'lucide-react';
import { GoogleDriveUploadService } from '../../lib/googleDriveUpload';
import { JewelleryDetailsSection } from './jewellery-form/JewelleryDetailsSection';
import { JewelleryImagesSection } from './jewellery-form/JewelleryImagesSection';
import { GoldSpecificationsSection } from './jewellery-form/GoldSpecificationsSection';
import { DiamondSlotsSection } from './jewellery-form/DiamondSlotsSection';
import { PricePreviewSection } from './jewellery-form/PricePreviewSection';
import { ImagePreviewModal } from './jewellery-form/ImagePreviewModal';
import { formatCurrency } from '../../lib/goldPrice';

interface JewelleryFormProps {
  categories: Category[];
  editingItem: JewelleryItem | null;
  goldPrice: number;
  gstRate: number;
  onSubmit: (itemData: Partial<JewelleryItem>, imageUrls: string[]) => Promise<void>;
  onCancel: () => void;
}

export function JewelleryForm({ 
  categories, 
  editingItem, 
  goldPrice, 
  gstRate, 
  onSubmit, 
  onCancel 
}: JewelleryFormProps) {
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: editingItem?.name || '', 
    description: editingItem?.description || '', 
    category: editingItem?.category || '', 
    gold_weight: editingItem?.gold_weight || 0,
    making_charges_per_gram: editingItem?.making_charges_per_gram || 500, 
    base_price: editingItem?.base_price || 0,
  });

  // Initialize diamond slots from editing item
  const initializeDiamondSlots = (): DiamondSlot[] => {
    if (!editingItem) return [];

    // Get all diamond arrays from the item
    const diamondArrays = {
      'Lab Grown': editingItem.diamonds_lab_grown || [],
      'GH/VS-SI': editingItem.diamonds_gh_vs_si || [],
      'FG/VVS-SI': editingItem.diamonds_fg_vvs_si || [],
      'EF/VVS': editingItem.diamonds_ef_vvs || []
    };

    // Find the quality with diamonds to determine the structure
    const qualityWithDiamonds = DIAMOND_QUALITIES.find(
      quality => diamondArrays[quality].length > 0
    );

    if (!qualityWithDiamonds) return [];

    // Use the first quality's diamonds as the template for carat weights
    const templateDiamonds = diamondArrays[qualityWithDiamonds];
    
    return templateDiamonds.map((_, index) => {
      const slot: DiamondSlot = {
        carat: templateDiamonds[index]?.carat || 0,
        costs: {} as Record<DiamondQuality, number>
      };

      // Fill in costs from each quality array
      DIAMOND_QUALITIES.forEach(quality => {
        const diamonds = diamondArrays[quality];
        slot.costs[quality] = diamonds[index]?.cost_per_carat || 25000;
      });

      return slot;
    });
  };

  const [diamondSlots, setDiamondSlots] = useState<DiamondSlot[]>(initializeDiamondSlots());
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [currentImages, setCurrentImages] = useState<string[]>(editingItem?.image_url || []);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  // Function to generate the detailed description string
  const generateItemDescription = (): string => {
    let description = `Name: ${formData.name}\n`;
    description += `Description: ${formData.description || 'N/A'}\n`;
    description += `Gold Weight: ${formData.gold_weight}g\n`;
    description += `Gold Quality: Customer selectable (14K, 18K, 24K)\n`;
    description += `Making Charges Per Gram: ${formatCurrency(formData.making_charges_per_gram)}/g\n`;

    // Add diamond information for each quality
    if (diamondSlots.length > 0) {
      DIAMOND_QUALITIES.forEach((quality) => {
        description += `${quality} Diamonds:\n`;
        diamondSlots.forEach((slot, index) => {
          const totalCost = slot.carat * slot.costs[quality];
          description += `  Diamond ${index + 1}: ${slot.carat}ct, Cost per Carat: ${formatCurrency(slot.costs[quality])}, Total cost: ${formatCurrency(totalCost)}\n`;
        });
        const totalCarats = diamondSlots.reduce((sum, slot) => sum + slot.carat, 0);
        const totalCost = diamondSlots.reduce((sum, slot) => sum + (slot.carat * slot.costs[quality]), 0);
        description += `  ${quality} Summary: Total Carats: ${totalCarats.toFixed(2)}ct, Total Cost: ${formatCurrency(totalCost)}\n`;
      });
    }

    description += `Base Price: ${formatCurrency(formData.base_price)}\n`;
    return description;
  };

  // Convert diamond slots to the four separate arrays
  const convertSlotsToQualityArrays = () => {
    const result = {
      diamonds_lab_grown: [] as Diamond[],
      diamonds_gh_vs_si: [] as Diamond[],
      diamonds_fg_vvs_si: [] as Diamond[],
      diamonds_ef_vvs: [] as Diamond[]
    };

    diamondSlots.forEach(slot => {
      if (slot.carat > 0) {
        DIAMOND_QUALITIES.forEach(quality => {
          const diamond = {
            carat: slot.carat,
            cost_per_carat: slot.costs[quality]
          };

          switch (quality) {
            case 'Lab Grown':
              result.diamonds_lab_grown.push(diamond);
              break;
            case 'GH/VS-SI':
              result.diamonds_gh_vs_si.push(diamond);
              break;
            case 'FG/VVS-SI':
              result.diamonds_fg_vvs_si.push(diamond);
              break;
            case 'EF/VVS':
              result.diamonds_ef_vvs.push(diamond);
              break;
          }
        });
      }
    });

    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      let newImageUrls: string[] = [];
      const itemDescription = generateItemDescription();

      // Upload new images to Google Drive if any are selected
      if (selectedImages.length > 0) {
        try {
          // Get category hierarchy for folder structure
          const selectedCategory = categories.find(cat => cat.name === formData.category);
          const parentCategory = selectedCategory?.parent_id 
            ? categories.find(cat => cat.id === selectedCategory.parent_id)
            : undefined;

          newImageUrls = await GoogleDriveUploadService.uploadJewelleryImages(
            selectedImages,
            formData.name,
            formData.category,
            parentCategory?.name,
            itemDescription
          );
          console.log('Successfully uploaded jewellery images:', newImageUrls);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          alert(`Image upload failed: ${uploadError.message}. The item will be saved without new images.`);
        }
      }

      // Delete images marked for deletion from Google Drive
      if (imagesToDelete.length > 0) {
        try {
          const deleteResult = await GoogleDriveUploadService.deleteFiles(imagesToDelete);
          console.log('Image deletion result:', deleteResult);
          
          if (!deleteResult.success) {
            console.warn('Some images failed to delete from Google Drive:', deleteResult.results);
          }
        } catch (deleteError) {
          console.error('Image deletion failed:', deleteError);
        }
      }

      // Combine current images (not marked for deletion) with new uploaded images
      const finalImageUrls = [...currentImages, ...newImageUrls];

      // Convert diamond slots to quality arrays
      const diamondArrays = convertSlotsToQualityArrays();

      const itemData = {
        ...formData,
        ...diamondArrays,
        description: formData.description,
      };

      await onSubmit(itemData, finalImageUrls);
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item. Please check your permissions and try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-screen overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <JewelleryDetailsSection
              formData={formData}
              setFormData={setFormData}
              categories={categories}
              uploading={uploading}
            />

            <JewelleryImagesSection
              selectedImages={selectedImages}
              setSelectedImages={setSelectedImages}
              currentImages={currentImages}
              setCurrentImages={setCurrentImages}
              imagesToDelete={imagesToDelete}
              setImagesToDelete={setImagesToDelete}
              uploading={uploading}
            />

            <GoldSpecificationsSection
              formData={formData}
              setFormData={setFormData}
              uploading={uploading}
            />

            <DiamondSlotsSection
              diamondSlots={diamondSlots}
              setDiamondSlots={setDiamondSlots}
              uploading={uploading}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                placeholder="Design complexity, additional stones, etc."
                disabled={uploading}
              />
              <p className="text-xs text-gray-500 mt-1">
                *Additional costs like design complexity, other stones, etc. (Gold, diamond, and making charges calculated separately)
              </p>
            </div>

            <PricePreviewSection
              formData={formData}
              diamondSlots={diamondSlots}
              goldPrice={goldPrice}
              gstRate={gstRate}
            />

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={uploading}
                className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{editingItem ? 'Update' : 'Add'} Item</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={uploading}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <ImagePreviewModal
        previewImage={previewImage}
        setPreviewImage={setPreviewImage}
      />
    </>
  );
}