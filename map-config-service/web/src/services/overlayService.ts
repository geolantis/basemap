import { supabase } from '../lib/supabase';

export interface OverlayMap {
  id: string;
  name: string;
  label: string;
  type: 'vtc' | 'wms' | 'wmts';
  style?: string;
  country: string;
  flag: string;
  preview_image_url?: string;
  metadata: {
    isOverlay: boolean;
    overlayType: 'cadastral' | 'symbols' | 'zoning' | 'hazard' | 'wms';
    tileset?: string;
    extra_sprite?: string;
    selectLayer?: string;
    url?: string;
    layers?: string[];
    format?: string;
    transparent?: boolean;
    version?: string;
  };
  is_active?: boolean;
  opacity?: number;
}

/**
 * Service for managing overlay maps
 */
export class OverlayService {
  /**
   * Fetch all active overlay maps
   */
  static async getOverlayMaps(): Promise<OverlayMap[]> {
    try {
      const { data, error } = await supabase
        .from('map_configs')
        .select('*')
        .not('metadata->isOverlay', 'is', null)
        .eq('is_active', true)
        .order('country', { ascending: true })
        .order('label', { ascending: true });

      if (error) {
        throw error;
      }

      return data as OverlayMap[];
    } catch (error) {
      console.error('Error fetching overlay maps:', error);
      return [];
    }
  }

  /**
   * Fetch overlay maps by country
   */
  static async getOverlayMapsByCountry(country: string): Promise<OverlayMap[]> {
    try {
      const { data, error } = await supabase
        .from('map_configs')
        .select('*')
        .not('metadata->isOverlay', 'is', null)
        .eq('country', country)
        .eq('is_active', true)
        .order('label', { ascending: true });

      if (error) {
        throw error;
      }

      return data as OverlayMap[];
    } catch (error) {
      console.error('Error fetching overlay maps by country:', error);
      return [];
    }
  }

  /**
   * Fetch overlay maps by type
   */
  static async getOverlayMapsByType(overlayType: string): Promise<OverlayMap[]> {
    try {
      const { data, error } = await supabase
        .from('map_configs')
        .select('*')
        .eq('metadata->overlayType', overlayType)
        .eq('is_active', true)
        .order('country', { ascending: true })
        .order('label', { ascending: true });

      if (error) {
        throw error;
      }

      return data as OverlayMap[];
    } catch (error) {
      console.error('Error fetching overlay maps by type:', error);
      return [];
    }
  }

  /**
   * Get preview image URL for an overlay map
   * Falls back to placeholder if no preview is available
   */
  static getPreviewImageUrl(overlay: OverlayMap): string {
    if (overlay.preview_image_url) {
      return overlay.preview_image_url;
    }

    // Generate placeholder based on overlay type
    const overlayTypeColors: Record<string, string> = {
      cadastral: 'e74c3c', // red
      symbols: '3498db',   // blue
      zoning: '2ecc71',    // green
      hazard: 'f39c12',    // orange
      wms: '9b59b6'        // purple
    };

    const color = overlayTypeColors[overlay.metadata.overlayType] || '95a5a6';
    const text = encodeURIComponent(overlay.label);
    
    // Use placeholder service
    return `https://via.placeholder.com/400x300/${color}/ffffff?text=${text}`;
  }

  /**
   * Update overlay opacity
   */
  static async updateOverlayOpacity(overlayId: string, opacity: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('map_configs')
        .update({ 
          'metadata': {
            opacity: Math.max(0, Math.min(1, opacity))
          }
        })
        .eq('id', overlayId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error updating overlay opacity:', error);
      return false;
    }
  }

  /**
   * Toggle overlay visibility
   */
  static async toggleOverlayVisibility(overlayId: string, isVisible: boolean): Promise<boolean> {
    try {
      // Store visibility state in localStorage for persistence
      const visibilityState = JSON.parse(
        localStorage.getItem('overlayVisibility') || '{}'
      );
      
      visibilityState[overlayId] = isVisible;
      localStorage.setItem('overlayVisibility', JSON.stringify(visibilityState));
      
      return true;
    } catch (error) {
      console.error('Error toggling overlay visibility:', error);
      return false;
    }
  }

  /**
   * Get overlay visibility state
   */
  static getOverlayVisibility(overlayId: string): boolean {
    try {
      const visibilityState = JSON.parse(
        localStorage.getItem('overlayVisibility') || '{}'
      );
      return visibilityState[overlayId] !== false; // Default to visible
    } catch (error) {
      console.error('Error getting overlay visibility:', error);
      return true; // Default to visible on error
    }
  }

  /**
   * Get all visible overlays
   */
  static getVisibleOverlays(overlays: OverlayMap[]): OverlayMap[] {
    return overlays.filter(overlay => 
      this.getOverlayVisibility(overlay.id)
    );
  }

  /**
   * Save overlay configuration to localStorage
   */
  static saveOverlayConfig(config: {
    activeOverlays: string[];
    overlayOpacities: Record<string, number>;
  }): void {
    localStorage.setItem('overlayConfig', JSON.stringify(config));
  }

  /**
   * Load overlay configuration from localStorage
   */
  static loadOverlayConfig(): {
    activeOverlays: string[];
    overlayOpacities: Record<string, number>;
  } | null {
    try {
      const config = localStorage.getItem('overlayConfig');
      return config ? JSON.parse(config) : null;
    } catch (error) {
      console.error('Error loading overlay config:', error);
      return null;
    }
  }

  /**
   * Generate preview images for overlays that don't have them
   * This would typically be called during map capture process
   */
  static async generateMissingPreviews(overlays: OverlayMap[]): Promise<void> {
    const overlaysWithoutPreviews = overlays.filter(o => !o.preview_image_url);
    
    if (overlaysWithoutPreviews.length > 0) {
      console.log(`Found ${overlaysWithoutPreviews.length} overlays without preview images`);
      // Preview generation would happen through the map capture utility
      // when the overlay is loaded on the map
    }
  }

  /**
   * Build MapLibre source configuration for an overlay
   */
  static buildOverlaySource(overlay: OverlayMap): any {
    if (overlay.type === 'wms') {
      return {
        type: 'raster',
        tiles: [
          `${overlay.metadata.url}?` +
          `SERVICE=WMS&VERSION=${overlay.metadata.version || '1.3.0'}` +
          `&REQUEST=GetMap&FORMAT=${overlay.metadata.format || 'image/png'}` +
          `&TRANSPARENT=${overlay.metadata.transparent !== false}` +
          `&LAYERS=${overlay.metadata.layers?.join(',')}` +
          `&WIDTH=256&HEIGHT=256` +
          `&CRS=EPSG:3857` +
          `&STYLES=` +
          `&BBOX={bbox-epsg-3857}`
        ],
        tileSize: 256
      };
    }
    
    // For VTC overlays, the source is typically defined in the style
    return null;
  }

  /**
   * Build MapLibre layer configuration for an overlay
   */
  static buildOverlayLayer(overlay: OverlayMap, sourceId: string): any {
    if (overlay.type === 'wms') {
      return {
        id: `overlay-${overlay.id}`,
        type: 'raster',
        source: sourceId,
        paint: {
          'raster-opacity': overlay.opacity || 0.7
        }
      };
    }
    
    // VTC layers are defined in the style
    return null;
  }
}

export default OverlayService;