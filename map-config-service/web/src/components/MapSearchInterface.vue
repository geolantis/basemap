<template>
  <div class="h-full flex flex-col bg-gray-50">
    <!-- Search Header -->
    <div class="bg-white shadow-sm border-b border-gray-200 p-6">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">Map Discovery</h1>
        
        <!-- Search Input -->
        <div class="flex flex-col sm:flex-row gap-4 mb-4">
          <div class="flex-1 relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i class="pi pi-search text-gray-400"></i>
            </div>
            <input
              v-model="searchQuery.term"
              type="text"
              placeholder="Search maps by name, label, or provider..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <!-- Type Filter -->
          <select
            v-model="searchQuery.type"
            class="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="vtc">Vector Tiles (VTC)</option>
            <option value="wmts">WMTS</option>
            <option value="wms">WMS</option>
          </select>
          
          <!-- Active Filter -->
          <select
            v-model="searchQuery.isActive"
            class="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option :value="undefined">All Status</option>
            <option :value="true">Active Only</option>
            <option :value="false">Inactive Only</option>
          </select>
        </div>

        <!-- Batch Actions & Search Stats -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <span>{{ totalResults }} maps found</span>
            <span v-if="selectedMaps.size > 0" class="text-blue-600">
              • {{ selectedMaps.size }} selected
            </span>
          </div>
          
          <div v-if="selectedMaps.size > 0" class="flex gap-2">
            <button
              @click="validateSelectedMaps"
              class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <i class="pi pi-check-circle mr-1"></i>
              Validate Selected
            </button>
            <button
              @click="acceptSelected"
              class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <i class="pi pi-check mr-1"></i>
              Accept Selected
            </button>
            <button
              @click="rejectSelected"
              class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <i class="pi pi-times mr-1"></i>
              Reject Selected
            </button>
            <button
              @click="clearSelection"
              class="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <i class="pi pi-times mr-1"></i>
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Search Results Area -->
    <div class="flex-1 flex overflow-hidden">
      <div class="flex-1 flex flex-col">
        <!-- Loading State -->
        <div v-if="isSearching" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p class="text-gray-600">Searching maps...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="searchError" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Search Error</h3>
            <p class="text-gray-600">{{ searchError }}</p>
            <button
              @click="performSearch"
              class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <i class="pi pi-refresh mr-2"></i>
              Try Again
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="searchResults.length === 0" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <i class="pi pi-search text-4xl text-gray-400 mb-4"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No maps found</h3>
            <p class="text-gray-600">Try adjusting your search criteria</p>
          </div>
        </div>

        <!-- Results Grid -->
        <div v-else class="flex-1 overflow-auto p-6">
          <MapResultsGrid
            :results="searchResults"
            :selected-maps="selectedMaps"
            :validation-statuses="validationStatuses"
            @toggle-selection="toggleMapSelection"
            @select-all="selectAllMaps"
            @clear-selection="clearSelection"
            @preview-map="showPreview"
            @accept-map="acceptMap"
            @reject-map="rejectMap"
          />
        </div>
      </div>

      <!-- Sidebar for validation status and batch operations -->
      <div class="w-80 bg-white border-l border-gray-200 overflow-auto">
        <ValidationStatusPanel
          :validation-statuses="validationStatuses"
          :batch-operations="batchOperations"
        />
      </div>
    </div>

    <!-- Map Preview Modal -->
    <MapPreviewModal
      v-if="showPreviewModal"
      :map-data="previewMapData"
      @close="closePreview"
      @accept="acceptMap"
      @reject="rejectMap"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useMapSearch } from '../composables/useMapSearch';
import type { MapPreviewData } from '../types';
import MapResultsGrid from './MapResultsGrid.vue';
import MapPreviewModal from './MapPreviewModal.vue';
import ValidationStatusPanel from './ValidationStatusPanel.vue';

// Use the search composable
const {
  searchQuery,
  searchResults,
  isSearching,
  searchError,
  totalResults,
  selectedMaps,
  validationStatuses,
  batchOperations,
  toggleMapSelection,
  selectAllMaps,
  clearSelection,
  validateSelectedMaps,
  createBatchOperation,
  performSearch
} = useMapSearch();

// Preview modal state
const showPreviewModal = ref(false);
const previewMapData = ref<MapPreviewData | null>(null);

// Methods
const showPreview = (mapId: string) => {
  const map = searchResults.value.find(m => m.id === mapId);
  if (map) {
    previewMapData.value = {
      id: map.id,
      style: `https://api.example.com/styles/${map.id}`, // Mock style URL
      bounds: [-180, -85, 180, 85],
      center: [0, 0],
      zoom: 2,
      metadata: map.metadata
    };
    showPreviewModal.value = true;
  }
};

const closePreview = () => {
  showPreviewModal.value = false;
  previewMapData.value = null;
};

const acceptMap = async (mapId: string) => {
  await createBatchOperation('accept', [mapId]);
};

const rejectMap = async (mapId: string) => {
  await createBatchOperation('reject', [mapId]);
};

const acceptSelected = async () => {
  const selectedIds = Array.from(selectedMaps.value);
  if (selectedIds.length > 0) {
    await createBatchOperation('accept', selectedIds);
  }
};

const rejectSelected = async () => {
  const selectedIds = Array.from(selectedMaps.value);
  if (selectedIds.length > 0) {
    await createBatchOperation('reject', selectedIds);
  }
};
</script>