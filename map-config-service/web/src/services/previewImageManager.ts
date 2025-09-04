import { supabase } from '../lib/supabase';
import { uploadMapPreview, captureMapPreview } from '../utils/mapCapture';
import type maplibregl from 'maplibre-gl';

interface MapConfig {
  id: string;
  name: string;
  label: string;
  type: string;
  style?: string;
  preview_image_url?: string;
  metadata?: any;
}

interface PreviewGenerationOptions {
  forceUpdate?: boolean;
  batchSize?: number;
  onProgress?: (current: number, total: number, mapName: string) => void;
  onError?: (mapName: string, error: Error) => void;
}

/**
 * Service for managing and updating map preview images across the entire system
 */
export class PreviewImageManager {
  private static isGenerating = false;
  private static generationQueue: MapConfig[] = [];
  private static failedMaps: Map<string, number> = new Map(); // Track retry attempts

  /**
   * Update all preview images in the system
   * This is called when a new preview is captured to ensure consistency
   */
  static async updateAllPreviews(
    currentMap: maplibregl.Map,
    options: PreviewGenerationOptions = {}
  ): Promise<{
    updated: number;
    failed: number;
    skipped: number;
  }> {
    if (this.isGenerating) {
      console.log('Preview generation already in progress');
      return { updated: 0, failed: 0, skipped: 0 };
    }

    this.isGenerating = true;
    const results = { updated: 0, failed: 0, skipped: 0 };
    const { forceUpdate = false, batchSize = 5, onProgress, onError } = options;

    try {
      // Fetch all maps that need preview updates
      const { data: maps, error } = await supabase
        .from('map_configs')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      if (!maps || maps.length === 0) {
        console.log('No maps found to update');
        return results;
      }

      // Filter maps that need updates
      const mapsToUpdate = forceUpdate 
        ? maps 
        : maps.filter(map => !map.preview_image_url || this.isPreviewStale(map));

      if (mapsToUpdate.length === 0) {
        console.log('All maps have up-to-date previews');
        results.skipped = maps.length;
        return results;
      }

      console.log(`Starting preview update for ${mapsToUpdate.length} maps`);
      this.generationQueue = [...mapsToUpdate];

      // Process maps in batches
      while (this.generationQueue.length > 0) {
        const batch = this.generationQueue.splice(0, batchSize);
        const batchPromises = batch.map(async (map) => {
          try {
            // Check if this map has failed too many times
            const retryCount = this.failedMaps.get(map.id) || 0;
            if (retryCount >= 3) {
              console.log(`Skipping ${map.label} - too many failed attempts`);
              results.skipped++;
              return;
            }

            if (onProgress) {
              const current = mapsToUpdate.length - this.generationQueue.length;
              onProgress(current, mapsToUpdate.length, map.label);
            }

            // Generate preview for this map
            const previewUrl = await this.generatePreviewForMap(currentMap, map);
            
            if (previewUrl) {
              // Update database with new preview URL
              const { error: updateError } = await supabase
                .from('map_configs')
                .update({
                  preview_image_url: previewUrl,
                  updated_at: new Date().toISOString()
                })
                .eq('id', map.id);

              if (updateError) {
                throw updateError;
              }

              console.log(`✅ Updated preview for: ${map.label}`);
              results.updated++;
              
              // Clear any failed attempts
              this.failedMaps.delete(map.id);
            } else {
              throw new Error('Failed to generate preview');
            }
          } catch (error) {
            console.error(`❌ Failed to update preview for ${map.label}:`, error);
            results.failed++;
            
            // Track failed attempt
            const retryCount = this.failedMaps.get(map.id) || 0;
            this.failedMaps.set(map.id, retryCount + 1);
            
            if (onError) {
              onError(map.label, error as Error);
            }
          }
        });

        // Wait for batch to complete
        await Promise.all(batchPromises);

        // Add a small delay between batches to avoid overwhelming the system
        if (this.generationQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Invalidate client-side caches
      await this.invalidateClientCaches();

    } catch (error) {
      console.error('Error updating previews:', error);
    } finally {
      this.isGenerating = false;
    }

    console.log(`\nPreview update complete:
      ✅ Updated: ${results.updated}
      ❌ Failed: ${results.failed}
      ⏭️ Skipped: ${results.skipped}
    `);

    return results;
  }

  /**
   * Generate a preview image for a specific map configuration
   */
  private static async generatePreviewForMap(
    mapInstance: maplibregl.Map,
    mapConfig: MapConfig
  ): Promise<string | null> {
    try {
      // Save current map state
      const currentStyle = mapInstance.getStyle();
      const currentCenter = mapInstance.getCenter();
      const currentZoom = mapInstance.getZoom();
      const currentBearing = mapInstance.getBearing();
      const currentPitch = mapInstance.getPitch();

      // Apply the map configuration
      await this.applyMapConfig(mapInstance, mapConfig);

      // Wait for map to load
      await this.waitForMapLoad(mapInstance);

      // Capture the preview
      const imageDataUrl = await captureMapPreview(mapInstance);
      
      // Upload to storage
      const uploadedUrl = await uploadMapPreview(mapConfig.id, imageDataUrl);

      // Restore original map state
      mapInstance.setStyle(currentStyle);
      mapInstance.jumpTo({
        center: currentCenter,
        zoom: currentZoom,
        bearing: currentBearing,
        pitch: currentPitch
      });

      return uploadedUrl;
    } catch (error) {
      console.error(`Failed to generate preview for ${mapConfig.label}:`, error);
      return null;
    }
  }

  /**
   * Apply a map configuration to the map instance
   */
  private static async applyMapConfig(
    map: maplibregl.Map,
    mapConfig: MapConfig
  ): Promise<void> {
    // Handle different map types
    if (mapConfig.type === 'vtc' && mapConfig.style) {
      // Vector tile map with style
      map.setStyle(mapConfig.style);
    } else if (mapConfig.type === 'wms' && mapConfig.metadata?.url) {
      // WMS layer
      const source = {
        type: 'raster' as const,
        tiles: [
          `${mapConfig.metadata.url}?` +
          `SERVICE=WMS&VERSION=${mapConfig.metadata.version || '1.3.0'}` +
          `&REQUEST=GetMap&FORMAT=${mapConfig.metadata.format || 'image/png'}` +
          `&TRANSPARENT=${mapConfig.metadata.transparent !== false}` +
          `&LAYERS=${mapConfig.metadata.layers?.join(',')}` +
          `&WIDTH=256&HEIGHT=256` +
          `&CRS=EPSG:3857` +
          `&BBOX={bbox-epsg-3857}`
        ],
        tileSize: 256
      };

      // Create a basic style with the WMS layer
      map.setStyle({
        version: 8,
        sources: {
          'wms-source': source
        },
        layers: [
          {
            id: 'wms-layer',
            type: 'raster',
            source: 'wms-source',
            paint: {
              'raster-opacity': mapConfig.metadata?.isOverlay ? 0.7 : 1
            }
          }
        ]
      });
    }

    // Set appropriate view for the map
    this.setOptimalView(map, mapConfig);
  }

  /**
   * Set optimal view for preview capture based on map configuration
   */
  private static setOptimalView(map: maplibregl.Map, mapConfig: MapConfig): void {
    // Default views based on country/region
    const countryViews: Record<string, any> = {
      'Austria': { center: [13.3, 47.5], zoom: 7 },
      'Global': { center: [0, 20], zoom: 2 },
      'Europe': { center: [10, 50], zoom: 4 },
      'Germany': { center: [10.5, 51.2], zoom: 6 },
      'Switzerland': { center: [8.2, 46.8], zoom: 7.5 },
      'Italy': { center: [12.5, 42.5], zoom: 5.5 },
      'France': { center: [2.3, 46.6], zoom: 5.5 },
      'USA': { center: [-98, 38], zoom: 4 },
      'Canada': { center: [-95, 60], zoom: 3 },
      'Australia': { center: [133, -27], zoom: 4 },
      'New Zealand': { center: [172, -42], zoom: 5 }
    };

    const view = countryViews[mapConfig.country || 'Global'] || countryViews['Global'];
    
    map.jumpTo({
      center: view.center,
      zoom: view.zoom,
      bearing: 0,
      pitch: 0
    });
  }

  /**
   * Wait for map to finish loading
   */
  private static waitForMapLoad(map: maplibregl.Map): Promise<void> {
    return new Promise((resolve) => {
      if (map.loaded() && !map.isStyleLoading()) {
        // Add extra delay for tiles to load
        setTimeout(resolve, 2000);
      } else {
        const checkLoaded = () => {
          if (map.loaded() && !map.isStyleLoading()) {
            map.off('load', checkLoaded);
            map.off('styledata', checkLoaded);
            // Add extra delay for tiles to load
            setTimeout(resolve, 2000);
          }
        };
        
        map.on('load', checkLoaded);
        map.on('styledata', checkLoaded);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          map.off('load', checkLoaded);
          map.off('styledata', checkLoaded);
          resolve();
        }, 10000);
      }
    });
  }

