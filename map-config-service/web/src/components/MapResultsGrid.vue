<template>
  <div class="space-y-4">
    <!-- Grid Header with Select All -->
    <div class="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
      <div class="flex items-center space-x-3">
        <input
          :checked="allSelected"
          :indeterminate="someSelected && !allSelected"
          @change="handleSelectAll"
          type="checkbox"
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <span class="text-sm font-medium text-gray-700">
          {{ selectedMaps.size }} of {{ results.length }} selected
        </span>
      </div>
      
      <div class="flex items-center space-x-2 text-sm text-gray-600">
        <button
          @click="toggleViewMode"
          class="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          :title="viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'"
        >
          <i :class="viewMode === 'grid' ? 'pi pi-list' : 'pi pi-th-large'"></i>
        </button>
      </div>
    </div>

    <!-- Grid View -->
    <div
      v-if="viewMode === 'grid'"
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
    >
      <MapResultCard
        v-for="map in results"
        :key="map.id"
        :map="map"
        :selected="selectedMaps.has(map.id)"
        :validation-status="validationStatuses.get(map.id)"
        @toggle-selection="$emit('toggle-selection', map.id)"
        @preview="$emit('preview-map', map.id)"
        @accept="$emit('accept-map', map.id)"
        @reject="$emit('reject-map', map.id)"
      />
    </div>

    <!-- List View -->
    <div v-else class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="min-w-full">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="w-12 px-6 py-3 text-left">
                <span class="sr-only">Select</span>
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Map
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Country
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Validation
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="map in results"
              :key="map.id"
              class="hover:bg-gray-50"
              :class="{ 'bg-blue-50': selectedMaps.has(map.id) }"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  :checked="selectedMaps.has(map.id)"
                  @change="$emit('toggle-selection', map.id)"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="text-sm font-medium text-gray-900">{{ map.label }}</div>
                  <div class="text-sm text-gray-500 ml-2">({{ map.name }})</div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  :class="getTypeColor(map.type)"
                >
                  {{ map.type.toUpperCase() }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div class="flex items-center">
                  <span class="mr-2">{{ map.flag }}</span>
                  {{ map.country }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  :class="map.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                >
                  {{ map.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <ValidationStatusBadge
                  :status="validationStatuses.get(map.id)"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button
                  @click="$emit('preview-map', map.id)"
                  class="text-blue-600 hover:text-blue-900"
                  title="Preview map"
                >
                  <i class="pi pi-eye"></i>
                </button>
                <button
                  @click="$emit('accept-map', map.id)"
                  class="text-green-600 hover:text-green-900"
                  title="Accept map"
                >
                  <i class="pi pi-check"></i>
                </button>
                <button
                  @click="$emit('reject-map', map.id)"
                  class="text-red-600 hover:text-red-900"
                  title="Reject map"
                >
                  <i class="pi pi-times"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="results.length === 0"
      class="text-center py-12 bg-white rounded-lg border border-gray-200"
    >
      <i class="pi pi-search text-4xl text-gray-400 mb-4"></i>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No maps found</h3>
      <p class="text-gray-600">Try adjusting your search criteria</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { MapSearchResult, ValidationStatus } from '../types';
import MapResultCard from './MapResultCard.vue';
import ValidationStatusBadge from './ValidationStatusBadge.vue';

interface Props {
  results: MapSearchResult[];
  selectedMaps: Set<string>;
  validationStatuses: Map<string, ValidationStatus>;
}

interface Emits {
  (e: 'toggle-selection', mapId: string): void;
  (e: 'select-all'): void;
  (e: 'clear-selection'): void;
  (e: 'preview-map', mapId: string): void;
  (e: 'accept-map', mapId: string): void;
  (e: 'reject-map', mapId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// View mode state
const viewMode = ref<'grid' | 'list'>('grid');

// Computed properties
const allSelected = computed(() => 
  props.results.length > 0 && props.results.every(map => props.selectedMaps.has(map.id))
);

const someSelected = computed(() => 
  props.results.some(map => props.selectedMaps.has(map.id))
);

// Methods
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid';
};

const handleSelectAll = () => {
  if (allSelected.value) {
    emit('clear-selection');
  } else {
    emit('select-all');
  }
};

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