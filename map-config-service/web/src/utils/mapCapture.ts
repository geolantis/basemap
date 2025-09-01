import maplibregl from 'maplibre-gl';
import { supabase } from '../lib/supabase';

/**
 * Captures the current map view as a PNG image
 * @param map - The MapLibre GL map instance
 * @returns Base64 encoded PNG image
 */
export async function captureMapPreview(map: maplibregl.Map): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Wait for the map to be fully loaded
      if (!map.loaded()) {
        map.once('load', () => {
          captureImage();
        });
      } else {
        captureImage();
      }

      function captureImage() {
        // Get the map canvas
        const canvas = map.getCanvas();
        
        // Convert to base64
        const dataUrl = canvas.toDataURL('image/png', 0.8); // 0.8 quality for smaller file size
        resolve(dataUrl);
      }
    } catch (error) {
      console.error('Failed to capture map preview:', error);
      reject(error);
    }
  });
}

/**
 * Uploads a map preview image to Supabase Storage
 * @param mapId - The ID of the map config
 * @param imageDataUrl - Base64 encoded image data URL
 * @returns The public URL of the uploaded image
 */
export async function uploadMapPreview(mapId: string, imageDataUrl: string): Promise<string | null> {
  try {
    // Convert base64 to blob
    const base64Data = imageDataUrl.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    
    // Generate filename with timestamp
    const filename = `${mapId}_${Date.now()}.png`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('map-previews')
      .upload(filename, blob, {
        contentType: 'image/png',
        upsert: true // Replace if exists
      });
    
    if (error) {
      console.error('Failed to upload preview image:', error);
      return null;
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('map-previews')
      .getPublicUrl(filename);
    
    return publicUrl;
  } catch (error) {
    console.error('Failed to upload map preview:', error);
    return null;
  }
}

/**
 * Deletes a map preview image from Supabase Storage
 * @param imageUrl - The URL of the image to delete
 */
export async function deleteMapPreview(imageUrl: string): Promise<boolean> {
  try {
    // Extract filename from URL
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    if (!filename) {
      return false;
    }
    
    const { error } = await supabase.storage
      .from('map-previews')
      .remove([filename]);
    
    if (error) {
      console.error('Failed to delete preview image:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete map preview:', error);
    return false;
  }
}

/**
 * Generates a thumbnail from a larger image
 * @param imageDataUrl - Base64 encoded image data URL
 * @param maxWidth - Maximum width for the thumbnail
 * @param maxHeight - Maximum height for the thumbnail
 * @returns Base64 encoded thumbnail image
 */
export async function generateThumbnail(
  imageDataUrl: string, 
  maxWidth: number = 400, 
  maxHeight: number = 300
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
      }
      
      // Create canvas for thumbnail
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve(thumbnailDataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageDataUrl;
  });
}