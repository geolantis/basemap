<template>
  <div class="preview-test-page">
    <PageHeader title="Preview Image Test" icon="pi pi-image" />
    
    <!-- Instructions Card -->
    <Card class="instructions-card">
      <template #header>
        <div class="card-header">
          <i class="pi pi-info-circle"></i>
          <h3>How to Use This Test Page</h3>
        </div>
      </template>
      <template #content>
        <div class="instructions">
          <h4>📋 Overview</h4>
          <p>This page tests the map preview image system, showing how images are served and cached efficiently.</p>
          
          <h4>🎯 Test Features</h4>
          <ol>
            <li><strong>View All Previews:</strong> See preview images for all maps (basemaps and overlays)</li>
            <li><strong>Cache Status:</strong> Check where images are served from (Memory, Edge, Database, etc.)</li>
            <li><strong>Generate New Previews:</strong> Capture live map views and update preview images</li>
            <li><strong>Performance Metrics:</strong> Monitor load times and cache efficiency</li>
            <li><strong>Cache Management:</strong> Clear and inspect cache statistics</li>
          </ol>

          <h4>🔧 How It Works</h4>
          <ul>
            <li>Images are served from <code>/api/preview/[mapId]</code> endpoint</li>
            <li>Multiple cache layers: Browser → Edge CDN → Server → Database</li>
            <li>Automatic placeholder generation for missing images</li>
            <li>Smart prefetching for better performance</li>
          </ul>

          <h4>💡 Tips</h4>
          <ul>
            <li>Check the browser DevTools Network tab to see caching in action</li>
            <li>Look for <code>X-Cache</code> headers to see cache hit/miss status</li>
            <li>Try refreshing the page to see localStorage cache working</li>
            <li>Click "Generate Preview" on any map to create a new image</li>
          </ul>
        </div>
      </template>
    </Card>

    <!-- Controls Card -->
    <Card class="controls-card">
      <template #header>
        <div class="card-header">
          <i class="pi pi-cog"></i>
          <h3>Test Controls</h3>
        </div>
      </template>
      <template #content>
        <div class="controls">
          <div class="control-group">
            <Button 
              @click="loadAllMaps" 
              icon="pi pi-download" 
              label="Load All Maps" 
              :loading="loading"
              severity="primary"
            />
            <Button 
              @click="preloadAllPreviews" 
              icon="pi pi-bolt" 
              label="Preload All Images"
              :disabled="maps.length === 0"
              severity="info"
            />
            <Button 
              @click="clearAllCaches" 
              icon="pi pi-trash" 
              label="Clear All Caches"
              severity="warning"
            />
            <Button 
              @click="showCacheStats = !showCacheStats" 
              icon="pi pi-chart-bar" 
              label="Cache Statistics"
              :class="{ 'p-button-outlined': !showCacheStats }"
            />
          </div>

          <div class="filter-group">
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText 
                v-model="searchQuery" 
                placeholder="Search maps..." 
                class="search-input"
              />
            </span>
            <Dropdown 
              v-model="filterType" 
              :options="typeOptions" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Filter by type"
              class="type-filter"
            />
            <Dropdown 
              v-model="filterCountry" 
              :options="countryOptions" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Filter by country"
              class="country-filter"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Cache Statistics -->
    <Card v-if="showCacheStats" class="stats-card">
      <template #header>
        <div class="card-header">
          <i class="pi pi-chart-bar"></i>
          <h3>Cache Statistics</h3>
        </div>
      </template>
      <template #content>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Total Images</span>
            <span class="stat-value">{{ cacheStats.total }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Remote URLs</span>
            <span class="stat-value">{{ cacheStats.remote }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Local Cache</span>
            <span class="stat-value">{{ cacheStats.local }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Generated</span>
            <span class="stat-value">{{ cacheStats.generated }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Cache Size</span>
            <span class="stat-value">{{ formatBytes(cacheStats.sizeBytes) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Cache Age</span>
            <span class="stat-value">{{ formatAge(cacheStats.oldestTimestamp) }}</span>
          </div>
        </div>
      </template>
    </Card>

    <!-- Preview Grid -->
    <Card class="preview-grid-card">
      <template #header>
        <div class="card-header">
          <i class="pi pi-images"></i>
          <h3>Map Previews ({{ filteredMaps.length }} of {{ maps.length }})</h3>
        </div>
      </template>
      <template #content>
        <div v-if="loading" class="loading-state">
          <ProgressSpinner />
          <p>Loading maps...</p>
        </div>

        <div v-else-if="filteredMaps.length === 0" class="empty-state">
          <i class="pi pi-inbox"></i>
          <p>No maps found</p>
        </div>

        <div v-else class="preview-grid">
          <div 
            v-for="map in filteredMaps" 
            :key="map.id"
            class="preview-item"
          >
            <div class="preview-image-container">
              <img 
                :src="getMapPreviewUrl(map)"
                :alt="map.label"
                @load="onImageLoad(map.id, $event)"
                @error="onImageError(map.id, $event)"
                class="preview-image"
                loading="lazy"
              />
              <div class="image-overlay">
                <Tag 
                  v-if="imageStatus[map.id]"
                  :value="imageStatus[map.id].status"
                  :severity="getStatusSeverity(imageStatus[map.id].status)"
                  class="status-tag"
                />
                <span v-if="imageStatus[map.id]?.loadTime" class="load-time">
                  {{ imageStatus[map.id].loadTime }}ms
                </span>
              </div>
              <div v-if="map.metadata?.isOverlay" class="overlay-badge">
                <i class="pi pi-clone"></i>
              </div>
            </div>
            
            <div class="preview-info">
              <h4>{{ map.label }}</h4>
              <div class="preview-meta">
                <span>{{ map.flag }} {{ map.country }}</span>
                <Tag :value="map.type" size="small" />
              </div>
              <div class="preview-actions">
                <Button 
                  @click="viewMap(map)"
                  icon="pi pi-eye"
                  label="View"
                  size="small"
                  outlined
                />
                <Button 
                  @click="generatePreview(map)"
                  icon="pi pi-camera"
                  label="Generate"
                  size="small"
                  severity="success"
                  :loading="generatingMap === map.id"
                />
                <Button 
                  @click="copyApiUrl(map)"
                  icon="pi pi-link"
                  label="API URL"
                  size="small"
                  outlined
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <Paginator 
          v-if="filteredMaps.length > pageSize"
          v-model:first="first"
          :rows="pageSize"
          :totalRecords="filteredMaps.length"
          :rowsPerPageOptions="[12, 24, 48, 96]"
          class="preview-paginator"
        />
      </template>
    </Card>

    <!-- Live Map Modal for Preview Generation -->
    <Dialog 
      v-model:visible="showMapDialog" 
      :header="`Generate Preview: ${selectedMap?.label}`"
      :modal="true"
      :style="{ width: '80vw' }"
      :maximizable="true"
    >
      <div class="map-dialog-content">
        <div id="preview-map" class="preview-map-container"></div>
        <div class="map-controls">
          <Button 
            @click="capturePreview"
            icon="pi pi-camera"
            label="Capture Preview"
            severity="success"
            :loading="capturing"
          />
          <Button 
            @click="resetMapView"
            icon="pi pi-refresh"
            label="Reset View"
            severity="secondary"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import Paginator from 'primevue/paginator';
import PageHeader from '../components/PageHeader.vue';
import { supabase } from '../lib/supabase';
import { captureMapPreview } from '../utils/mapCapture';
import { useMapPreview } from '../hooks/useMapPreview';
import { getSupabasePreviewUrl, uploadPreviewToSupabase } from '../utils/supabasePreview';

const toast = useToast();
const { getPreviewUrl, preloadPreviews, generateAndUpdatePreview, clearCache, getCacheStats } = useMapPreview();

// State
const maps = ref<any[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const filterType = ref('all');
const filterCountry = ref('all');
const showCacheStats = ref(false);
const cacheStats = ref({
  total: 0,
  remote: 0,
  local: 0,
  generated: 0,
  sizeBytes: 0,
  oldestTimestamp: Date.now()
});
const imageStatus = ref<Record<string, { status: string; loadTime: number }>>({});
const generatingMap = ref<string | null>(null);
const showMapDialog = ref(false);
const selectedMap = ref<any>(null);
const capturing = ref(false);
const mapInstance = ref<maplibregl.Map | null>(null);

// Pagination
const first = ref(0);
const pageSize = ref(24);

// Filter options
const typeOptions = [
  { label: 'All Types', value: 'all' },
  { label: 'VTC', value: 'vtc' },
  { label: 'WMS', value: 'wms' },
  { label: 'WMTS', value: 'wmts' }
];

const countryOptions = computed(() => {
  const countries = new Set(maps.value.map(m => m.country));
  return [
    { label: 'All Countries', value: 'all' },
    ...Array.from(countries).map(c => ({ label: c, value: c }))
  ];
});

// Computed
const filteredMaps = computed(() => {
  let result = maps.value;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(m => 
      m.label.toLowerCase().includes(query) ||
      m.name.toLowerCase().includes(query)
    );
  }
  
  if (filterType.value !== 'all') {
    result = result.filter(m => m.type === filterType.value);
  }
  
  if (filterCountry.value !== 'all') {
    result = result.filter(m => m.country === filterCountry.value);
  }
  
  return result;
});

// Helper to get the correct preview URL
const getMapPreviewUrl = (map: any): string => {
  // Check localStorage cache first
  const cacheKey = `preview_${map.id}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      if (data.url && Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000) {
        return data.url;
      }
    }
  } catch (e) {
    console.warn('Cache read error:', e);
  }
  
  // Use direct Supabase URL
  return getSupabasePreviewUrl(map.id);
};

// Methods
const loadAllMaps = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from('map_configs')
      .select('*')
      .eq('is_active', true)
      .order('country')
      .order('label');
    
    if (error) throw error;
    maps.value = data || [];
    
    // Maps will use Supabase storage URLs directly
    
    toast.add({
      severity: 'success',
      summary: 'Maps Loaded',
      detail: `Loaded ${maps.value.length} maps`,
      life: 3000
    });
    
    updateCacheStats();
  } catch (error) {
    console.error('Error loading maps:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load maps',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const preloadAllPreviews = async () => {
  const startTime = Date.now();
  let loaded = 0;
  let cached = 0;
  let failed = 0;
  
  toast.add({
    severity: 'info',
    summary: 'Preloading Images',
    detail: `Starting to preload ${maps.value.length} images...`,
    life: 2000
  });
  
  // Preload images in batches
  const batchSize = 5;
  for (let i = 0; i < maps.value.length; i += batchSize) {
    const batch = maps.value.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (map) => {
        try {
          const url = getSupabasePreviewUrl(map.id);
          
          // Try to fetch from Supabase
          const response = await fetch(url);
          if (response.ok) {
            const blob = await response.blob();
            
            // Convert to base64 for localStorage
            const reader = new FileReader();
            await new Promise<void>((resolve) => {
              reader.onloadend = () => {
                try {
                  const base64 = reader.result as string;
                  const cacheKey = `preview_${map.id}`;
                  localStorage.setItem(cacheKey, JSON.stringify({
                    url: base64,
                    timestamp: Date.now(),
                    type: 'cached'
                  }));
                  cached++;
                } catch (e) {
                  console.warn('Could not cache to localStorage:', e);
                }
                resolve();
              };
              reader.readAsDataURL(blob);
            });
            
            loaded++;
          } else {
            failed++;
            console.warn(`Preview not found for ${map.label}`);
          }
        } catch (error) {
          failed++;
          console.error(`Failed to preload ${map.label}:`, error);
        }
      })
    );
    
    // Update progress
    if (i + batchSize < maps.value.length) {
      toast.add({
        severity: 'info',
        summary: 'Preloading Progress',
        detail: `Processed ${Math.min(i + batchSize, maps.value.length)} of ${maps.value.length} maps...`,
        life: 1000
      });
    }
  }
  
  const duration = Date.now() - startTime;
  
  toast.add({
    severity: loaded > 0 ? 'success' : 'warning',
    summary: 'Preload Complete',
    detail: `Loaded ${loaded} images, ${cached} cached locally, ${failed} failed (${duration}ms)`,
    life: 5000
  });
  
  updateCacheStats();
};

const clearAllCaches = async () => {
  clearCache();
  imageStatus.value = {};
  
  // Also clear browser cache for API endpoints
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
  }
  
  toast.add({
    severity: 'warning',
    summary: 'Cache Cleared',
    detail: 'All preview caches have been cleared',
    life: 3000
  });
  
  updateCacheStats();
};

const updateCacheStats = () => {
  cacheStats.value = getCacheStats();
};

const onImageLoad = (mapId: string, event: Event) => {
  const img = event.target as HTMLImageElement;
  const loadTime = performance.now() - (img as any)._startTime || 0;
  
  // Try to get cache status from response headers (if available)
  let status = 'LOADED';
  
  // Check if it's from cache
  if (loadTime < 10) {
    status = 'MEMORY';
  } else if (loadTime < 50) {
    status = 'CACHE';
  } else if (loadTime < 200) {
    status = 'EDGE';
  } else {
    status = 'NETWORK';
  }
  
  imageStatus.value[mapId] = {
    status,
    loadTime: Math.round(loadTime)
  };
};

const onImageError = (mapId: string, event: Event) => {
  imageStatus.value[mapId] = {
    status: 'ERROR',
    loadTime: 0
  };
};

const viewMap = (map: any) => {
  window.open(`/config/${map.id}/preview`, '_blank');
};

const generatePreview = async (map: any) => {
  selectedMap.value = map;
  showMapDialog.value = true;
  
  // Wait for dialog to open
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Initialize map
  if (!mapInstance.value) {
    mapInstance.value = new maplibregl.Map({
      container: 'preview-map',
      style: map.style || 'https://demotiles.maplibre.org/style.json',
      center: [0, 0],
      zoom: 2,
      preserveDrawingBuffer: true
    });
    
    await new Promise(resolve => {
      mapInstance.value!.on('load', resolve);
    });
  } else {
    // Update style for selected map
    if (map.style) {
      mapInstance.value.setStyle(map.style);
      await new Promise(resolve => {
        mapInstance.value!.once('styledata', resolve);
      });
    }
  }
};

const capturePreview = async () => {
  if (!mapInstance.value || !selectedMap.value) return;
  
  capturing.value = true;
  generatingMap.value = selectedMap.value.id;
  
  try {
    // Capture the map view
    const dataUrl = await captureMapPreview(mapInstance.value);
    
    // Convert to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // Upload to Supabase storage
    const newUrl = await uploadPreviewToSupabase(selectedMap.value.id, blob);
    
    if (newUrl) {
      // Update the database record
      await supabase
        .from('map_configs')
        .update({
          preview_image_url: newUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedMap.value.id);
      
      // Clear local cache for this map
      const cacheKey = `preview_${selectedMap.value.id}`;
      localStorage.removeItem(cacheKey);
      
      // Force reload the image
      const img = document.querySelector(`[alt="${selectedMap.value.label}"]`) as HTMLImageElement;
      if (img) {
        img.src = newUrl + '?t=' + Date.now();
      }
      
      toast.add({
        severity: 'success',
        summary: 'Preview Generated',
        detail: `New preview created and uploaded for ${selectedMap.value.label}`,
        life: 3000
      });
    } else {
      throw new Error('Failed to upload preview');
    }
    
    showMapDialog.value = false;
    updateCacheStats();
  } catch (error) {
    console.error('Error generating preview:', error);
    toast.add({
      severity: 'error',
      summary: 'Generation Failed',
      detail: 'Failed to generate preview image',
      life: 3000
    });
  } finally {
    capturing.value = false;
    generatingMap.value = null;
  }
};

const resetMapView = () => {
  if (mapInstance.value) {
    mapInstance.value.jumpTo({
      center: [0, 0],
      zoom: 2,
      bearing: 0,
      pitch: 0
    });
  }
};

const copyApiUrl = (map: any) => {
  const url = `${window.location.origin}/api/preview/${map.id}`;
  navigator.clipboard.writeText(url);
  
  toast.add({
    severity: 'info',
    summary: 'URL Copied',
    detail: 'API URL copied to clipboard',
    life: 2000
  });
};

const getStatusSeverity = (status: string): string => {
  switch (status) {
    case 'MEMORY': return 'success';
    case 'CACHE': return 'info';
    case 'EDGE': return 'info';
    case 'NETWORK': return 'warning';
    case 'ERROR': return 'danger';
    default: return 'secondary';
  }
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const formatAge = (timestamp: number): string => {
  const age = Date.now() - timestamp;
  const days = Math.floor(age / (1000 * 60 * 60 * 24));
  const hours = Math.floor((age % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return 'Fresh';
};

// Track image load times
watch(filteredMaps, () => {
  filteredMaps.value.forEach(map => {
    const img = new Image();
    (img as any)._startTime = performance.now();
    img.src = getMapPreviewUrl(map);
  });
});

// Lifecycle
onMounted(() => {
  loadAllMaps();
  updateCacheStats();
  
  // Update stats periodically
  setInterval(updateCacheStats, 5000);
});
</script>

<style scoped>
.preview-test-page {
  padding: 1rem;
  max-width: 1600px;
  margin: 0 auto;
}

.instructions-card,
.controls-card,
.stats-card,
.preview-grid-card {
  margin-bottom: 1.5rem;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-header i {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.instructions {
  line-height: 1.6;
}

.instructions h4 {
  color: var(--primary-color);
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.instructions ol,
.instructions ul {
  margin-left: 1.5rem;
}

.instructions code {
  background: var(--surface-100);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.875rem;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.control-group,
.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.search-input {
  width: 250px;
}

.type-filter,
.country-filter {
  min-width: 150px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary-color);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: var(--text-color-secondary);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.preview-item {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.preview-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.preview-image-container {
  position: relative;
  width: 100%;
  padding-top: 75%; /* 4:3 aspect ratio */
  background: var(--surface-50);
  overflow: hidden;
}

.preview-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.load-time {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.overlay-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: var(--primary-color);
  color: white;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-info {
  padding: 1rem;
}

.preview-info h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.preview-actions {
  display: flex;
  gap: 0.5rem;
}

.preview-actions .p-button {
  flex: 1;
  font-size: 0.75rem;
  padding: 0.375rem 0.5rem;
}

.preview-paginator {
  margin-top: 2rem;
}

.map-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview-map-container {
  width: 100%;
  height: 500px;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
}

.map-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .instructions code {
    background: var(--surface-700);
  }
  
  .stat-item {
    background: var(--surface-800);
  }
  
  .preview-image-container {
    background: var(--surface-700);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .preview-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .control-group,
  .filter-group {
    flex-direction: column;
  }
  
  .search-input,
  .type-filter,
  .country-filter {
    width: 100%;
  }
}
</style>