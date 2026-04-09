import React, { useState, useEffect } from 'react';
import { DiamondSlot, JewelleryItem } from '../../../types';
import { useGoldPrice } from '../../../hooks/useGoldPrice';
import { useAdminSettings } from '../../../hooks/useAdminSettings';
import { useQualityContext } from '../../../context/QualityContext';
import { getPriceBreakdownItem, formatCurrency } from '../../../lib/goldPrice';
import { DIAMOND_QUALITIES, DiamondQuality } from '../../../constants/jewellery';

interface PricePreviewSectionProps {
  formData: any;
  diamondSlots: DiamondSlot[];
}

export function PricePreviewSection({ formData, diamondSlots }: PricePreviewSectionProps) {
  const { goldPrice } = useGoldPrice();
  const { fallbackGoldPrice, overrideLiveGoldPrice, gstRate, globalGoldMakingCharges, diamondBaseCosts, diamondTiers } = useAdminSettings();
  const { globalGoldPurity, globalDiamondQuality } = useQualityContext();

  // Local state for the preview dropdowns
  const [previewGoldPurity, setPreviewGoldPurity] = useState(globalGoldPurity);
  const [previewDiamondQuality, setPreviewDiamondQuality] = useState<DiamondQuality>(globalDiamondQuality as DiamondQuality);

  useEffect(() => { setPreviewGoldPurity(globalGoldPurity); }, [globalGoldPurity]);
  useEffect(() => { setPreviewDiamondQuality(globalDiamondQuality as DiamondQuality); }, [globalDiamondQuality]);

  const effectiveGoldPrice = overrideLiveGoldPrice ? fallbackGoldPrice : goldPrice;

  const mockItem = {
    base_price: parseFloat(formData.base_price) || 0,
    gold_weight: parseFloat(formData.gold_weight) || 0,
    making_charges_per_gram: parseFloat(formData.making_charges_per_gram) || -1,
    diamonds: diamondSlots,
    other_stones: formData.other_stones,
    override_diamond_costs: formData.override_diamond_costs !== false
  } as JewelleryItem;

  const pricing = getPriceBreakdownItem(
    mockItem,
    previewGoldPurity,
    previewDiamondQuality,
    globalGoldMakingCharges,
    effectiveGoldPrice,
    gstRate,
    diamondBaseCosts,
    diamondTiers
  );

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-2 md:space-y-0">
        <h3 className="text-lg font-semibold text-gray-800">Live Price Preview</h3>
        <div className="flex space-x-2">
          <select 
            value={previewGoldPurity} 
            onChange={(e) => setPreviewGoldPurity(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1 font-medium bg-white focus:ring-1 focus:ring-yellow-500"
          >
            {['14K', '18K', '22K', '24K'].map(q => <option key={q} value={q}>{q} Gold</option>)}
          </select>
          {diamondSlots.length > 0 && (
            <select 
              value={previewDiamondQuality} 
              onChange={(e) => setPreviewDiamondQuality(e.target.value as DiamondQuality)}
              className="text-xs border border-gray-300 rounded px-2 py-1 font-medium bg-white focus:ring-1 focus:ring-blue-500"
            >
              {DIAMOND_QUALITIES.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          )}
        </div>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Gold Value ({previewGoldPurity}):</span>
          <span>{formatCurrency(pricing.goldValue)}</span>
        </div>
        {pricing.diamondCost > 0 && (
          <div className="flex justify-between">
            <span>Diamond Cost ({previewDiamondQuality}) {mockItem.override_diamond_costs ? '(Manual)' : '(Grid)'}:</span>
            <span>{formatCurrency(pricing.diamondCost)}</span>
          </div>
        )}
        {pricing.otherStonesCost > 0 && (
          <div className="flex justify-between">
            <span>Other Stones:</span>
            <span>{formatCurrency(pricing.otherStonesCost)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Making Charges:</span>
          <span>{formatCurrency(pricing.makingCharges)}</span>
        </div>
        <div className="flex justify-between">
          <span>Base Markup:</span>
          <span>{formatCurrency(pricing.basePrice)}</span>
        </div>
        <div className="flex justify-between text-gray-400 border-t pt-2 mt-2">
          <span>Subtotal:</span>
          <span>{formatCurrency(pricing.subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>GST ({(gstRate * 100).toFixed(0)}%):</span>
          <span>{formatCurrency(pricing.gst)}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 text-lg border-t pt-2 mt-2">
          <span>Final Total:</span>
          <span className="text-yellow-600">{formatCurrency(pricing.total)}</span>
        </div>
      </div>
    </div>
  );
}