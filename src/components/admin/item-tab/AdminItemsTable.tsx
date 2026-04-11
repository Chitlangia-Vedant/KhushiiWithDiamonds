import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { JewelleryItem } from '../../types';
import { AdminTableRow } from './AdminTableRow';

interface Props {
  isLoading: boolean; // <-- NEW PROP
  paginatedItems: JewelleryItem[];
  filteredItemsLength: number;
  selectedItemIds: string[];
  onToggleSelection: (id: string) => void;
  onSelectAll: (checked: boolean, pageIds: string[]) => void;
  onEdit: (item: JewelleryItem) => void;
  onDelete: (id: string) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  startIndex: number;
  itemsPerPage: number;
  clearFilters: () => void;
}

export function AdminItemsTable({
  isLoading, paginatedItems, filteredItemsLength, selectedItemIds, onToggleSelection, onSelectAll,
  onEdit, onDelete, currentPage, setCurrentPage, totalPages, startIndex, itemsPerPage, clearFilters
}: Props) {
  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 w-12 text-left">
                <input 
                  type="checkbox" 
                  disabled={isLoading}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-4 w-4 disabled:opacity-50"
                  checked={paginatedItems.length > 0 && paginatedItems.every(item => selectedItemIds.includes(item.id))}
                  onChange={(e) => onSelectAll(e.target.checked, paginatedItems.map(i => i.id))}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item</th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
              <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Gold</th>
              <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Diamonds</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price (₹)</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            
            {/* --- SKELETON LOADER --- */}
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap"><div className="h-4 w-4 bg-gray-200 rounded"></div></td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gray-200 rounded-lg mr-3 flex-shrink-0"></div>
                      <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap"><div className="h-5 w-24 bg-gray-200 rounded-full"></div></td>
                  <td className="hidden lg:table-cell px-4 py-4 whitespace-nowrap"><div className="h-4 w-16 bg-gray-200 rounded"></div></td>
                  <td className="hidden xl:table-cell px-4 py-4 whitespace-nowrap"><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                  <td className="px-4 py-4 whitespace-nowrap"><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
                  <td className="px-4 py-4 whitespace-nowrap text-right"><div className="h-8 w-16 bg-gray-200 rounded ml-auto"></div></td>
                </tr>
              ))
            ) : (
              /* --- ACTUAL DATA --- */
              paginatedItems.map((item, index) => (
                <AdminTableRow 
                  key={item.id} 
                  item={item} 
                  onEdit={onEdit} 
                  onDelete={onDelete} 
                  index={index} 
                  totalRows={paginatedItems.length}
                  isSelected={selectedItemIds.includes(item.id)}
                  onSelect={() => onToggleSelection(item.id)}
                />
              ))
            )}
          </tbody>
        </table>
        
        {/* Make sure empty state doesn't flash while loading */}
        {!isLoading && paginatedItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 font-medium">No items found matching your filters.</p>
            <button onClick={clearFilters} className="text-yellow-600 text-sm font-semibold mt-2 hover:underline">Clear All Filters</button>
          </div>
        )}
      </div>

      {!isLoading && filteredItemsLength > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-700 hidden sm:block">
            Showing <span className="font-semibold">{startIndex + 1}</span> to <span className="font-semibold">{Math.min(startIndex + itemsPerPage, filteredItemsLength)}</span> of <span className="font-semibold">{filteredItemsLength}</span> items
          </p>
          <div className="flex justify-between sm:justify-end space-x-2 w-full sm:w-auto">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center"><ChevronLeft className="h-4 w-4 mr-1" /> Prev</button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center">Next <ChevronRight className="h-4 w-4 ml-1" /></button>
          </div>
        </div>
      )}
    </div>
  );
}