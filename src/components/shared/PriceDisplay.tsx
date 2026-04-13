import React from 'react';
import { JewelleryItem } from '../../types';
import { useGoldPrice } from '../../hooks/useGoldPrice';
import { useAdminSettings } from '../../hooks/useAdminSettings';
import { useQualityContext } from '../../context/QualityContext';
import { getPriceBreakdownItem, formatCurrency } from '../../lib/goldPrice';

interface PriceDisplayProps {
  item: JewelleryItem;
  showBreakdown?: boolean; // Optional flag if you want to show the full math
}

export function PriceDisplay({ item, showBreakdown = false }: PriceDisplayProps) {
  // 1. The Component grabs all the live data automatically!
  const { goldPrice } = useGoldPrice();
  const { globalGoldMakingCharges } = useAdminSettings();
  const { globalGoldPurity, globalDiamondQuality } = useQualityContext();

  // 2. It passes everything to your pure math engine
  const pricing = getPriceBreakdownItem(
    item,
    globalGoldPurity,
    globalDiamondQuality,
    globalGoldMakingCharges,
    goldPrice
  );

  // 3. It renders the simple price (or the complex table)
  if (!showBreakdown) {
    return <span className="font-bold text-gray-900">{formatCurrency(pricing.total)}</span>;
  }

  // Optional: Return the full detailed breakdown if requested
  return (
    <div className="space-y-1 text-sm text-gray-600">
      <div className="font-bold text-gray-900 text-lg">Total: {formatCurrency(pricing.total)}</div>
      <div>Gold Value: {formatCurrency(pricing.goldValue)}</div>
      <div>Diamonds: {formatCurrency(pricing.diamondCost)}</div>
      <div>Making: {formatCurrency(pricing.makingCharges)}</div>
      <div>GST: {formatCurrency(pricing.gst)}</div>
    </div>
  );
}