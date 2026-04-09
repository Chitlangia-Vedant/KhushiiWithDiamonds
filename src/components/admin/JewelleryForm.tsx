import React, { useState, useEffect } from 'react';
import { JewelleryItem, DiamondSlot, StoneSlot } from '../../types';
import { Save, X, Loader } from 'lucide-react';
import { JewelleryDetailsSection } from './jewellery-form/JewelleryDetailsSection';
import { JewelleryImagesSection } from './jewellery-form/JewelleryImagesSection';
import { GoldSpecificationsSection } from './jewellery-form/GoldSpecificationsSection';
import { DiamondSlotsSection } from './jewellery-form/DiamondSlotsSection';
import { PricePreviewSection } from './jewellery-form/PricePreviewSection';
import { ImagePreviewModal } from './jewellery-form/ImagePreviewModal';
import { formatCurrency, getPriceBreakdownItem } from '../../lib/goldPrice';
import { DIAMOND_QUALITIES, DiamondQuality } from '../../constants/jewellery';
import { uploadJewelleryImages, deleteDriveImages, updateJewelleryDriveMetadata } from '../../utils/uploadUtils';
import { useCategories } from '../../hooks/useCategories';
import { OtherStonesSection } from './jewellery-form/OtherStonesSection';

// --- ADD THESE NEW IMPORTS ---
import { useGoldPrice } from '../../hooks/useGoldPrice';
import { useAdminSettings } from '../../hooks/useAdminSettings';
import { useQualityContext } from '../../context/QualityContext';

interface JewelleryFormProps {
  editingItem: JewelleryItem | null;
  onSubmit: (itemData: Partial<JewelleryItem>, imageUrls: string[]) => Promise<void>;
  onCancel: () => void;
}

