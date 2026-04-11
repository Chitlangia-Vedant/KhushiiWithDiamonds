interface UploadFile {
  name: string
  data: string // base64 encoded
  mimeType: string
}

interface UploadResponse {
  success: boolean
  folderId: string
  folderPath: string
  files: Array<{
    originalName: string
    driveFileId: string
    fileName: string
    directUrl: string
    webViewLink: string
  }>
  imageUrls: string[]
  error?: string
  details?: string
}

interface DeleteResponse {
  success: boolean
  results: Array<{
    url: string
    fileId: string | null
    success: boolean
    error?: string
  }>
  summary: {
    total: number
    successful: number
    failed: number
  }
}

export class GoogleDriveUploadService {
  private static readonly EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_DATABASE_URL}/functions/v1/upload-to-drive`
  private static readonly DELETE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_DATABASE_URL}/functions/v1/delete-from-drive`
  private static readonly UPDATE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_DATABASE_URL}/functions/v1/update-in-drive`
  /**
   * Convert File objects to base64 encoded data
   */
  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = result.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Determine folder path based on category hierarchy
   */
  private static getFolderPath(
    itemType: 'category' | 'jewellery',
    itemName?: string, // <-- NEW: Accept item name
    category?: string,
    parentCategory?: string
  ): string {
    const basePath = 'WebCatalog(DO NOT EDIT)';
    
    if (itemType === 'category') {
      return basePath;
    }
    
    // Sanitize item name to prevent accidental sub-folders if name contains slashes
    const safeItemName = itemName ? `/${itemName.replace(/[\/\\]/g, '-')}` : '';
    
    // For jewellery items, append the safeItemName to the end of the path
    if (parentCategory && category) {
      return `${basePath}/${parentCategory}/${category}${safeItemName}`;
    } else if (category) {
      return `${basePath}/${category}${safeItemName}`;
    }
    
    return `${basePath}${safeItemName}`;
  }

  /**
   * Upload files to Google Drive
   */
  static async uploadFiles(
    files: File[],
    itemName: string,
    itemType: 'category' | 'jewellery',
    category?: string,
    parentCategory?: string,
    itemDescription?: string
  ): Promise<UploadResponse> {
    try {
      if (!files || files.length === 0) throw new Error('No files provided for upload');
      for (const file of files) if (file.size > 10 * 1024 * 1024) throw new Error(`File too large.`);
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      for (const file of files) if (!allowedTypes.includes(file.type)) throw new Error(`Unsupported type.`);

      const uploadFiles: UploadFile[] = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          data: await this.fileToBase64(file),
          mimeType: file.type,
        }))
      );

      // <-- FIX: Pass the itemName into the path generator
      const folderPath = this.getFolderPath(itemType, itemName, category, parentCategory);

      const requestPayload = { files: uploadFiles, folderPath, itemName, itemType, itemDescription };

      const response = await fetch(this.EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) throw new Error(`HTTP Error: ${response.statusText}`);
      const result: UploadResponse = await response.json();
      if (!result.success) throw new Error(result.error || 'Upload failed');
      return result;
    } catch (error) {
      console.error('Google Drive upload error:', error);
      throw error;
    }
  }

  /**
   * Delete files from Google Drive
   */
  static async deleteFiles(imageUrls: string[]): Promise<DeleteResponse> {
    try {
      if (!imageUrls || imageUrls.length === 0) {
        throw new Error('No image URLs provided for deletion')
      }

      console.log(`Starting deletion process for ${imageUrls.length} files`)

      // Prepare request payload
      const requestPayload = {
        imageUrls,
      }

      console.log(`Calling delete edge function: ${this.DELETE_FUNCTION_URL}`)

      // Call the delete edge function
      const response = await fetch(this.DELETE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(requestPayload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result: DeleteResponse = await response.json()
      
      console.log(`Deletion complete: ${result.summary.successful} successful, ${result.summary.failed} failed`)
      return result

    } catch (error) {
      console.error('Google Drive deletion error:', error)
      throw error
    }
  }

  /**
   * Upload category images
   */
  static async uploadCategoryImages(
    files: File[],
    categoryName: string,
    itemDescription: string
  ): Promise<string[]> {
    const result = await this.uploadFiles(files, categoryName, 'category', undefined, undefined, itemDescription)
    return result.imageUrls
  }

  /**
   * Upload jewellery item images
   */
  static async uploadJewelleryImages(
    files: File[],
    itemName: string,
    category: string,
    parentCategory?: string,
    itemDescription?: string
  ): Promise<string[]> {
    const result = await this.uploadFiles(files, itemName, 'jewellery', category, parentCategory, itemDescription)
    return result.imageUrls
  }

  /**
   * Update file descriptions and move them to the correct folder in Google Drive
   */
  static async updateFilesMetadata(
    imageUrls: string[],
    itemType: 'category' | 'jewellery',
    category?: string,
    parentCategory?: string,
    itemDescription?: string,
    itemName?: string // <-- NEW: Accept item name here too!
  ): Promise<boolean> {
    try {
      if (!imageUrls || imageUrls.length === 0) return true;

      // <-- FIX: Pass the itemName into the path generator
      const folderPath = this.getFolderPath(itemType, itemName, category, parentCategory);

      const response = await fetch(this.UPDATE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ imageUrls, folderPath, itemDescription }),
      });

      if (!response.ok) throw new Error('Failed to update Drive metadata');
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Google Drive update error:', error);
      return false; 
    }
  }

  static async deleteFolder(folderPath: string): Promise<boolean> {
    try {
      const response = await fetch(this.DELETE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ imageUrls: [], folderPaths: [folderPath] }),
      });
      return response.ok;
    } catch (error) {
      console.error('Google Drive folder deletion error:', error);
      return false;
    }
  }

  /**
   * Move or Rename an entire category folder explicitly by path
   */
  static async moveCategoryFolder(oldFolderPath: string, newFolderPath: string): Promise<boolean> {
    try {
      const response = await fetch(this.UPDATE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: 'move_folder', oldFolderPath, newFolderPath }),
      });
      return response.ok;
    } catch (error) {
      console.error('Google Drive folder move error:', error);
      return false;
    }
  }
}