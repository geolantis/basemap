import { isSupabaseConfigured } from '../lib/supabase';
import type { MapConfig } from '../types';
import { allMapsConfig } from '../data/allMapsConfig';
import { convertMapConfigToArray } from '../utils/convertMaps';

// Service layer for map configurations
// Falls back to static data if Supabase is not configured

export class MapConfigService {
  private static instance: MapConfigService;
  private useSupabase: boolean;

  private constructor() {
    this.useSupabase = isSupabaseConfigured();
  }

  public static getInstance(): MapConfigService {
    if (!MapConfigService.instance) {
      MapConfigService.instance = new MapConfigService();
    }
    return MapConfigService.instance;
  }

  // Helper function to transform database record to frontend format
  private transformDbToFrontend(item: any): MapConfig {
    return {
      id: item.id,
      name: item.name,
      label: item.label,
      type: item.type,
      style: item.style,
      originalStyle: item.original_style,
      country: item.country,
      flag: item.flag,
      layers: item.layers || [],
      metadata: item.metadata || {},
      version: item.version,
      isActive: item.is_active,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      createdBy: item.created_by,
      previewImageUrl: item.preview_image_url,
      center: item.center,
      zoom: item.zoom,
      bearing: item.bearing,
      pitch: item.pitch,
      map_category: item.map_category // Include map_category field
    };
  }

  // Get all map configurations
  async getAll(): Promise<MapConfig[]> {
    if (!this.useSupabase) {
      console.log('Using static data - Supabase not configured');
      // Fallback to static data
      return convertMapConfigToArray(allMapsConfig);
    }

    try {
      console.log('Fetching from Supabase...');
      // Dynamically import supabase only when needed
      const { supabase } = await import('../lib/supabase');
      
      if (!supabase) {
        console.log('Supabase client is null, falling back to static data');
        return convertMapConfigToArray(allMapsConfig);
      }
      
      const { data, error } = await supabase
        .from('map_configs')
        .select('*')
        .eq('is_active', true)
        .order('country', { ascending: true })
        .order('label', { ascending: true });

      if (error) throw error;
      
      console.log(`Fetched ${data?.length || 0} configs from Supabase`);
      
      // If database is empty, fall back to static data
      if (!data || data.length === 0) {
        console.log('Database empty, using static data as fallback');
        return convertMapConfigToArray(allMapsConfig);
      }
      
      // Transform database fields to match frontend expectations
      const transformedData = data.map((item: any) => this.transformDbToFrontend(item));
      
      console.log('First transformed config:', transformedData[0]);
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching configs from Supabase:', error);
      // Fallback to static data on error
      return convertMapConfigToArray(allMapsConfig);
    }
  }

  // Get a single configuration by ID
  async getById(id: string): Promise<MapConfig | null> {
    if (!this.useSupabase) {
      const configs = convertMapConfigToArray(allMapsConfig);
      return configs.find(c => c.id === id) || null;
    }

    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('map_configs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Transform the response to camelCase
      if (data) {
        return this.transformDbToFrontend(data);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching config by ID:', error);
      return null;
    }
  }

  // Create a new configuration
  async create(config: Omit<MapConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<MapConfig | null> {
    if (!this.useSupabase) {
      throw new Error('Supabase is not configured. Cannot create configurations in demo mode.');
    }

    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('map_configs')
        .insert({
          ...config,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      return data ? this.transformDbToFrontend(data) : null;
    } catch (error) {
      console.error('Error creating config:', error);
      throw error;
    }
  }

  // Update an existing configuration
  async update(id: string, updates: Partial<MapConfig>): Promise<MapConfig | null> {
    if (!this.useSupabase) {
      // In demo mode, save to localStorage only
      console.log('Demo mode: Saving to localStorage only');
      const configs = convertMapConfigToArray(allMapsConfig);
      const config = configs.find(c => c.id === id);
      if (config) {
        const updatedConfig = { ...config, ...updates, updatedAt: new Date().toISOString() };
        localStorage.setItem(`map-config-${id}`, JSON.stringify(updatedConfig));
        return updatedConfig;
      }
      return null;
    }

    try {
      const { supabase } = await import('../lib/supabase');
      
      if (!supabase) {
        console.log('Supabase client is null, saving to localStorage');
        const configs = convertMapConfigToArray(allMapsConfig);
        const config = configs.find(c => c.id === id);
        if (config) {
          const updatedConfig = { ...config, ...updates, updatedAt: new Date().toISOString() };
          localStorage.setItem(`map-config-${id}`, JSON.stringify(updatedConfig));
          return updatedConfig;
        }
        return null;
      }
      
      // Transform camelCase to snake_case for database fields
      const dbUpdates: any = {
        updated_at: new Date().toISOString()
      };
      
      // Map frontend field names to database field names
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.label !== undefined) dbUpdates.label = updates.label;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.style !== undefined) dbUpdates.style = updates.style;
      if (updates.originalStyle !== undefined) dbUpdates.original_style = updates.originalStyle;
      if (updates.country !== undefined) dbUpdates.country = updates.country;
      if (updates.flag !== undefined) dbUpdates.flag = updates.flag;
      if (updates.layers !== undefined) dbUpdates.layers = updates.layers;
      if (updates.metadata !== undefined) dbUpdates.metadata = updates.metadata;
      if (updates.version !== undefined) dbUpdates.version = updates.version;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.previewImageUrl !== undefined) dbUpdates.preview_image_url = updates.previewImageUrl;
      if (updates.center !== undefined) dbUpdates.center = updates.center;
      if (updates.zoom !== undefined) dbUpdates.zoom = updates.zoom;
      if (updates.bearing !== undefined) dbUpdates.bearing = updates.bearing;
      if (updates.pitch !== undefined) dbUpdates.pitch = updates.pitch;
      if (updates.map_category !== undefined) dbUpdates.map_category = updates.map_category;
      
      const { data, error } = await supabase
        .from('map_configs')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Transform the response back to camelCase
      if (data) {
        return this.transformDbToFrontend(data);
      }
      
      return null;
    } catch (error) {
      console.error('Error updating config in database:', error);
      // Fallback to localStorage
      const configs = await this.getAll();
      const config = configs.find(c => c.id === id);
      if (config) {
        const updatedConfig = { ...config, ...updates, updatedAt: new Date().toISOString() };
        localStorage.setItem(`map-config-${id}`, JSON.stringify(updatedConfig));
        console.log('Saved to localStorage as fallback');
        return updatedConfig;
      }
      throw error;
    }
  }

