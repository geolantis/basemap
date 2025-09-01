import { useToast } from 'primevue/usetoast';
import { useAuthStore } from '../stores/auth';
import type { MapStyle, SaveResponse, SaveError } from '../types/save';

export interface SaveServiceConfig {
  baseUrl: string;
  apiVersion?: string;
  timeout?: number;
}

export class SaveService {
  private static instance: SaveService;
  private config: SaveServiceConfig;
  private authStore: any;

  private constructor(config: SaveServiceConfig) {
    this.config = {
      apiVersion: 'v1',
      timeout: 30000,
      ...config
    };
    this.authStore = useAuthStore();
  }

  public static getInstance(config?: SaveServiceConfig): SaveService {
    if (!SaveService.instance) {
      const defaultConfig = {
        baseUrl: import.meta.env.VITE_API_BASE_URL || window.location.origin
      };
      SaveService.instance = new SaveService(config || defaultConfig);
    }
    return SaveService.instance;
  }

  /**
   * Get authentication headers for API requests
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Get token from auth store or fallback to localStorage
    const token = this.authStore?.user?.token || localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Save a Mapbox GL style to the backend
   */
  async saveStyle(styleData: MapStyle, options: {
    name?: string;
    description?: string;
    category?: string;
    isPublic?: boolean;
    overwrite?: boolean;
  } = {}): Promise<SaveResponse> {
    try {
      const url = `${this.config.baseUrl}/api/${this.config.apiVersion}/styles`;
      const payload = {
        style: styleData,
        metadata: {
          name: options.name || 'Untitled Style',
          description: options.description || '',
          category: options.category || 'custom',
          isPublic: options.isPublic || false,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString()
        },
        overwrite: options.overwrite || false
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.config.timeout!)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SaveError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code || 'SAVE_ERROR'
        );
      }

      const result = await response.json();
      return {
        success: true,
        styleId: result.styleId,
        url: result.url,
        message: result.message || 'Style saved successfully',
        metadata: result.metadata
      };

    } catch (error) {
      console.error('Save error:', error);
      
      if (error instanceof SaveError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new SaveError('Request timed out. Please try again.', 408, 'TIMEOUT');
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new SaveError('Network error. Please check your connection.', 0, 'NETWORK_ERROR');
      }

      throw new SaveError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        500,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Update an existing style
   */
  async updateStyle(styleId: string, styleData: MapStyle, options: {
    name?: string;
    description?: string;
    category?: string;
    isPublic?: boolean;
  } = {}): Promise<SaveResponse> {
    try {
      const url = `${this.config.baseUrl}/api/${this.config.apiVersion}/styles/${styleId}`;
      const payload = {
        style: styleData,
        metadata: {
          ...options,
          modifiedAt: new Date().toISOString()
        }
      };

      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.config.timeout!)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SaveError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code || 'UPDATE_ERROR'
        );
      }

      const result = await response.json();
      return {
        success: true,
        styleId: result.styleId,
        url: result.url,
        message: result.message || 'Style updated successfully',
        metadata: result.metadata
      };

    } catch (error) {
      console.error('Update error:', error);
      
      if (error instanceof SaveError) {
        throw error;
      }

      throw new SaveError(
        error instanceof Error ? error.message : 'Failed to update style',
        500,
        'UPDATE_ERROR'
      );
    }
  }

  /**
   * Get list of saved styles for the current user
   */
  async getUserStyles(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    createdAt: string;
    modifiedAt: string;
    url: string;
  }>> {
    try {
      const url = `${this.config.baseUrl}/api/${this.config.apiVersion}/styles`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        signal: AbortSignal.timeout(this.config.timeout!)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SaveError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code || 'FETCH_ERROR'
        );
      }

      const result = await response.json();
      return result.styles || [];

    } catch (error) {
      console.error('Fetch styles error:', error);
      throw error instanceof SaveError ? error : new SaveError(
        'Failed to fetch user styles',
        500,
        'FETCH_ERROR'
      );
    }
  }

  /**
   * Delete a saved style
   */
  async deleteStyle(styleId: string): Promise<{ success: boolean; message: string }> {
    try {
      const url = `${this.config.baseUrl}/api/${this.config.apiVersion}/styles/${styleId}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        signal: AbortSignal.timeout(this.config.timeout!)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SaveError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code || 'DELETE_ERROR'
        );
      }

      const result = await response.json();
      return {
        success: true,
        message: result.message || 'Style deleted successfully'
      };

    } catch (error) {
      console.error('Delete error:', error);
      throw error instanceof SaveError ? error : new SaveError(
        'Failed to delete style',
        500,
        'DELETE_ERROR'
      );
    }
  }

  /**
   * Validate a Mapbox GL style before saving
   */
  async validateStyle(styleData: MapStyle): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      // Basic client-side validation
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!styleData.version) {
        errors.push('Style version is required');
      }

      if (!styleData.sources || Object.keys(styleData.sources).length === 0) {
        warnings.push('Style has no sources defined');
      }

      if (!styleData.layers || styleData.layers.length === 0) {
        warnings.push('Style has no layers defined');
      }

      // Server-side validation
      const url = `${this.config.baseUrl}/api/${this.config.apiVersion}/styles/validate`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ style: styleData }),
        signal: AbortSignal.timeout(this.config.timeout!)
      });

      if (response.ok) {
        const result = await response.json();
        errors.push(...(result.errors || []));
        warnings.push(...(result.warnings || []));
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      console.warn('Style validation failed:', error);
      // Don't throw on validation errors, just return basic client validation
      return {
        valid: !!styleData.version,
        errors: styleData.version ? [] : ['Style version is required'],
        warnings: ['Server validation unavailable']
      };
    }
  }
}

/**
 * Custom error class for save operations
 */
export class SaveError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = 'SaveError';
  }
}

/**
 * Convenience function to get the save service instance
 */
export function useSaveService(): SaveService {
  return SaveService.getInstance();
}