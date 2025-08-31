<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-lg shadow-xl w-11/12 h-5/6 max-w-6xl flex flex-col">
      <!-- Header -->
      <div class="flex justify-between items-center p-4 border-b">
        <div>
          <h3 class="text-xl font-semibold flex items-center gap-2">
            <span>{{ map.flag }}</span>
            {{ map.label }}
          </h3>
          <p class="text-sm text-gray-600">{{ map.provider }} - {{ map.type.toUpperCase() }}</p>
        </div>
        <button
          @click="$emit('close')"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <i class="pi pi-times text-gray-600"></i>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 flex">
        <!-- Map Preview -->
        <div class="flex-1 relative">
          <div ref="mapContainer" class="w-full h-full"></div>
          
          <!-- Map Controls -->
          <div class="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 space-y-2">
            <button
              @click="zoomIn"
              class="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
              title="Zoom In"
            >
              <i class="pi pi-plus"></i>
            </button>
            <button
              @click="zoomOut"
              class="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
              title="Zoom Out"
            >
              <i class="pi pi-minus"></i>
            </button>
            <button
              @click="resetView"
              class="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
              title="Reset View"
            >
              <i class="pi pi-refresh"></i>
            </button>
          </div>

          <!-- Coordinates Display -->
          <div class="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2 text-sm">
            <span class="font-medium">Zoom:</span> {{ currentZoom.toFixed(1) }} |
            <span class="font-medium">Center:</span> {{ currentCenter.lat.toFixed(4) }}, {{ currentCenter.lng.toFixed(4) }}
          </div>

          <!-- Loading/Error State -->
          <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div class="text-center">
              <i class="pi pi-spin pi-spinner text-4xl text-primary mb-2"></i>
              <p class="text-gray-600">Loading map...</p>
            </div>
          </div>
          
          <div v-if="error" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div class="text-center">
              <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-2"></i>
              <p class="text-red-600">{{ error }}</p>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="w-80 border-l p-4 overflow-y-auto">
          <!-- Validation Results -->
          <div class="mb-6">
            <h4 class="font-semibold mb-3">Validation Results</h4>
            <div v-if="map.validation" class="space-y-2">
              <div
                class="flex items-center justify-between p-2 rounded"
                :class="{
                  'bg-green-50': map.validation.status === 'valid',
                  'bg-yellow-50': map.validation.status === 'warning',
                  'bg-red-50': map.validation.status === 'invalid'
                }"
              >
                <span class="font-medium">Status</span>
                <span
                  class="px-2 py-1 text-xs font-medium rounded"
                  :class="{
                    'bg-green-200 text-green-800': map.validation.status === 'valid',
                    'bg-yellow-200 text-yellow-800': map.validation.status === 'warning',
                    'bg-red-200 text-red-800': map.validation.status === 'invalid'
                  }"
                >
                  {{ map.validation.status.toUpperCase() }}
                </span>
              </div>

              <div class="space-y-1">
                <div
                  v-for="(passed, test) in map.validation.tests"
                  :key="test"
                  class="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <span class="text-sm capitalize">{{ test }}</span>
                  <i
                    class="pi"
                    :class="passed ? 'pi-check-circle text-green-500' : 'pi-times-circle text-red-500'"
                  ></i>
                </div>
              </div>

              <div v-if="map.validation.errors.length > 0" class="mt-3">
                <p class="text-sm font-medium text-red-700 mb-1">Errors:</p>
                <ul class="text-xs text-red-600 space-y-1">
                  <li v-for="error in map.validation.errors" :key="error" class="flex items-start">
                    <i class="pi pi-exclamation-circle mt-0.5 mr-1"></i>
                    {{ error }}
                  </li>
                </ul>
              </div>

              <div v-if="map.validation.warnings.length > 0" class="mt-3">
                <p class="text-sm font-medium text-yellow-700 mb-1">Warnings:</p>
                <ul class="text-xs text-yellow-600 space-y-1">
                  <li v-for="warning in map.validation.warnings" :key="warning" class="flex items-start">
                    <i class="pi pi-exclamation-triangle mt-0.5 mr-1"></i>
                    {{ warning }}
                  </li>
                </ul>
              </div>
            </div>
            <div v-else class="text-sm text-gray-500">
              No validation data available
            </div>
          </div>

          <!-- Map Details -->
          <div class="mb-6">
            <h4 class="font-semibold mb-3">Map Details</h4>
            <dl class="space-y-2 text-sm">
              <div>
                <dt class="text-gray-600">Type</dt>
                <dd class="font-medium">{{ map.type.toUpperCase() }}</dd>
              </div>
              <div>
                <dt class="text-gray-600">Provider</dt>
                <dd class="font-medium">{{ map.provider }}</dd>
              </div>
              <div>
                <dt class="text-gray-600">Country</dt>
                <dd class="font-medium">{{ map.country }}</dd>
              </div>
              <div>
                <dt class="text-gray-600">Confidence</dt>
                <dd class="font-medium">{{ Math.round(map.confidence * 100) }}%</dd>
              </div>
              <div v-if="map.url">
                <dt class="text-gray-600">URL</dt>
                <dd class="font-mono text-xs break-all">{{ map.url }}</dd>
              </div>
              <div v-if="map.styleUrl">
                <dt class="text-gray-600">Style URL</dt>
                <dd class="font-mono text-xs break-all">{{ map.styleUrl }}</dd>
              </div>
            </dl>
          </div>

          <!-- Actions -->
          <div class="space-y-2">
            <button
              @click="$emit('accept', map)"
              class="w-full btn-primary flex items-center justify-center gap-2"
              :disabled="map.validation?.status === 'invalid'"
            >
              <i class="pi pi-check"></i>
              Add to Map Pool
            </button>
            <button
              @click="$emit('close')"
              class="w-full btn-secondary flex items-center justify-center gap-2"
            >
              <i class="pi pi-times"></i>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const props = defineProps<{
  map: any;
}>();

