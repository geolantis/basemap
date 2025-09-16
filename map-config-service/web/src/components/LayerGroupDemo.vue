<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Demo Header -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div class="flex items-center">
            <h1 class="text-3xl font-bold text-gray-900">
              Layer Groups Management Demo
            </h1>
          </div>
          <div class="flex space-x-4">
            <Button
              @click="resetDemo"
              outlined
              severity="secondary"
            >
              <i class="pi pi-refresh mr-2"></i>
              Reset Demo
            </Button>
            <Button
              @click="showInstructions = !showInstructions"
              :severity="showInstructions ? 'info' : 'secondary'"
              outlined
            >
              <i class="pi pi-question-circle mr-2"></i>
              {{ showInstructions ? 'Hide' : 'Show' }} Instructions
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Instructions Panel -->
    <div v-if="showInstructions" class="bg-blue-50 border-b border-blue-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="bg-white rounded-lg p-6">
          <h2 class="text-lg font-semibold text-blue-900 mb-4">Demo Instructions</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 class="font-medium text-blue-800 mb-2">1. Browse Components</h3>
              <p class="text-sm text-blue-700">
                View basemap and overlay cards with preview images, type badges, and metadata.
              </p>
            </div>
            <div>
              <h3 class="font-medium text-blue-800 mb-2">2. Create Layer Groups</h3>
              <p class="text-sm text-blue-700">
                Click "Create New Group" to open the configurator and combine basemaps with overlays.
              </p>
            </div>
            <div>
              <h3 class="font-medium text-blue-800 mb-2">3. Drag & Drop</h3>
              <p class="text-sm text-blue-700">
                In the configurator, drag overlay cards to reorder them. Higher positions render on top.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Demo Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Demo Controls -->
      <div class="mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Demo Controls</h2>
            <div class="flex space-x-2">
              <Button
                @click="demoStep = 'cards'"
                :severity="demoStep === 'cards' ? 'primary' : 'secondary'"
                size="small"
                outlined
              >
                Layer Cards
              </Button>
              <Button
                @click="demoStep = 'configurator'"
                :severity="demoStep === 'configurator' ? 'primary' : 'secondary'"
                size="small"
                outlined
              >
                Configurator
              </Button>
              <Button
                @click="demoStep = 'management'"
                :severity="demoStep === 'management' ? 'primary' : 'secondary'"
                size="small"
                outlined
              >
                Management
              </Button>
            </div>
          </div>

          <!-- Step Descriptions -->
          <div class="text-sm text-gray-600">
            <div v-if="demoStep === 'cards'">
              Explore individual basemap and overlay cards with visual previews and metadata.
            </div>
            <div v-if="demoStep === 'configurator'">
              Test the layer group configurator with drag-and-drop overlay reordering.
            </div>
            <div v-if="demoStep === 'management'">
              View the complete layer groups management interface with search, filters, and bulk operations.
            </div>
          </div>
        </div>
      </div>

      <!-- Layer Cards Demo -->
      <div v-if="demoStep === 'cards'" class="space-y-8">
        <!-- Basemap Cards Section -->
        <div>
          <h3 class="text-lg font-medium text-gray-900 mb-4">Basemap Cards</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <BasemapCard
              v-for="basemap in demoBasemaps"
              :key="basemap.id"
              :basemap="basemap"
              :selected="selectedBasemap?.id === basemap.id"
              @select="selectBasemap(basemap)"
            />
          </div>
        </div>

        <!-- Overlay Cards Section -->
        <div>
          <h3 class="text-lg font-medium text-gray-900 mb-4">Overlay Cards</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <OverlayCard
              v-for="overlay in demoOverlays"
              :key="overlay.id"
              :overlay="overlay"
              :selected="isOverlaySelected(overlay.id)"
              :draggable="false"
              :show-controls="true"
              :opacity="getOverlayOpacity(overlay.id)"
              @select="toggleOverlay(overlay)"
              @opacity-change="updateOverlayOpacity(overlay.id, $event)"
            />
          </div>
        </div>

        <!-- Selected Overlays with Drag & Drop -->
        <div v-if="selectedOverlays.length > 0">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            Selected Overlays - Drag to Reorder
          </h3>
          <div class="space-y-3">
            <div
              v-for="(overlay, index) in selectedOverlays"
              :key="overlay.id"
              @dragover.prevent
              @drop="handleDrop(index, $event)"
            >
              <OverlayCard
                :overlay="overlay"
                :draggable="true"
                :show-controls="true"
                :show-actions="true"
                :show-order="true"
                :order="index + 1"
                :opacity="overlayOpacities[overlay.id] || 80"
                @drag-start="handleDragStart(index, $event)"
                @drag-end="handleDragEnd"
                @remove="removeOverlay(index)"
                @opacity-change="updateOverlayOpacity(overlay.id, $event)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Configurator Demo -->
      <div v-if="demoStep === 'configurator'" class="space-y-8">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-900">Layer Group Configurator</h3>
          <Button @click="openConfigurator">
            <i class="pi pi-plus mr-2"></i>
            Open Configurator
          </Button>
        </div>

        <!-- Configuration Preview -->
        <div v-if="currentConfig.basemap || currentConfig.overlays.length > 0" class="bg-white rounded-lg shadow p-6">
          <h4 class="text-md font-medium text-gray-900 mb-4">Current Configuration</h4>

          <!-- Config Summary -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h5 class="text-sm font-medium text-gray-700 mb-2">Layer Group Name</h5>
              <p class="text-sm text-gray-900">{{ currentConfig.name || 'Untitled Group' }}</p>
            </div>
            <div>
              <h5 class="text-sm font-medium text-gray-700 mb-2">Basemap</h5>
              <p class="text-sm text-gray-900">
                {{ currentConfig.basemap?.label || 'None selected' }}
              </p>
            </div>
            <div>
              <h5 class="text-sm font-medium text-gray-700 mb-2">Overlays</h5>
              <p class="text-sm text-gray-900">
                {{ currentConfig.overlays.length }} layer{{ currentConfig.overlays.length !== 1 ? 's' : '' }}
              </p>
            </div>
          </div>

          <!-- Layer Stack Preview -->
          <div v-if="currentConfig.overlays.length > 0" class="mt-6">
            <h5 class="text-sm font-medium text-gray-700 mb-3">Layer Stack (Rendering Order)</h5>
            <div class="space-y-2">
              <div
                v-for="(overlayConfig, index) in [...currentConfig.overlays].reverse()"
                :key="overlayConfig.overlay.id"
                class="flex items-center justify-between bg-gray-50 rounded p-3"
              >
                <div class="flex items-center space-x-3">
                  <div
                    class="w-4 h-4 rounded"
                    :style="{ backgroundColor: getLayerColor(overlayConfig.overlay.type) }"
                  ></div>
                  <span class="text-sm font-medium">{{ overlayConfig.overlay.label }}</span>
                </div>
                <div class="flex items-center space-x-4 text-xs text-gray-500">
                  <span>{{ overlayConfig.opacity }}% opacity</span>
                  <span>Order: {{ currentConfig.overlays.length - index }}</span>
                </div>
              </div>

              <!-- Basemap (always at bottom) -->
              <div v-if="currentConfig.basemap" class="flex items-center justify-between bg-blue-50 rounded p-3 border-t-2 border-blue-200">
                <div class="flex items-center space-x-3">
                  <div
                    class="w-4 h-4 rounded"
                    :style="{ backgroundColor: getLayerColor(currentConfig.basemap.type) }"
                  ></div>
                  <span class="text-sm font-medium">{{ currentConfig.basemap.label }}</span>
                </div>
                <div class="flex items-center space-x-4 text-xs text-gray-500">
                  <span>100% opacity</span>
                  <span>Base Layer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Management Demo -->
      <div v-if="demoStep === 'management'" class="space-y-8">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-900">Layer Groups Management</h3>
          <Button @click="openManagement">
            <i class="pi pi-external-link mr-2"></i>
            Open Management View
          </Button>
        </div>

        <!-- Sample Layer Groups -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <LayerGroupCard
            v-for="group in demoLayerGroups"
            :key="group.id"
            :layer-group="group"
            @preview="previewGroup(group)"
            @edit="editGroup(group)"
            @duplicate="duplicateGroup(group)"
            @delete="deleteGroup(group)"
          />
        </div>
      </div>
    </div>

    <!-- Layer Group Configurator -->
    <LayerGroupConfigurator
      v-model:visible="showConfigurator"
      :layer-group="editingGroup"
      :basemaps="demoBasemaps"
      :overlays="demoOverlays"
      @save="handleSaveGroup"
      @close="closeConfigurator"
    />

    <!-- Toast for notifications -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Toast from 'primevue/toast';

