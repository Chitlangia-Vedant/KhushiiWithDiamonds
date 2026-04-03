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
  extractFileIdFromUrl(url) {
    // Extract file ID from Google Drive URLs
    // Format: https://drive.google.com/thumbnail?id=FILE_ID
    // or: https://drive.google.com/file/d/FILE_ID/view
    const thumbnailMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (thumbnailMatch) {
      return thumbnailMatch[1];
    }
    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) {
      return fileMatch[1];
    }
    return null;
  }
  async deleteFile(fileId) {
    const accessToken = await this.getAccessToken();
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    if (response.ok || response.status === 404) {
      // 404 means file was already deleted or doesn't exist
      return true;
    }
    const errorText = await response.text();
    console.error(`Failed to delete file ${fileId}: ${response.status} ${response.statusText} - ${errorText}`);
    return false;
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
    const deleteRequest = await req.json();
    if (!deleteRequest.imageUrls || deleteRequest.imageUrls.length === 0) {
      return new Response(JSON.stringify({
        error: 'No image URLs provided'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`Starting deletion process for ${deleteRequest.imageUrls.length} images`);
    const driveService = new GoogleDriveService();
    const results = [];
    // Delete each file
    for (const url of deleteRequest.imageUrls){
      const fileId = driveService.extractFileIdFromUrl(url);
      if (!fileId) {
        console.warn(`Could not extract file ID from URL: ${url}`);
        results.push({
          url,
          fileId: null,
          success: false,
          error: 'Could not extract file ID from URL'
        });
        continue;
      }
      console.log(`Deleting file with ID: ${fileId}`);
      try {
        const success = await driveService.deleteFile(fileId);
        results.push({
          url,
          fileId,
          success,
          error: success ? undefined : 'Failed to delete file'
        });
        if (success) {
          console.log(`Successfully deleted file: ${fileId}`);
        } else {
          console.error(`Failed to delete file: ${fileId}`);
        }
      } catch (error) {
        console.error(`Error deleting file ${fileId}:`, error);
        results.push({
          url,
          fileId,
          success: false,
          error: error.message
        });
      }
    }
    const successCount = results.filter((r)=>r.success).length;
    const failureCount = results.length - successCount;
    console.log(`Deletion complete: ${successCount} successful, ${failureCount} failed`);
    return new Response(JSON.stringify({
      success: failureCount === 0,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Delete error:', error);
    return new Response(JSON.stringify({
      error: 'Delete failed',
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
