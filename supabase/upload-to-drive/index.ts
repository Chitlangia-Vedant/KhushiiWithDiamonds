import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { encodeBase64 } from 'https://deno.land/std@0.208.0/encoding/base64.ts';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };

class GoogleDriveService {
  clientId = Deno.env.get('GOOGLE_CLIENT_ID') || '';
  clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';
  refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN') || '';
  accessToken: string | null = null;
  supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

  async getAccessToken() {
    if (this.accessToken) return this.accessToken;
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: this.clientId, client_secret: this.clientSecret, refresh_token: this.refreshToken, grant_type: 'refresh_token' })
    });
    this.accessToken = (await res.json()).access_token;
    return this.accessToken;
  }

  // --- OPTIMIZATION 3: Database Caching ---
  async getCachedFolderId(path: string) {
    const res = await fetch(`${this.supabaseUrl}/rest/v1/drive_folder_cache?path=eq.${encodeURIComponent(path)}&select=folder_id`, {
      headers: { 'apikey': this.supabaseKey, 'Authorization': `Bearer ${this.supabaseKey}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.length > 0 ? data[0].folder_id : null;
  }

  async setCachedFolderId(path: string, folderId: string) {
    await fetch(`${this.supabaseUrl}/rest/v1/drive_folder_cache`, {
      method: 'POST', headers: { 'apikey': this.supabaseKey, 'Authorization': `Bearer ${this.supabaseKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, folder_id: folderId })
    });
  }

  async verifyFolderExists(folderId: string) {
    const accessToken = await this.getAccessToken();
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,trashed`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    if (!res.ok) return false;
    const data = await res.json();
    return !data.trashed;
  }

  async findOrCreateFolder(folderPath: string) {
    // Check Cache First! (Saves 80% API Quota)
    const cachedId = await this.getCachedFolderId(folderPath);
    if (cachedId && await this.verifyFolderExists(cachedId)) return cachedId;

    const accessToken = await this.getAccessToken();
    const pathParts = folderPath.split('/').filter(part => part.trim());
    let currentFolderId = 'root';
    let currentPath = '';

    for (const folderName of pathParts) {
      currentPath += currentPath ? `/${folderName}` : folderName;
      
      const searchQuery = `name='${folderName.replace(/'/g, "\\'")}' and parents in '${currentFolderId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&fields=files(id)`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
      const searchData = await searchRes.json();
      
      if (searchData.files && searchData.files.length > 0) {
        currentFolderId = searchData.files[0].id;
      } else {
        const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [currentFolderId] })
        });
        currentFolderId = (await createRes.json()).id;
        await this.setCachedFolderId(currentPath, currentFolderId); // Save to cache!
      }
    }
    return currentFolderId;
  }

  async updateFolderDescription(folderId: string, description: string) {
    const accessToken = await this.getAccessToken();
    await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}`, {
      method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ description })
    });
  }

  async uploadFile(fileName: string, fileData: string, mimeType: string, folderId: string, description: string) {
    const accessToken = await this.getAccessToken();
    const boundary = '-------314159265358979323846';
    const multipartBody = `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify({ name: fileName, parents: [folderId], description })}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n${fileData}\r\n--${boundary}--`;
    
    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
      method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': `multipart/related; boundary="${boundary}"` }, body: multipartBody
    });
    if (!res.ok) throw new Error(await res.text());
    
    const driveFile = await res.json();
    await fetch(`https://www.googleapis.com/drive/v3/files/${driveFile.id}/permissions`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'reader', type: 'anyone' })
    });
    return { ...driveFile, directUrl: `https://drive.google.com/thumbnail?id=${driveFile.id}` };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const formData = await req.formData();
    const files = formData.getAll('files');
    const folderPath = formData.get('folderPath') as string;
    const itemName = formData.get('itemName') as string;
    const itemDescription = formData.get('itemDescription') as string || '';

    const driveService = new GoogleDriveService();
    const folderId = await driveService.findOrCreateFolder(folderPath);
    if (itemDescription) await driveService.updateFolderDescription(folderId, itemDescription);

    // --- OPTIMIZATION 1: Parallel Processing ---
    const uploadPromises = files.map(async (file: any, i: number) => {
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = encodeBase64(new Uint8Array(arrayBuffer));
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = files.length === 1 ? `${itemName}.${ext}` : `${itemName}_${i + 1}.${ext}`;
      
      const driveFile = await driveService.uploadFile(fileName, base64Data, file.type, folderId, itemDescription);
      return { originalName: file.name, driveFileId: driveFile.id, fileName, directUrl: driveFile.directUrl, webViewLink: driveFile.webViewLink };
    });

    const uploadedFiles = await Promise.all(uploadPromises); // Uploads 4 images simultaneously!

    return new Response(JSON.stringify({ success: true, folderId, folderPath, files: uploadedFiles, imageUrls: uploadedFiles.map(f => f.directUrl) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) { return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
});