const emit = defineEmits<{
  close: [];
  accept: [map: any];
}>();

// Refs
const mapContainer = ref<HTMLElement>();
const mapInstance = ref<maplibregl.Map | null>(null);
const loading = ref(true);
const error = ref('');
const currentZoom = ref(10);
const currentCenter = ref({ lat: 47.5, lng: 13.5 }); // Default to Austria

// Initialize map
onMounted(() => {
  if (!mapContainer.value) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    // Determine map style based on type
    let style: any;
    
    if (props.map.type === 'vtc' && props.map.styleUrl) {
      // Vector tiles with style
      style = props.map.styleUrl;
    } else if (props.map.type === 'wmts' || props.map.type === 'wms') {
      // Raster tiles
      style = {
        version: 8,
        sources: {
          'raster-source': {
            type: 'raster',
            tiles: [props.map.url],
            tileSize: 256
          }
        },
        layers: [{
          id: 'raster-layer',
          type: 'raster',
          source: 'raster-source'
        }]
      };
    } else {
      throw new Error('Unsupported map type');
    }
    
    // Create map
    mapInstance.value = new maplibregl.Map({
      container: mapContainer.value,
      style: style,
      center: [currentCenter.value.lng, currentCenter.value.lat],
      zoom: currentZoom.value
    });
    
    // Add navigation controls
    mapInstance.value.addControl(new maplibregl.NavigationControl(), 'top-left');
    
    // Update state on map events
    mapInstance.value.on('load', () => {
      loading.value = false;
    });
    
    mapInstance.value.on('error', (e) => {
      console.error('Map error:', e);
      error.value = 'Failed to load map';
      loading.value = false;
    });
    
    mapInstance.value.on('zoom', () => {
      currentZoom.value = mapInstance.value!.getZoom();
    });
    
    mapInstance.value.on('move', () => {
      const center = mapInstance.value!.getCenter();
      currentCenter.value = {
        lat: center.lat,
        lng: center.lng
      };
    });
  } catch (err) {
    console.error('Failed to initialize map:', err);
    error.value = err instanceof Error ? err.message : 'Failed to initialize map';
    loading.value = false;
  }
});

// Cleanup
onUnmounted(() => {
  if (mapInstance.value) {
    mapInstance.value.remove();
  }
});

// Map controls
function zoomIn() {
  if (mapInstance.value) {
    mapInstance.value.zoomIn();
  }
}

function zoomOut() {
  if (mapInstance.value) {
    mapInstance.value.zoomOut();
  }
}

function resetView() {
  if (mapInstance.value) {
    mapInstance.value.flyTo({
      center: [13.5, 47.5],
      zoom: 10
    });
  }
}
</script>