import BasemapCard from './BasemapCard.vue';
import OverlayCard from './OverlayCard.vue';
import LayerGroupCard from './LayerGroupCard.vue';
import LayerGroupConfigurator from './LayerGroupConfigurator.vue';
import type { BasemapLayer, OverlayLayer, LayerGroup, LayerGroupConfig } from '../types';

const router = useRouter();
const toast = useToast();

// Demo State
const demoStep = ref<'cards' | 'configurator' | 'management'>('cards');
const showInstructions = ref(true);
const showConfigurator = ref(false);
const editingGroup = ref<LayerGroup | undefined>(undefined);
const selectedBasemap = ref<BasemapLayer | null>(null);
const selectedOverlays = ref<OverlayLayer[]>([]);
const overlayOpacities = ref<Record<string, number>>({});
const draggedIndex = ref<number | null>(null);

// Current configuration state
const currentConfig = ref<LayerGroupConfig>({
  name: '',
  basemap: null,
  overlays: []
});

// Demo data
const demoBasemaps = ref<BasemapLayer[]>([
  {
    id: 'osm-standard',
    name: 'osm-standard',
    label: 'OpenStreetMap Standard',
    type: 'xyz',
    country: 'Global',
    flag: '🌍',
    isActive: true,
    previewUrl: 'https://picsum.photos/400/300?random=1',
    metadata: { provider: 'OpenStreetMap Foundation' }
  },
  {
    id: 'cartodb-light',
    name: 'cartodb-positron',
    label: 'CartoDB Light',
    type: 'xyz',
    country: 'Global',
    flag: '🌍',
    isActive: true,
    previewUrl: 'https://picsum.photos/400/300?random=2',
    metadata: { provider: 'CartoDB' }
  },
  {
    id: 'satellite',
    name: 'satellite-imagery',
    label: 'Satellite Imagery',
    type: 'wmts',
    country: 'Global',
    flag: '🌍',
    isActive: true,
    previewUrl: 'https://picsum.photos/400/300?random=3',
    metadata: { provider: 'Esri' }
  },
  {
    id: 'terrain',
    name: 'terrain-map',
    label: 'Terrain Map',
    type: 'wmts',
    country: 'Global',
    flag: '🌍',
    isActive: true,
    previewUrl: 'https://picsum.photos/400/300?random=4',
    metadata: { provider: 'USGS' }
  }
]);

