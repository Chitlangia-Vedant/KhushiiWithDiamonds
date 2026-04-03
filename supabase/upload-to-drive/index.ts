import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
class GoogleDriveService {
  clientId;
  clientSecret;
  refreshToken;
  accessToken = null;
  constructor(){
    this.clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    this.clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';
    this.refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN') || '';
    if (!this.clientSecret || !this.refreshToken) {
      throw new Error('Missing required Google Drive credentials in environment variables');
    }
  }
  async getAccessToken() {
    if (this.accessToken) {
      return this.accessToken;
    }
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token'
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    this.accessToken = data.access_token;
    return this.accessToken;
  }
  async findOrCreateFolder(folderPath) {
    const accessToken = await this.getAccessToken();
    const pathParts = folderPath.split('/').filter((part)=>part.trim());
    let currentFolderId = 'root';
    for (const folderName of pathParts){
      // Search for existing folder
      const searchQuery = `name='${folderName.replace(/'/g, "\\'")}' and parents in '${currentFolderId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&fields=files(id,name)`;
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        throw new Error(`Failed to search for folder "${folderName}": ${searchResponse.status} ${searchResponse.statusText} - ${errorText}`);
      }
      const searchData = await searchResponse.json();
      if (searchData.files && searchData.files.length > 0) {
        // Folder exists
        currentFolderId = searchData.files[0].id;
      } else {
        // Create new folder
        const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [
              currentFolderId
            ]
          })
        });
        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          throw new Error(`Failed to create folder "${folderName}": ${createResponse.status} ${createResponse.statusText} - ${errorText}`);
        }
        const createData = await createResponse.json();
        currentFolderId = createData.id;
      }
    }
    return currentFolderId;
  }
  async uploadFile(fileName, fileData, mimeType, folderId, fileDescription) {
    const accessToken = await this.getAccessToken();
    // Create multipart upload
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const close_delim = `\r\n--${boundary}--`;
    const metadata = {
      name: fileName,
      parents: [
        folderId
      ],
      description: fileDescription // Added this line
    };
    const multipartRequestBody = delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) + delimiter + `Content-Type: ${mimeType}\r\n` + 'Content-Transfer-Encoding: base64\r\n\r\n' + fileData + close_delim;
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`
      },
      body: multipartRequestBody
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload file "${fileName}": ${response.status} ${response.statusText} - ${errorText}`);
    }
    return await response.json();
  }
  async makeFilePublic(fileId) {
    const accessToken = await this.getAccessToken();
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to make file public: ${response.status} ${response.statusText} - ${errorText}`);
    }
  }
  getDirectImageUrl(fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}`;
  }
}
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const uploadRequest = await req.json();
    if (!uploadRequest.files || uploadRequest.files.length === 0) {
      return new Response(JSON.stringify({
        error: 'No files provided'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (!uploadRequest.folderPath || !uploadRequest.itemName) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: folderPath and itemName'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Added validation for itemDescription
    if (!uploadRequest.itemDescription) {
      return new Response(JSON.stringify({
        error: 'Missing required field: itemDescription'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`Starting upload for ${uploadRequest.itemType}: ${uploadRequest.itemName}`);
    console.log(`Target folder: ${uploadRequest.folderPath}`);
    console.log(`Number of files: ${uploadRequest.files.length}`);
    const driveService = new GoogleDriveService();
    // Find or create the target folder
    const folderId = await driveService.findOrCreateFolder(uploadRequest.folderPath);
    console.log(`Target folder ID: ${folderId}`);
    const uploadedFiles = [];
    // Upload each file
    for(let i = 0; i < uploadRequest.files.length; i++){
      const file = uploadRequest.files[i];
      // Generate filename based on item name and index
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = uploadRequest.files.length === 1 ? `${uploadRequest.itemName}.${fileExtension}` : `${uploadRequest.itemName}_${i + 1}.${fileExtension}`;
      console.log(`Uploading file ${i + 1}/${uploadRequest.files.length}: ${fileName}`);
      // Upload file to Google Drive
      const driveFile = await driveService.uploadFile(fileName, file.data, file.mimeType, folderId, uploadRequest.itemDescription); // Passed itemDescription here
      console.log(`File uploaded with ID: ${driveFile.id}`);
      // Make file publicly accessible
      await driveService.makeFilePublic(driveFile.id);
      console.log(`File made public: ${driveFile.id}`);
      // Get direct image URL
      const directUrl = driveService.getDirectImageUrl(driveFile.id);
      uploadedFiles.push({
        originalName: file.name,
        driveFileId: driveFile.id,
        fileName: fileName,
        directUrl: directUrl,
        webViewLink: driveFile.webViewLink
      });
    }
    console.log(`Successfully uploaded ${uploadedFiles.length} files`);
    return new Response(JSON.stringify({
      success: true,
      folderId: folderId,
      folderPath: uploadRequest.folderPath,
      files: uploadedFiles,
      imageUrls: uploadedFiles.map((f)=>f.directUrl)
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({
      error: 'Upload failed',
      details: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
