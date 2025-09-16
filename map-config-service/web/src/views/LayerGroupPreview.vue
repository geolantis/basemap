<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <Button
            @click="$router.go(-1)"
            outlined
            size="small"
          >
            <i class="pi pi-arrow-left mr-2"></i>
            Back
          </Button>

          <div v-if="layerGroup">
            <h1 class="text-2xl font-bold text-gray-900">{{ layerGroup.name }}</h1>
            <p class="text-sm text-gray-500">
              {{ layerGroup.basemap?.label || 'No basemap' }}
              <span v-if="layerGroup.overlays.length > 0">
                + {{ layerGroup.overlays.length }} overlay{{ layerGroup.overlays.length > 1 ? 's' : '' }}
              </span>
            </p>
          </div>
          <div v-else>
            <div class="animate-pulse">
              <div class="h-8 bg-gray-300 rounded w-48 mb-2"></div>
              <div class="h-4 bg-gray-300 rounded w-64"></div>
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <Button
            @click="showLayerStack = !showLayerStack"
            outlined
            size="small"
          >
            <i class="pi pi-layers mr-2"></i>
            {{ showLayerStack ? 'Hide' : 'Show' }} Layers
          </Button>

          <Button
            v-if="layerGroup"
            @click="editGroup"
            size="small"
          >
            <i class="pi pi-pencil mr-2"></i>
            Edit Group
          </Button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Layer Stack Panel -->
      <div
        v-if="showLayerStack && layerGroup"
        class="w-80 bg-white border-r border-gray-200 flex flex-col"
      >
        <div class="flex-shrink-0 p-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">Layer Stack</h2>
          <p class="text-sm text-gray-500">Rendering order (top to bottom)</p>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          <!-- Overlays (top to bottom) -->
          <div v-for="(overlayConfig, index) in [...layerGroup.overlays].reverse()" :key="overlayConfig.overlay.id">
            <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-900 truncate">
                  {{ overlayConfig.overlay.label }}
                </span>
                <div class="flex items-center space-x-2">
                  <span class="text-xs text-gray-500">{{ overlayConfig.opacity }}%</span>
                  <div
                    class="w-4 h-4 rounded border border-gray-300"
                    :style="{ backgroundColor: getLayerColor(overlayConfig.overlay.type) }"
                  ></div>
                </div>
              </div>

              <div class="flex items-center justify-between text-xs text-gray-500">
                <span>{{ overlayConfig.overlay.type.toUpperCase() }}</span>
                <span>Order: {{ layerGroup.overlays.length - index }}</span>
              </div>

              <div class="mt-2">
                <div class="text-xs text-gray-500 mb-1">Opacity</div>
                <div class="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    class="bg-blue-500 h-1.5 rounded-full"
                    :style="{ width: overlayConfig.opacity + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Basemap (bottom) -->
          <div v-if="layerGroup.basemap" class="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-900 truncate">
                {{ layerGroup.basemap.label }}
              </span>
              <div class="flex items-center space-x-2">
                <span class="text-xs text-gray-500">100%</span>
                <div
                  class="w-4 h-4 rounded border border-gray-300"
                  :style="{ backgroundColor: getLayerColor(layerGroup.basemap.type) }"
                ></div>
              </div>
            </div>

            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>{{ layerGroup.basemap.type.toUpperCase() }}</span>
              <span>Base Layer</span>
            </div>

            <div class="mt-2">
              <div class="text-xs text-gray-500 mb-1">Base Map</div>
              <div class="w-full bg-blue-200 rounded-full h-1.5">
                <div class="bg-blue-500 h-1.5 rounded-full w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Map Preview Area -->
      <div class="flex-1 bg-gray-100 relative">
        <div v-if="layerGroup" class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <i class="pi pi-map text-6xl text-gray-400 mb-4"></i>
            <h3 class="text-xl font-medium text-gray-700 mb-2">Interactive Map Preview</h3>
            <p class="text-gray-500 mb-4">
              Layer Group: {{ layerGroup.name }}
            </p>
            <div class="bg-white bg-opacity-90 rounded-lg p-4 max-w-md">
              <h4 class="text-sm font-medium text-gray-900 mb-2">Layer Composition</h4>
              <div class="text-left space-y-1">
                <div class="flex justify-between items-center text-sm">
                  <span>Basemap:</span>
                  <span class="text-blue-600">{{ layerGroup.basemap?.label || 'None' }}</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                  <span>Overlays:</span>
                  <span class="text-green-600">{{ layerGroup.overlays.length }} layer{{ layerGroup.overlays.length !== 1 ? 's' : '' }}</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                  <span>Total Layers:</span>
                  <span class="font-medium">{{ (layerGroup.basemap ? 1 : 0) + layerGroup.overlays.length }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <i class="pi pi-spinner pi-spin text-4xl text-gray-400 mb-4"></i>
            <p class="text-gray-500">Loading layer group...</p>
          </div>
        </div>

        <!-- Error state -->
        <div v-if="error" class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <i class="pi pi-exclamation-triangle text-4xl text-red-400 mb-4"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Layer Group</h3>
            <p class="text-gray-500 mb-4">{{ error }}</p>
            <Button @click="loadLayerGroup" outlined>
              <i class="pi pi-refresh mr-2"></i>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import type { LayerGroup } from '../types';

const route = useRoute();
const router = useRouter();

// State
const layerGroup = ref<LayerGroup | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const showLayerStack = ref(true);

// Computed
const groupId = computed(() => route.params.id as string);

// Methods
const loadLayerGroup = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Mock data - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading

    // Mock layer group data
    layerGroup.value = {
      id: groupId.value,
      name: 'Urban Planning Demo',
      basemap: {
        id: 'osm-carto',
        name: 'openstreetmap-carto',
        label: 'OpenStreetMap Carto',
        type: 'xyz',
        country: 'Global',
        flag: '🌍',
        isActive: true,
        previewUrl: '/api/preview/osm-carto.png',
        metadata: { provider: 'OpenStreetMap' }
      },
      overlays: [
        {
          overlay: {
            id: 'buildings',
            name: 'building-overlay',
            label: 'Buildings Layer',
            type: 'geojson',
            country: 'Global',
            flag: '🌍',
            isActive: true,
            previewUrl: '/api/preview/buildings.png',
            metadata: { provider: 'Local GIS' }
          },
          opacity: 80,
          blendMode: 'multiply',
          order: 0
        },
        {
          overlay: {
            id: 'roads',
            name: 'roads-overlay',
            label: 'Road Network',
            type: 'vector',
            country: 'Global',
            flag: '🌍',
            isActive: true,
            previewUrl: '/api/preview/roads.png',
            metadata: { provider: 'OSM' }
          },
          opacity: 60,
          blendMode: 'normal',
          order: 1
        }
      ],
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      createdBy: 'admin'
    };
  } catch (err) {
    console.error('Error loading layer group:', err);
    error.value = 'Failed to load layer group. Please try again.';
  } finally {
    loading.value = false;
  }
};

const editGroup = () => {
  router.push('/layer-groups');
};

const getLayerColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'vtc': return '#3b82f6';
    case 'wmts': return '#10b981';
    case 'wms': return '#8b5cf6';
    case 'xyz': return '#f59e0b';
    case 'geojson': return '#eab308';
    case 'vector': return '#06b6d4';
    default: return '#6b7280';
  }
};

// Lifecycle
onMounted(() => {
  loadLayerGroup();
});
</script>