  /**
   * Check if a preview image is stale and needs updating
   */
  private static isPreviewStale(map: MapConfig): boolean {
    if (!map.preview_image_url) return true;
    
    // Consider preview stale if it's a placeholder
    if (map.preview_image_url.includes('placeholder')) return true;
    if (map.preview_image_url.includes('via.placeholder')) return true;
    
    // Could add more logic here based on last updated timestamp
    return false;
  }

  /**
   * Invalidate client-side caches to ensure fresh previews are loaded
   */
  private static async invalidateClientCaches(): Promise<void> {
    try {
      // Send cache invalidation signal to all connected clients
      // This could be done via WebSocket, Server-Sent Events, or polling
      
      // For now, just clear localStorage cache on next client load
      if (typeof window !== 'undefined' && window.localStorage) {
        const cacheKey = 'map_preview_cache';
        const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
        
        // Mark all entries as expired
        Object.keys(cache).forEach(key => {
          if (cache[key]) {
            cache[key].timestamp = 0; // Force expiration
          }
        });
        
        localStorage.setItem(cacheKey, JSON.stringify(cache));
      }
    } catch (error) {
      console.error('Failed to invalidate client caches:', error);
    }
  }

  /**
   * Get generation status
   */
  static getStatus(): {
    isGenerating: boolean;
    queueLength: number;
    failedCount: number;
  } {
    return {
      isGenerating: this.isGenerating,
      queueLength: this.generationQueue.length,
      failedCount: this.failedMaps.size
    };
  }

  /**
   * Cancel ongoing generation
   */
  static cancelGeneration(): void {
    this.generationQueue = [];
    this.isGenerating = false;
    console.log('Preview generation cancelled');
  }

  /**
   * Clear failed maps to retry them
   */
  static clearFailedMaps(): void {
    this.failedMaps.clear();
    console.log('Cleared failed maps list');
  }

  /**
   * Schedule automatic preview updates
   */
  static scheduleAutomaticUpdates(mapInstance: maplibregl.Map, intervalHours: number = 24): void {
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    setInterval(async () => {
      console.log('Starting scheduled preview update...');
      await this.updateAllPreviews(mapInstance, {
        forceUpdate: false,
        batchSize: 3,
        onProgress: (current, total, mapName) => {
          console.log(`Updating previews: ${current}/${total} - ${mapName}`);
        }
      });
    }, intervalMs);
    
    console.log(`Scheduled automatic preview updates every ${intervalHours} hours`);
  }
}

export default PreviewImageManager;