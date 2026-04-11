import React, { useState, useEffect } from 'react';
import { JewelleryItem, DiamondSlot, StoneSlot } from '../../../types';
import { Save, X, Loader, AlertTriangle } from 'lucide-react';
import { JewelleryDetailsSection } from './jewellery-form/JewelleryDetailsSection';
import { JewelleryImagesSection } from './jewellery-form/JewelleryImagesSection';
import { GoldSpecificationsSection } from './jewellery-form/GoldSpecificationsSection';
import { DiamondSlotsSection } from './jewellery-form/DiamondSlotsSection';
import { PricePreviewSection } from './jewellery-form/PricePreviewSection';
import { ImagePreviewModal } from './jewellery-form/ImagePreviewModal';
import { formatCurrency, getPriceBreakdownItem } from '../../../lib/goldPrice';
import { DiamondQuality } from '../../../constants/jewellery';
import { uploadJewelleryImages, deleteDriveImages, updateJewelleryDriveMetadata } from '../../../utils/uploadUtils';
import { useCategories } from '../../../hooks/useCategories';
import { OtherStonesSection } from './jewellery-form/OtherStonesSection';

import { useGoldPrice } from '../../../hooks/useGoldPrice';
import { useAdminSettings } from '../../../hooks/useAdminSettings';
import { useQualityContext } from '../../../context/QualityContext';
import toast from 'react-hot-toast';

interface JewelleryFormProps {
  editingItem: JewelleryItem | null;
  onSubmit: (itemData: Partial<JewelleryItem>, imageUrls: string[]) => Promise<void>;
  onCancel: () => void;
}

