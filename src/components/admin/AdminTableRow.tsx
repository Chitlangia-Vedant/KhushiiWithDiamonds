import React, { useState, useEffect } from 'react';
import { JewelleryItem, DiamondQuality } from '../../types';
import { Edit, Trash2, Gem, ChevronDown } from 'lucide-react';
import { formatCurrency, calculateJewelleryPriceSync, formatDiamondSummary } from '../../lib/goldPrice';
import { useClickOutside } from '../../hooks/useClickOutside'; // Import the hook!
import { getAvailableDiamondQualities, getDiamondsForQuality } from '../../utils/diamondUtils';
import { useGoldPrice } from '../../hooks/useGoldPrice';
import { useAdminSettings } from '../../hooks/useAdminSettings';

interface AdminTableRowProps {
  item: JewelleryItem;
  onEdit: (item: JewelleryItem) => void;
  onDelete: (id: string) => void;
}

export function AdminTableRow({ item, onEdit, onDelete }: AdminTableRowProps) {
    const { goldPrice } = useGoldPrice();
    const { gstRate } = useAdminSettings();
  // Local state just for this specific row!
  const { ref: dropdownRef, isOpen: isDropdownOpen, setIsOpen: setIsDropdownOpen } = useClickOutside<HTMLDivElement>(false);
  const [selectedQuality, setSelectedQuality] = useState<DiamondQuality | null>(null);
  const availableQualities = getAvailableDiamondQualities(item);

  // Initialize selected quality on mount
  useEffect(() => {
    if (availableQualities.length > 0 && !selectedQuality) {
      setSelectedQuality(availableQualities[0]);
    }
  }, [availableQualities, selectedQuality]);

  const diamondsData = selectedQuality 
    ? getDiamondsForQuality(item, selectedQuality)
    : { diamonds: [], quality: null };

const totalCost = calculateJewelleryPriceSync(
    item.base_price, item.gold_weight, '14K',
    diamondsData, item.making_charges_per_gram, goldPrice, gstRate
  );

  return (
    <tr className="hover:bg-gray-50">
      
      {/* 1. Item Name & Image (Always visible) */}
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <img
            /* FIX: Changed rounded-full to rounded-lg */
            className="h-10 w-10 md:h-12 md:w-12 rounded-lg object-cover border border-gray-200 flex-shrink-0"
            src={item.image_url[0] || 'https://drive.google.com/thumbnail?id=1KRTxnA-gFSbg6R5EfBhu-y-tAxElt_AO&sz=w625-h340'}
            alt=""
          />
          <div className="ml-3">
            <div className="text-sm font-bold text-gray-900 truncate max-w-[150px] sm:max-w-xs">{item.name}</div>
            <div className="md:hidden mt-1 inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full bg-yellow-100 text-yellow-800">
              {item.category}
            </div>
          </div>
        </div>
      </td>

      {/* 2. Category (Hidden on mobile) */}
      <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap">
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
          {item.category}
        </span>
      </td>

      {/* 4. Specs (Hidden on mobile & tablet) */}
      <td className="hidden lg:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-900">
         <div>Gold: {item.gold_weight}g</div>
      </td>

      {/* 5. Diamond Quality (Hidden on mobile, tablet & small desktop) */}
      <td className="hidden xl:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-900 overflow-visible">
        {availableQualities.length > 0 ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-1 text-sm bg-blue-50 border border-blue-200 rounded px-2 py-1 hover:bg-blue-100"
            >
              <Gem className="h-3 w-3 text-blue-500" />
              <span className="font-medium">{selectedQuality || availableQualities[0]}</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-32">
                {availableQualities.map((quality) => (
                  <button key={quality} onClick={() => { setSelectedQuality(quality); setIsDropdownOpen(false); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700">
                    {quality}
                  </button>
                ))}
              </div>
            )}
            {diamondsData.diamonds.length > 0 && (
              <div className="text-xs text-blue-600 mt-1">
                {formatDiamondSummary(diamondsData.diamonds, diamondsData.quality)}
              </div>
            )}
          </div>
        ) : (
          <span className="text-gray-400">No diamonds</span>
        )}
      </td>

      {/* 6. Cost Components (Hidden on mobile) */}
      <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="space-y-1">
          <div>Making: {formatCurrency(item.making_charges_per_gram)}/g</div>
          <div>Base: {formatCurrency(item.base_price)}</div>
          {diamondsData.diamonds.length > 0 && (
            <div>Diamonds: {formatCurrency(diamondsData.diamonds.reduce((sum, d) => sum + (d.carat * d.cost_per_carat), 0))}</div>
          )}
        </div>
      </td>

      {/* 7. Total Cost (Always visible) */}
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="text-sm md:text-lg font-bold text-green-600">
          {formatCurrency(totalCost)}
        </div>
        <div className="hidden md:block text-xs text-gray-500">
          Incl. GST & Live Gold
        </div>
      </td>

      {/* 8. Actions (Always visible) */}
      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button onClick={() => onEdit(item)} className="text-yellow-600 hover:text-yellow-900 mr-3 p-1">
          <Edit className="h-4 w-4 md:h-5 md:w-5" />
        </button>
        <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-900 p-1">
          <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
        </button>
      </td>
    </tr>
  );
}