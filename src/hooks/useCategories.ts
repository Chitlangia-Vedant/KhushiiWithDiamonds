import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Category } from '../types';
import toast from 'react-hot-toast';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
        
      if (error) throw error;
      if (data) setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(err instanceof Error ? err : new Error('Unknown error loading categories'));
      
      // Let the admin know the background fetch failed
      toast.error('Failed to load categories. Please check your connection.', {
        duration: 4000
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Compute helpful derivatives so components don't have to!
  const topLevelCategories = categories.filter(cat => !cat.parent_id);
  const getSubcategories = (parentId: string) => categories.filter(cat => cat.parent_id === parentId);

  return { 
    categories, 
    topLevelCategories, 
    getSubcategories,
    loadingCategories, 
    error,
    refetchCategories: fetchCategories // Expose this so AdminPage can refresh data after edits!
  };
}