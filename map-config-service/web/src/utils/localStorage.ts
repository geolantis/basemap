/**
 * Local storage utilities for saving map preview data
 * This provides a reliable fallback when database updates fail
 */

interface MapPreviewData {
  previewImageUrl: string;
  center?: [number, number];
  zoom?: number;
  bearing?: number;
  pitch?: number;
  savedAt: string;
}

const PREVIEW_STORAGE_PREFIX = 'map-preview-';
const POSITION_STORAGE_PREFIX = 'map-position-';

/**
 * Save map preview image to localStorage
 */
export function savePreviewToLocalStorage(mapId: string, imageUrl: string): void {
  const key = `${PREVIEW_STORAGE_PREFIX}${mapId}`;
  const data: MapPreviewData = {
    previewImageUrl: imageUrl,
    savedAt: new Date().toISOString()
  };
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Get map preview image from localStorage
 */
export function getPreviewFromLocalStorage(mapId: string): string | null {
  const key = `${PREVIEW_STORAGE_PREFIX}${mapId}`;
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  
  try {
    const data: MapPreviewData = JSON.parse(stored);
    return data.previewImageUrl;
  } catch {
    return null;
  }
}

/**
 * Save map position to localStorage
 */
export function savePositionToLocalStorage(
  mapId: string, 
  position: {
    center: [number, number];
    zoom: number;
    bearing: number;
    pitch: number;
  }
): void {
  const key = `${POSITION_STORAGE_PREFIX}${mapId}`;
  localStorage.setItem(key, JSON.stringify({
    ...position,
    savedAt: new Date().toISOString()
  }));
}

/**
 * Get map position from localStorage
 */
export function getPositionFromLocalStorage(mapId: string): any {
  const key = `${POSITION_STORAGE_PREFIX}${mapId}`;
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Get all saved previews from localStorage
 */
export function getAllPreviewsFromLocalStorage(): Map<string, string> {
  const previews = new Map<string, string>();
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREVIEW_STORAGE_PREFIX)) {
      const mapId = key.replace(PREVIEW_STORAGE_PREFIX, '');
      const preview = getPreviewFromLocalStorage(mapId);
      if (preview) {
        previews.set(mapId, preview);
      }
    }
  }
  
  return previews;
}

/**
 * Clear old previews to manage storage space
 */
export function clearOldPreviews(daysToKeep: number = 7): void {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREVIEW_STORAGE_PREFIX)) {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const data: MapPreviewData = JSON.parse(stored);
          const savedDate = new Date(data.savedAt);
          if (savedDate < cutoffDate) {
            keysToRemove.push(key);
          }
        } catch {
          // Invalid data, remove it
          keysToRemove.push(key);
        }
      }
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
}