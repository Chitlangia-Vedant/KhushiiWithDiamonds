import React, { useState, useEffect } from 'react';
import { JewelleryItem, DiamondQuality } from '../../types';
import { Edit, Trash2, Image, ChevronRight, Gem, ChevronDown } from 'lucide-react';
import { formatCurrency, calculateJewelleryPriceSync, formatDiamondSummary } from '../../lib/goldPrice';
import { getCategoryDisplayName } from '../../utils/categoryUtils';
import { useClickOutside } from '../../hooks/useClickOutside'; // Import the hook!
import { getAvailableDiamondQualities, getDiamondsForQuality } from '../../utils/diamondUtils';
import { useCategories } from '../../hooks/useCategories';
import { useGoldPrice } from '../../hooks/useGoldPrice';
import { useAdminSettings } from '../../hooks/useAdminSettings';

interface AdminTableRowProps {
  item: JewelleryItem;
  onEdit: (item: JewelleryItem) => void;
  onDelete: (id: string) => void;
}

export function AdminTableRow({ item, onEdit, onDelete }: AdminTableRowProps) {
    const { categories } = useCategories();
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

  const categoryDisplay = getCategoryDisplayName(categories, item.category);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <img
            className="h-10 w-10 rounded-full object-cover"
            src={item.image_url[0] || 'https://drive.google.com/thumbnail?id=1KRTxnA-gFSbg6R5EfBhu-y-tAxElt_AO&sz=w625-h340'}
            alt=""
          />
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{item.name}</div>
            <div className="text-sm text-gray-500">{item.description.substring(0, 50)}...</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 mb-1">
            {item.category}
          </span>
          {categoryDisplay.includes('→') && (
            <span className="text-xs text-gray-500 flex items-center">
              <ChevronRight className="h-3 w-3 mr-1" />
              {categoryDisplay}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-1">
          <Image className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">{item.image_url.length}</span>
        </div>
      </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
         <div>Gold: {item.gold_weight}g</div>
        </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {availableQualities.length > 0 ? (
          /* USE THE REF HERE FOR THE DROPDOWN */
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
              <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-32">
                {availableQualities.map((quality) => (
                  <button
                    key={quality}
                    onClick={() => {
                      setSelectedQuality(quality);
                      setIsDropdownOpen(false); // Close on selection
                    }}
                    className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                      (selectedQuality || availableQualities[0]) === quality 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700'
                    }`}
                  >
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
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="space-y-1">
          <div>Making: {formatCurrency(item.making_charges_per_gram)}/g</div>
          <div>Base: {formatCurrency(item.base_price)}</div>
          {diamondsData.diamonds.length > 0 && (
            <div>Diamonds: {formatCurrency(diamondsData.diamonds.reduce((sum, d) => sum + (d.carat * d.cost_per_carat), 0))}</div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-lg font-bold text-green-600">
          {formatCurrency(totalCost)}
        </div>
        <div className="text-xs text-gray-500">
          Including GST & Live Gold
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button
          onClick={() => onEdit(item)}
          className="text-yellow-600 hover:text-yellow-900 mr-4"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="text-red-600 hover:text-red-900"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}