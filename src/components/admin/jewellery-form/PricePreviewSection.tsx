import React, { useState } from 'react';
import { DiamondSlot, DiamondQuality } from '../../../types';
import { formatCurrency, calculateJewelleryPriceSync } from '../../../lib/goldPrice';
import { ChevronDown } from 'lucide-react';

interface PricePreviewSectionProps {
  formData: {
    base_price: number;
    gold_weight: number;
    making_charges_per_gram: number;
  };
  diamondSlots: DiamondSlot[];
  goldPrice: number;
  gstRate: number;
}

const DIAMOND_QUALITY_OPTIONS: DiamondQuality[] = ['Lab Grown', 'GH/VS-SI', 'FG/VVS-SI', 'EF/VVS'];

export function PricePreviewSection({ 
  formData, 
  diamondSlots, 
  goldPrice, 
  gstRate 
}: PricePreviewSectionProps) {
  const [selectedQuality, setSelectedQuality] = useState<DiamondQuality>('Lab Grown');
  const [selectedGoldQuality, setSelectedGoldQuality] = useState('14K');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showGoldDropdown, setShowGoldDropdown] = useState(false);
  
  const totalDiamondWeight = diamondSlots.reduce((sum, slot) => sum + slot.carat, 0);
  const shouldShowPreview = formData.gold_weight > 0 || formData.base_price > 0 || totalDiamondWeight > 0;
  
  if (!shouldShowPreview) {
    return null;
  }

  // Convert diamond slots to the format expected by price calculation
  const convertSlotsToQualityDiamonds = (quality: DiamondQuality) => {
    return diamondSlots.map(slot => ({
      carat: slot.carat,
      cost_per_carat: slot.costs[quality]
    }));
  };

  const diamondsData = {
    diamonds: convertSlotsToQualityDiamonds(selectedQuality),
    quality: selectedQuality
  };

  const finalPrice = calculateJewelleryPriceSync(
    formData.base_price, 
    formData.gold_weight, 
    selectedGoldQuality,
    diamondsData, 
    formData.making_charges_per_gram, 
    goldPrice, 
    gstRate
  );

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-medium text-green-800">Live Price Preview</h4>
        
        <div className="flex space-x-2">
          {/* Gold Quality Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowGoldDropdown(!showGoldDropdown)}
              className="flex items-center space-x-1 text-sm bg-white border border-yellow-300 rounded px-3 py-1 hover:bg-yellow-50"
            >
              <span>{selectedGoldQuality}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            
            {showGoldDropdown && (
              <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-24">
                {['14K', '18K', '24K'].map((quality) => (
                  <button
                    key={quality}
                    type="button"
                    onClick={() => {
                      setSelectedGoldQuality(quality);
                      setShowGoldDropdown(false);
                    }}
                    className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                      selectedGoldQuality === quality ? 'bg-yellow-50 text-yellow-600' : 'text-gray-700'
                    }`}
                  >
                    {quality}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Diamond Quality Selector */}
          {diamondSlots.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-1 text-sm bg-white border border-blue-300 rounded px-3 py-1 hover:bg-blue-50"
              >
                <span>{selectedQuality}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-32">
                  {DIAMOND_QUALITY_OPTIONS.map((quality) => (
                    <button
                      key={quality}
                      type="button"
                      onClick={() => {
                        setSelectedQuality(quality);
                        setShowDropdown(false);
                      }}
                      className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                        selectedQuality === quality ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {quality}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="text-2xl font-bold text-green-600 mb-2">
        {formatCurrency(finalPrice)}
      </div>
      
      <div className="space-y-1 text-xs text-green-600">
        <p>*Including live gold price ({formatCurrency(goldPrice)}/gram, {selectedGoldQuality}) + GST ({Math.round(gstRate * 100)}%)</p>
        {totalDiamondWeight > 0 && (
          <p>*Including {diamondSlots.length} diamond{diamondSlots.length > 1 ? 's' : ''} ({totalDiamondWeight.toFixed(2)} total carats) - {selectedQuality}</p>
        )}
      </div>

      {/* Dropdown Overlay */}
      {(showDropdown || showGoldDropdown) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowDropdown(false);
            setShowGoldDropdown(false);
          }}
        />
      )}
    </div>
  );
}