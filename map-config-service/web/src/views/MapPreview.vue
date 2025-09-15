<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-4">
            <button
              @click="router.push('/')"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Dashboard"
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
              @click="toggleTileInspector"
              :class="[
                'flex items-center space-x-2',
                tileInspectorEnabled ? 'btn-primary' : 'btn-secondary'
              ]"
              title="Toggle Tile Inspector"
            >
              <i class="pi pi-th-large"></i>
              <span>{{ tileInspectorEnabled ? 'Hide' : 'Show' }} Tiles</span>
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
      
      <!-- Location Search Overlay -->
      <div class="absolute top-4 left-4 z-10">
        <LocationSearch
          :placeholder="'Search for a location...'"
          :proximity="currentMapCenter"
          :limit="8"
          @select="handleLocationSelect"
          @error="handleSearchError"
        />
      </div>
      
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
          <button
            @click="savePreviewImage"
            :disabled="savingPreview"
            class="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:bg-gray-200 disabled:text-gray-400"
          >
            <i :class="savingPreview ? 'pi pi-spin pi-spinner' : 'pi pi-image'"></i>
            <span>{{ previewSaved ? 'Preview Saved' : 'Save Preview Image' }}</span>
          </button>
          <div v-if="positionSaved" class="text-xs text-green-600 text-center">
            <i class="pi pi-check-circle mr-1"></i>
            Position saved to database
          </div>
          <div v-if="previewSaved" class="text-xs text-green-600 text-center">
            <i class="pi pi-check-circle mr-1"></i>
            Preview image saved
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
          <label class="block text-sm font-medium text-gray-700 mb-2">Zoom: {{ zoom ? zoom.toFixed(1) : '10.0' }}</label>
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
            <dd class="font-medium">{{ zoom ? zoom.toFixed(1) : '10.0' }}</dd>
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
import { useConfigStore } from '../stores/mapConfig';
import { storeToRefs } from 'pinia';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { MapConfig } from '../types';
import { openInMaputnik as openMaputnik, canOpenInMaputnik } from '../utils/maputnikHelper';
import { captureMapPreview, uploadMapPreview, generateThumbnail } from '../utils/mapCapture';
import LocationSearch from '../components/LocationSearch.vue';

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

// Computed property for current map center (for location search proximity)
const currentMapCenter = computed(() => {
  return {
    lng: center.value.lng,
    lat: center.value.lat
  };
});

const selectedStyle = ref('');
const zoom = ref(10);
const bearing = ref(0);
const pitch = ref(0);
const center = ref({ lat: 47.3769, lng: 8.5417 }); // Default to Zurich
const positionSaved = ref(false);
const positionChanged = ref(false);
const savingPreview = ref(false);
const previewSaved = ref(false);
const tileInspectorEnabled = ref(false);
const tileInspectorLayer = ref<any>(null);

// Helper function to proxy URLs through our CORS proxy when needed
function proxyTileUrl(url: string): string {
  // Local URLs don't need proxy
  if (url.startsWith('/')) {
    return url;
  }
  
  // List of domains that need proxy even with HTTPS due to CORS issues
  const corsProblematicDomains = [
    'pamapserver.pa.org.mt',  // Malta
    'services.datafordeler.dk', // Denmark
    'geoportal.ancpi.ro',      // Romania
    'geoserver.geoportal.gov.cz', // Czech Republic
    'mapy.geoportal.gov.pl',   // Poland
    'services.terraitaly.it',   // Italy
    'geo.nls.uk',               // UK
    'geodata.nationaalgeoregister.nl', // Netherlands
    'services.data.shom.fr',    // France
    'wms.ngi.be',               // Belgium
    'gis.lmi.is',               // Iceland
    'geoserver.geoportal.lt'    // Lithuania
  ];
  
  // Check if this domain needs proxy (either HTTP or problematic HTTPS)
  const needsProxy = url.startsWith('http://') || 
    corsProblematicDomains.some(domain => url.includes(domain));
  
  if (needsProxy) {
    // Use our proxy to handle CORS
    return `/api/proxy-tiles?url=${encodeURIComponent(url)}`;
  }
  
  return url;
}

// Helper function to process tile URLs in an array
function proxyTileUrls(urls: string[]): string[] {
  return urls.map(url => proxyTileUrl(url));
}