const demoOverlays = ref<OverlayLayer[]>([
  {
    id: 'traffic',
    name: 'traffic-layer',
    label: 'Traffic Conditions',
    type: 'vector',
    country: 'Global',
    flag: '🌍',
    isActive: true,
    previewUrl: 'https://picsum.photos/400/300?random=5',
    metadata: { provider: 'Google', supportedBlendModes: ['normal', 'multiply'] }
  },
  {
    id: 'weather',
    name: 'weather-overlay',
    label: 'Weather Data',
    type: 'wms',
    country: 'Global',
    flag: '🌍',
    isActive: true,
    previewUrl: 'https://picsum.photos/400/300?random=6',
    metadata: { provider: 'NOAA' }
  },
  {
    id: 'buildings',
    name: 'buildings-3d',
    label: '3D Buildings',
    type: 'geojson',
    country: 'Global',
    flag: '🌍',
    isActive: true,
    previewUrl: 'https://picsum.photos/400/300?random=7',
    metadata: { provider: 'OSM Buildings' }
  },
  {
    id: 'boundaries',
    name: 'admin-boundaries',
    label: 'Administrative Boundaries',
    type: 'vector',
    country: 'Global',
    flag: '🌍',
    isActive: true,
    previewUrl: 'https://picsum.photos/400/300?random=8',
    metadata: { provider: 'Natural Earth' }
  }
]);

const demoLayerGroups = ref<LayerGroup[]>([
  {
    id: '1',
    name: 'Urban Planning Suite',
    basemap: demoBasemaps.value[0],
    overlays: [
      {
        overlay: demoOverlays.value[0],
        opacity: 80,
        blendMode: 'multiply',
        order: 0
      },
      {
        overlay: demoOverlays.value[2],
        opacity: 60,
        blendMode: 'normal',
        order: 1
      }
    ],
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    createdBy: 'admin'
  },
  {
    id: '2',
    name: 'Weather Analysis',
    basemap: demoBasemaps.value[2],
    overlays: [
      {
        overlay: demoOverlays.value[1],
        opacity: 70,
        blendMode: 'normal',
        order: 0
      }
    ],
    isActive: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
    createdBy: 'weather-admin'
  },
  {
    id: '3',
    name: 'Geographic Context',
    basemap: demoBasemaps.value[1],
    overlays: [
      {
        overlay: demoOverlays.value[3],
        opacity: 90,
        blendMode: 'normal',
        order: 0
      }
    ],
    isActive: false,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-12'),
    createdBy: 'geo-admin'
  }
]);

