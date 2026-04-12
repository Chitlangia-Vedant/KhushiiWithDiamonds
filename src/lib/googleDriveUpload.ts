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
  private static readonly EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_DATABASE_URL}/functions/v1/upload-to-drive`;
  private static readonly DELETE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_DATABASE_URL}/functions/v1/delete-from-drive`;
  private static readonly UPDATE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_DATABASE_URL}/functions/v1/update-in-drive`;

  private static async getAuthHeader(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    return `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`;
  }

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
      
      const authHeader = await this.getAuthHeader();
      
      const response = await fetch(this.EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 
          'Authorization': authHeader,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY // <-- Added Project Key Header
        },
        body: formData, 
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const result: UploadResponse = await response.json();
      if (!result.success) throw new Error(result.error || 'Upload failed');
      return result;
    } catch (error) {
      console.error('Google Drive upload error:', error);
      throw error;
    }
  }

  static async deleteFiles(imageUrls: string[]): Promise<DeleteResponse> {
    try {
      if (!imageUrls || imageUrls.length === 0) throw new Error('No image URLs provided');
      const authHeader = await this.getAuthHeader();
      const response = await fetch(this.DELETE_FUNCTION_URL, {
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': authHeader,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY // <-- Added Project Key Header
        },
        body: JSON.stringify({ imageUrls }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
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
      const authHeader = await this.getAuthHeader();
      const response = await fetch(this.UPDATE_FUNCTION_URL, {
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': authHeader,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY // <-- Added Project Key Header
        },
        body: JSON.stringify({ imageUrls, folderPath, itemDescription, itemName }),
      });
      return response.ok;
    } catch (error) { return false; }
  }

  static async deleteFolder(folderPath: string): Promise<boolean> {
    try {
      const authHeader = await this.getAuthHeader();
      const response = await fetch(this.DELETE_FUNCTION_URL, {
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': authHeader,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY // <-- Added Project Key Header
        },
        body: JSON.stringify({ imageUrls: [], folderPaths: [folderPath] }),
      });
      return response.ok;
    } catch (error) { return false; }
  }

  static async moveCategoryFolder(oldFolderPath: string, newFolderPath: string): Promise<boolean> {
    try {
      const authHeader = await this.getAuthHeader();
      const response = await fetch(this.UPDATE_FUNCTION_URL, {
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': authHeader,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY // <-- Added Project Key Header
        },
        body: JSON.stringify({ action: 'move_folder', oldFolderPath, newFolderPath }),
      });
      return response.ok;
    } catch (error) { return false; }
  }
}