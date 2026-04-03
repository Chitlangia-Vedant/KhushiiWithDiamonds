import { Category } from '../types';

export const getCategoryDisplayName = (categories: Category[], categoryName: string) => {
  const category = categories.find(cat => cat.name === categoryName);
  if (!category) return categoryName;
  if (category.parent_id) {
    const parent = categories.find(cat => cat.id === category.parent_id);
    return parent ? `${parent.name} → ${categoryName}` : categoryName;
  }
  return categoryName;
};

export const getTopLevelCategories = (categories: Category[]) => 
  categories.filter(cat => !cat.parent_id);

export const getSubcategories = (categories: Category[], parentId: string) => 
  categories.filter(cat => cat.parent_id === parentId);