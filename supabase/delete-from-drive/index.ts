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

  extractFileIdFromUrl(url: string) {
    const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/) || url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  async getFileParents(fileId: string): Promise<string[]> {
    const accessToken = await this.getAccessToken();
    const res = await fetchWithRetry(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=parents`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    return res.ok ? (await res.json()).parents || [] : [];
  }

  async isFolderEmpty(folderId: string) {
    const accessToken = await this.getAccessToken();
    const res = await fetchWithRetry(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`'${folderId}' in parents and trashed=false`)}&pageSize=1`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    return res.ok && (await res.json()).files?.length === 0;
  }

  async deleteFile(fileId: string) {
    const accessToken = await this.getAccessToken();
    await fetchWithRetry(`https://www.googleapis.com/drive/v3/files/${fileId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const deleteReq = await req.json();
    const driveService = new GoogleDriveService();
    const parentFoldersToCheck = new Set<string>(); 

    let results: any[] = [];

    // --- OPTIMIZATION 1: Parallel Processing Deletes ---
    if (deleteReq.imageUrls) {
      const deletePromises = deleteReq.imageUrls.map(async (url: string) => {
        try {
          const fileId = driveService.extractFileIdFromUrl(url);
          if (!fileId) return { url, success: false };
          
          const parents = await driveService.getFileParents(fileId);
          parents.forEach(p => parentFoldersToCheck.add(p));
          await driveService.deleteFile(fileId);
          return { url, fileId, success: true };
        } catch (e: any) { return { url, success: false, error: e.message }; }
      });
      results = await Promise.all(deletePromises); // Deletes all images concurrently!

      for (const folderId of parentFoldersToCheck) {
        if (await driveService.isFolderEmpty(folderId)) await driveService.deleteFile(folderId);
      }
    }

    if (deleteReq.folderPaths) {
      for (const folderPath of deleteReq.folderPaths) {
        const folderId = await driveService.getCachedFolderId(folderPath); // Uses Fast Cache lookup!
        if (folderId) await driveService.deleteFile(folderId);
      }
    }

    return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) { return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
});