async function initializeMap() {
  if (!mapContainer.value || !config.value) {
    error.value = 'Map configuration not found';
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = '';

  // Initialize from saved position if available
  if (config.value.center && config.value.center.length === 2) {
    center.value = { lng: config.value.center[0], lat: config.value.center[1] };
  } else {
    // Set default centers for known Australian services
    if (config.value.name?.includes('QLD') || config.value.label?.includes('Queensland')) {
      center.value = { lng: 153.0251, lat: -27.4698 }; // Brisbane
    } else if (config.value.name?.includes('NSW')) {
      center.value = { lng: 151.2093, lat: -33.8688 }; // Sydney
    } else if (config.value.name?.includes('Tasmania') || config.value.name?.includes('TAS')) {
      center.value = { lng: 147.3272, lat: -42.8821 }; // Hobart
    } else if (config.value.name?.includes('VIC')) {
      center.value = { lng: 144.9631, lat: -37.8136 }; // Melbourne
    } else if (config.value.name?.includes('WA')) {
      center.value = { lng: 115.8605, lat: -31.9505 }; // Perth
    }
  }
  
  if (config.value.zoom !== undefined && config.value.zoom !== null) {
    zoom.value = config.value.zoom;
  }
  if (config.value.bearing !== undefined && config.value.bearing !== null) {
    bearing.value = config.value.bearing;
  }
  if (config.value.pitch !== undefined && config.value.pitch !== null) {
    pitch.value = config.value.pitch;
  }

  try {
    // Determine the style URL based on config type
    let styleUrl = '';
    
    if (config.value.type === 'vtc' || config.value.type === 'vector-esri') {
      // Vector tile with style
      if (config.value.style && config.value.style !== 'tiles') {
        // Use the style URL from the database
        styleUrl = config.value.style;
      } else if (config.value.styleUrl) {
        // Check for styleUrl at the top level (for vector-esri)
        styleUrl = config.value.styleUrl;
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
        // Ensure tiles is an array
        let tilesArray = Array.isArray(config.value.metadata.tiles) 
          ? config.value.metadata.tiles 
          : [config.value.metadata.tiles];
        
        // Only add file extensions for WMTS (not WMS)
        if (config.value.type === 'wmts') {
          tilesArray = tilesArray.map(tileUrl => {
            // Check if URL already has an image extension
            if (!tileUrl.match(/\.(png|jpg|jpeg|webp)$/i)) {
              // Add .jpeg extension for WMTS services (common default)
              return tileUrl + '.jpeg';
            }
            return tileUrl;
          });
        }
        
        // Proxy HTTP URLs
        tilesArray = proxyTileUrls(tilesArray);
        
        styleUrl = {
          version: 8,
          sources: {
            'raster-tiles': {
              type: 'raster',
              tiles: tilesArray,
              tileSize: config.value.metadata.tileSize || 256,
              attribution: config.value.metadata.attribution || ''
            }
          },
          layers: [{
            id: 'raster-layer',
            type: 'raster',
            source: 'raster-tiles'
          }]
        } as any;
      } else if (config.value.metadata?.url || config.value.url) {
        // WMS endpoint (check both metadata.url and top-level url)
        const wmsUrl = config.value.metadata?.url || config.value.url;
        const layers = config.value.layers || config.value.metadata?.layers;
        const layerString = Array.isArray(layers) ? layers.join(',') : (typeof layers === 'string' ? layers : '');
        
        // Handle WMS parameters from the config
        const version = config.value.version || config.value.metadata?.version || '1.1.0';
        const format = config.value.format || config.value.metadata?.format || 'image/png';
        const transparent = config.value.transparent !== undefined ? config.value.transparent : true;
        const crs = version === '1.3.0' ? 'CRS' : 'SRS';
        
        // Construct the WMS URL - MapLibre will replace the placeholders
        const wmsUrlTemplate = `${wmsUrl}?SERVICE=WMS&VERSION=${version}&REQUEST=GetMap&FORMAT=${format}&TRANSPARENT=${transparent}&LAYERS=${layerString}&${crs}=EPSG:3857&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}`;
        
        styleUrl = {
          version: 8,
          sources: {
            'wms-source': {
              type: 'raster',
              tiles: [proxyTileUrl(wmsUrlTemplate)],
              tileSize: 256,
              scheme: 'xyz'
            }
          },
          layers: [{
            id: 'wms-layer',
            type: 'raster',
            source: 'wms-source'
          }]
        } as any;
      } else if (config.value.tiles) {
        // Direct tiles array at top level
        let tilesArray = Array.isArray(config.value.tiles) ? config.value.tiles : [config.value.tiles];
        
        // Only add file extensions for WMTS (not WMS)
        if (config.value.type === 'wmts') {
          tilesArray = tilesArray.map(tileUrl => {
            if (!tileUrl.match(/\.(png|jpg|jpeg|webp)$/i)) {
              return tileUrl + '.jpeg';
            }
            return tileUrl;
          });
        }
        
        // Proxy URLs that need it
        tilesArray = proxyTileUrls(tilesArray);
        
        styleUrl = {
          version: 8,
          sources: {
            'raster-tiles': {
              type: 'raster',
              tiles: tilesArray,
              tileSize: config.value.tileSize || 256,
              attribution: config.value.attribution || ''
            }
          },
          layers: [{
            id: 'raster-layer',
            type: 'raster',
            source: 'raster-tiles'
          }]
        } as any;
      }
    } else if (config.value.type === 'raster') {
      // Raster tile layers (like NSW Imagery)
      if (config.value.tiles) {
        let tilesArray = Array.isArray(config.value.tiles) ? config.value.tiles : [config.value.tiles];
        
        // Add file extensions if missing (common for WMTS services)
        tilesArray = tilesArray.map(tileUrl => {
          if (!tileUrl.match(/\.(png|jpg|jpeg|webp)$/i)) {
            // NSW Imagery doesn't need extension, QLD Aerial needs .jpeg
            // Check if it's QLD service
            if (tileUrl.includes('qld.gov.au')) {
              return tileUrl + '.jpeg';
            }
            // NSW services typically don't need extension
            return tileUrl;
          }
          return tileUrl;
        });
        
        // Proxy HTTP URLs
        tilesArray = proxyTileUrls(tilesArray);
        
        styleUrl = {
          version: 8,
          sources: {
            'raster-tiles': {
              type: 'raster',
              tiles: tilesArray,
              tileSize: config.value.tileSize || 256,
              attribution: config.value.attribution || '',
              maxzoom: config.value.maxzoom || 22
            }
          },
          layers: [{
            id: 'raster-layer',
            type: 'raster',
            source: 'raster-tiles'
          }]
        } as any;
      }
    }

    if (!styleUrl) {
      throw new Error('Unable to determine map style URL');
    }

    // If styleUrl is a string (URL), fetch and fix it
    if (typeof styleUrl === 'string') {
      try {
        const response = await fetch(styleUrl);
        const styleJson = await response.json();
        
        // Fix relative sprite URLs
        if (styleJson.sprite && !styleJson.sprite.startsWith('http')) {
          // Make sprite URL absolute based on the style URL
          const baseUrl = styleUrl.substring(0, styleUrl.lastIndexOf('/'));
          styleJson.sprite = baseUrl + '/' + styleJson.sprite;
        }
        
        // Fix relative glyphs URLs
        if (styleJson.glyphs && !styleJson.glyphs.startsWith('http')) {
          const baseUrl = styleUrl.substring(0, styleUrl.lastIndexOf('/'));
          styleJson.glyphs = baseUrl + '/' + styleJson.glyphs;
        }
        
        // Fix relative source URLs
        if (styleJson.sources) {
          Object.values(styleJson.sources).forEach((source: any) => {
            if (source.url && !source.url.startsWith('http')) {
              const baseUrl = styleUrl.substring(0, styleUrl.lastIndexOf('/'));
              source.url = baseUrl + '/' + source.url;
            }
          });
        }
        
        styleUrl = styleJson;
      } catch (err) {
        console.error('Failed to fetch or fix style JSON:', err);
        // Continue with the original URL, map might still work
      }
    }

    // Initialize the map with preserveDrawingBuffer for screenshot capability
    map.value = new maplibregl.Map({
      container: mapContainer.value,
      style: styleUrl,
      center: [center.value.lng, center.value.lat],
      zoom: zoom.value,
      bearing: bearing.value,
      pitch: pitch.value,
      preserveDrawingBuffer: true // CRITICAL: Required for capturing screenshots
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
    
    // Track source loading states
    let sourcesLoading = new Set();
    
    map.value.on('sourcedata', (e) => {
      if (e.sourceId) {
        if (e.isSourceLoaded) {
          sourcesLoading.delete(e.sourceId);
        } else if (e.sourceDataType === 'metadata') {
          sourcesLoading.add(e.sourceId);
        }
      }
      
      // Clear loading state when all sources have attempted to load
      // Even if tiles fail, we consider the map "loaded" after metadata is loaded
      if (e.sourceDataType === 'metadata' && e.isSourceLoaded) {
        // Give it a small delay to ensure map is ready
        setTimeout(() => {
          if (loading.value) {
            loading.value = false;
          }
        }, 500);
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
    
    // Failsafe: If still loading after 5 seconds, assume map is ready
    // This handles cases where tile loading errors prevent normal load event
    setTimeout(() => {
      if (loading.value && map.value) {
        console.log('Map load timeout reached, forcing ready state');
        loading.value = false;
      }
    }, 5000);

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
  if (config.value?.center && config.value.center.length === 2) {
    center.value = { lng: config.value.center[0], lat: config.value.center[1] };
    zoom.value = config.value.zoom ?? 10;
    bearing.value = config.value.bearing ?? 0;
    pitch.value = config.value.pitch ?? 0;
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
    // Save to database
    const result = await configStore.updateConfig(config.value.id, positionData);
    
    if (result) {
      console.log('Position saved to database');
      positionSaved.value = true;
      positionChanged.value = false;
      
      // Reset the saved indicator after 3 seconds
      setTimeout(() => {
        positionSaved.value = false;
      }, 3000);
    } else {
      throw new Error('Failed to update database');
    }
    
  } catch (error) {
    console.error('Failed to save map position:', error);
    alert('Failed to save position. The database may need to be updated. Please contact support.');
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
    // Navigate to our custom Maputnik editor page
    router.push(`/config/${config.value.id}/maputnik`);
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

async function savePreviewImage() {
  if (!map.value || !config.value) return;
  
  // Remove the problematic loading check - just proceed with capture
  savingPreview.value = true;
  previewSaved.value = false;
  
  try {
    // Wait a moment to ensure map is stable
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Capture the current map view
    console.log('Capturing map preview...');
    const imageDataUrl = await captureMapPreview(map.value);
    console.log('Captured image size:', imageDataUrl.length);
    
    // Generate a thumbnail
    const thumbnailDataUrl = await generateThumbnail(imageDataUrl, 400, 300);
    console.log('Generated thumbnail size:', thumbnailDataUrl.length);
    
    // Save directly as base64 in the database
    const result = await configStore.updateConfig(config.value.id, {
      previewImageUrl: thumbnailDataUrl
    });
    
    if (result) {
      console.log('Preview image saved to database');
      previewSaved.value = true;
      
      // Refresh the configs to show the new preview
      await configStore.fetchConfigs();
      
      // Reset the saved indicator after 3 seconds
      setTimeout(() => {
        previewSaved.value = false;
      }, 3000);
    } else {
      throw new Error('Failed to update database');
    }
    
  } catch (error) {
    console.error('Failed to save preview image:', error);
    
    // More specific error messages
    if (error instanceof Error) {
      if (error.message.includes('empty') || error.message.includes('preserveDrawingBuffer')) {
        alert('Failed to capture map image. Please try refreshing the page and trying again.');
      } else if (error.message.includes('database')) {
        alert('Failed to save to database. Please check if RLS policies are configured correctly.');
      } else {
        alert(`Failed to save preview: ${error.message}`);
      }
    } else {
      alert('Failed to save preview image. Please try again.');
    }
  } finally {
    savingPreview.value = false;
  }
}

function retryLoad() {
  initializeMap();
}

function toggleTileInspector() {
  if (!map.value) return;
  
  tileInspectorEnabled.value = !tileInspectorEnabled.value;
  
  if (tileInspectorEnabled.value) {
    // Add tile debug layer
    if (!map.value.getSource('tile-boundaries')) {
      // Create a custom source that shows tile boundaries
      map.value.addSource('tile-boundaries', {
        type: 'vector',
        tiles: ['https://a.tiles.mapbox.com/v4/mapbox.mapbox-streets-v8/{z}/{x}/{y}.mvt?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'],
        maxzoom: 14
      });
    }
    
    // Add debug layers to show tile boundaries and coordinates
    if (!map.value.getLayer('tile-boundaries-lines')) {
      // Add tile boundary lines
      map.value.addLayer({
        id: 'tile-boundaries-lines',
        type: 'line',
        source: 'tile-boundaries',
        'source-layer': 'admin',
        layout: {},
        paint: {
          'line-color': '#ff0000',
          'line-width': 2,
          'line-opacity': 0.7
        }
      });
      
      // Add a custom canvas source for tile coordinates
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      
      // Function to draw tile info on canvas
      const drawTileInfo = () => {
        const ctx = canvas.getContext('2d');
        if (!ctx || !map.value) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        
        // Draw border
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        
        // Get current zoom level and center
        const z = Math.floor(map.value.getZoom());
        const bounds = map.value.getBounds();
        
        // Calculate tile coordinates
        const n = Math.pow(2, z);
        const centerLng = (bounds.getWest() + bounds.getEast()) / 2;
        const centerLat = (bounds.getNorth() + bounds.getSouth()) / 2;
        
        const x = Math.floor(((centerLng + 180) / 360) * n);
        const latRad = (centerLat * Math.PI) / 180;
        const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
        
        // Draw tile info text
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(5, 5, 150, 60);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Zoom: ${z}`, 10, 25);
        ctx.fillText(`Tile: ${x}, ${y}`, 10, 45);
        ctx.fillText(`Total: ${n}x${n}`, 10, 65);
      };
      
      // Update on map move
      map.value.on('move', drawTileInfo);
      map.value.on('zoom', drawTileInfo);
      
      // Initial draw
      drawTileInfo();
      
      // Create image source from canvas
      map.value.addSource('tile-info-overlay', {
        type: 'canvas',
        canvas: canvas,
        coordinates: [
          [bounds.getWest(), bounds.getNorth()],
          [bounds.getEast(), bounds.getNorth()],
          [bounds.getEast(), bounds.getSouth()],
          [bounds.getWest(), bounds.getSouth()]
        ],
        animate: true
      });
    }
    
    // Add grid overlay showing tile boundaries
    const bounds = map.value.getBounds();
    const z = Math.floor(map.value.getZoom());
    const tileSize = 256 * Math.pow(2, map.value.getZoom() - z);
    
    // Create GeoJSON for tile grid
    const features = [];
    const n = Math.pow(2, z);
    
    for (let x = 0; x < n; x++) {
      for (let y = 0; y < n; y++) {
        // Convert tile coordinates to lat/lng
        const nw = {
          lng: (x / n) * 360 - 180,
          lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI
        };
        const se = {
          lng: ((x + 1) / n) * 360 - 180,
          lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI
        };
        
        // Only add tiles in current viewport
        if (se.lng >= bounds.getWest() && nw.lng <= bounds.getEast() &&
            nw.lat >= bounds.getSouth() && se.lat <= bounds.getNorth()) {
          features.push({
            type: 'Feature',
            properties: {
              tile: `${z}/${x}/${y}`
            },
            geometry: {
              type: 'LineString',
              coordinates: [
                [nw.lng, nw.lat],
                [se.lng, nw.lat],
                [se.lng, se.lat],
                [nw.lng, se.lat],
                [nw.lng, nw.lat]
              ]
            }
          });
          
          // Add label for tile coordinates
          features.push({
            type: 'Feature',
            properties: {
              tile: `${z}/${x}/${y}`,
              x: x,
              y: y,
              z: z
            },
            geometry: {
              type: 'Point',
              coordinates: [(nw.lng + se.lng) / 2, (nw.lat + se.lat) / 2]
            }
          });
        }
      }
    }
    
    // Add or update the tile grid source
    if (map.value.getSource('tile-grid')) {
      (map.value.getSource('tile-grid') as any).setData({
        type: 'FeatureCollection',
        features: features
      });
    } else {
      map.value.addSource('tile-grid', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: features
        }
      });
      
      // Add tile boundary lines
      map.value.addLayer({
        id: 'tile-grid-lines',
        type: 'line',
        source: 'tile-grid',
        filter: ['==', '$type', 'LineString'],
        paint: {
          'line-color': '#ff0000',
          'line-width': 2,
          'line-opacity': 0.7,
          'line-dasharray': [2, 2]
        }
      });
      
      // Add tile coordinate labels
      map.value.addLayer({
        id: 'tile-grid-labels',
        type: 'symbol',
        source: 'tile-grid',
        filter: ['==', '$type', 'Point'],
        layout: {
          'text-field': '{tile}',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 14,
          'text-anchor': 'center'
        },
        paint: {
          'text-color': '#ff0000',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });
    }
    
    // Update grid on map move
    const updateTileGrid = () => {
      if (!map.value || !map.value.getSource('tile-grid')) return;
      
      const bounds = map.value.getBounds();
      const z = Math.floor(map.value.getZoom());
      const features = [];
      const n = Math.pow(2, z);
      
      // Limit the number of tiles shown to prevent performance issues
      const minX = Math.max(0, Math.floor(((bounds.getWest() + 180) / 360) * n) - 1);
      const maxX = Math.min(n - 1, Math.ceil(((bounds.getEast() + 180) / 360) * n) + 1);
      const minY = Math.max(0, Math.floor(((1 - Math.log(Math.tan((bounds.getNorth() * Math.PI) / 180) + 1 / Math.cos((bounds.getNorth() * Math.PI) / 180)) / Math.PI) / 2) * n) - 1);
      const maxY = Math.min(n - 1, Math.ceil(((1 - Math.log(Math.tan((bounds.getSouth() * Math.PI) / 180) + 1 / Math.cos((bounds.getSouth() * Math.PI) / 180)) / Math.PI) / 2) * n) + 1);
      
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          const nw = {
            lng: (x / n) * 360 - 180,
            lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI
          };
          const se = {
            lng: ((x + 1) / n) * 360 - 180,
            lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI
          };
          
          features.push({
            type: 'Feature',
            properties: {
              tile: `${z}/${x}/${y}`
            },
            geometry: {
              type: 'LineString',
              coordinates: [
                [nw.lng, nw.lat],
                [se.lng, nw.lat],
                [se.lng, se.lat],
                [nw.lng, se.lat],
                [nw.lng, nw.lat]
              ]
            }
          });
          
          features.push({
            type: 'Feature',
            properties: {
              tile: `${z}/${x}/${y}`,
              x: x,
              y: y,
              z: z
            },
            geometry: {
              type: 'Point',
              coordinates: [(nw.lng + se.lng) / 2, (nw.lat + se.lat) / 2]
            }
          });
        }
      }
      
      (map.value.getSource('tile-grid') as any).setData({
        type: 'FeatureCollection',
        features: features
      });
    };
    
    map.value.on('moveend', updateTileGrid);
    map.value.on('zoomend', updateTileGrid);
    
  } else {
    // Remove tile debug layers
    if (map.value.getLayer('tile-grid-labels')) {
      map.value.removeLayer('tile-grid-labels');
    }
    if (map.value.getLayer('tile-grid-lines')) {
      map.value.removeLayer('tile-grid-lines');
    }
    if (map.value.getSource('tile-grid')) {
      map.value.removeSource('tile-grid');
    }
    if (map.value.getLayer('tile-boundaries-lines')) {
      map.value.removeLayer('tile-boundaries-lines');
    }
    if (map.value.getSource('tile-boundaries')) {
      map.value.removeSource('tile-boundaries');
    }
    
    // Remove event listeners
    map.value.off('moveend', () => {});
    map.value.off('zoomend', () => {});
  }
}

// Handle location selection from search
function handleLocationSelect(location: any) {
  if (!map.value) return;
  
  // Extract coordinates
  const [lng, lat] = location.center || location.geometry.coordinates;
  
  // Determine appropriate zoom level based on place type
  let zoomLevel = 12; // Default zoom
  if (location.place_type) {
    const placeType = location.place_type[0];
    switch (placeType) {
      case 'country':
        zoomLevel = 5;
        break;
      case 'region':
        zoomLevel = 7;
        break;
      case 'postcode':
      case 'district':
        zoomLevel = 11;
        break;
      case 'place':
      case 'locality':
        zoomLevel = 12;
        break;
      case 'neighborhood':
        zoomLevel = 14;
        break;
      case 'address':
        zoomLevel = 16;
        break;
      case 'poi':
        zoomLevel = 17;
        break;
    }
  }
  
  // If bbox is provided, fit to bounds instead
  if (location.bbox && location.bbox.length === 4) {
    map.value.fitBounds(location.bbox, {
      padding: 50,
      duration: 1000
    });
  } else {
    // Fly to the location
    map.value.flyTo({
      center: [lng, lat],
      zoom: zoomLevel,
      duration: 1000,
      essential: true
    });
  }
  
  // Update local state
  center.value = { lng, lat };
  zoom.value = zoomLevel;
  
  // Mark position as changed
  positionChanged.value = true;
  positionSaved.value = false;
  
  // Optionally add a marker for the searched location
  // This could be enhanced with a temporary marker that disappears after a few seconds
  const marker = new maplibregl.Marker({
    color: '#3b82f6'
  })
    .setLngLat([lng, lat])
    .addTo(map.value);
  
  // Remove marker after 5 seconds
  setTimeout(() => {
    marker.remove();
  }, 5000);
}

// Handle search errors
function handleSearchError(error: Error) {
  console.error('Location search error:', error);
  // You could show a toast notification here
  // For now, we'll just log the error
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