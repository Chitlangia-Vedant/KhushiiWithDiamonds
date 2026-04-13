import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { JewelleryItem } from '../types';
import JewelleryCard from '../components/JewelleryCard';
import { Search, Filter, Sparkles } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { useNavigate } from 'react-router-dom';
import { CategoryFilter } from '../components/shared/CategoryFilter';
import { getValidCategoryNames } from '../utils/categoryUtils';


export function CategoryPage() {
  const { categoryName } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();
  const { categories, loadingCategories } = useCategories();  const [items, setItems] = useState<JewelleryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const currentCategory = categories.find(c => c.name === categoryName);
  const activeCategoryId = currentCategory ? currentCategory.id : 'All';

  useEffect(() => {
    const loadAllItems = async () => {
      try {
        setLoadingItems(true); // Only show loader on the very first page load
        
        const { data, error } = await supabase
          .from('jewellery_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setItems(data);
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoadingItems(false);
      }
    };

    loadAllItems();
  }, [])

  const handleCategorySelect = (categoryId: string) => {
    if (categoryId === 'All') {
      navigate('/category/All');
    } else {
      const selectedCat = categories.find(c => c.id === categoryId);
      if (selectedCat) navigate(`/category/${selectedCat.name}`);
    }
  };

  const filteredItems = items.filter(item => {
    if (activeCategoryId === 'All') return true;
    const validNames = getValidCategoryNames(activeCategoryId, categories);
    return validNames.includes(item.category);
  });

  if (loadingCategories || loadingItems) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {/* ... existing spinner UI ... */}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{categoryName}</h1>
        <p className="text-xl text-gray-600">{filteredItems.length} items available</p>
        {currentCategory?.description && (
          <p className="text-gray-500 mt-2">{currentCategory.description}</p>
        )}
      </div>

      {/* Universal Category Filter */}
      <CategoryFilter 
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelect={handleCategorySelect}
      />

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search jewellery..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="name">Sort by Name</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* Current Filter Display */}
      {(selectedSubcategory !== 'all' || searchTerm) && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Showing:</span>
          {selectedSubcategory !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {selectedSubcategory === 'main' ? `${categoryName} Only` : selectedSubcategory}
              <button
                onClick={() => setSelectedSubcategory('all')}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          )}
          {searchTerm && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Search: "{searchTerm}"
              <button
                onClick={() => setSearchTerm('')}
                className="ml-2 text-yellow-600 hover:text-yellow-800"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-600">
            {searchTerm || selectedSubcategory !== 'all' 
              ? 'Try adjusting your search or filters.' 
              : 'No items available in this category yet.'}
          </p>
          {(searchTerm || selectedSubcategory !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSubcategory('all');
              }}
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <JewelleryCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}