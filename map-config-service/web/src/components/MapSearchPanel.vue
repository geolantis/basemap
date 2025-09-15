<template>
  <div class="bg-white rounded-lg shadow-lg p-6">
    <div class="mb-6">
      <h2 class="text-2xl font-bold mb-2">AI Map Discovery</h2>
      <p class="text-gray-600">Search for public map services using AI-powered discovery</p>
    </div>

    <!-- Search Input -->
    <div class="space-y-4">
      <div class="flex gap-2">
        <div class="flex-1 relative">
          <input
            v-model="searchQuery"
            @keyup.enter="searchMaps"
            type="text"
            placeholder="e.g., 'topographic maps Austria', 'satellite imagery Europe', 'street maps Germany'"
            class="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            :disabled="isSearching"
          />
          <i class="pi pi-search absolute right-3 top-3 text-gray-400"></i>
        </div>
        <button
          @click="searchMaps"
          :disabled="!searchQuery || isSearching"
          class="btn-primary flex items-center gap-2"
        >
          <i v-if="isSearching" class="pi pi-spin pi-spinner"></i>
          <i v-else class="pi pi-search"></i>
          {{ isSearching ? 'Searching...' : 'Search' }}
        </button>
      </div>

      <!-- Filters -->
      <div class="flex gap-4">
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium">Type:</label>
          <select v-model="selectedType" class="px-3 py-1 border rounded-lg text-sm">
            <option value="">All Types</option>
            <option value="vtc">Vector Tiles</option>
            <option value="wmts">WMTS</option>
            <option value="wms">WMS</option>
          </select>
        </div>
        
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium">Region:</label>
          <select v-model="selectedRegion" class="px-3 py-1 border rounded-lg text-sm">
            <option value="">Global</option>
            <option value="Europe">Europe</option>
            <option value="Austria">Austria</option>
            <option value="Germany">Germany</option>
            <option value="Switzerland">Switzerland</option>
            <option value="France">France</option>
            <option value="Italy">Italy</option>
            <option value="Spain">Spain</option>
            <option value="Netherlands">Netherlands</option>
            <option value="United Kingdom">United Kingdom</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-sm font-medium">Max Results:</label>
          <input
            v-model.number="maxResults"
            type="number"
            min="5"
            max="50"
            class="w-20 px-2 py-1 border rounded-lg text-sm"
          />
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-if="searchResults.length > 0" class="mt-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">
          Found {{ searchResults.length }} Maps
        </h3>
        <div class="flex gap-2">
          <button
            @click="validateAll"
            :disabled="isValidating"
            class="btn-secondary text-sm flex items-center gap-1"
          >
            <i class="pi pi-check-circle"></i>
            Validate All
          </button>
          <button
            @click="acceptSelected"
            :disabled="selectedMaps.length === 0"
            class="btn-primary text-sm flex items-center gap-1"
          >
            <i class="pi pi-plus"></i>
            Add Selected ({{ selectedMaps.length }})
          </button>
        </div>
      </div>

      <!-- Results Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="map in searchResults"
          :key="map.name"
          class="border rounded-lg p-4 hover:shadow-lg transition-shadow"
          :class="{
            'border-primary bg-primary/5': selectedMaps.includes(map.name),
            'border-gray-200': !selectedMaps.includes(map.name)
          }"
        >
          <!-- Map Card Header -->
          <div class="flex justify-between items-start mb-3">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="text-xl">{{ map.flag }}</span>
                <h4 class="font-semibold text-gray-900">{{ map.label }}</h4>
              </div>
              <p class="text-sm text-gray-500 mt-1">{{ map.provider }}</p>
            </div>
            <div class="flex items-center gap-1">
              <span
                class="px-2 py-1 text-xs font-medium rounded"
                :class="{
                  'bg-blue-100 text-blue-700': map.type === 'vtc',
                  'bg-green-100 text-green-700': map.type === 'wmts',
                  'bg-purple-100 text-purple-700': map.type === 'wms'
                }"
              >
                {{ map.type.toUpperCase() }}
              </span>
            </div>
          </div>

          <!-- Validation Status -->
          <div class="mb-3">
            <div
              v-if="map.validation"
              class="flex items-center gap-2 text-sm"
            >
              <i
                class="pi"
                :class="{
                  'pi-check-circle text-green-500': map.validation.status === 'valid',
                  'pi-exclamation-triangle text-yellow-500': map.validation.status === 'warning',
                  'pi-times-circle text-red-500': map.validation.status === 'invalid',
                  'pi-spin pi-spinner text-blue-500': map.validation.status === 'pending'
                }"
              ></i>
              <span
                :class="{
                  'text-green-700': map.validation.status === 'valid',
                  'text-yellow-700': map.validation.status === 'warning',
                  'text-red-700': map.validation.status === 'invalid',
                  'text-blue-700': map.validation.status === 'pending'
                }"
              >
                {{ getValidationText(map.validation.status) }}
              </span>
            </div>
            <div v-else class="text-sm text-gray-500">
              <i class="pi pi-question-circle"></i>
              Not validated
            </div>

            <!-- Validation Tests -->
            <div v-if="map.validation?.tests" class="mt-2 grid grid-cols-2 gap-1 text-xs">
              <div
                v-for="(passed, test) in map.validation.tests"
                :key="test"
                class="flex items-center gap-1"
              >
                <i
                  class="pi"
                  :class="passed ? 'pi-check text-green-500' : 'pi-times text-red-500'"
                ></i>
                <span :class="passed ? 'text-green-700' : 'text-red-700'">
                  {{ test }}
                </span>
              </div>
            </div>
          </div>

          <!-- Confidence Score -->
          <div class="mb-3">
            <div class="flex justify-between text-xs text-gray-600 mb-1">
              <span>Confidence</span>
              <span>{{ Math.round(map.confidence * 100) }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all"
                :class="{
                  'bg-green-500': map.confidence >= 0.8,
                  'bg-yellow-500': map.confidence >= 0.5 && map.confidence < 0.8,
                  'bg-red-500': map.confidence < 0.5
                }"
                :style="{ width: `${map.confidence * 100}%` }"
              ></div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <button
              @click="toggleSelection(map)"
              class="flex-1 px-3 py-2 text-sm border rounded-lg transition-colors"
              :class="{
                'bg-primary text-white border-primary': selectedMaps.includes(map.name),
                'bg-white text-gray-700 border-gray-300 hover:bg-gray-50': !selectedMaps.includes(map.name)
              }"
            >
              <i class="pi" :class="selectedMaps.includes(map.name) ? 'pi-check' : 'pi-plus'"></i>
              {{ selectedMaps.includes(map.name) ? 'Selected' : 'Select' }}
            </button>
            <button
              @click="previewMap(map)"
              class="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <i class="pi pi-eye"></i>
              Preview
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!isSearching && searchPerformed" class="text-center py-12">
      <i class="pi pi-inbox text-4xl text-gray-400 mb-4"></i>
      <p class="text-gray-600">No maps found. Try a different search query.</p>
    </div>

    <!-- Initial State -->
    <div v-else-if="!searchPerformed" class="text-center py-12">
      <i class="pi pi-search text-4xl text-gray-400 mb-4"></i>
      <p class="text-gray-600">Enter a search query to discover public map services.</p>
      <div class="mt-4 text-sm text-gray-500">
        <p>Example searches:</p>
        <ul class="mt-2 space-y-1">
          <li>"topographic maps Europe"</li>
          <li>"satellite imagery Austria"</li>
          <li>"street maps open data"</li>
          <li>"government mapping services Germany"</li>
        </ul>
      </div>
    </div>

    <!-- Map Preview Modal -->
    <MapPreviewModal
      v-if="previewingMap"
      :map="previewingMap"
      @close="previewingMap = null"
      @accept="acceptMap"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
