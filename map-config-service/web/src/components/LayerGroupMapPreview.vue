<template>
  <div class="layer-group-map-preview">
    <!-- Map Container -->
    <div ref="mapContainer" class="map-container"></div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="preview-overlay">
      <div class="text-center">
        <i class="pi pi-spin pi-spinner text-4xl text-primary mb-2"></i>
        <p class="text-gray-600">Loading map preview...</p>
      </div>
    </div>

    <!-- Error Overlay -->
    <div v-if="error && !loading" class="preview-overlay">
      <div class="text-center">
        <i class="pi pi-exclamation-triangle text-4xl text-yellow-500 mb-2"></i>
        <p class="text-gray-600">{{ error }}</p>
        <button @click="initMap" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Retry
        </button>
      </div>
    </div>

    <!-- No Basemap Selected -->
    <div v-if="!basemap && !loading" class="preview-overlay">
      <div class="text-center">
        <i class="pi pi-map text-4xl text-gray-400 mb-2"></i>
        <p class="text-gray-600">Select a basemap to see preview</p>
      </div>
    </div>

    <!-- Map Controls -->
    <div v-if="map && !loading && !error" class="map-controls">
      <button @click="zoomIn" class="control-button" title="Zoom In">
        <i class="pi pi-plus"></i>
      </button>
      <button @click="zoomOut" class="control-button" title="Zoom Out">
        <i class="pi pi-minus"></i>
      </button>
      <button @click="resetView" class="control-button" title="Reset View">
        <i class="pi pi-refresh"></i>
      </button>
    </div>

    <!-- Layer Toggle Controls -->
    <div v-if="map && overlays.length > 0 && !loading && !error" class="layer-controls">
      <div class="layer-control-header">
        <i class="pi pi-layers"></i>
        <span>Layers</span>
      </div>
      <div class="layer-control-list">
        <div v-for="(overlay, index) in overlays" :key="overlay.overlay.id" class="layer-control-item">
          <label class="flex items-center justify-between">
            <span class="text-xs truncate">{{ overlay.overlay.label }}</span>
            <input
              type="checkbox"
              :checked="overlayVisibility[overlay.overlay.id] !== false"
              @change="toggleOverlay(overlay.overlay.id)"
              class="ml-2"
            />
          </label>
        </div>
      </div>
    </div>

    <!-- Coordinates Display -->
    <div v-if="map && !loading && !error" class="coordinates-display">
      <span class="font-medium">Zoom:</span> {{ currentZoom }} |
      <span class="font-medium">Center:</span> {{ currentCenter.lat }}, {{ currentCenter.lng }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import maplibregl from 'maplibre-gl';
import type { BasemapLayer, OverlayLayer } from '../types';

interface Props {
  basemap: BasemapLayer | null;
  overlays: Array<{
    overlay: OverlayLayer;
    opacity: number;
    blendMode?: string;
    order: number;
  }>;
}

const props = defineProps<Props>();

// Template refs
const mapContainer = ref<HTMLDivElement>();

// State
const map = ref<maplibregl.Map | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const currentZoom = ref(10);
const currentCenter = ref({ lat: 46.8182, lng: 8.2275 }); // Switzerland center
const overlayVisibility = ref<Record<string, boolean>>({});

// Initialize map
const initMap = async () => {
  if (!mapContainer.value || !props.basemap) return;

  loading.value = true;
  error.value = null;

  try {
    // Clean up existing map
    if (map.value) {
      map.value.remove();
      map.value = null;
    }

    // Determine appropriate center based on basemap country
    const center = getMapCenter(props.basemap);

    // Create map instance
    map.value = new maplibregl.Map({
      container: mapContainer.value,
      style: props.basemap.style || {
        version: 8,
        sources: {},
        layers: []
      },
      center: [center.lng, center.lat],
      zoom: center.zoom,
      attributionControl: true
    });

    // Wait for map to load
    await new Promise<void>((resolve, reject) => {
      if (!map.value) {
        reject(new Error('Map initialization failed'));
        return;
      }

      map.value.on('load', () => resolve());
      map.value.on('error', (e) => reject(e.error));
    });

    // Add overlays
    if (props.overlays && props.overlays.length > 0) {
      for (const overlayConfig of props.overlays) {
        await addOverlayLayer(overlayConfig);
      }
    }

    // Update current position
    if (map.value) {
      const center = map.value.getCenter();
      currentCenter.value = { lat: center.lat, lng: center.lng };
      currentZoom.value = Math.round(map.value.getZoom());

      // Listen to map movements
      map.value.on('move', () => {
        if (!map.value) return;
        const center = map.value.getCenter();
        currentCenter.value = {
          lat: Math.round(center.lat * 10000) / 10000,
          lng: Math.round(center.lng * 10000) / 10000
        };
        currentZoom.value = Math.round(map.value.getZoom() * 10) / 10;
      });
    }

  } catch (err) {
    console.error('Failed to initialize map:', err);
    error.value = 'Failed to load map preview. The basemap style may not be available.';
  } finally {
    loading.value = false;
  }
};

// Add overlay layer to map
const addOverlayLayer = async (overlayConfig: any) => {
  if (!map.value || !overlayConfig.overlay.style) return;

  try {
    const overlayId = `overlay-${overlayConfig.overlay.id}`;

    // Add source if it's a URL
    if (typeof overlayConfig.overlay.style === 'string') {
      // For now, we'll skip URL-based overlays as they need proper handling
      console.log('Overlay style URL:', overlayConfig.overlay.style);
    }

    // Set initial visibility
    overlayVisibility.value[overlayConfig.overlay.id] = true;

  } catch (err) {
    console.error('Failed to add overlay:', err);
  }
};

// Get appropriate map center based on country
const getMapCenter = (basemap: BasemapLayer) => {
  const countryMap: Record<string, { lat: number; lng: number; zoom: number }> = {
    'Austria': { lat: 47.5162, lng: 14.5501, zoom: 7 },
    'Switzerland': { lat: 46.8182, lng: 8.2275, zoom: 7 },
    'Germany': { lat: 51.1657, lng: 10.4515, zoom: 6 },
    'Italy': { lat: 41.8719, lng: 12.5674, zoom: 5 },
    'France': { lat: 46.2276, lng: 2.2137, zoom: 5 },
    'Global': { lat: 0, lng: 0, zoom: 2 },
  };

  return countryMap[basemap.country || 'Global'] || countryMap['Global'];
};

// Map controls
const zoomIn = () => {
  if (map.value) {
    map.value.zoomIn();
  }
};

const zoomOut = () => {
  if (map.value) {
    map.value.zoomOut();
  }
};

const resetView = () => {
  if (map.value && props.basemap) {
    const center = getMapCenter(props.basemap);
    map.value.flyTo({
      center: [center.lng, center.lat],
      zoom: center.zoom,
      duration: 1000
    });
  }
};

const toggleOverlay = (overlayId: string) => {
  if (!map.value) return;

  const layerId = `overlay-${overlayId}`;
  const visibility = overlayVisibility.value[overlayId] !== false;

  // Toggle visibility
  overlayVisibility.value[overlayId] = !visibility;

  // Update map layer visibility (if layer exists)
  try {
    if (map.value.getLayer(layerId)) {
      map.value.setLayoutProperty(
        layerId,
        'visibility',
        !visibility ? 'visible' : 'none'
      );
    }
  } catch (err) {
    console.error('Failed to toggle overlay:', err);
  }
};

// Watch for basemap changes
watch(() => props.basemap, () => {
  initMap();
});

// Watch for overlay changes
watch(() => props.overlays, () => {
  initMap();
}, { deep: true });

// Lifecycle
onMounted(() => {
  initMap();
});

onUnmounted(() => {
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
});
</script>

<style scoped>
.layer-group-map-preview {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: #f3f4f6;
  border-radius: 8px;
  overflow: hidden;
}

.map-container {
  width: 100%;
  height: 100%;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 10;
}

.map-controls {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 20;
}

.control-button {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.control-button:hover {
  background: #f3f4f6;
}

.control-button:not(:last-child) {
  border-bottom: 1px solid #e5e7eb;
}

.layer-controls {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  width: 200px;
  z-index: 20;
}

.layer-control-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  font-size: 0.875rem;
}

.layer-control-list {
  max-height: 200px;
  overflow-y: auto;
}

.layer-control-item {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.layer-control-item:last-child {
  border-bottom: none;
}

.coordinates-display {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-size: 0.875rem;
  z-index: 20;
}

/* MapLibre GL styles */
:deep(.maplibregl-ctrl-attrib) {
  font-size: 10px;
}

:deep(.maplibregl-ctrl-attrib-button) {
  display: none;
}
</style>