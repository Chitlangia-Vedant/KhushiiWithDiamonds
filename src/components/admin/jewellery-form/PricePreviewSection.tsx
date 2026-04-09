import React from 'react';
import { DiamondSlot, JewelleryItem } from '../../../types';
import { useGoldPrice } from '../../../hooks/useGoldPrice';
import { useAdminSettings } from '../../../hooks/useAdminSettings';
import { useQualityContext } from '../../../context/QualityContext';
import { getPriceBreakdownItem, formatCurrency } from '../../../lib/goldPrice';

interface PricePreviewSectionProps {
  formData: any;
  diamondSlots: DiamondSlot[];
}

export function PricePreviewSection({ formData, diamondSlots }: PricePreviewSectionProps) {
  const { goldPrice } = useGoldPrice();
  const { fallbackGoldPrice, overrideLiveGoldPrice, gstRate, globalGoldMakingCharges, diamondBaseCosts, diamondTiers } = useAdminSettings();
  const { globalGoldPurity, globalDiamondQuality } = useQualityContext();

  const effectiveGoldPrice = overrideLiveGoldPrice ? fallbackGoldPrice : goldPrice;

  // Build a "mock" item to feed into your master math engine
  const mockItem = {
    base_price: parseFloat(formData.base_price) || 0,
    gold_weight: parseFloat(formData.gold_weight) || 0,
    making_charges_per_gram: parseFloat(formData.making_charges_per_gram) || -1,
    diamonds: diamondSlots,
    other_stones: formData.other_stones,
    override_diamond_costs: formData.override_diamond_costs !== false
  } as JewelleryItem;

  // Let the master engine do all the heavy lifting!
  const pricing = getPriceBreakdownItem(
    mockItem,
    globalGoldPurity,
    globalDiamondQuality,
    globalGoldMakingCharges,
    effectiveGoldPrice,
    gstRate,
    diamondBaseCosts,
    diamondTiers
  );

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Live Price Preview</h3>
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Gold Value ({globalGoldPurity}):</span>
          <span>{formatCurrency(pricing.goldValue)}</span>
        </div>
        {pricing.diamondCost > 0 && (
          <div className="flex justify-between">
            <span>Diamond Cost ({globalDiamondQuality}) {mockItem.override_diamond_costs ? '(Manual)' : '(Grid)'}:</span>
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