import React from 'react';
import { JewelleryItem } from '../../../../types';
import { formatCurrency } from '../../../../lib/goldPrice';
import { DIAMOND_QUALITIES, DiamondQuality, GOLD_QUALITIES } from '../../../../constants/jewellery';


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
    <div className="border border-gray-200 rounded-lg p-5 mt-6 bg-white shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 pb-3 border-b border-gray-100 gap-3">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Final Preview</h3>
        <div className="flex space-x-2">
          <select 
            value={previewGoldPurity} onChange={(e) => setPreviewGoldPurity(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1 font-medium bg-gray-50 focus:ring-0 cursor-pointer"
          >
            {GOLD_QUALITIES.map(q => (
                  <option key={q.value} value={q.value}>{q.label}</option>
                ))}
          </select>
          {mockItem.diamonds.length > 0 && (
            <select 
              value={previewDiamondQuality} onChange={(e) => setPreviewDiamondQuality(e.target.value as DiamondQuality)}
              className="text-xs border border-gray-300 rounded px-2 py-1 font-medium bg-gray-50 focus:ring-0 cursor-pointer"
            >
              {DIAMOND_QUALITIES.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
            </select>
          )}
        </div>
      </div>
      
      <div className="space-y-1.5 text-sm text-gray-600">
        <div className="flex justify-between"><span>Gold Value:</span> <span className="font-medium text-gray-900">{formatCurrency(pricing.goldValue)}</span></div>
        
        {pricing.diamondCost > 0 && (
          <div className="flex justify-between">
            <span>Diamonds {mockItem.override_diamond_costs ? '(Manual)' : '(Grid)'}:</span> 
            <span className="font-medium text-gray-900">{formatCurrency(pricing.diamondCost)}</span>
          </div>
        )}
        
        {pricing.otherStonesCost > 0 && (
          <div className="flex justify-between"><span>Other Stones:</span> <span className="font-medium text-gray-900">{formatCurrency(pricing.otherStonesCost)}</span></div>
        )}
        
        <div className="flex justify-between"><span>Making Charges:</span> <span className="font-medium text-gray-900">{formatCurrency(pricing.makingCharges)}</span></div>
        <div className="flex justify-between"><span>Base Price:</span> <span className="font-medium text-gray-900">{formatCurrency(pricing.basePrice)}</span></div>
        
        <div className="flex justify-between text-gray-400 pt-2 mt-2 border-t border-gray-50">
          <span>Subtotal:</span> <span>{formatCurrency(pricing.subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>GST ({(gstRate * 100).toFixed(0)}%):</span> <span>{formatCurrency(pricing.gst)}</span>
        </div>
        
        <div className="flex justify-between font-bold text-lg pt-3 mt-3 border-t border-gray-200">
          <span className="text-gray-900">Total</span>
          <span className="text-gray-900">{formatCurrency(pricing.total)}</span>
        </div>
      </div>
    </div>
  );
}