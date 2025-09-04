import { ref, computed, onMounted } from 'vue';
import { supabase } from '../lib/supabase';
import { captureMapPreview } from '../utils/mapCapture';
import type maplibregl from 'maplibre-gl';

interface UseMapPreviewOptions {
  cacheInLocalStorage?: boolean;
  fallbackToGenerated?: boolean;
  quality?: number;
}

interface PreviewCache {
  [mapId: string]: {
    url: string;
    timestamp: number;
    type: 'remote' | 'local' | 'generated';
  };
}

/**
 * Vue composable for efficient map preview handling
 * Uses multiple strategies to serve previews efficiently
 */
export function useMapPreview(options: UseMapPreviewOptions = {}) {
  const {
    cacheInLocalStorage = true,
    fallbackToGenerated = true,
    quality = 0.8
  } = options;

  const CACHE_KEY = 'map_previews_v2';
  const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Get preview URL for a map with multiple fallback strategies
  const getPreviewUrl = async (mapId: string, mapName?: string): Promise<string> => {
    // Strategy 1: Check localStorage cache first (fastest)
    if (cacheInLocalStorage) {
      const cached = getFromLocalStorage(mapId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.url;
      }
    }

    // Strategy 2: Use the API endpoint (with Vercel edge caching)
    const apiUrl = `/api/preview/${mapId}`;
    
    // Prefetch to warm the cache
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = apiUrl;
      document.head.appendChild(link);
    }

    // Strategy 3: Generate a client-side placeholder if needed
    if (fallbackToGenerated) {
      const placeholder = generatePlaceholder(mapId, mapName);
      
      // Cache the result
      if (cacheInLocalStorage) {
        saveToLocalStorage(mapId, apiUrl, 'remote');
      }
      
      // Return API URL (will load async) but show placeholder immediately
      return apiUrl;
    }

    return apiUrl;
  };

  // Batch preload multiple preview images
  const preloadPreviews = async (maps: Array<{ id: string; name?: string }>) => {
    const preloadPromises = maps.map(async (map) => {
      const url = await getPreviewUrl(map.id, map.name);
      
      // Preload the image
      if (typeof window !== 'undefined') {
        const img = new Image();
        img.src = url;
      }
      
      return url;
    });

    await Promise.all(preloadPromises);
  };

  // Generate preview from live map and update all caches
  const generateAndUpdatePreview = async (
    mapId: string,
    mapInstance: maplibregl.Map
  ): Promise<string> => {
    try {
      // Capture the current map view
      const dataUrl = await captureMapPreview(mapInstance);
      
      // Convert to blob for more efficient storage
      const blob = await dataUrlToBlob(dataUrl);
      const objectUrl = URL.createObjectURL(blob);
      
      // Update database with the new preview
      const { error } = await supabase
        .from('map_configs')
        .update({
          preview_image_url: dataUrl, // Store as base64 in DB
          updated_at: new Date().toISOString()
        })
        .eq('id', mapId);

      if (error) {
        console.error('Failed to update preview in database:', error);
      }

      // Update localStorage cache
      if (cacheInLocalStorage) {
        saveToLocalStorage(mapId, objectUrl, 'local');
      }

      // Trigger cache invalidation on the edge
      await fetch(`/api/preview/${mapId}`, {
        method: 'POST',
        headers: {
          'X-Invalidate-Cache': 'true'
        }
      }).catch(() => {});

      return objectUrl;
    } catch (error) {
      console.error('Failed to generate preview:', error);
      return generatePlaceholder(mapId);
    }
  };

  // Helper functions
  function getFromLocalStorage(mapId: string): PreviewCache[string] | null {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') as PreviewCache;
      return cache[mapId] || null;
    } catch {
      return null;
    }
  }

  function saveToLocalStorage(mapId: string, url: string, type: 'remote' | 'local' | 'generated'): void {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') as PreviewCache;
      cache[mapId] = {
        url,
        timestamp: Date.now(),
        type
      };
      
      // Cleanup old entries if cache is too large
      const cacheSize = JSON.stringify(cache).length;
      if (cacheSize > 5 * 1024 * 1024) { // 5MB limit
        const entries = Object.entries(cache);
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        // Remove oldest 25%
        const toRemove = Math.ceil(entries.length * 0.25);
        for (let i = 0; i < toRemove; i++) {
          delete cache[entries[i][0]];
        }
      }
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  function generatePlaceholder(mapId: string, mapName?: string): string {
    const hash = mapId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const hue = Math.abs(hash) % 360;
    
    const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="hsl(${hue}, 70%, 50%)"/>
        <text x="200" y="150" text-anchor="middle" fill="white" font-size="18" font-family="sans-serif">
          ${mapName || 'Map Preview'}
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl);
    return res.blob();
  }

  // Clear all cached previews
  const clearCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
      
      // Clear object URLs to free memory
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') as PreviewCache;
      Object.values(cache).forEach(item => {
        if (item.type === 'local' && item.url.startsWith('blob:')) {
          URL.revokeObjectURL(item.url);
        }
      });
    }
  };

  // Get cache statistics
  const getCacheStats = () => {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') as PreviewCache;
      const entries = Object.entries(cache);
      
      return {
        total: entries.length,
        remote: entries.filter(([_, v]) => v.type === 'remote').length,
        local: entries.filter(([_, v]) => v.type === 'local').length,
        generated: entries.filter(([_, v]) => v.type === 'generated').length,
        sizeBytes: JSON.stringify(cache).length,
        oldestTimestamp: Math.min(...entries.map(([_, v]) => v.timestamp))
      };
    } catch {
      return {
        total: 0,
        remote: 0,
        local: 0,
        generated: 0,
        sizeBytes: 0,
        oldestTimestamp: Date.now()
      };
    }
  };

  return {
    getPreviewUrl,
    preloadPreviews,
    generateAndUpdatePreview,
    clearCache,
    getCacheStats
  };
}

export default useMapPreview;