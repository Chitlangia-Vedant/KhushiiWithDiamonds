import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CategoryCard } from '../components/CategoryCard';
import { Sparkles } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';

export function HomePage() {
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState(true)
  const { topLevelCategories, getSubcategories, loadingCategories } = useCategories();

useEffect(() => {
    const loadCounts = async () => {
      // Wait for the hook to finish loading the categories first
      if (loadingCategories) return;
      if (topLevelCategories.length === 0) {
        setLoadingCounts(false);
        return;
      }

      try {
        // --- FIX: Create an array of Promises to fetch concurrently ---
        const countPromises = topLevelCategories.map(async (category) => {
          const subcategories = getSubcategories(category.id);
          const categoryNames = [category.name, ...subcategories.map(sub => sub.name)];

          const { count, error: countError } = await supabase
            .from('jewellery_items')
            .select('*', { count: 'exact', head: true })
            .in('category', categoryNames);
          
          if (countError) {
            console.warn(`Error counting items for ${category.name}:`, countError);
            return { name: category.name, count: 0 };
          }
          
          return { name: category.name, count: count || 0 };
        });

        // --- FIX: Wait for all queries to finish simultaneously ---
        const results = await Promise.all(countPromises);
        
        // Map the results back into the expected Record<string, number> format
        const counts: Record<string, number> = {};
        results.forEach(result => {
          counts[result.name] = result.count;
        });

        setItemCounts(counts);
      } catch (error) {
        console.error('Error loading counts:', error);
      } finally {
        setLoadingCounts(false);
      }
    };

    loadCounts();
  }, [topLevelCategories, loadingCategories]);

  if (loadingCategories || loadingCounts) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-yellow-600 mx-auto animate-spin" />
          <p className="mt-4 text-gray-600">Loading jewellery collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="relative h-96 bg-gradient-to-r from-orange-900 via-red-900 to-yellow-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="relative text-center text-white z-10">
          <img src="https://drive.google.com/thumbnail?id=134N2Qr1lMDYWfLH1D84gDeICb0dYZQR7&sz=w625-h340" className="pb-4"></img>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Shop by Category</h2>
          <p className="text-xl text-gray-600">Discover our curated collection of fine Indian jewellery</p>
        </div>

        {topLevelCategories.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600 mb-4">There might be a database connection issue.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {topLevelCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                itemCount={itemCounts[category.name] || 0}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}