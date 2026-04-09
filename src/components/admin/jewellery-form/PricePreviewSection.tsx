import React from 'react';
import { JewelleryItem } from '../../../types';
import { formatCurrency } from '../../../lib/goldPrice';
import { DIAMOND_QUALITIES, DiamondQuality } from '../../../constants/jewellery';

interface PricePreviewSectionProps {
  mockItem: JewelleryItem;
  pricing: any;
  gstRate: number;
  previewGoldPurity: string;
  setPreviewGoldPurity: (val: string) => void;
  previewDiamondQuality: DiamondQuality;
  setPreviewDiamondQuality: (val: DiamondQuality) => void;
}

export function PricePreviewSection({ 
  mockItem, pricing, gstRate, previewGoldPurity, setPreviewGoldPurity, previewDiamondQuality, setPreviewDiamondQuality 
}: PricePreviewSectionProps) {

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-2 md:space-y-0">
        <h3 className="text-lg font-semibold text-gray-800">Live Price Preview</h3>
        <div className="flex space-x-2">
          <select 
            value={previewGoldPurity} onChange={(e) => setPreviewGoldPurity(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1 font-medium bg-white focus:ring-1 focus:ring-yellow-500"
          >
            {['14K', '18K', '22K', '24K'].map(q => <option key={q} value={q}>{q} Gold</option>)}
          </select>
          {mockItem.diamonds.length > 0 && (
            <select 
              value={previewDiamondQuality} onChange={(e) => setPreviewDiamondQuality(e.target.value as DiamondQuality)}
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