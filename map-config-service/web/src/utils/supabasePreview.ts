import { supabase } from '../lib/supabase';

/**
 * Get the direct URL for a preview image from Supabase storage
 */
export function getSupabasePreviewUrl(mapId: string): string {
  // Direct public URL for Supabase storage
  const { data } = supabase.storage
    .from('map-previews')
    .getPublicUrl(`${mapId}.png`);
  
  return data.publicUrl;
}

/**
 * Upload a preview image to Supabase storage
 */
export async function uploadPreviewToSupabase(
  mapId: string, 
  blob: Blob
): Promise<string | null> {
  try {
    const fileName = `${mapId}.png`;
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('map-previews')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Get the public URL
    return getSupabasePreviewUrl(mapId);
  } catch (error) {
    console.error('Failed to upload preview:', error);
    return null;
  }
}

/**
 * Check if a preview exists in Supabase storage
 */
export async function checkPreviewExists(mapId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from('map-previews')
      .list('', {
        search: mapId
      });

    if (error) {
      console.error('List error:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Check error:', error);
    return false;
  }
}