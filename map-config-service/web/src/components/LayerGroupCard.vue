<template>
  <div
    class="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
    :class="{ 'ring-2 ring-blue-500 ring-opacity-50': selected }"
  >
    <!-- Preview Stack -->
    <div class="aspect-video bg-gray-100 relative overflow-hidden">
      <!-- Basemap Preview -->
      <div class="absolute inset-0">
        <img
          v-if="layerGroup.basemap?.previewUrl"
          :src="layerGroup.basemap.previewUrl"
          :alt="layerGroup.basemap.label"
          class="w-full h-full object-cover"
          loading="lazy"
        />
        <div v-else class="absolute inset-0 flex items-center justify-center bg-gray-200">
          <div class="text-center">
            <i class="pi pi-map text-2xl text-gray-400 mb-2"></i>
            <p class="text-xs text-gray-500">No Basemap</p>
          </div>
        </div>
      </div>

      <!-- Overlay Previews (stacked with opacity) -->
      <div
        v-for="(overlayConfig, index) in layerGroup.overlays.slice(0, 3)"
        :key="overlayConfig.overlay.id"
        class="absolute inset-0"
        :style="{ opacity: overlayConfig.opacity / 100 }"
      >
        <img
          v-if="overlayConfig.overlay.previewUrl"
          :src="overlayConfig.overlay.previewUrl"
          :alt="overlayConfig.overlay.label"
          class="w-full h-full object-cover"
          :style="{ mixBlendMode: overlayConfig.blendMode }"
          loading="lazy"
        />
      </div>

      <!-- Layer Count Indicator -->
      <div class="absolute top-2 right-2">
        <div class="bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
          <i class="pi pi-layers"></i>
          <span>{{ 1 + layerGroup.overlays.length }}</span>
        </div>
      </div>

      <!-- More Overlays Indicator -->
      <div v-if="layerGroup.overlays.length > 3" class="absolute top-2 left-2">
        <div class="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
          +{{ layerGroup.overlays.length - 3 }} more
        </div>
      </div>

      <!-- Hover Actions Overlay -->
      <div class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
        <div class="flex space-x-2">
          <Button
            @click.stop="$emit('preview')"
            rounded
            outlined
            severity="secondary"
            size="small"
            class="bg-white"
          >
            <i class="pi pi-eye"></i>
          </Button>
          <Button
            @click.stop="$emit('edit')"
            rounded
            outlined
            severity="info"
            size="small"
            class="bg-white"
          >
            <i class="pi pi-pencil"></i>
          </Button>
        </div>
      </div>
    </div>

    <!-- Card Content -->
    <div class="p-4">
      <!-- Header -->
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center mb-1">
            <span v-if="layerGroup.country && layerGroup.countryFlag" class="text-lg mr-2">
              {{ layerGroup.countryFlag }}
            </span>
            <h3 class="text-lg font-semibold text-gray-900 truncate">
              {{ layerGroup.name }}
            </h3>
          </div>
          <p class="text-sm text-gray-500">
            {{ layerGroup.basemap?.label || 'No basemap' }}
            <span v-if="layerGroup.overlays.length > 0">
              + {{ layerGroup.overlays.length }} overlay{{ layerGroup.overlays.length > 1 ? 's' : '' }}
            </span>
          </p>
        </div>

        <!-- Status Badge -->
        <span
          class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
          :class="layerGroup.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
        >
          {{ layerGroup.isActive ? 'Active' : 'Inactive' }}
        </span>
      </div>

      <!-- Basemap Info -->
      <div v-if="layerGroup.basemap" class="mb-3">
        <div class="flex items-center space-x-2 text-sm">
          <div class="w-4 h-4 rounded-sm border border-gray-300"
               :style="{ backgroundColor: getLayerColor(layerGroup.basemap.type) }">
          </div>
          <span class="font-medium text-gray-700">{{ layerGroup.basemap.type.toUpperCase() }}</span>
          <span class="text-gray-500">•</span>
          <span class="text-gray-500 flex items-center">
            {{ layerGroup.country || layerGroup.basemap.country || 'Global' }}
          </span>
        </div>
      </div>

      <!-- Overlay Stack Preview -->
      <div v-if="layerGroup.overlays.length > 0" class="mb-3">
        <div class="text-xs font-medium text-gray-700 mb-2">Overlays ({{ layerGroup.overlays.length }})</div>
        <div class="space-y-1">
          <div
            v-for="(overlayConfig, index) in layerGroup.overlays.slice(0, 3)"
            :key="overlayConfig.overlay.id"
            class="flex items-center justify-between text-xs"
          >
            <div class="flex items-center space-x-2 flex-1 min-w-0">
              <div class="w-3 h-3 rounded-sm border border-gray-300"
                   :style="{ backgroundColor: getLayerColor(overlayConfig.overlay.type) }">
              </div>
              <span class="truncate">{{ overlayConfig.overlay.label }}</span>
            </div>
            <span class="text-gray-500 ml-2">{{ overlayConfig.opacity }}%</span>
          </div>
          <div v-if="layerGroup.overlays.length > 3" class="text-xs text-gray-500 italic pl-5">
            and {{ layerGroup.overlays.length - 3 }} more...
          </div>
        </div>
      </div>

      <!-- Metadata -->
      <div class="flex items-center justify-between text-xs text-gray-500">
        <div class="flex items-center space-x-2">
          <i class="pi pi-calendar"></i>
          <span>{{ formatDate(layerGroup.updatedAt) }}</span>
        </div>
        <div class="flex items-center space-x-2">
          <i class="pi pi-user"></i>
          <span>{{ layerGroup.createdBy || 'System' }}</span>
        </div>
      </div>
    </div>

    <!-- Card Actions -->
    <div class="px-4 py-3 bg-gray-50 border-t border-gray-100">
      <div class="flex justify-between items-center">
        <!-- Left Actions -->
        <div class="flex space-x-2">
          <Button
            @click="$emit('preview')"
            size="small"
            outlined
            severity="secondary"
          >
            <i class="pi pi-eye mr-1"></i>
            Preview
          </Button>
        </div>

        <!-- Right Actions -->
        <div class="flex space-x-2">
          <Button
            @click="$emit('duplicate')"
            size="small"
            outlined
            severity="info"
            v-tooltip="'Duplicate layer group'"
          >
            <i class="pi pi-copy"></i>
          </Button>

          <Button
            @click="$emit('edit')"
            size="small"
            outlined
            severity="info"
          >
            <i class="pi pi-pencil mr-1"></i>
            Edit
          </Button>

          <Button
            @click="$emit('delete')"
            size="small"
            outlined
            severity="danger"
          >
            <i class="pi pi-trash mr-1"></i>
            Delete
          </Button>
        </div>
      </div>
    </div>

    <!-- Selection Checkbox (if in selection mode) -->
    <div v-if="showSelection" class="absolute top-3 left-3">
      <input
        :checked="selected"
        @change="$emit('toggle-selection')"
        type="checkbox"
        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded bg-white bg-opacity-90"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Button from 'primevue/button';
import { formatDistanceToNow } from 'date-fns';
import type { LayerGroup } from '../types';

interface Props {
  layerGroup: LayerGroup;
  selected?: boolean;
  showSelection?: boolean;
}

interface Emits {
  (e: 'preview'): void;
  (e: 'edit'): void;
  (e: 'duplicate'): void;
  (e: 'delete'): void;
  (e: 'toggle-selection'): void;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  showSelection: false,
});

const emit = defineEmits<Emits>();

const getLayerColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'vtc': return '#3b82f6';
    case 'wmts': return '#10b981';
    case 'wms': return '#8b5cf6';
    case 'xyz': return '#f59e0b';
    case 'geojson': return '#eab308';
    default: return '#6b7280';
  }
};

const formatDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};
</script>