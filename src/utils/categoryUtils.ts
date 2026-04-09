import { Category } from '../types';

// 1. New: Recursively find ALL descendant names for the filter logic
export const getValidCategoryNames = (categoryId: string, categories: Category[]): string[] => {
  if (categoryId === 'All') return [];
  
  const parentCat = categories.find(c => c.id === categoryId);
  if (!parentCat) return [];

  let names = [parentCat.name];
  const children = categories.filter(c => c.parent_id === categoryId);

  children.forEach(child => {
    names = [...names, ...getValidCategoryNames(child.id, categories)];
  });

  return names;
};

// 2. Upgraded: Infinite-depth breadcrumb string (e.g. "Rings → Engagement → Solitaire")
export const getCategoryDisplayName = (categories: Category[], categoryName: string): string => {
  const category = categories.find(cat => cat.name === categoryName);
  if (!category) return categoryName;

  const trail = [];
  let currentId: string | null = category.id;

  // Walk up the family tree to the very top!
  while (currentId) {
    const cat = categories.find(c => c.id === currentId);
    if (cat) {
      trail.unshift(cat.name); // Push to the front of the array
      currentId = cat.parent_id;
    } else {
      break;
    }
  }

  return trail.join(' → ');
};