import React from 'react';
import { Trash2, FolderSymlink } from 'lucide-react';
import { CategoryDropdown } from '../../CategoryDropdown';

interface Props {
  selectedCount: number;
  bulkCategoryName: string;
  setBulkCategoryName: (name: string) => void;
  onMove: () => void;
  onDelete: () => void;
}

export function AdminItemsBulkActions({ selectedCount, bulkCategoryName, setBulkCategoryName, onMove, onDelete }: Props) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex flex-col sm:flex-row items-center justify-between shadow-sm transition-all">
      <div className="flex items-center mb-3 sm:mb-0">
        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full mr-3">
          {selectedCount}
        </span>
        <span className="text-blue-900 font-medium text-sm">Items Selected</span>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
        <div className="flex items-center space-x-2 w-full sm:w-auto bg-white p-1 rounded-md border border-blue-100">
          <div className="w-48">
            <CategoryDropdown 
              valueLabel={bulkCategoryName || 'Move to...'} 
              onSelect={(_, name) => setBulkCategoryName(name)} 
              onClear={() => setBulkCategoryName('')}
              clearLabel="Cancel"
            />
          </div>
          <button onClick={onMove} className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors flex items-center shadow-sm">
            <FolderSymlink className="h-4 w-4 mr-1.5" /> Move
          </button>
        </div>
        
        <div className="w-px h-6 bg-blue-200 hidden sm:block"></div>
        
        <button onClick={onDelete} className="w-full sm:w-auto px-3 py-2 bg-white border border-red-200 text-red-600 text-sm font-bold rounded-md hover:bg-red-50 hover:border-red-300 transition-colors flex items-center justify-center shadow-sm">
          <Trash2 className="h-4 w-4 mr-1.5" /> Delete Selected
        </button>
      </div>
    </div>
  );
}