<template>
  <div class="h-screen flex flex-col">
    <!-- Page Header (if needed) -->
    <div v-if="showPageHeader" class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Map Discovery</h1>
          <p class="text-gray-600">Search and validate map configurations</p>
        </div>
        <div class="flex items-center space-x-4">
          <!-- Optional header actions -->
          <button
            @click="showHelp = true"
            class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <i class="pi pi-question-circle mr-2"></i>
            Help
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-hidden">
      <MapSearchInterface />
    </div>

    <!-- Help Modal -->
    <div
      v-if="showHelp"
      class="fixed inset-0 z-50 overflow-y-auto"
      @keydown.escape="showHelp = false"
    >
      <div class="flex min-h-screen items-center justify-center p-4">
        <div class="fixed inset-0 bg-black bg-opacity-50" @click="showHelp = false"></div>
        <div class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-gray-900">Map Discovery Help</h2>
              <button @click="showHelp = false" class="text-gray-400 hover:text-gray-600">
                <i class="pi pi-times text-lg"></i>
              </button>
            </div>
            
            <div class="space-y-6 text-sm text-gray-700">
              <div>
                <h3 class="font-semibold text-gray-900 mb-2">Search Features</h3>
                <ul class="space-y-1 list-disc list-inside">
                  <li>Type to search maps by name, label, or provider</li>
                  <li>Filter by map type (VTC, WMTS, WMS) or status</li>
                  <li>Real-time search with debounced input</li>
                </ul>
              </div>
              
              <div>
                <h3 class="font-semibold text-gray-900 mb-2">Selection & Batch Operations</h3>
                <ul class="space-y-1 list-disc list-inside">
                  <li>Click checkboxes to select individual maps</li>
                  <li>Use "Select All" to select all visible maps</li>
                  <li>Perform batch validation, acceptance, or rejection</li>
                  <li>Monitor operation progress in the sidebar</li>
                </ul>
              </div>
              
              <div>
                <h3 class="font-semibold text-gray-900 mb-2">Map Preview</h3>
                <ul class="space-y-1 list-disc list-inside">
                  <li>Click "Preview" to view maps with MapLibre GL</li>
                  <li>Pan, zoom, and explore interactive maps</li>
                  <li>View detailed style and layer information</li>
                  <li>Accept or reject directly from preview</li>
                </ul>
              </div>
              
              <div>
                <h3 class="font-semibold text-gray-900 mb-2">Validation Status</h3>
                <ul class="space-y-1 list-disc list-inside">
                  <li><span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 mr-2">Valid</span>Map passed validation</li>
                  <li><span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 mr-2">Invalid</span>Map has validation errors</li>
                  <li><span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 mr-2">Validating</span>Validation in progress</li>
                  <li><span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 mr-2">Pending</span>Not yet validated</li>
                </ul>
              </div>
            </div>
            
            <div class="mt-6 flex justify-end">
              <button
                @click="showHelp = false"
                class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MapSearchInterface from '../components/MapSearchInterface.vue';

// Component state
const showPageHeader = ref(false); // Can be toggled based on layout needs
const showHelp = ref(false);
</script>