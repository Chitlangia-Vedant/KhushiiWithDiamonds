import React, { useState, useEffect } from 'react';
import { JewelleryItem } from '../../types';
import { DiamondQuality } from '../../constants/jewellery';
import { Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../lib/goldPrice';
import { getAvailableDiamondQualities, getDiamondsForQuality } from '../../utils/diamondUtils';
import { useQualityContext } from '../../context/QualityContext';
import { useItemPrice } from '../../hooks/useItemPrice';


interface AdminTableRowProps {
  item: JewelleryItem;
  onEdit: (item: JewelleryItem) => void;
  onDelete: (id: string) => void;
}

export function AdminTableRow({ item, onEdit, onDelete }: AdminTableRowProps) {
    const { globalDiamondQuality } = useQualityContext(); 
  
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

  const pricing = useItemPrice(item);
  // 2. Figure out which rate is active (just for the display label)
  const isGlobalMakingCharge = item.making_charges_per_gram === -1;

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

      {/* 7. Total Cost (Always visible) */}
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
        {/* Changed to 'relative inline-flex' so the tooltip anchors to the right edge of the text */}
        <div className="group relative inline-flex items-center cursor-help">
          
          <span className="font-bold text-yellow-700 border-b border-dashed border-yellow-400 pb-0.5">
            {formatCurrency(pricing.total)}
          </span>

          {/* THE TOOLTIP (Pops to the RIGHT to avoid table top/bottom clipping) */}
          <div className="absolute z-50 hidden group-hover:block left-full top-1/2 transform -translate-y-1/2 ml-3 w-56 bg-white border border-gray-200 shadow-xl rounded-lg p-3 text-xs pointer-events-none">
            
            {/* Tooltip left-pointing arrow */}
            <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-[6px] border-transparent border-r-white"></div>

            <div className="font-semibold text-gray-800 border-b border-gray-100 pb-1.5 mb-1.5">
              Price Breakdown
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Gold Value:</span>
                <span className="font-medium text-gray-900">{formatCurrency(pricing.goldValue)}</span>
              </div>
              
              {pricing.diamondCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Diamonds:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(pricing.diamondCost)}</span>
                </div>
              )}
              
              {pricing.otherStonesCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Other Stones:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(pricing.otherStonesCost)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Making:</span>
                <span className="font-medium text-gray-900 flex items-center space-x-1">
                  <span>{formatCurrency(pricing.makingCharges)}</span>
                  {isGlobalMakingCharge ? (
                    <span className="text-[9px] bg-purple-100 text-purple-700 px-1 py-0.5 rounded font-bold uppercase tracking-wider">Glbl</span>
                  ) : (
                    <span className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-bold uppercase tracking-wider">Cstm</span>
                  )}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Base Markup:</span>
                <span className="font-medium text-gray-900">{formatCurrency(pricing.basePrice)}</span>
              </div>
              
              <div className="flex justify-between text-gray-400 pt-1 mt-1 border-t border-gray-50">
                <span>GST:</span>
                <span>{formatCurrency(pricing.gst)}</span>
              </div>
            </div>
          </div>
          
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