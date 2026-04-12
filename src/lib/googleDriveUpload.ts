import { supabase } from './supabase'; 

interface UploadResponse {
  success: boolean; folderId: string; folderPath: string;
  files: Array<{ originalName: string; driveFileId: string; fileName: string; directUrl: string; webViewLink: string; }>;
  imageUrls: string[]; error?: string; details?: string;
}

interface DeleteResponse {
  success: boolean; summary: { total: number; successful: number; failed: number; };
  results: Array<{ url: string; fileId: string | null; success: boolean; error?: string; }>;
}

export class GoogleDriveUploadService {
  private static getFolderPath(itemType: 'category' | 'jewellery', itemName?: string, category?: string, parentCategory?: string): string {
    const basePath = 'WebCatalog(DO NOT EDIT)';
    if (itemType === 'category') return basePath;
    const safeItemName = itemName ? `/${itemName.replace(/[\/\\]/g, '-')}` : '';
    if (parentCategory && category) return `${basePath}/${parentCategory}/${category}${safeItemName}`;
    if (category) return `${basePath}/${category}${safeItemName}`;
    return `${basePath}${safeItemName}`;
  }

  static async uploadFiles(
    files: File[], itemName: string, itemType: 'category' | 'jewellery',
    category?: string, parentCategory?: string, itemDescription?: string
  ): Promise<UploadResponse> {
    try {
      if (!files || files.length === 0) throw new Error('No files provided');
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      
      const formData = new FormData();
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) throw new Error(`File "${file.name}" is too large. Max 10MB.`);
        if (!allowedTypes.includes(file.type)) throw new Error(`File "${file.name}" has unsupported type.`);
        formData.append('files', file); 
      }

      const folderPath = this.getFolderPath(itemType, itemName, category, parentCategory);
      formData.append('folderPath', folderPath);
      formData.append('itemName', itemName);
      formData.append('itemType', itemType);
      if (itemDescription) formData.append('itemDescription', itemDescription);
      
      // Native Supabase SDK handles Auth, Token Refresh, and API Keys automatically!
      const { data, error } = await supabase.functions.invoke('upload-to-drive', {
        body: formData, 
      });

      if (error) throw new Error(error.message || 'Upload failed');
      if (!data?.success) throw new Error(data?.error || 'Upload failed');
      return data as UploadResponse;
    } catch (error) {
      console.error('Google Drive upload error:', error);
      throw error;
    }
  }

  static async deleteFiles(imageUrls: string[]): Promise<DeleteResponse> {
    try {
      if (!imageUrls || imageUrls.length === 0) throw new Error('No image URLs provided');
      const { data, error } = await supabase.functions.invoke('delete-from-drive', {
        body: { imageUrls },
      });
      if (error) throw new Error(error.message);
      return data as DeleteResponse;
    } catch (error) { console.error('Delete error:', error); throw error; }
  }

  static async uploadCategoryImages(files: File[], categoryName: string, itemDescription: string): Promise<string[]> {
    return (await this.uploadFiles(files, categoryName, 'category', undefined, undefined, itemDescription)).imageUrls;
  }

  static async uploadJewelleryImages(files: File[], itemName: string, category: string, parentCategory?: string, itemDescription?: string): Promise<string[]> {
    return (await this.uploadFiles(files, itemName, 'jewellery', category, parentCategory, itemDescription)).imageUrls;
  }

  static async updateFilesMetadata(imageUrls: string[], itemType: 'category' | 'jewellery', category?: string, parentCategory?: string, itemDescription?: string, itemName?: string): Promise<boolean> {
    try {
      if (!imageUrls || imageUrls.length === 0) return true;
      const folderPath = this.getFolderPath(itemType, itemName, category, parentCategory);
      const { data, error } = await supabase.functions.invoke('update-in-drive', {
        body: { imageUrls, folderPath, itemDescription, itemName },
      });
      if (error) return false;
      return data?.success || false;
    } catch (error) { return false; }
  }

  static async deleteFolder(folderPath: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('delete-from-drive', {
        body: { imageUrls: [], folderPaths: [folderPath] },
      });
      if (error) return false;
      return data?.success || false;
    } catch (error) { return false; }
  }

  static async moveCategoryFolder(oldFolderPath: string, newFolderPath: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('update-in-drive', {
        body: { action: 'move_folder', oldFolderPath, newFolderPath },
      });
      if (error) return false;
      return data?.success || false;
    } catch (error) { return false; }
  }
}