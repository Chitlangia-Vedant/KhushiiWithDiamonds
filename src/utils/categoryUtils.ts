import { Category } from '../types';

// 1. New: Recursively find ALL descendant names for the filter logic
export const getValidCategoryNames = (
  categoryId: string, 
  categories: Category[], 
  visited = new Set<string>() // <-- Failsafe added here
): string[] => {
  if (visited.has(categoryId)) return []; // Break loop immediately
  visited.add(categoryId);
  
  const category = categories.find((c) => c.id === categoryId);
  if (!category) return [];

  const childCategories = categories.filter((c) => c.parent_id === categoryId);
  if (childCategories.length === 0) return [category.name];

  return childCategories.flatMap((child) => getValidCategoryNames(child.id, categories, visited));
};

export const getDescendantCategoryIds = (categoryId: string, categories: Category[]): string[] => {
  const descendants: string[] = [];
  const traverse = (currentId: string) => {
    const children = categories.filter(c => c.parent_id === currentId);
    children.forEach(child => {
      descendants.push(child.id);
      traverse(child.id);
    });
  };
  traverse(categoryId);
  return descendants;
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