export function JewelleryForm({ editingItem, onSubmit, onCancel }: JewelleryFormProps) {
  const { categories } = useCategories();
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { goldPrice } = useGoldPrice();
  const { fallbackGoldPrice, overrideLiveGoldPrice, gstRate, globalGoldMakingCharges, diamondBaseCosts, diamondTiers } = useAdminSettings();
  const { globalGoldPurity, globalDiamondQuality } = useQualityContext();

  const [previewGoldPurity, setPreviewGoldPurity] = useState(globalGoldPurity);
  const [previewDiamondQuality, setPreviewDiamondQuality] = useState<DiamondQuality>(globalDiamondQuality as DiamondQuality);
  const [combinedOrder, setCombinedOrder] = useState<string[]>([]);

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

  const [initialDataStr] = useState(JSON.stringify(formData));

  const hasUnsavedChanges = () => {
    return JSON.stringify(formData) !== initialDataStr || selectedImages.length > 0 || imagesToDelete.length > 0;
  };

  useEffect(() => {
    const isDirty = hasUnsavedChanges();
    (window as any).isFormDirty = isDirty; 

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      (window as any).isFormDirty = false; 
    };
  }, [formData, selectedImages, imagesToDelete, initialDataStr]);

  // --- CUSTOM TOAST CANCEL HANDLER ---
  const handleSafeCancel = () => {
    if (hasUnsavedChanges()) {
      toast((t) => (
        <div className="flex flex-col p-1 min-w-[320px]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0 border border-orange-100">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="font-extrabold text-gray-900 text-lg">Discard Changes?</h3>
          </div>
          <div className="text-sm text-gray-800 mb-5 pl-[52px] leading-relaxed">
            <p className="mb-2 font-medium">You have unsaved changes in this item.</p>
            <p className="bg-orange-50/80 p-2 border border-orange-100 rounded text-orange-900 text-xs">
              Are you sure you want to close without saving?
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-1">
            <button onClick={() => toast.dismiss(t.id)} className="px-5 py-2 text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-300 shadow-sm">
              Keep Editing
            </button>
            <button 
              onClick={() => {
                toast.dismiss(t.id);
                (window as any).isFormDirty = false;
                onCancel();
              }} 
              className="px-5 py-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors shadow-sm border border-orange-600"
            >
              Yes, discard
            </button>
          </div>
        </div>
      ), { duration: Infinity, style: { maxWidth: '450px', padding: '16px', backgroundColor: '#ffffff', border: '1px solid #fed7aa' } });
    } else {
      (window as any).isFormDirty = false;
      onCancel();
    }
  };

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

  const generateItemDescription = (): string => {
    const parts: string[] = [];
    parts.push('=========================================');
    parts.push(` ITEM: ${formData.name.toUpperCase()}`);
    parts.push('=========================================');
    parts.push(`Description: ${formData.description || 'N/A'}\n`);
    parts.push('✦ GOLD SPECIFICATIONS ✦');
    parts.push(`• Gold Weight: ${formData.gold_weight}g`);
    
    if (formData.diamonds.length > 0) {
      const totalCarats = formData.diamonds.reduce((sum, slot) => sum + slot.carat, 0);
      parts.push('✦ DIAMOND SPECIFICATIONS ✦');
      parts.push(`• Total Stones: ${formData.diamonds.length}`);
      parts.push(`• Total Weight: ${totalCarats.toFixed(2)} ct\n`);
    } else {
      parts.push('✦ DIAMOND SPECIFICATIONS ✦');
      parts.push('• No diamonds configured for this item.\n');
    }
    parts.push('✦ ADDITIONAL DETAILS ✦');
    parts.push(`• Base Price (Design/Misc): ${formatCurrency(formData.base_price)}`);
    return parts.join('\n');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    const loadingToastId = toast.loading(editingItem ? 'Updating item...' : 'Saving new item...');

    try {
      const itemDescription = generateItemDescription();

      if (editingItem && currentImages.length > 0) {
        try { await updateJewelleryDriveMetadata(currentImages, formData.category, categories, itemDescription); } 
        catch (updateError) { console.error('Drive metadata update failed:', updateError); }
      }

      let newImageUrls: string[] = [];
      if (selectedImages.length > 0) {
        try { newImageUrls = await uploadJewelleryImages(selectedImages, formData.name, formData.category, categories, itemDescription); } 
        catch (uploadError) {
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
          toast.error(`Image upload failed: ${errorMessage}. Saving without new images.`, { duration: 5000 });
        }
      }

      if (imagesToDelete.length > 0) {
        try { await deleteDriveImages(imagesToDelete); } 
        catch (deleteError) { console.error('Failed to delete images:', deleteError); }
      }

      let finalImageUrls: string[] = [];
      if (combinedOrder.length > 0) {
        const newUrlMap: Record<string, string> = {};
        selectedImages.forEach((file, index) => { newUrlMap[`${file.name}-${file.size}`] = newImageUrls[index]; });
        finalImageUrls = combinedOrder.map(id => currentImages.includes(id) ? id : newUrlMap[id]).filter(Boolean) as string[];
      } else {
        finalImageUrls = [...currentImages, ...newImageUrls];
      }
      
      const cleanedDiamonds = formData.diamonds.filter(slot => slot.carat > 0);
      const cleanedOtherStones = formData.other_stones.filter(stone => stone.carat > 0);

      const itemData: Partial<JewelleryItem> = {
        name: formData.name, description: formData.description, category: formData.category,
        gold_weight: formData.gold_weight, making_charges_per_gram: formData.making_charges_per_gram,
        base_price: formData.base_price, diamonds: cleanedDiamonds,
        other_stones: cleanedOtherStones, override_diamond_costs: formData.override_diamond_costs
      };

      await onSubmit(itemData, finalImageUrls);
      
      (window as any).isFormDirty = false; // Successfully saved! Clear the dirty flag.
      toast.success(editingItem ? 'Item updated successfully!' : 'Item added successfully!', { id: loadingToastId });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Error saving item: ${errorMessage}`, { id: loadingToastId, duration: 5000 });
    } finally {
      setUploading(false);
    }
  };

return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[95vh] relative">
          
          <div className="flex justify-between items-center p-5 sm:px-8 sm:py-5 border-b border-gray-200 shrink-0">
            <h2 className="text-xl font-bold text-gray-800">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
            <button onClick={handleSafeCancel} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="overflow-y-auto p-5 sm:p-8 flex-1 custom-scrollbar">
            <form id="jewellery-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              <div className="space-y-6">
                <JewelleryDetailsSection formData={formData} setFormData={setFormData} categories={categories} uploading={uploading} />
                <JewelleryImagesSection selectedImages={selectedImages} setSelectedImages={setSelectedImages} currentImages={currentImages} setCurrentImages={setCurrentImages} imagesToDelete={imagesToDelete} setImagesToDelete={setImagesToDelete} uploading={uploading} setCombinedOrder={setCombinedOrder} />
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Base Price (₹)</label>
                  <input type="number" step="0.01" required value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 bg-white" placeholder="Design complexity, additional stones, etc." disabled={uploading} />
                  <p className="text-xs text-gray-500 mt-1">*Misc costs (Gold, diamond, and making charges calculated separately)</p>
                </div>
              </div>

              <div className="space-y-6">
                <GoldSpecificationsSection formData={formData} setFormData={setFormData} uploading={uploading} pricing={pricing} previewGoldPurity={previewGoldPurity} />
                <DiamondSlotsSection diamondSlots={formData.diamonds} setDiamondSlots={(slots) => setFormData({ ...formData, diamonds: slots })} uploading={uploading} overrideDiamondCosts={formData.override_diamond_costs} setOverrideDiamondCosts={(val) => setFormData({ ...formData, override_diamond_costs: val })} pricing={pricing} previewDiamondQuality={previewDiamondQuality} />
                <OtherStonesSection otherStones={formData.other_stones} setOtherStones={(stones) => setFormData({ ...formData, other_stones: stones })} uploading={uploading} />
                <PricePreviewSection mockItem={mockItem} pricing={pricing} gstRate={gstRate} previewGoldPurity={previewGoldPurity} setPreviewGoldPurity={setPreviewGoldPurity} previewDiamondQuality={previewDiamondQuality} setPreviewDiamondQuality={setPreviewDiamondQuality} />
              </div>

            </form>
          </div>

          <div className="p-5 sm:px-8 sm:py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end space-x-4 shrink-0">
            <button type="button" onClick={handleSafeCancel} disabled={uploading} className="px-5 py-2 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" form="jewellery-form" disabled={uploading} className="bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700 font-medium flex items-center space-x-2 transition-colors disabled:opacity-70 shadow-sm">
              {uploading ? <><Loader className="h-4 w-4 animate-spin" /><span>Saving...</span></> : <><Save className="h-4 w-4" /><span>{editingItem ? 'Update Item' : 'Save Item'}</span></>}
            </button>
          </div>

        </div>
      </div>
      <ImagePreviewModal previewImage={previewImage} setPreviewImage={setPreviewImage} />
    </>
  );
}