  // Delete a configuration (soft delete by setting is_active to false)
  async delete(id: string): Promise<boolean> {
    if (!this.useSupabase) {
      throw new Error('Supabase is not configured. Cannot delete configurations in demo mode.');
    }

    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase
        .from('map_configs')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting config:', error);
      return false;
    }
  }

  // Duplicate a configuration
  async duplicate(sourceId: string, newConfig: Partial<MapConfig>): Promise<MapConfig | null> {
    if (!this.useSupabase) {
      throw new Error('Supabase is not configured. Cannot duplicate configurations in demo mode.');
    }

    try {
      // First get the source configuration
      const source = await this.getById(sourceId);
      if (!source) {
        throw new Error('Source configuration not found');
      }

      // Create new configuration based on source
      const { id, createdAt, updatedAt, ...sourceData } = source;
      
      const duplicated = await this.create({
        ...sourceData,
        ...newConfig,
        name: newConfig.name || `${source.name}_copy`,
        label: newConfig.label || `${source.label} (Copy)`
      });

      return duplicated;
    } catch (error) {
      console.error('Error duplicating config:', error);
      throw error;
    }
  }

  // Search configurations
  async search(query: string): Promise<MapConfig[]> {
    if (!this.useSupabase) {
      const configs = convertMapConfigToArray(allMapsConfig);
      const lowerQuery = query.toLowerCase();
      return configs.filter(c => 
        c.name.toLowerCase().includes(lowerQuery) ||
        c.label.toLowerCase().includes(lowerQuery) ||
        c.country?.toLowerCase().includes(lowerQuery)
      );
    }

    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('map_configs')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,label.ilike.%${query}%,country.ilike.%${query}%`)
        .order('label', { ascending: true });

      if (error) throw error;
      
      return (data || []).map((item: any) => this.transformDbToFrontend(item));
    } catch (error) {
      console.error('Error searching configs:', error);
      return [];
    }
  }

  // Get configurations by country
  async getByCountry(country: string): Promise<MapConfig[]> {
    if (!this.useSupabase) {
      const configs = convertMapConfigToArray(allMapsConfig);
      return configs.filter(c => c.country === country);
    }

    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('map_configs')
        .select('*')
        .eq('is_active', true)
        .eq('country', country)
        .order('label', { ascending: true });

      if (error) throw error;
      
      return (data || []).map((item: any) => this.transformDbToFrontend(item));
    } catch (error) {
      console.error('Error fetching configs by country:', error);
      return [];
    }
  }

  // Upload a custom style file
  async uploadStyle(formData: FormData): Promise<any> {
    try {
      // Use relative URL for production compatibility
      // In dev, this will use the dev server; in production, it will use the same domain
      const baseUrl = import.meta.env.VITE_API_URL || '';
      // Check if baseUrl already ends with /api to avoid duplication
      const uploadUrl = baseUrl 
        ? (baseUrl.endsWith('/api') 
            ? `${baseUrl}/styles/upload` 
            : `${baseUrl}/api/styles/upload`)
        : '/api/styles/upload';
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error uploading style:', error);
      throw error;
    }
  }

  // Initialize database with seed data (admin only)
  async seedDatabase(): Promise<boolean> {
    if (!this.useSupabase) {
      throw new Error('Supabase is not configured. Cannot seed database.');
    }

    try {
      const { supabase } = await import('../lib/supabase');
      const configs = convertMapConfigToArray(allMapsConfig);
      
      // Insert all configs, ignoring conflicts
      for (const config of configs) {
        const { id, ...configData } = config;
        await supabase
          .from('map_configs')
          .upsert({
            ...configData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'name'
          });
      }
      
      return true;
    } catch (error) {
      console.error('Error seeding database:', error);
      return false;
    }
  }
}