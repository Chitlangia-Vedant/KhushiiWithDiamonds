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
    category?: string,
    parentCategory?: string
  ): string {
    const basePath = 'WebCatalog(DO NOT EDIT)'
    
    if (itemType === 'category') {
      return basePath
    }
    
    // For jewellery items
    if (parentCategory && category) {
      return `${basePath}/${parentCategory}/${category}`
    } else if (category) {
      return `${basePath}/${category}`
    }
    
    return basePath
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
      if (!files || files.length === 0) {
        throw new Error('No files provided for upload')
      }

      // Validate file sizes (max 10MB each)
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File "${file.name}" is too large. Maximum size is 10MB.`)
        }
      }

      // Validate file types
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      for (const file of files) {
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`File "${file.name}" has unsupported type. Only images are allowed.`)
        }
      }

      console.log(`Starting upload process for ${files.length} files`)

      // Convert files to base64
      const uploadFiles: UploadFile[] = await Promise.all(
        files.map(async (file) => {
          console.log(`Converting ${file.name} to base64...`)
          return {
            name: file.name,
            data: await this.fileToBase64(file),
            mimeType: file.type,
          }
        })
      )

      // Determine folder path
      const folderPath = this.getFolderPath(itemType, category, parentCategory)
      console.log(`Target folder path: ${folderPath}`)

      // Prepare request payload
      const requestPayload = {
        files: uploadFiles,
        folderPath,
        itemName,
        itemType,
        itemDescription,
      }

      console.log(`Calling edge function: ${this.EDGE_FUNCTION_URL}`)

      // Call the edge function
      const response = await fetch(this.EDGE_FUNCTION_URL, {
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

      const result: UploadResponse = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      console.log(`Upload successful! ${result.files.length} files uploaded.`)
      return result

    } catch (error) {
      console.error('Google Drive upload error:', error)
      throw error
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
}