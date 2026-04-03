import { Category, JewelleryItem } from '../../types';
import { Edit, Trash2, Image, ChevronRight, Folder, FolderOpen } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
  items: JewelleryItem[];
  subcategories: Category[];
  isSubcategory?: boolean;
  expandedCategories: Set<string>;
  onToggleExpanded: (categoryId: string) => void;
  onEdit: (category: Category) => void;
  onDelete: (id: string, categoryName: string) => void;
}

export function CategoryCard({ 
  category, 
  items, 
  subcategories, 
  isSubcategory = false,
  expandedCategories,
  onToggleExpanded,
  onEdit,
  onDelete
}: CategoryCardProps) {
  const itemCount = items.filter(item => item.category === category.name).length;
  const imageCount = category.image_url 
    ? category.image_url.split(',').map(url => url.trim()).filter(url => url).length
    : 0;
  const hasSubcategories = subcategories.length > 0;
  const isExpanded = expandedCategories.has(category.id);

  return (
    <div className={`${isSubcategory ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
        <div className="relative h-32">
          <img
            src={category.image_url?.split(',')[0]?.trim() || 'https://drive.google.com/thumbnail?id=1KRTxnA-gFSbg6R5EfBhu-y-tAxElt_AO&sz=w625-h340'}
            alt={category.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 flex space-x-1">
            <button
              onClick={() => onEdit(category)}
              className="bg-white bg-opacity-90 p-1 rounded-full hover:bg-opacity-100"
            >
              <Edit className="h-4 w-4 text-yellow-600" />
            </button>
            <button
              onClick={() => onDelete(category.id, category.name)}
              className="bg-white bg-opacity-90 p-1 rounded-full hover:bg-opacity-100"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          </div>
          {imageCount > 1 && (
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
              <Image className="h-3 w-3" />
              <span>{imageCount}</span>
            </div>
          )}
          {isSubcategory && (
            <div className="absolute bottom-2 left-2 bg-blue-500 bg-opacity-90 text-white px-2 py-1 rounded-full text-xs">
              Subcategory
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
            {hasSubcategories && (
              <button
                onClick={() => onToggleExpanded(category.id)}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
              >
                {isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                <span className="text-sm">{subcategories.length}</span>
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{category.description}</p>
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{itemCount} items</span>
            {hasSubcategories && (
              <span>{subcategories.length} subcategories</span>
            )}
          </div>
        </div>
      </div>

      {/* Render subcategories */}
      {hasSubcategories && isExpanded && (
        <div className="space-y-4">
          {subcategories.map((subcategory) => {
            const subSubcategories = items.filter(item => item.category === subcategory.name);
            return (
              <CategoryCard 
                key={subcategory.id} 
                category={subcategory} 
                items={items}
                subcategories={[]} // Assuming no nested subcategories for now
                isSubcategory={true}
                expandedCategories={expandedCategories}
                onToggleExpanded={onToggleExpanded}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}