import React, { useState, useEffect } from 'react';
import { JewelleryItem, DiamondQuality } from '../../types';
import { Edit, Trash2, Image, Gem, ChevronDown } from 'lucide-react';
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
    <tr className="block md:table-row bg-white border border-gray-200 md:border-none rounded-lg shadow-sm md:shadow-none mb-4 md:mb-0 hover:bg-gray-50">
      
      {/* 1. Item Info & Mobile Actions */}
      <td className="block md:table-cell px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 md:border-none bg-gray-50 md:bg-transparent rounded-t-lg md:rounded-none">
        <div className="flex justify-between items-start md:block">
          <div className="flex items-center">
            <img
              className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover border border-gray-200"
              src={item.image_url[0] || 'https://drive.google.com/thumbnail?id=1KRTxnA-gFSbg6R5EfBhu-y-tAxElt_AO&sz=w625-h340'}
              alt=""
            />
            <div className="ml-3 md:ml-4">
              <div className="text-sm font-bold text-gray-900">{item.name}</div>
              <div className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate md:max-w-xs">{item.description}</div>
            </div>
          </div>
          
          {/* Mobile Actions - Hidden on Desktop */}
          <div className="flex md:hidden space-x-2 mt-1">
            <button onClick={() => onEdit(item)} className="p-2 text-yellow-600 bg-yellow-50 rounded-full hover:bg-yellow-100">
              <Edit className="h-4 w-4" />
            </button>
            <button onClick={() => onDelete(item.id)} className="p-2 text-red-600 bg-red-50 rounded-full hover:bg-red-100">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </td>

      {/* 2. Category */}
      <td className="block md:table-cell px-4 py-2 md:px-6 md:py-4 border-b border-gray-100 md:border-none">
        <div className="flex justify-between items-center md:block">
          <span className="md:hidden text-xs font-semibold text-gray-500 uppercase">Category</span>
          <div className="flex flex-col items-end md:items-start">
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 mb-1">
              {item.category}
            </span>
            {categoryDisplay.includes('→') && (
              <span className="text-xs text-gray-500 flex items-center text-right md:text-left">
                {categoryDisplay}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* 3. Images Count */}
      <td className="block md:table-cell px-4 py-2 md:px-6 md:py-4 border-b border-gray-100 md:border-none">
        <div className="flex justify-between items-center md:block">
          <span className="md:hidden text-xs font-semibold text-gray-500 uppercase">Images</span>
          <div className="flex items-center space-x-1">
            <Image className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{item.image_url.length}</span>
          </div>
        </div>
      </td>

      {/* 4. Specifications */}
      <td className="block md:table-cell px-4 py-2 md:px-6 md:py-4 border-b border-gray-100 md:border-none text-sm text-gray-900">
        <div className="flex justify-between items-center md:block">
          <span className="md:hidden text-xs font-semibold text-gray-500 uppercase">Specs</span>
          <div>Gold: {item.gold_weight}g</div>
        </div>
      </td>

      {/* 5. Diamond Quality */}
      <td className="block md:table-cell px-4 py-2 md:px-6 md:py-4 border-b border-gray-100 md:border-none text-sm text-gray-900 overflow-visible">
        <div className="flex justify-between items-start md:block">
          <span className="md:hidden text-xs font-semibold text-gray-500 uppercase mt-1">Diamonds</span>
          
          {availableQualities.length > 0 ? (
            <div className="relative flex flex-col items-end md:items-start" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-1 text-sm bg-blue-50 border border-blue-200 rounded px-2 py-1 hover:bg-blue-100"
              >
                <Gem className="h-3 w-3 text-blue-500" />
                <span className="font-medium">{selectedQuality || availableQualities[0]}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-full right-0 md:left-0 z-20 mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-32">
                  {availableQualities.map((quality) => (
                    <button
                      key={quality}
                      onClick={() => {
                        setSelectedQuality(quality);
                        setIsDropdownOpen(false);
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
                <div className="text-xs text-blue-600 mt-1 text-right md:text-left">
                  {formatDiamondSummary(diamondsData.diamonds, diamondsData.quality)}
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-400 text-right md:text-left">No diamonds</span>
          )}
        </div>
      </td>

      {/* 6. Cost Components */}
      <td className="block md:table-cell px-4 py-2 md:px-6 md:py-4 border-b border-gray-100 md:border-none text-sm text-gray-900">
        <div className="flex justify-between items-start md:block">
          <span className="md:hidden text-xs font-semibold text-gray-500 uppercase mt-1">Cost Breakdown</span>
          <div className="space-y-1 text-right md:text-left">
            <div>Making: {formatCurrency(item.making_charges_per_gram)}/g</div>
            <div>Base: {formatCurrency(item.base_price)}</div>
            {diamondsData.diamonds.length > 0 && (
              <div>Diamonds: {formatCurrency(diamondsData.diamonds.reduce((sum, d) => sum + (d.carat * d.cost_per_carat), 0))}</div>
            )}
          </div>
        </div>
      </td>

      {/* 7. Total Cost */}
      <td className="block md:table-cell px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 md:border-none bg-green-50/30 md:bg-transparent rounded-b-lg md:rounded-none">
        <div className="flex justify-between items-center md:block">
          <span className="md:hidden text-xs font-semibold text-gray-500 uppercase">Total Cost</span>
          <div className="text-right md:text-left">
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(totalCost)}
            </div>
            <div className="text-xs text-gray-500">
              Incl. GST & Live Gold
            </div>
          </div>
        </div>
      </td>

      {/* 8. Desktop Actions - Hidden on Mobile */}
      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm font-medium">
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