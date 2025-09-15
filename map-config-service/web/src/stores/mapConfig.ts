import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { MapConfig } from '../types';

export const useConfigStore = defineStore('mapConfig', () => {
  const configs = ref<MapConfig[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  async function fetchConfigs(): Promise<MapConfig[]> {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/map_configs?is_active=eq.true&order=name`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch configurations');
      }

      const data = await response.json();
      // Map database fields to frontend fields
      const mappedData = data.map((config: any) => ({
        ...config,
        mapCategory: config.map_category,
        selectLayer: config.select_layer,
        previewImageUrl: config.preview_image_url
      }));
      configs.value = mappedData;
      return mappedData;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch configurations';
      console.error('Error fetching configs:', err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchConfig(id: string): Promise<MapConfig | null> {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/map_configs?id=eq.${id}`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch configuration');
      }

      const data = await response.json();
      if (data[0]) {
        // Map database fields to frontend fields
        return {
          ...data[0],
          mapCategory: data[0].map_category,
          selectLayer: data[0].select_layer,
          previewImageUrl: data[0].preview_image_url
        };
      }
      return null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch configuration';
      console.error('Error fetching config:', err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function createConfig(config: Partial<MapConfig>): Promise<MapConfig | null> {
    loading.value = true;
    error.value = null;

    try {
      // Map frontend fields to database columns
      const configData = {
        ...config,
        map_category: config.mapCategory, // Map to database column name
        select_layer: config.selectLayer, // Map to database column name
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1,
        is_active: true
      };

      // Remove frontend-only fields
      delete configData.mapCategory;
      delete configData.selectLayer;
      delete configData.id;

      const response = await fetch(`${supabaseUrl}/rest/v1/map_configs`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(configData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create configuration: ${errorData}`);
      }

      const data = await response.json();

      // Refresh the configs list
      await fetchConfigs();

      return data[0] || null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create configuration';
      console.error('Error creating config:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateConfig(id: string, updates: Partial<MapConfig>): Promise<MapConfig | null> {
    loading.value = true;
    error.value = null;

    try {
      // Map frontend fields to database columns
      const updateData = {
        ...updates,
        map_category: updates.mapCategory, // Map to database column name
        select_layer: updates.selectLayer, // Map to database column name
        updated_at: new Date().toISOString(),
        version: (updates.version || 0) + 1
      };

      // Remove frontend-only fields and unchanged fields
      delete updateData.mapCategory;
      delete updateData.selectLayer;
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.created_by;

      const response = await fetch(`${supabaseUrl}/rest/v1/map_configs?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to update configuration: ${errorData}`);
      }

      const data = await response.json();

      // Update local store
      const index = configs.value.findIndex(c => c.id === id);
      if (index !== -1 && data[0]) {
        // Map database field back to frontend field
        const updatedConfig = {
          ...data[0],
          selectLayer: data[0].select_layer
        };
        configs.value[index] = updatedConfig;
      }

      return data[0] || null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update configuration';
      console.error('Error updating config:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteConfig(id: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/map_configs?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete configuration');
      }

      // Remove from local store
      configs.value = configs.value.filter(c => c.id !== id);

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete configuration';
      console.error('Error deleting config:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    configs,
    loading,
    error,

    // Actions
    fetchConfigs,
    fetchConfig,
    createConfig,
    updateConfig,
    deleteConfig,
  };
});