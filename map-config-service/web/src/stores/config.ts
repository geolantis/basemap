import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { MapConfig, DuplicateRequest } from '../types';
import { MapConfigService } from '../services/mapConfigService';

export const useConfigStore = defineStore('config', () => {
  const configs = ref<MapConfig[]>([]);
  const currentConfig = ref<MapConfig | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Service instance
  const service = MapConfigService.getInstance();
  
  // Filters
  const searchQuery = ref('');
  const selectedCountry = ref('all');
  const selectedType = ref<string | null>(null);
  
  // Computed
  const filteredConfigs = computed(() => {
    let result = configs.value;
    
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.label.toLowerCase().includes(query) ||
        c.country?.toLowerCase().includes(query)
      );
    }
    
    if (selectedCountry.value && selectedCountry.value !== 'all') {
      result = result.filter(c => c.country === selectedCountry.value);
    }
    
    if (selectedType.value) {
      result = result.filter(c => c.type === selectedType.value);
    }
    
    return result;
  });
  
  const countries = computed(() => {
    const unique = new Set(configs.value.map(c => c.country));
    return Array.from(unique).sort();
  });
  
  // Actions
  async function fetchConfigs() {
    loading.value = true;
    error.value = null;
    
    try {
      // Use the service which handles both Supabase and fallback
      configs.value = await service.getAll();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch configurations';
      console.error('Failed to fetch configs:', err);
      configs.value = [];
    } finally {
      loading.value = false;
    }
  }
  
  async function fetchConfig(id: string) {
    loading.value = true;
    error.value = null;
    
    try {
      const config = await service.getById(id);
      currentConfig.value = config;
      return config;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch configuration';
      console.error('Failed to fetch config:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }
  
  async function createConfig(config: Partial<MapConfig>) {
    loading.value = true;
    error.value = null;
    
    try {
      const newConfig = await service.create(config as Omit<MapConfig, 'id' | 'createdAt' | 'updatedAt'>);
      if (newConfig) {
        configs.value.push(newConfig);
      }
      return newConfig;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create configuration';
      console.error('Failed to create config:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }
  
  async function updateConfig(id: string, updates: Partial<MapConfig>) {
    loading.value = true;
    error.value = null;

    try {
      const updatedConfig = await service.update(id, updates);

      if (updatedConfig) {
        const index = configs.value.findIndex(c => c.id === id);
        if (index !== -1) {
          // Use Vue's reactivity system to ensure the update triggers re-renders
          configs.value.splice(index, 1, updatedConfig);
        }

        if (currentConfig.value?.id === id) {
          currentConfig.value = updatedConfig;
        }
      }

      return updatedConfig;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update configuration';
      console.error('Failed to update config:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }
  
  async function deleteConfig(id: string) {
    loading.value = true;
    error.value = null;
    
    try {
      const success = await service.delete(id);
      
      if (success) {
        configs.value = configs.value.filter(c => c.id !== id);
        
        if (currentConfig.value?.id === id) {
          currentConfig.value = null;
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete configuration';
      console.error('Failed to delete config:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }
  
  async function duplicateConfiguration(request: DuplicateRequest) {
    loading.value = true;
    error.value = null;
    
    try {
      const duplicated = await service.duplicate(request.sourceId, {
        name: request.name,
        label: request.label,
        country: request.country || undefined,
        type: request.type || undefined
      });
      
      if (duplicated) {
        configs.value.push(duplicated);
      }
      
      return duplicated;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to duplicate configuration';
      console.error('Failed to duplicate config:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }
  
  async function searchConfigs(query: string) {
    loading.value = true;
    error.value = null;
    
    try {
      const results = await service.search(query);
      return results;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to search configurations';
      console.error('Failed to search configs:', err);
      return [];
    } finally {
      loading.value = false;
    }
  }
  
  async function getByCountry(country: string) {
    loading.value = true;
    error.value = null;
    
    try {
      const results = await service.getByCountry(country);
      return results;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch configurations by country';
      console.error('Failed to fetch configs by country:', err);
      return [];
    } finally {
      loading.value = false;
    }
  }
  
  async function seedDatabase() {
    loading.value = true;
    error.value = null;
    
    try {
      const success = await service.seedDatabase();
      if (success) {
        await fetchConfigs(); // Reload configs after seeding
      }
      return success;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to seed database';
      console.error('Failed to seed database:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }
  
  async function exportConfig(id: string) {
    const config = configs.value.find(c => c.id === id);
    if (!config) return;
    
    // Transform to mapconfig.json format
    const exportData = {
      backgroundMaps: {
        [config.name]: {
          name: config.name,
          style: config.originalStyle || config.style,
          label: config.label,
          type: config.type,
          flag: config.flag,
          country: config.country,
          ...(config.layers && { layers: config.layers }),
          ...(config.metadata && { 
            tiles: config.metadata.tiles,
            url: config.metadata.url,
            tileSize: config.metadata.tileSize,
            attribution: config.metadata.attribution
          })
        }
      }
    };
    
    // Download as JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  return {
    // State
    configs,
    currentConfig,
    loading,
    error,
    searchQuery,
    selectedCountry,
    selectedType,
    
    // Computed
    filteredConfigs,
    countries,
    
    // Actions
    fetchConfigs,
    fetchConfig,
    createConfig,
    updateConfig,
    deleteConfig,
    duplicateConfiguration,
    searchConfigs,
    getByCountry,
    seedDatabase,
    exportConfig
  };
});