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
        <div>
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

const selectedStyle = ref('');
const zoom = ref(10);
const bearing = ref(0);
const pitch = ref(0);
const center = ref({ lat: 47.3769, lng: 8.5417 }); // Default to Zurich

function initializeMap() {
  if (!mapContainer.value || !config.value) {
    error.value = 'Map configuration not found';
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = '';

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

    // Update state on map move
    map.value.on('move', () => {
      if (!map.value) return;
      const mapCenter = map.value.getCenter();
      center.value = { lat: mapCenter.lat, lng: mapCenter.lng };
      zoom.value = map.value.getZoom();
      bearing.value = map.value.getBearing();
      pitch.value = map.value.getPitch();
    });

    map.value.on('load', () => {
      loading.value = false;
    });

    map.value.on('error', (e) => {
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
  zoom.value = 10;
  bearing.value = 0;
  pitch.value = 0;
  center.value = { lat: 47.3769, lng: 8.5417 };
  
  map.value?.jumpTo({
    center: [center.value.lng, center.value.lat],
    zoom: zoom.value,
    bearing: bearing.value,
    pitch: pitch.value
  });
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
      initializeMap();
    });
  } else {
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