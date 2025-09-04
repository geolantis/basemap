/**
 * Service for handling map preview image storage and caching
 * Supports both remote URLs and local storage (base64) caching
 */

interface CachedImage {
  url: string;
  data?: string; // base64 data
  timestamp: number;
  type: 'remote' | 'local' | 'generated';
}

export class ImageStorageService {
  private static CACHE_KEY = 'map_preview_cache';
  private static CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  private static MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB max for localStorage
  private static memoryCache = new Map<string, CachedImage>();

  /**
   * Get image from cache or fetch from remote
   */
  static async getImage(mapId: string, imageUrl?: string): Promise<string> {
    // Check memory cache first
    const memoryCached = this.memoryCache.get(mapId);
    if (memoryCached && this.isCacheValid(memoryCached)) {
      return memoryCached.data || memoryCached.url;
    }

    // Check localStorage cache
    const localCached = this.getFromLocalStorage(mapId);
    if (localCached && this.isCacheValid(localCached)) {
      // Update memory cache
      this.memoryCache.set(mapId, localCached);
      return localCached.data || localCached.url;
    }

    // If we have a URL, try to fetch and cache it
    if (imageUrl) {
      try {
        // For now, just return the URL directly
        // In production, you might want to fetch and convert to base64
        const cachedImage: CachedImage = {
          url: imageUrl,
          timestamp: Date.now(),
          type: 'remote'
        };
        
        // Optionally fetch and store as base64 for offline support
        if (this.shouldCacheLocally(imageUrl)) {
          const base64 = await this.fetchAndConvertToBase64(imageUrl);
          if (base64) {
            cachedImage.data = base64;
            cachedImage.type = 'local';
          }
        }

        this.saveToCache(mapId, cachedImage);
        return cachedImage.data || cachedImage.url;
      } catch (error) {
        console.error(`Failed to fetch image for ${mapId}:`, error);
      }
    }

    // Return placeholder if no image available
    return this.generatePlaceholder(mapId);
  }

  /**
   * Save image to cache (memory and localStorage)
   */
  static saveToCache(mapId: string, image: CachedImage): void {
    // Update memory cache
    this.memoryCache.set(mapId, image);

    // Update localStorage if not too large
    if (image.data && image.data.length < 500000) { // ~500KB limit per image
      this.saveToLocalStorage(mapId, image);
    }
  }

  /**
   * Check if cache entry is still valid
   */
  private static isCacheValid(cached: CachedImage): boolean {
    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  /**
   * Get cached image from localStorage
   */
  private static getFromLocalStorage(mapId: string): CachedImage | null {
    try {
      const cacheData = localStorage.getItem(this.CACHE_KEY);
      if (!cacheData) return null;

      const cache = JSON.parse(cacheData);
      return cache[mapId] || null;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return null;
    }
  }

  /**
   * Save image to localStorage
   */
  private static saveToLocalStorage(mapId: string, image: CachedImage): void {
    try {
      const cacheData = localStorage.getItem(this.CACHE_KEY) || '{}';
      const cache = JSON.parse(cacheData);
      
      // Check total size before saving
      const totalSize = JSON.stringify(cache).length;
      if (totalSize > this.MAX_CACHE_SIZE) {
        // Clean up old entries
        this.cleanupLocalStorage(cache);
      }

      cache[mapId] = image;
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      // If localStorage is full, clear the cache
      if (error.name === 'QuotaExceededError') {
        this.clearCache();
      }
    }
  }

  /**
   * Determine if image should be cached locally
   */
  private static shouldCacheLocally(imageUrl: string): boolean {
    // Cache images from our own domain
    if (imageUrl.includes('mapconfig.geolantis.com')) {
      return true;
    }
    
    // Don't cache external large images
    if (imageUrl.includes('satellite') || imageUrl.includes('ortho')) {
      return false;
    }

    // Cache other small images
    return true;
  }

  /**
   * Fetch image and convert to base64
   */
  private static async fetchAndConvertToBase64(imageUrl: string): Promise<string | null> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) return null;

      const blob = await response.blob();
      
      // Don't cache if too large
      if (blob.size > 500000) return null;

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to fetch image:', error);
      return null;
    }
  }

  /**
   * Generate a placeholder image for a map
   */
  private static generatePlaceholder(mapId: string): string {
    // Generate a color based on the map ID
    const hash = mapId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const hue = Math.abs(hash) % 360;
    const color = `hsl(${hue}, 70%, 50%)`;
    
    // Create an SVG placeholder
    const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="${color}"/>
        <text x="200" y="150" text-anchor="middle" fill="white" font-size="24" font-family="sans-serif">
          Map Preview
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Clean up old entries from localStorage
   */
  private static cleanupLocalStorage(cache: Record<string, CachedImage>): void {
    const entries = Object.entries(cache);
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 25% of entries
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      delete cache[entries[i][0]];
    }
  }

  /**
   * Clear all cached images
   */
  static clearCache(): void {
    this.memoryCache.clear();
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  /**
   * Preload images for a list of maps
   */
  static async preloadImages(maps: Array<{ id: string; preview_image_url?: string }>): Promise<void> {
    const promises = maps.map(map => {
      if (map.preview_image_url) {
        return this.getImage(map.id, map.preview_image_url);
      }
      return Promise.resolve();
    });

    await Promise.all(promises);
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    memoryCacheSize: number;
    localStorageSize: number;
    totalImages: number;
    cacheAge: number;
  } {
    const memoryCacheSize = this.memoryCache.size;
    
    let localStorageSize = 0;
    let totalImages = 0;
    let oldestCache = Date.now();
    
    try {
      const cacheData = localStorage.getItem(this.CACHE_KEY);
      if (cacheData) {
        const cache = JSON.parse(cacheData);
        totalImages = Object.keys(cache).length;
        localStorageSize = cacheData.length;
        
        Object.values(cache).forEach((item: any) => {
          if (item.timestamp < oldestCache) {
            oldestCache = item.timestamp;
          }
        });
      }
    } catch (error) {
      console.error('Failed to get cache stats:', error);
    }

    return {
      memoryCacheSize,
      localStorageSize,
      totalImages,
      cacheAge: Date.now() - oldestCache
    };
  }

  /**
   * Export cache for debugging
   */
  static exportCache(): Record<string, CachedImage> {
    const cache: Record<string, CachedImage> = {};
    
    // Add memory cache
    this.memoryCache.forEach((value, key) => {
      cache[key] = value;
    });

    // Add localStorage cache
    try {
      const cacheData = localStorage.getItem(this.CACHE_KEY);
      if (cacheData) {
        const localCache = JSON.parse(cacheData);
        Object.assign(cache, localCache);
      }
    } catch (error) {
      console.error('Failed to export cache:', error);
    }

    return cache;
  }
}

export default ImageStorageService;