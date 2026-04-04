import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

class GoogleDriveService {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken: string | null = null;

  constructor() {
    this.clientId = Deno.env.get('GOOGLE_CLIENT_ID') || '';
    this.clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';
    this.refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN') || '';

    if (!this.clientSecret || !this.refreshToken) {
      throw new Error('Missing required Google Drive credentials in environment variables');
    }
  }

  async getAccessToken() {
    if (this.accessToken) return this.accessToken;

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) throw new Error('Failed to get access token');
    const data = await response.json();
    this.accessToken = data.access_token;
    return this.accessToken;
  }

  async findOrCreateFolder(folderPath: string) {
    const accessToken = await this.getAccessToken();
    const pathParts = folderPath.split('/').filter(part => part.trim());
    let currentFolderId = 'root';

    for (const folderName of pathParts) {
      const searchQuery = `name='${folderName.replace(/'/g, "\\'")}' and parents in '${currentFolderId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&fields=files(id,name)`;
      
      const searchResponse = await fetch(searchUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      const searchData = await searchResponse.json();
      
      if (searchData.files && searchData.files.length > 0) {
        currentFolderId = searchData.files[0].id;
      } else {
        const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [currentFolderId]
          })
        });
        const createData = await createResponse.json();
        currentFolderId = createData.id;
      }
    }
    return currentFolderId;
  }

  async updateFile(fileId: string, newFolderId: string, newDescription: string) {
    const accessToken = await this.getAccessToken();

    // 1. Get current parents to detach from
    const getRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=parents`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const fileData = await getRes.json();
    const previousParents = fileData.parents ? fileData.parents.join(',') : '';

    // 2. Build the Patch URL to move the file
    let patchUrl = `https://www.googleapis.com/drive/v3/files/${fileId}`;
    const queryParams = [];
    if (newFolderId) {
      queryParams.push(`addParents=${newFolderId}`);
      if (previousParents) queryParams.push(`removeParents=${previousParents}`);
    }
    if (queryParams.length > 0) {
      patchUrl += '?' + queryParams.join('&');
    }

    // 3. Update description and execute move
    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ description: newDescription })
    });

    if (!patchRes.ok) {
      const errorText = await patchRes.text();
      throw new Error(`Failed to update file: ${errorText}`);
    }
    return await patchRes.json();
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { imageUrls, folderPath, itemDescription } = await req.json();

    if (!imageUrls || !folderPath || !itemDescription) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
    }

    const driveService = new GoogleDriveService();
    const targetFolderId = await driveService.findOrCreateFolder(folderPath);

    const results = [];
    for (const url of imageUrls) {
      // Extract Drive File ID from URL
      const urlObj = new URL(url);
      const fileId = urlObj.searchParams.get('id');
      
      if (fileId) {
        await driveService.updateFile(fileId, targetFolderId, itemDescription);
        results.push({ url, success: true });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});