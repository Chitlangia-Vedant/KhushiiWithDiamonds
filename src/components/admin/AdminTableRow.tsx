import React, { useState, useEffect } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';
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
  index: number;
  totalRows: number;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function AdminTableRow({ item, onEdit, onDelete, index, totalRows, isSelected, onSelect }: AdminTableRowProps) {
  const { globalDiamondQuality } = useQualityContext(); 
  
  const [selectedQuality, setSelectedQuality] = useState<DiamondQuality | null>(null);
  const availableQualities = getAvailableDiamondQualities(item);

  useEffect(() => {
    if (availableQualities.length > 0 && !selectedQuality) {
      setSelectedQuality(availableQualities[0]);
    }
  }, [availableQualities, selectedQuality]);

  const diamondsData = getDiamondsForQuality(item, globalDiamondQuality as DiamondQuality);
  const pricing = useItemPrice(item);
  const isGlobalMakingCharge = item.making_charges_per_gram === -1;

// --- DUAL-ACTION STATE LOGIC ---
  // 1. The "Click to Lock" state (managed natively by React)
  const [isLocked, setIsLocked] = useState(false);
  
  // 2. The click-outside hook (closes the lock when you click away)
  const popoverRef = useClickOutside(() => setIsLocked(false));
  
  // 3. The "Hover to View" state
  const [isHovered, setIsHovered] = useState(false)

  // Show the popover if it is EITHER hovered OR locked
  const showPopover = isHovered || isLocked;

  // --- DYNAMIC POSITIONING LOGIC ---
  let popoverPosition = "top-1/2 -translate-y-1/2"; 
  let arrowPosition = "top-1/2 -translate-y-1/2";   

  if (index === 0) {
    popoverPosition = "top-0";
    arrowPosition = "top-3";
  } else if (index === totalRows - 1) {
    popoverPosition = "bottom-0";
    arrowPosition = "bottom-3";
  }

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}>
      
      {/* --- ADD THIS CHECKBOX COLUMN --- */}
      <td className="px-4 py-4 whitespace-nowrap">
        <input 
          type="checkbox" 
          checked={isSelected} 
          onChange={onSelect}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4"
        />
      </td>
      {/* 1. Item Name & Image */}
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <img
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

      {/* 2. Category */}
      <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap">
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
          {item.category}
        </span>
      </td>

      {/* 4. Specs */}
      <td className="hidden lg:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-900">
         <div>{item.gold_weight}g</div>
      </td>

      {/* 5. Diamonds */}
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

      {/* 7. Total Cost (Dual Action: Hover & Click) */}
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
        
        {/* We add mouse events to the wrapper so hovering ANYWHERE inside it triggers the popup */}
        <div 
          className="relative inline-flex items-center" 
          ref={popoverRef as React.RefObject<HTMLDivElement>}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <button 
            onClick={(e) => {
              e.preventDefault();
              if (isLocked) {
                // If it's already locked, clicking toggles it off AND forces hover off so it hides immediately
                setIsLocked(false);
                setIsHovered(false);
              } else {
                // Otherwise, lock it!
                setIsLocked(true);
              }
            }}
            className={`font-bold border-b border-dashed pb-0.5 cursor-pointer focus:outline-none transition-colors ${
              isLocked ? 'text-yellow-900 border-yellow-800' : 'text-yellow-700 border-yellow-400 hover:text-yellow-900'
            }`}
          >
            {formatCurrency(pricing.total)}
          </button>

          {/* THE POPOVER */}
          {showPopover && (
            <div className={`absolute z-50 left-full ml-3 w-56 bg-white border shadow-xl rounded-lg p-3 text-xs shadow-black/5 transition-opacity ${
              isLocked ? 'border-yellow-300' : 'border-gray-200' 
            } ${popoverPosition}`}>
            
              <div className={`absolute right-full border-[6px] border-transparent border-r-white ${arrowPosition}`}></div>

              <div className="font-semibold text-gray-800 border-b border-gray-100 pb-1.5 mb-1.5 flex justify-between items-center">
                <span>Price Breakdown</span>
                
                {/* DYNAMIC HEADER TEXT: Changes based on locked state */}
                {isLocked ? (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsLocked(false); setIsHovered(false); }}
                    className="text-gray-500 text-[10px] font-normal hover:text-red-600 bg-gray-100 hover:bg-red-50 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    Close
                  </button>
                ) : (
                  <span className="text-gray-400 text-[9px] font-normal italic">
                    Click to lock
                  </span>
                )}
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
                    {isGlobalMakingCharge ? (
                      <span className="text-[9px] bg-purple-100 text-purple-700 px-1 py-0.5 rounded font-bold uppercase tracking-wider">Glbl</span>
                    ) : (
                      <span className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-bold uppercase tracking-wider">Cstm</span>
                    )}
                    <span>{formatCurrency(pricing.makingCharges)}</span>
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
          )}
          
        </div>
      </td>

      {/* 8. Actions */}
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