// Use development mock service for now (switch to ClaudeMapService when API endpoint is deployed)
import { ClaudeMapServiceDev } from '../services/claudeMapServiceDev';
import { useConfigStore } from '../stores/mapConfig';
import MapPreviewModal from './MapPreviewModal.vue';

const configStore = useConfigStore();

// Use development mock service for testing
// Replace with: import { ClaudeMapService } from '../services/claudeMapService';
// when deploying to Vercel
const claudeService = new ClaudeMapServiceDev();

// State
const searchQuery = ref('');
const selectedType = ref('');
const selectedRegion = ref('');
const maxResults = ref(20);
const isSearching = ref(false);
const isValidating = ref(false);
const searchPerformed = ref(false);
const searchResults = ref<any[]>([]);
const selectedMaps = ref<string[]>([]);
const previewingMap = ref<any>(null);

// Search for maps
async function searchMaps() {
  if (!searchQuery.value) return;
  
  isSearching.value = true;
  searchPerformed.value = true;
  searchResults.value = [];
  selectedMaps.value = [];
  
  try {
    const result = await claudeService.searchMaps({
      query: searchQuery.value,
      maxResults: maxResults.value,
      mapTypes: selectedType.value ? [selectedType.value as any] : undefined,
      regions: selectedRegion.value ? [selectedRegion.value] : undefined
    });
    
    searchResults.value = result.maps;
    console.log(`Found ${result.maps.length} maps`, result.searchMetadata);
  } catch (error) {
    console.error('Search failed:', error);
    // TODO: Show error notification
  } finally {
    isSearching.value = false;
  }
}

// Validate all results
async function validateAll() {
  isValidating.value = true;
  
  // Validation is already done in parallel by the service
  // This could trigger a re-validation if needed
  
  isValidating.value = false;
}

// Toggle map selection
function toggleSelection(map: any) {
  const index = selectedMaps.value.indexOf(map.name);
  if (index > -1) {
    selectedMaps.value.splice(index, 1);
  } else {
    selectedMaps.value.push(map.name);
  }
}

// Accept selected maps
async function acceptSelected() {
  const mapsToAdd = searchResults.value.filter(m => selectedMaps.value.includes(m.name));
  
  for (const map of mapsToAdd) {
    const config = claudeService.convertToMapConfig(map);
    await configStore.createConfig(config);
  }
  
  // Clear selection
  selectedMaps.value = [];
  
  // TODO: Show success notification
  console.log(`Added ${mapsToAdd.length} maps to the pool`);
}

// Accept single map
async function acceptMap(map: any) {
  const config = claudeService.convertToMapConfig(map);
  await configStore.createConfig(config);
  
  // Remove from selected if present
  const index = selectedMaps.value.indexOf(map.name);
  if (index > -1) {
    selectedMaps.value.splice(index, 1);
  }
  
  // Close preview
  previewingMap.value = null;
  
  console.log(`Added ${map.label} to the pool`);
}

// Preview map
function previewMap(map: any) {
  previewingMap.value = map;
}

// Get validation status text
function getValidationText(status: string): string {
  switch (status) {
    case 'valid':
      return 'Valid';
    case 'warning':
      return 'Partial';
    case 'invalid':
      return 'Invalid';
    case 'pending':
      return 'Validating...';
    default:
      return 'Unknown';
  }
}
</script>