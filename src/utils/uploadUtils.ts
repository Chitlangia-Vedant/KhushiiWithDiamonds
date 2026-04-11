import { GoogleDriveUploadService } from '../lib/googleDriveUpload.ts'; // Adjust path as needed
import { Category } from '../types';

export const uploadJewelleryImages = async (
  files: File[],
  itemName: string,
  categoryName: string,
  categories: Category[],
  description: string
): Promise<string[]> => {
  if (!files || files.length === 0) return [];

  // Find parent category for Drive folder structure
  const selectedCategory = categories.find(cat => cat.name === categoryName);
  const parentCategory = selectedCategory?.parent_id 
    ? categories.find(cat => cat.id === selectedCategory.parent_id)
    : undefined;

  // Execute the upload
  const urls = await GoogleDriveUploadService.uploadJewelleryImages(
    files,
    itemName,
    categoryName,
    parentCategory?.name,
    description
  );
  
  return urls;
};

export const deleteDriveImages = async (urlsToDelete: string[]) => {
  if (!urlsToDelete || urlsToDelete.length === 0) return;
  
  const deleteResult = await GoogleDriveUploadService.deleteFiles(urlsToDelete);
  if (!deleteResult.success) {
    console.warn('Some images failed to delete from Google Drive:', deleteResult.results);
  }
  return deleteResult;
};

// Add this below your existing uploadJewelleryImages function!

export const uploadCategoryImages = async (
  files: File[],
  categoryName: string,
  description: string
): Promise<string[]> => {
  if (!files || files.length === 0) return [];

  // Let the utility handle the Drive service call
  const urls = await GoogleDriveUploadService.uploadCategoryImages(
    files,
    categoryName,
    description
  );
  
  return urls;
};

export const updateJewelleryDriveMetadata = async (
  currentImageUrls: string[],
  itemName: string, // <-- NEW: Added itemName
  categoryName: string,
  categories: any[], 
  itemDescription: string
): Promise<void> => {
  if (!currentImageUrls || currentImageUrls.length === 0) return;

  const category = categories.find(c => c.name === categoryName);
  const parentCategory = category?.parent_id 
    ? categories.find(c => c.id === category.parent_id)?.name 
    : undefined;

  await GoogleDriveUploadService.updateFilesMetadata(
    currentImageUrls,
    'jewellery',
    categoryName,
    parentCategory,
    itemDescription,
    itemName // <-- Pass it to the service
  );
};

export const deleteDriveFolder = async (categoryName: string, parentCategoryName?: string) => {
  const basePath = 'WebCatalog(DO NOT EDIT)';
  const folderPath = parentCategoryName 
    ? `${basePath}/${parentCategoryName}/${categoryName}`
    : `${basePath}/${categoryName}`;
    
  await GoogleDriveUploadService.deleteFolder(folderPath);
};