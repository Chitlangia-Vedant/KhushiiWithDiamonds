import React, { useState, useEffect } from 'react';
import { JewelleryItem } from '../../types';
import { DiamondQuality } from '../../constants/jewellery';
import { Edit, Trash2 } from 'lucide-react';
import { formatCurrency, calculateJewelleryPriceSync } from '../../lib/goldPrice';
import { getAvailableDiamondQualities, getDiamondsForQuality } from '../../utils/diamondUtils';
import { useGoldPrice } from '../../hooks/useGoldPrice';
import { useAdminSettings } from '../../hooks/useAdminSettings';
import { useQualityContext } from '../../context/QualityContext';


interface AdminTableRowProps {
  item: JewelleryItem;
  onEdit: (item: JewelleryItem) => void;
  onDelete: (id: string) => void;
}

export function AdminTableRow({ item, onEdit, onDelete }: AdminTableRowProps) {
    const { goldPrice } = useGoldPrice();
    const { gstRate } = useAdminSettings();
    const { globalDiamondQuality, globalGoldPurity } = useQualityContext(); 
  
  // Local state just for this specific row!
  const [selectedQuality, setSelectedQuality] = useState<DiamondQuality | null>(null);
  const availableQualities = getAvailableDiamondQualities(item);

  // Initialize selected quality on mount
  useEffect(() => {
    if (availableQualities.length > 0 && !selectedQuality) {
      setSelectedQuality(availableQualities[0]);
    }
  }, [availableQualities, selectedQuality]);

  // FIX 2: Use your safe utility function instead of the broken Record lookup!
  const diamondsData = getDiamondsForQuality(item, globalDiamondQuality as DiamondQuality);

  // FIX 3: Use globalGoldPurity instead of hardcoded '14K'
  const totalCost = calculateJewelleryPriceSync(
    item.base_price, item.gold_weight, globalGoldPurity,
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

      {/* 5. Diamonds (Carats Only) */}
      <td className="hidden xl:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-900">
        {availableQualities.length > 0 && diamondsData && diamondsData.diamonds.length > 0 ? (
          <span
            className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 truncate max-w-[160px]"
            title={diamondsData.diamonds.map((d: any) => `${d.carat}ct`).join(' + ')}
          >
            {diamondsData.diamonds.map((d: any) => `${d.carat}ct`).join(' + ')}
          </span>
        ) : (
          <span className="text-gray-400 text-xs italic">No diamonds</span>
        )}
      </td>

      {/* 6. Cost Components (Hidden on mobile) */}
      <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="space-y-1">
          <div>Making: {formatCurrency(item.making_charges_per_gram)}/g</div>
          <div>Base: {formatCurrency(item.base_price)}</div>
          
          {/* THE FIX: We first check if diamondsData exists AND if it has the diamonds array */}
          {diamondsData && diamondsData.diamonds && diamondsData.diamonds.length > 0 && (
            <div>Diamonds: {formatCurrency(diamondsData.diamonds.reduce((sum: any, d: any) => sum + (d.carat * d.cost_per_carat), 0))}</div>
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