export function JewelleryForm({ editingItem, onSubmit, onCancel }: JewelleryFormProps) {
  const { categories } = useCategories();
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // --- LIFTED MATH ENGINE & STATE ---
  const { goldPrice } = useGoldPrice();
  const { fallbackGoldPrice, overrideLiveGoldPrice, gstRate, globalGoldMakingCharges, diamondBaseCosts, diamondTiers } = useAdminSettings();
  const { globalGoldPurity, globalDiamondQuality } = useQualityContext();

  const [previewGoldPurity, setPreviewGoldPurity] = useState(globalGoldPurity);
  const [previewDiamondQuality, setPreviewDiamondQuality] = useState<DiamondQuality>(globalDiamondQuality as DiamondQuality);

  // Ensure dropdowns stay synced if global context loads late
  useEffect(() => { setPreviewGoldPurity(globalGoldPurity); }, [globalGoldPurity]);
  useEffect(() => { setPreviewDiamondQuality(globalDiamondQuality as DiamondQuality); }, [globalDiamondQuality]);

  const [formData, setFormData] = useState({
    name: editingItem?.name || '', 
    description: editingItem?.description || '', 
    category: editingItem?.category || '', 
    gold_weight: editingItem?.gold_weight || 0,
    making_charges_per_gram: editingItem?.making_charges_per_gram ?? -1, 
    base_price: editingItem?.base_price || 0,
    diamonds: editingItem?.diamonds || ([] as DiamondSlot[]), 
    other_stones: editingItem?.other_stones || ([] as StoneSlot[]),
    override_diamond_costs: editingItem?.override_diamond_costs ?? false,
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [currentImages, setCurrentImages] = useState<string[]>(editingItem?.image_url || []);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  // --- CALCULATE LIVE PRICING TO PASS DOWN TO SECTIONS ---
  const effectiveGoldPrice = overrideLiveGoldPrice ? fallbackGoldPrice : goldPrice;
  const mockItem = {
    base_price: parseFloat(formData.base_price?.toString() || '0'),
    gold_weight: parseFloat(formData.gold_weight?.toString() || '0'),
    making_charges_per_gram: parseFloat(formData.making_charges_per_gram?.toString() || '-1'),
    diamonds: formData.diamonds,
    other_stones: formData.other_stones,
    override_diamond_costs: formData.override_diamond_costs !== false
  } as JewelleryItem;

  const pricing = getPriceBreakdownItem(
    mockItem, previewGoldPurity, previewDiamondQuality, globalGoldMakingCharges, 
    effectiveGoldPrice, gstRate, diamondBaseCosts, diamondTiers
  );

  // Function to generate a highly readable, structured description for Google Drive
  const generateItemDescription = (): string => {
    const parts: string[] = [];

    // 1. HEADER
    parts.push('=========================================');
    parts.push(` ITEM: ${formData.name.toUpperCase()}`);
    parts.push('=========================================');
    parts.push(`Description: ${formData.description || 'N/A'}`);
    parts.push('');

    // 2. GOLD SPECIFICATIONS
    parts.push('✦ GOLD SPECIFICATIONS ✦');
    parts.push(`• Gold Weight: ${formData.gold_weight}g`);
    parts.push(`• Making Charges: ${formatCurrency(formData.making_charges_per_gram)} per gram`);
    parts.push('');

    // 3. DIAMOND SPECIFICATIONS
    if (formData.diamonds.length > 0) {
      const totalCarats = formData.diamonds.reduce((sum, slot) => sum + slot.carat, 0);
      
      parts.push('✦ DIAMOND SPECIFICATIONS ✦');
      parts.push(`• Total Stones: ${formData.diamonds.length}`);
      parts.push(`• Total Weight: ${totalCarats.toFixed(2)} ct`);
      parts.push('');
      
      parts.push('--- Breakdown by Quality Tier ---');
      DIAMOND_QUALITIES.forEach((quality) => {
        const tierTotalCost = formData.diamonds.reduce((sum, slot) => sum + (slot.carat * slot.costs[quality]), 0);
        
        parts.push(`[ ${quality} ] -> Total Tier Cost: ${formatCurrency(tierTotalCost)}`);
        
        // List individual stones under the quality tier
        formData.diamonds.forEach((slot, index) => {
          const stoneCost = slot.carat * slot.costs[quality];
          parts.push(`  ↳ Stone ${index + 1}: ${slot.carat}ct @ ${formatCurrency(slot.costs[quality])}/ct = ${formatCurrency(stoneCost)}`);
        });
        parts.push(''); // Add a blank line between quality tiers
      });
    } else {
      parts.push('✦ DIAMOND SPECIFICATIONS ✦');
      parts.push('• No diamonds configured for this item.');
      parts.push('');
    }

    // 4. ADDITIONAL DETAILS
    parts.push('✦ ADDITIONAL DETAILS ✦');
    parts.push(`• Base Price (Design/Misc): ${formatCurrency(formData.base_price)}`);

    // Join all the parts together with standard line breaks
    return parts.join('\n');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // 1. Generate description (if you are using this for Drive metadata)
      const itemDescription = generateItemDescription();

      if (editingItem && currentImages.length > 0) {
        // This will silently update the description and move the files if the category changed!
        await updateJewelleryDriveMetadata(
          currentImages,
          formData.category,
          categories,
          itemDescription
        );
      }

      // 2. Upload new images using the utility
      let newImageUrls: string[] = [];
      if (selectedImages.length > 0) {
        newImageUrls = await uploadJewelleryImages(
          selectedImages,
          formData.name,
          formData.category,
          categories,
          itemDescription
        );
      }

      // 3. Delete removed images using the utility
      if (imagesToDelete.length > 0) {
        await deleteDriveImages(imagesToDelete);
      }

      // 4. Combine arrays and clean up diamonds (ignore empty slots)
      const finalImageUrls = [...currentImages, ...newImageUrls];
      const cleanedDiamonds = formData.diamonds.filter(slot => slot.carat > 0);
      const cleanedOtherStones = formData.other_stones.filter(stone => stone.carat > 0); // <-- Clean empty stones

      // 5. Build final data and submit
      const itemData: Partial<JewelleryItem> = {
        name: formData.name,
        description: formData.description, // Fixed strict null TypeScript error
        category: formData.category,
        gold_weight: formData.gold_weight,
        making_charges_per_gram: formData.making_charges_per_gram,
        base_price: formData.base_price,
        diamonds: cleanedDiamonds,
        other_stones: cleanedOtherStones, 
        override_diamond_costs: formData.override_diamond_costs
      };

      await onSubmit(itemData, finalImageUrls);
      
    } catch (error) {
      console.error('Error saving item:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error saving item: ${errorMessage}. Please check permissions.`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6">
        {/* FIX: Changed max-h-screen to max-h-[90vh] so it never clips off the bottom! */}
        <div className="bg-white rounded-lg p-5 sm:p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto pb-8">
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
              formData={formData} setFormData={setFormData} uploading={uploading}
              pricing={pricing} previewGoldPurity={previewGoldPurity} // <-- NEW
            />

            <DiamondSlotsSection
              diamondSlots={formData.diamonds} setDiamondSlots={(slots) => setFormData({ ...formData, diamonds: slots })}
              uploading={uploading} overrideDiamondCosts={formData.override_diamond_costs} setOverrideDiamondCosts={(val) => setFormData({ ...formData, override_diamond_costs: val })}
              pricing={pricing} previewDiamondQuality={previewDiamondQuality} // <-- NEW
            />
            
            <OtherStonesSection
              otherStones={formData.other_stones} setOtherStones={(stones) => setFormData({ ...formData, other_stones: stones })}
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
              mockItem={mockItem} pricing={pricing} gstRate={gstRate} // <-- NEW
              previewGoldPurity={previewGoldPurity} setPreviewGoldPurity={setPreviewGoldPurity} 
              previewDiamondQuality={previewDiamondQuality} setPreviewDiamondQuality={setPreviewDiamondQuality}
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