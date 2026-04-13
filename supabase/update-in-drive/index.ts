import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 4): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(url, options);
    
    // 403 User Rate Limit Exceeded or 429 Too Many Requests
    if (res.ok || (res.status !== 403 && res.status !== 429 && res.status < 500)) {
      return res;
    }
    
    if (i === maxRetries - 1) return res; // Give up on the last try
    
    // Exponential backoff: Wait 1s, then 2s, then 4s, plus random jitter
    const waitTime = Math.pow(2, i) * 1000 + Math.random() * 500;
    console.log(`Google API Rate Limit hit (${res.status}). Retrying in ${Math.round(waitTime)}ms...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  throw new Error('Unreachable');
}

class GoogleDriveService {
  clientId = Deno.env.get('GOOGLE_CLIENT_ID') || '';
  clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';
  refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN') || '';
  accessToken: string | null = null;
  supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  async getAccessToken() {
    if (this.accessToken) return this.accessToken;
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: this.clientId, client_secret: this.clientSecret, refresh_token: this.refreshToken, grant_type: 'refresh_token' })
    });
    this.accessToken = (await res.json()).access_token;
    return this.accessToken;
  }

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
    const res = await fetchWithRetry(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,trashed`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    if (!res.ok) return false;
    return !(await res.json()).trashed;
  }

  async findOrCreateFolder(folderPath: string) {
    const cachedId = await this.getCachedFolderId(folderPath);
    if (cachedId && await this.verifyFolderExists(cachedId)) return cachedId;

    const accessToken = await this.getAccessToken();
    const pathParts = folderPath.split('/').filter(part => part.trim());
    let currentFolderId = 'root';
    let currentPath = '';

    for (const folderName of pathParts) {
      currentPath += currentPath ? `/${folderName}` : folderName;
      const searchQuery = `name='${folderName.replace(/'/g, "\\'")}' and parents in '${currentFolderId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const searchRes = await fetchWithRetry(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&fields=files(id)`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
      const searchData = await searchRes.json();
      
      if (searchData.files && searchData.files.length > 0) { currentFolderId = searchData.files[0].id; } 
      else {
        const createRes = await fetchWithRetry('https://www.googleapis.com/drive/v3/files', {
          method: 'POST', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [currentFolderId] })
        });
        currentFolderId = (await createRes.json()).id;
        await this.setCachedFolderId(currentPath, currentFolderId);
      }
    }
    return currentFolderId;
  }

  async getFolderIdByPath(folderPath: string) {
    const cachedId = await this.getCachedFolderId(folderPath);
    if (cachedId && await this.verifyFolderExists(cachedId)) return cachedId;
    return null; // Rely on cache for fast lookups
  }

  async renameAndMoveFolder(folderId: string, newParentId: string, newName: string) {
    const accessToken = await this.getAccessToken();
    const getRes = await fetchWithRetry(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=parents`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const currentParents: string[] = (await getRes.json()).parents || [];

    let patchUrl = `https://www.googleapis.com/drive/v3/files/${folderId}`;
    const queryParams = [];
    if (newParentId && !currentParents.includes(newParentId)) queryParams.push(`addParents=${newParentId}`);
    const parentsToRemove = currentParents.filter(id => id !== newParentId).join(',');
    if (parentsToRemove) queryParams.push(`removeParents=${parentsToRemove}`);
    if (queryParams.length > 0) patchUrl += '?' + queryParams.join('&');

    await fetchWithRetry(patchUrl, { method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName }) });
  }

  async isFolderEmpty(folderId: string) {
    const accessToken = await this.getAccessToken();
    const response = await fetchWithRetry(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`'${folderId}' in parents and trashed=false`)}&pageSize=1`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const data = await response.json();
    return data.files && data.files.length === 0;
  }

  async deleteFolder(folderId: string) {
    const accessToken = await this.getAccessToken();
    await fetchWithRetry(`https://www.googleapis.com/drive/v3/files/${folderId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } });
  }

  async updateFolderDescription(folderId: string, description: string) {
    const accessToken = await this.getAccessToken();
    await fetchWithRetry(`https://www.googleapis.com/drive/v3/files/${folderId}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ description }) });
  }

  async updateFile(fileId: string, newFolderId: string, newDescription: string, newBaseName?: string, index?: number, totalFiles?: number) {
    const accessToken = await this.getAccessToken();
    const getRes = await fetchWithRetry(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=parents,name,fileExtension`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    const fileData = await getRes.json();
    const currentParents: string[] = fileData.parents || [];
    
    let patchUrl = `https://www.googleapis.com/drive/v3/files/${fileId}`;
    const queryParams = [];
    if (newFolderId && !currentParents.includes(newFolderId)) queryParams.push(`addParents=${newFolderId}`);
    const parentsToRemove = currentParents.filter(id => id !== newFolderId).join(',');
    if (parentsToRemove) queryParams.push(`removeParents=${parentsToRemove}`);
    if (queryParams.length > 0) patchUrl += '?' + queryParams.join('&');

    const updateBody: any = { description: newDescription };
    if (newBaseName && index !== undefined && totalFiles !== undefined) {
       const ext = fileData.fileExtension || (fileData.name || '').split('.').pop() || 'jpg';
       updateBody.name = totalFiles === 1 ? `${newBaseName}.${ext}` : `${newBaseName}_${index + 1}.${ext}`;
    }
    await fetchWithRetry(patchUrl, { method: 'PATCH', headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(updateBody) });
    return currentParents.filter(id => id !== newFolderId);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const reqData = await req.json();
    const driveService = new GoogleDriveService();

    if (reqData.action === 'move_folder') {
      const folderIdToMove = await driveService.getFolderIdByPath(reqData.oldFolderPath);
      if (folderIdToMove) {
        const pathParts = reqData.newFolderPath.split('/').filter((p: string) => p.trim());
        const newName = pathParts.pop();
        const newParentId = await driveService.findOrCreateFolder(pathParts.join('/'));
        await driveService.renameAndMoveFolder(folderIdToMove, newParentId, newName);
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { imageUrls, folderPath, itemDescription, itemName } = reqData;
    const targetFolderId = await driveService.findOrCreateFolder(folderPath);
    await driveService.updateFolderDescription(targetFolderId, itemDescription);

    const oldFoldersToCheck = new Set<string>(); 

    // --- OPTIMIZATION 1: Parallel Processing Updates ---
    const updatePromises = imageUrls.map(async (url: string, i: number) => {
      try {
        const fileId = new URL(url).searchParams.get('id');
        if (fileId) {
          const oldParents = await driveService.updateFile(fileId, targetFolderId, itemDescription, itemName, i, imageUrls.length);
          oldParents.forEach(p => oldFoldersToCheck.add(p));
          return { url, success: true };
        }
        return { url, success: false };
      } catch (e: any) { return { url, success: false, error: e.message }; }
    });

    const results = await Promise.all(updatePromises);

    for (const folderId of oldFoldersToCheck) {
      if (await driveService.isFolderEmpty(folderId)) await driveService.deleteFolder(folderId);
    }
    return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) { return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
});