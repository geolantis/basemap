<template>
  <div
    class="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
    :class="{ 'ring-2 ring-blue-500 ring-opacity-50': selected }"
  >
    <!-- Card Header -->
    <div class="p-4 border-b border-gray-100">
      <div class="flex items-start justify-between">
        <div class="flex items-start space-x-3">
          <input
            :checked="selected"
            @change="$emit('toggle-selection')"
            type="checkbox"
            class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-gray-900 truncate">
              {{ map.label }}
            </h3>
            <p class="text-sm text-gray-500 truncate">
              {{ map.name }}
            </p>
          </div>
        </div>
        
        <!-- Relevance Score -->
        <div class="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          <i class="pi pi-star-fill text-yellow-400 mr-1"></i>
          {{ Math.round(map.relevanceScore * 100) }}%
        </div>
      </div>
    </div>

    <!-- Card Content -->
    <div class="p-4 space-y-3">
      <!-- Map Type and Country -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="text-lg">{{ map.flag }}</span>
          <span class="text-sm text-gray-700">{{ map.country }}</span>
        </div>
        <span
          class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
          :class="getTypeColor(map.type)"
        >
          {{ map.type.toUpperCase() }}
        </span>
      </div>

      <!-- Status and Validation -->
      <div class="flex items-center justify-between">
        <span
          class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
          :class="map.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
        >
          <i :class="map.isActive ? 'pi pi-check-circle' : 'pi pi-pause-circle'" class="mr-1"></i>
          {{ map.isActive ? 'Active' : 'Inactive' }}
        </span>
        
        <ValidationStatusBadge :status="validationStatus" />
      </div>

      <!-- Metadata -->
      <div v-if="map.metadata?.provider" class="text-xs text-gray-600">
        <i class="pi pi-info-circle mr-1"></i>
        Provider: {{ map.metadata.provider }}
      </div>

      <!-- Preview Thumbnail -->
      <div class="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <i class="pi pi-map text-2xl text-gray-400 mb-2"></i>
            <p class="text-xs text-gray-500">Map Preview</p>
          </div>
        </div>
        
        <!-- Preview Button Overlay -->
        <button
          @click="$emit('preview')"
          class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center group"
        >
          <div class="bg-white bg-opacity-90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <i class="pi pi-eye text-gray-700"></i>
          </div>
        </button>
      </div>
    </div>

    <!-- Card Actions -->
    <div class="px-4 py-3 bg-gray-50 border-t border-gray-100">
      <div class="flex justify-between items-center">
        <button
          @click="$emit('preview')"
          class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <i class="pi pi-eye mr-1"></i>
          Preview
        </button>
        
        <div class="flex space-x-2">
          <button
            @click="$emit('accept')"
            class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-500"
            title="Accept this map"
          >
            <i class="pi pi-check mr-1"></i>
            Accept
          </button>
          <button
            @click="$emit('reject')"
            class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500"
            title="Reject this map"
          >
            <i class="pi pi-times mr-1"></i>
            Reject
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MapSearchResult, ValidationStatus } from '../types';
import ValidationStatusBadge from './ValidationStatusBadge.vue';

interface Props {
  map: MapSearchResult;
  selected: boolean;
  validationStatus?: ValidationStatus;
}

interface Emits {
  (e: 'toggle-selection'): void;
  (e: 'preview'): void;
  (e: 'accept'): void;
  (e: 'reject'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const getTypeColor = (type: string) => {
  switch (type) {
    case 'vtc':
      return 'bg-blue-100 text-blue-800';
    case 'wmts':
      return 'bg-green-100 text-green-800';
    case 'wms':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
</script>