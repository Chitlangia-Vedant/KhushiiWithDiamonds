import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Category, JewelleryItem } from '../types';
import JewelleryCard from '../components/JewelleryCard';
import { Search, Filter, Sparkles, ChevronRight } from 'lucide-react';

export function CategoryPage() {
  const { categoryName } = useParams<{ categoryName: string }>();
  const [items, setItems] = useState<JewelleryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<JewelleryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!categoryName) return;

      try {
        // Load all categories to find current category and its subcategories
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (categoriesData) {
          setCategories(categoriesData);
          
          // Find the current category
          const current = categoriesData.find(cat => cat.name === categoryName);
          setCurrentCategory(current || null);
        }

        // Load items for this category and its subcategories
        const subcategoryNames = categoriesData
          ?.filter(cat => {
            const current = categoriesData.find(c => c.name === categoryName);
            return current && cat.parent_id === current.id;
          })
          .map(cat => cat.name) || [];

        const allCategoryNames = [categoryName, ...subcategoryNames];

        const { data: itemsData } = await supabase
          .from('jewellery_items')
          .select('*')
          .in('category', allCategoryNames)
          .order('created_at', { ascending: false });

        if (itemsData) {
          setItems(itemsData);
          setFilteredItems(itemsData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categoryName]);

  useEffect(() => {
    let filtered = items;

    // Filter by subcategory
    if (selectedSubcategory !== 'all') {
      if (selectedSubcategory === 'main') {
        filtered = filtered.filter(item => item.category === categoryName);
      } else {
        filtered = filtered.filter(item => item.category === selectedSubcategory);
      }
    }

    // Filter by search term
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'price_low': return a.base_price - b.base_price;
        case 'price_high': return b.base_price - a.base_price;
        case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default: return 0;
      }
    });

    setFilteredItems(filtered);
  }, [items, selectedSubcategory, searchTerm, sortBy, categoryName]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-yellow-600 mx-auto animate-spin" />
          <p className="mt-4 text-gray-600">Loading {categoryName}...</p>
        </div>
      </div>
    );
  }

  // Get subcategories for the current category
  const subcategories = currentCategory 
    ? categories.filter(cat => cat.parent_id === currentCategory.id)
    : [];

  // Count items for each filter option
  const mainCategoryCount = items.filter(item => item.category === categoryName).length;
  const getSubcategoryCount = (subcategoryName: string) => 
    items.filter(item => item.category === subcategoryName).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{categoryName}</h1>
        <p className="text-xl text-gray-600">{filteredItems.length} items available</p>
        {currentCategory?.description && (
          <p className="text-gray-500 mt-2">{currentCategory.description}</p>
        )}
      </div>

      {/* Subcategory Filter */}
      {subcategories.length > 0 && (
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSubcategory('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSubcategory === 'all'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({items.length})
              </button>
              <button
                onClick={() => setSelectedSubcategory('main')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSubcategory === 'main'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {categoryName} Only ({mainCategoryCount})
              </button>
              {subcategories.map((subcategory) => {
                const count = getSubcategoryCount(subcategory.name);
                return (
                  <button
                    key={subcategory.id}
                    onClick={() => setSelectedSubcategory(subcategory.name)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                      selectedSubcategory === subcategory.name
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <ChevronRight className="h-3 w-3" />
                    <span>{subcategory.name} ({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

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