// Methods
const selectBasemap = (basemap: BasemapLayer) => {
  selectedBasemap.value = basemap;
  currentConfig.value.basemap = basemap;

  toast.add({
    severity: 'success',
    summary: 'Basemap Selected',
    detail: `Selected ${basemap.label}`,
    life: 2000
  });
};

const toggleOverlay = (overlay: OverlayLayer) => {
  const index = selectedOverlays.value.findIndex(o => o.id === overlay.id);
  if (index >= 0) {
    selectedOverlays.value.splice(index, 1);
    delete overlayOpacities.value[overlay.id];
  } else {
    selectedOverlays.value.push(overlay);
    overlayOpacities.value[overlay.id] = 80;
  }

  // Update config
  currentConfig.value.overlays = selectedOverlays.value.map((o, idx) => ({
    overlay: o,
    opacity: overlayOpacities.value[o.id] || 80,
    blendMode: 'normal',
    order: idx
  }));
};

const isOverlaySelected = (overlayId: string) => {
  return selectedOverlays.value.some(o => o.id === overlayId);
};

const getOverlayOpacity = (overlayId: string) => {
  return overlayOpacities.value[overlayId] || 80;
};

const updateOverlayOpacity = (overlayId: string, opacity: number) => {
  overlayOpacities.value[overlayId] = opacity;

  // Update config
  const configIndex = currentConfig.value.overlays.findIndex(c => c.overlay.id === overlayId);
  if (configIndex >= 0) {
    currentConfig.value.overlays[configIndex].opacity = opacity;
  }
};

const removeOverlay = (index: number) => {
  const overlay = selectedOverlays.value[index];
  selectedOverlays.value.splice(index, 1);
  delete overlayOpacities.value[overlay.id];

  // Update config
  currentConfig.value.overlays.splice(index, 1);

  toast.add({
    severity: 'info',
    summary: 'Overlay Removed',
    detail: `Removed ${overlay.label}`,
    life: 2000
  });
};

// Drag and drop handlers
const handleDragStart = (index: number, event: DragEvent) => {
  draggedIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
};

const handleDragEnd = () => {
  draggedIndex.value = null;
};

const handleDrop = (targetIndex: number, event: DragEvent) => {
  event.preventDefault();
  if (draggedIndex.value !== null && draggedIndex.value !== targetIndex) {
    const draggedItem = selectedOverlays.value.splice(draggedIndex.value, 1)[0];
    selectedOverlays.value.splice(targetIndex, 0, draggedItem);

    // Update config
    currentConfig.value.overlays = selectedOverlays.value.map((o, idx) => ({
      overlay: o,
      opacity: overlayOpacities.value[o.id] || 80,
      blendMode: 'normal',
      order: idx
    }));

    toast.add({
      severity: 'success',
      summary: 'Overlays Reordered',
      detail: 'Layer stack updated',
      life: 2000
    });
  }
  draggedIndex.value = null;
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

const openConfigurator = () => {
  showConfigurator.value = true;
};

const closeConfigurator = () => {
  editingGroup.value = undefined;
  showConfigurator.value = false;
};

const handleSaveGroup = (config: LayerGroupConfig) => {
  currentConfig.value = { ...config };

  toast.add({
    severity: 'success',
    summary: 'Layer Group Saved',
    detail: `Saved "${config.name}" with ${config.overlays.length} overlays`,
    life: 3000
  });
};

const openManagement = () => {
  router.push('/layer-groups');
};

const previewGroup = (group: LayerGroup) => {
  router.push(`/layer-groups/${group.id}/preview`);
};

const editGroup = (group: LayerGroup) => {
  editingGroup.value = group;
  showConfigurator.value = true;
};

const duplicateGroup = (group: LayerGroup) => {
  toast.add({
    severity: 'success',
    summary: 'Group Duplicated',
    detail: `Created copy of "${group.name}"`,
    life: 3000
  });
};

const deleteGroup = (group: LayerGroup) => {
  toast.add({
    severity: 'error',
    summary: 'Group Deleted',
    detail: `Deleted "${group.name}"`,
    life: 3000
  });
};

const resetDemo = () => {
  selectedBasemap.value = null;
  selectedOverlays.value = [];
  overlayOpacities.value = {};
  currentConfig.value = {
    name: '',
    basemap: null,
    overlays: []
  };
  demoStep.value = 'cards';

  toast.add({
    severity: 'info',
    summary: 'Demo Reset',
    detail: 'All selections cleared',
    life: 2000
  });
};
</script>