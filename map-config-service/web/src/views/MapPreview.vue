<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <button
              @click="router.back()"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <i class="pi pi-arrow-left"></i>
            </button>
            <h1 class="text-2xl font-bold text-gray-900">
              {{ config?.label || 'Map Preview' }}
            </h1>
          </div>
          <div class="flex items-center space-x-4">
            <button
              @click="toggleFullscreen"
              class="btn-secondary flex items-center space-x-2"
            >
              <i :class="`pi pi-${isFullscreen ? 'compress' : 'expand'}`"></i>
              <span>{{ isFullscreen ? 'Exit' : 'Enter' }} Fullscreen</span>
            </button>
            <button
              @click="viewStyleJson"
              class="btn-secondary flex items-center space-x-2"
              title="View Style JSON"
            >
              <i class="pi pi-eye"></i>
              <span>View Style</span>
            </button>
            <button
              v-if="canEditInMaputnik"
              @click="openInMaputnik"
              class="btn-secondary flex items-center space-x-2"
              title="Edit in Maputnik"
            >
              <i class="pi pi-palette"></i>
              <span>Edit in Maputnik</span>
            </button>
            <button
              @click="downloadStyleJson"
              class="btn-secondary flex items-center space-x-2"
              title="Download Style JSON"
            >
              <i class="pi pi-download"></i>
              <span>Download Style</span>
            </button>
            <button
              @click="editConfig"
              class="btn-primary flex items-center space-x-2"
            >
              <i class="pi pi-pencil"></i>
              <span>Edit Config</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Map Container -->
    <div class="relative flex-1" style="height: calc(100vh - 4rem)">
      <div ref="mapContainer" class="w-full h-full"></div>
      
      <!-- Map Controls Overlay -->
      <div class="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 space-y-4">
        <!-- Save/Load Position Controls -->
        <div class="space-y-2">
          <button
            @click="saveMapPosition"
            :disabled="!positionChanged"
            :class="[
              'w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors',
              positionChanged
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            ]"
          >
            <i class="pi pi-save"></i>
            <span>{{ positionSaved ? 'Position Saved' : 'Save Position' }}</span>
          </button>
          <div v-if="positionSaved" class="text-xs text-green-600 text-center">
            <i class="pi pi-check-circle mr-1"></i>
            Position saved to database
          </div>
        </div>
        
        <div class="border-t pt-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Style</label>
          <select
            v-model="selectedStyle"
            @change="updateMapStyle"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option :value="config?.style">Default</option>
            <option value="streets">Streets</option>
            <option value="satellite">Satellite</option>
            <option value="outdoors">Outdoors</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Zoom: {{ zoom.toFixed(1) }}</label>
          <input
            type="range"
            v-model="zoom"
            @input="updateZoom"
            min="0"
            max="22"
            step="0.1"
            class="w-full"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Bearing: {{ bearing }}°</label>
          <input
            type="range"
            v-model="bearing"
            @input="updateBearing"
            min="0"
            max="360"
            step="1"
            class="w-full"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Pitch: {{ pitch }}°</label>
          <input
            type="range"
            v-model="pitch"
            @input="updatePitch"
            min="0"
            max="60"
            step="1"
            class="w-full"
          />
        </div>
        
        <button
          @click="resetView"
          class="w-full btn-secondary"
        >
          Reset View
        </button>
      </div>
      
      <!-- Info Panel -->
      <div class="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <h3 class="font-semibold text-gray-900 mb-2">Map Information</h3>
        <dl class="space-y-1 text-sm">
          <div class="flex justify-between">
            <dt class="text-gray-600">Type:</dt>
            <dd class="font-medium">{{ config?.type?.toUpperCase() }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-600">Country:</dt>
            <dd class="font-medium">{{ config?.flag }} {{ config?.country }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-600">Center:</dt>
            <dd class="font-medium">{{ center.lat.toFixed(4) }}, {{ center.lng.toFixed(4) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-600">Zoom:</dt>
            <dd class="font-medium">{{ zoom.toFixed(1) }}</dd>
          </div>
        </dl>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
        <div class="text-center">
          <i class="pi pi-spin pi-spinner text-4xl text-blue-500 mb-4"></i>
          <p class="text-gray-600">Loading map...</p>
        </div>
      </div>
      
      <!-- Error State -->
      <div v-if="error" class="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center">
        <div class="text-center max-w-md">
          <i class="pi pi-exclamation-triangle text-6xl text-red-500 mb-4"></i>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Failed to Load Map</h2>
          <p class="text-gray-600 mb-4">{{ error }}</p>
          <button @click="retryLoad" class="btn-primary">
            <i class="pi pi-refresh mr-2"></i>
            Retry
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useConfigStore } from '../stores/config';
import { storeToRefs } from 'pinia';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapConfig } from '../types';
import { openInMaputnik as openMaputnik, canOpenInMaputnik } from '../utils/maputnikHelper';

const route = useRoute();
const router = useRouter();
const configStore = useConfigStore();
const { configs } = storeToRefs(configStore);

const mapContainer = ref<HTMLElement>();
const map = ref<maplibregl.Map | null>(null);
const loading = ref(true);
const error = ref('');
const isFullscreen = ref(false);

const config = computed(() => 
  configs.value.find(c => c.id === route.params.id)
);

const canEditInMaputnik = computed(() => {
  return config.value && canOpenInMaputnik(config.value);
});

const selectedStyle = ref('');
const zoom = ref(10);
const bearing = ref(0);
const pitch = ref(0);
const center = ref({ lat: 47.3769, lng: 8.5417 }); // Default to Zurich
const positionSaved = ref(false);
const positionChanged = ref(false);

function initializeMap() {
  if (!mapContainer.value || !config.value) {
    error.value = 'Map configuration not found';
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = '';

  // Initialize from saved position if available
  if (config.value.center) {
    center.value = { lng: config.value.center[0], lat: config.value.center[1] };
  }
  if (config.value.zoom !== undefined) {
    zoom.value = config.value.zoom;
  }
  if (config.value.bearing !== undefined) {
    bearing.value = config.value.bearing;
  }
  if (config.value.pitch !== undefined) {
    pitch.value = config.value.pitch;
  }

  try {
    // Determine the style URL based on config type
    let styleUrl = '';
    
    if (config.value.type === 'vtc') {
      // Vector tile with style
      if (config.value.style && config.value.style !== 'tiles') {
        // Use the style URL from the database
        styleUrl = config.value.style;
      } else if (config.value.metadata?.styleUrl) {
        // Fallback to metadata styleUrl if available
        styleUrl = config.value.metadata.styleUrl;
      } else if (config.value.metadata?.tiles) {
        // Create a basic style from tiles array
        styleUrl = {
          version: 8,
          sources: {
            'raster-tiles': {
              type: 'raster',
              tiles: config.value.metadata.tiles,
              tileSize: config.value.metadata.tileSize || 256
            }
          },
          layers: [{
            id: 'raster-layer',
            type: 'raster',
            source: 'raster-tiles'
          }]
        } as any;
      }
    } else if (config.value.type === 'wmts' || config.value.type === 'wms') {
      // WMTS/WMS layers
      if (config.value.metadata?.tiles) {
        styleUrl = {
          version: 8,
          sources: {
            'raster-tiles': {
              type: 'raster',
              tiles: config.value.metadata.tiles,
              tileSize: config.value.metadata.tileSize || 256,
              attribution: config.value.metadata.attribution
            }
          },
          layers: [{
            id: 'raster-layer',
            type: 'raster',
            source: 'raster-tiles'
          }]
        } as any;
      } else if (config.value.metadata?.url) {
        // WMS endpoint
        styleUrl = {
          version: 8,
          sources: {
            'wms-source': {
              type: 'raster',
              tiles: [`${config.value.metadata.url}?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.0&request=GetMap&srs=EPSG:3857&width=256&height=256&layers=${config.value.layers?.join(',') || ''}`],
              tileSize: 256
            }
          },
          layers: [{
            id: 'wms-layer',
            type: 'raster',
            source: 'wms-source'
          }]
        } as any;
      }
    }

    if (!styleUrl) {
      throw new Error('Unable to determine map style URL');
    }

    // Initialize the map
    map.value = new maplibregl.Map({
      container: mapContainer.value,
      style: styleUrl,
      center: [center.value.lng, center.value.lat],
      zoom: zoom.value,
      bearing: bearing.value,
      pitch: pitch.value
    });

    // Add navigation controls
    map.value.addControl(new maplibregl.NavigationControl(), 'top-left');
    map.value.addControl(new maplibregl.ScaleControl(), 'bottom-left');
    
    // Add source error handling to ignore tile loading issues
    map.value.on('sourcedataloading', () => {
      // Reset error when loading new source data
      if (error.value?.includes('tile')) {
        error.value = '';
      }
    });
    
    map.value.on('sourcedata', (e) => {
      // Clear loading state when source loads successfully
      if (e.isSourceLoaded && loading.value) {
        loading.value = false;
      }
    });

    // Update state on map move
    map.value.on('move', () => {
      if (!map.value) return;
      const mapCenter = map.value.getCenter();
      center.value = { lat: mapCenter.lat, lng: mapCenter.lng };
      zoom.value = map.value.getZoom();
      bearing.value = map.value.getBearing();
      pitch.value = map.value.getPitch();
    });

    // Mark position as changed when user moves the map
    map.value.on('moveend', () => {
      positionChanged.value = true;
      positionSaved.value = false;
    });

    map.value.on('load', () => {
      loading.value = false;
    });

    map.value.on('error', (e) => {
      // Ignore tile loading errors (404s are common for missing tiles at certain zoom levels)
      const isTileError = 
        e.error?.status === 404 || 
        e.error?.status === 0 || 
        e.error?.status === 403 || // Sometimes tiles are forbidden at certain zooms
        e.error?.message?.includes('Failed to fetch') ||
        e.error?.message?.includes('404') ||
        e.error?.message?.includes('403') ||
        e.error?.message?.includes('NetworkError') ||
        e.error?.message?.includes('tile') ||
        e.error?.message?.includes('.pbf') ||
        e.error?.message?.includes('.png') ||
        e.error?.message?.includes('.jpg') ||
        e.error?.message?.includes('.jpeg') ||
        e.error?.message?.includes('.mvt') ||
        e.error?.url?.includes('/tiles/') ||
        e.error?.url?.includes('.pbf') ||
        e.error?.url?.includes('.png') ||
        e.sourceId === 'raster-tiles' ||
        e.sourceId?.includes('tile');
      
      if (isTileError) {
        // Just log tile errors to console, don't show to user
        console.log('Tile not available:', e.error?.url || e.error?.message);
        return;
      }
      
      // Only show critical errors to the user
      console.error('Map error:', e);
      error.value = e.error?.message || 'Failed to load map';
      loading.value = false;
    });

  } catch (err: any) {
    console.error('Failed to initialize map:', err);
    error.value = err.message || 'Failed to initialize map';
    loading.value = false;
  }
}

function updateMapStyle() {
  // Implement style switching if needed
  console.log('Style changed to:', selectedStyle.value);
}

function updateZoom() {
  map.value?.setZoom(zoom.value);
}

function updateBearing() {
  map.value?.setBearing(bearing.value);
}

function updatePitch() {
  map.value?.setPitch(pitch.value);
}

function resetView() {
  // Reset to saved position or default
  if (config.value?.center) {
    center.value = { lng: config.value.center[0], lat: config.value.center[1] };
    zoom.value = config.value.zoom || 10;
    bearing.value = config.value.bearing || 0;
    pitch.value = config.value.pitch || 0;
  } else {
    zoom.value = 10;
    bearing.value = 0;
    pitch.value = 0;
    center.value = { lat: 47.3769, lng: 8.5417 };
  }
  
  map.value?.jumpTo({
    center: [center.value.lng, center.value.lat],
    zoom: zoom.value,
    bearing: bearing.value,
    pitch: pitch.value
  });
}

async function saveMapPosition() {
  if (!config.value) return;
  
  // Prepare position data
  const positionData = {
    center: [center.value.lng, center.value.lat],
    zoom: zoom.value,
    bearing: bearing.value,
    pitch: pitch.value
  };
  
  try {
    // Save to Supabase via config store
    await configStore.updateConfig(config.value.id, positionData);
    
    // Also save to localStorage as backup
    localStorage.setItem(`map-position-${config.value.id}`, JSON.stringify({
      ...positionData,
      savedAt: new Date().toISOString()
    }));
    
    // Update UI state
    positionSaved.value = true;
    positionChanged.value = false;
    
    // Reset the saved indicator after 3 seconds
    setTimeout(() => {
      positionSaved.value = false;
    }, 3000);
    
  } catch (error) {
    console.error('Failed to save map position:', error);
    alert('Failed to save position to database. The position has been saved locally.');
    
    // Fallback to localStorage only
    localStorage.setItem(`map-position-${config.value.id}`, JSON.stringify({
      ...positionData,
      savedAt: new Date().toISOString()
    }));
    
    positionSaved.value = true;
    positionChanged.value = false;
  }
}

function loadSavedPosition() {
  if (!config.value) return;
  
  // Try to load from localStorage first
  const savedPosition = localStorage.getItem(`map-position-${config.value.id}`);
  if (savedPosition) {
    try {
      const position = JSON.parse(savedPosition);
      if (position.center) {
        center.value = { lng: position.center[0], lat: position.center[1] };
      }
      if (position.zoom !== undefined) {
        zoom.value = position.zoom;
      }
      if (position.bearing !== undefined) {
        bearing.value = position.bearing;
      }
      if (position.pitch !== undefined) {
        pitch.value = position.pitch;
      }
    } catch (e) {
      console.error('Failed to parse saved position:', e);
    }
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    isFullscreen.value = true;
  } else {
    document.exitFullscreen();
    isFullscreen.value = false;
  }
}

function editConfig() {
  router.push(`/config/${route.params.id}/edit`);
}

function openInMaputnik() {
  if (config.value) {
    openMaputnik(config.value.originalStyle || config.value.style, config.value.type);
  }
}

async function viewStyleJson() {
  if (!config.value?.style) {
    alert('No style URL available for this map');
    return;
  }
  
  // Open the style JSON in a new tab
  window.open(config.value.style, '_blank');
}

async function downloadStyleJson() {
  if (!config.value?.style) {
    alert('No style URL available for this map');
    return;
  }
  
  try {
    // Fetch the style JSON
    const response = await fetch(config.value.style);
    if (!response.ok) {
      throw new Error('Failed to fetch style');
    }
    
    const styleJson = await response.json();
    
    // Create a blob and download it
    const blob = new Blob([JSON.stringify(styleJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.value.name.replace(/\s+/g, '-').toLowerCase()}-style.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download style:', error);
    alert('Failed to download style file. Please try viewing it instead.');
  }
}

function retryLoad() {
  initializeMap();
}

onMounted(() => {
  if (!configs.value.length) {
    configStore.fetchConfigs().then(() => {
      loadSavedPosition();
      initializeMap();
    });
  } else {
    loadSavedPosition();
    initializeMap();
  }
});

onUnmounted(() => {
  map.value?.remove();
});
</script>

<style scoped>
.maplibregl-canvas {
  outline: none;
}
</style>