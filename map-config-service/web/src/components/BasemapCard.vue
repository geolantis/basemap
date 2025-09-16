<template>
  <div
    class="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer"
    :class="{
      'ring-2 ring-blue-500 ring-opacity-50': selected,
      'opacity-50': disabled
    }"
    @click="!disabled && $emit('select')"
  >
    <!-- Preview Image -->
    <div class="aspect-video bg-gray-100 relative overflow-hidden">
      <img
        v-if="basemap.previewUrl"
        :src="basemap.previewUrl"
        :alt="basemap.label"
        class="w-full h-full object-cover"
        loading="lazy"
      />
      <div v-else class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <i class="pi pi-map text-2xl text-gray-400 mb-2"></i>
          <p class="text-xs text-gray-500">No Preview</p>
        </div>
      </div>

      <!-- Selection Overlay -->
      <div v-if="selected" class="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
        <div class="bg-white rounded-full p-2">
          <i class="pi pi-check text-blue-600 text-xl"></i>
        </div>
      </div>

      <!-- Map Type Badge -->
      <div class="absolute top-2 right-2">
        <span
          class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
          :class="getTypeColor(basemap.type)"
        >
          {{ basemap.type.toUpperCase() }}
        </span>
      </div>
    </div>

    <!-- Card Content -->
    <div class="p-4">
      <h3 class="font-semibold text-gray-900 truncate mb-1">
        {{ basemap.label }}
      </h3>
      <p class="text-sm text-gray-500 truncate mb-2">
        {{ basemap.name }}
      </p>

      <!-- Country and Provider -->
      <div class="flex items-center justify-between text-xs text-gray-600">
        <div class="flex items-center space-x-1">
          <span>{{ basemap.flag }}</span>
          <span>{{ basemap.country }}</span>
        </div>
        <span v-if="basemap.metadata?.provider" class="truncate ml-2">
          {{ basemap.metadata.provider }}
        </span>
      </div>

      <!-- Status -->
      <div class="mt-2 flex items-center justify-between">
        <span
          class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
          :class="basemap.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
        >
          <i :class="basemap.isActive ? 'pi pi-check-circle' : 'pi pi-pause-circle'" class="mr-1"></i>
          {{ basemap.isActive ? 'Active' : 'Inactive' }}
        </span>

        <!-- Compatibility indicator for overlay selection -->
        <div v-if="showCompatibility && compatibilityScore !== undefined" class="flex items-center text-xs">
          <i class="pi pi-shield-check text-green-500 mr-1"></i>
          {{ compatibilityScore }}% Compatible
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BasemapLayer } from '../types';

interface Props {
  basemap: BasemapLayer;
  selected?: boolean;
  disabled?: boolean;
  showCompatibility?: boolean;
  compatibilityScore?: number;
}

interface Emits {
  (e: 'select'): void;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  disabled: false,
  showCompatibility: false,
});

const emit = defineEmits<Emits>();

const getTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'vtc':
      return 'bg-blue-100 text-blue-800';
    case 'wmts':
      return 'bg-green-100 text-green-800';
    case 'wms':
      return 'bg-purple-100 text-purple-800';
    case 'xyz':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
</script>