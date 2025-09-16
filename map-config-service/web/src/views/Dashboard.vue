<template>
  <BrandLayout>
    <!-- Search in header -->
    <template #search>
      <SearchBar v-model="searchQuery" />
    </template>
    
    <!-- Action buttons in header -->
    <template #actions>
      <button
        @click="$router.push('/layer-groups')"
        class="btn-secondary flex items-center space-x-2"
      >
        <i class="pi pi-sitemap"></i>
        <span>Layer Groups</span>
      </button>
      <button
        @click="showMapSearch = true"
        class="btn-secondary flex items-center space-x-2"
      >
        <i class="pi pi-sparkles"></i>
        <span>AI Search</span>
      </button>
      <button
        @click="showDuplicateDialog = true"
        class="btn-secondary flex items-center space-x-2"
      >
        <i class="pi pi-copy"></i>
        <span>Copy Existing</span>
      </button>
      <button
        @click="showStyleUpload = true"
        class="btn-secondary flex items-center space-x-2"
      >
        <i class="pi pi-upload"></i>
        <span>Upload Style</span>
      </button>
      <button
        @click="createNew"
        class="btn-primary flex items-center space-x-2"
      >
        <i class="pi pi-plus"></i>
        <span>New Config</span>
      </button>
    </template>
    
    <!-- Secondary navigation with tabs -->
    <template #navigation>
      <div class="flex justify-between items-center py-4">
        <div class="flex items-center space-x-6">
          <!-- Country Tabs -->
          <div class="flex space-x-3">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              @click="selectedCountry = tab.value"
              :title="tab.tooltip || tab.value"
              :class="[
                'pb-2 px-2 border-b-2 font-medium text-sm transition-colors flex items-center space-x-1',
                selectedCountry === tab.value
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              ]"
            >
              <span class="text-lg">{{ tab.label }}</span>
              <span class="text-xs">({{ tab.count || getCountryCount(tab.value) }})</span>
            </button>
          </div>
          
          <!-- Category Filter -->
          <div class="flex items-center space-x-2 ml-6 pl-6 border-l border-neutral-300">
            <span class="text-sm text-neutral-600">Category:</span>
            <div class="flex space-x-2">
              <button
                @click="selectedCategory = 'all'"
                :class="[
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                ]"
              >
                All
              </button>
              <button
                @click="selectedCategory = 'background'"
                :class="[
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center space-x-1',
                  selectedCategory === 'background'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                ]"
              >
                <i class="pi pi-map text-xs"></i>
                <span>Background ({{ backgroundCount }})</span>
              </button>
              <button
                @click="selectedCategory = 'overlay'"
                :class="[
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center space-x-1',
                  selectedCategory === 'overlay'
                    ? 'bg-violet-600 text-white'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                ]"
              >
                <i class="pi pi-clone text-xs"></i>
                <span>Overlay ({{ overlayCount }})</span>
              </button>
            </div>
          </div>
        </div>
        
        <!-- View Toggle -->
        <div class="flex items-center space-x-2">
          <button
            @click="viewMode = 'grid'"
            :class="[
              'p-2 rounded transition-colors',
              viewMode === 'grid' ? 'bg-neutral-200 text-blue-600' : 'hover:bg-neutral-100 text-neutral-600'
            ]"
            title="Grid View"
          >
            <i class="pi pi-th-large"></i>
          </button>
          <button
            @click="viewMode = 'list'"
            :class="[
              'p-2 rounded transition-colors',
              viewMode === 'list' ? 'bg-neutral-200 text-blue-600' : 'hover:bg-neutral-100 text-neutral-600'
            ]"
            title="List View"
          >
            <i class="pi pi-list"></i>
          </button>
        </div>
      </div>
    </template>

    <!-- Stats Cards -->
    <div class="max-w-brand mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Maps"
          :value="configs.length"
          icon="pi-map"
        />
        <StatCard
          title="Countries"
          :value="uniqueCountries"
          icon="pi-globe"
        />
        <StatCard
          title="Vector Tiles"
          :value="vtcCount"
          icon="pi-sitemap"
        />
        <StatCard
          title="WMTS/WMS"
          :value="wmtsCount"
          icon="pi-images"
        />
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <i class="pi pi-spin pi-spinner text-4xl text-blue-600"></i>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
        <i class="pi pi-exclamation-triangle mr-2"></i>
        {{ error }}
      </div>
      
      <!-- Grid View -->
      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div v-if="categoryFilteredConfigs.length === 0" class="col-span-full text-center py-12 text-neutral-500">
          <i class="pi pi-inbox text-4xl mb-2"></i>
          <p>No maps found. Try adjusting your filters or search query.</p>
        </div>
        <MapCard
          v-for="config in categoryFilteredConfigs"
          :key="config.id"
          :config="config"
          @edit="editConfig"
          @preview="previewConfig"
          @duplicate="duplicateConfig"
          @delete="deleteConfig"
          @upload-style="showStyleUpload = true"
        />
      </div>
      
      <!-- List View with Country Grouping -->
      <div v-else-if="viewMode === 'list'" class="bg-white rounded-lg border border-gray-200">
        <div v-for="[country, configs] in groupedConfigs" :key="country">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 class="text-sm font-semibold text-gray-900 flex items-center">
              <span class="mr-2 text-lg">{{ getCountryFlag(country) }}</span>
              <span class="text-base">{{ country }}</span>
              <span class="ml-2 text-sm font-normal text-gray-500">({{ configs.length }} maps)</span>
            </h3>
          </div>
          <div class="divide-y divide-gray-200">
            <div
              v-for="config in configs"
              :key="config.id"
              class="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
              @click="previewConfig(config)"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4 flex-1">
                  <!-- Map Type Badge -->
                  <span 
                    :class="[
                      'inline-flex px-2 py-1 text-xs font-semibold rounded uppercase',
                      config.type === 'vtc' ? 'bg-blue-100 text-blue-800' : 
                      config.type === 'wmts' ? 'bg-green-100 text-green-800' : 
                      'bg-purple-100 text-purple-800'
                    ]"
                  >
                    {{ config.type }}
                  </span>
                  
                  <!-- Map Category Badge -->
                  <span 
                    :class="[
                      'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full',
                      isOverlay(config) 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    ]"
                  >
                    <i :class="[
                      'mr-1',
                      isOverlay(config) ? 'pi pi-clone' : 'pi pi-map'
                    ]" style="font-size: 10px;"></i>
                    {{ isOverlay(config) ? 'Overlay' : 'Background' }}
                  </span>
                  
                  <!-- Map Name and Label -->
                  <div class="flex-1">
                    <h4 class="font-medium text-gray-900">{{ config.label }}</h4>
                    <p class="text-sm text-gray-500">{{ config.name }}</p>
                  </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="flex items-center space-x-1" @click.stop>
                  <button
                    @click="editConfig(config)"
                    class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <i class="pi pi-pencil text-gray-600"></i>
                  </button>
                  <button
                    @click="previewConfig(config)"
                    class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Preview"
                  >
                    <i class="pi pi-eye text-gray-600"></i>
                  </button>
                  <button
                    @click="duplicateConfig(config)"
                    class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    <i class="pi pi-copy text-gray-600"></i>
                  </button>
                  <button
                    @click="openInMaputnik(config)"
                    class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Open in Maputnik"
                  >
                    <i class="pi pi-external-link text-gray-600"></i>
                  </button>
                  <button
                    @click="deleteConfig(config)"
                    class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <i class="pi pi-trash text-red-600"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Empty state for list view -->
        <div v-if="categoryFilteredConfigs.length === 0" class="px-6 py-12 text-center text-gray-500">
          <i class="pi pi-inbox text-4xl mb-2"></i>
          <p>No maps found. Try adjusting your filters or search query.</p>
        </div>
      </div>
    </div>

    <!-- Duplicate Dialog -->
    <DuplicateDialog
      v-model:visible="showDuplicateDialog"
      :configs="configs"
      @duplicate="handleDuplicate"
    />

    <!-- Map Search Modal -->
    <div v-if="showMapSearch" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="fixed inset-0 bg-black bg-opacity-50" @click="showMapSearch = false"></div>
        <div class="relative bg-white rounded-lg max-w-brand w-full max-h-[90vh] overflow-y-auto">
          <button
            @click="showMapSearch = false"
            class="absolute top-4 right-4 z-10 p-2 hover:bg-neutral-100 rounded-lg"
          >
            <i class="pi pi-times text-neutral-600"></i>
          </button>
          <MapSearchPanel @close="showMapSearch = false" />
        </div>
      </div>
    </div>

    <!-- Style Upload Modal -->
    <StyleUploadModal
      v-model:visible="showStyleUpload"
      @upload-success="handleStyleUploadSuccess"
      @upload-error="handleStyleUploadError"
    />
  </BrandLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useConfigStore } from '../stores/mapConfig';
import { storeToRefs } from 'pinia';
import BrandLayout from '../components/BrandLayout.vue';
import SearchBar from '../components/SearchBar.vue';
import StatCard from '../components/StatCard.vue';
import MapCard from '../components/MapCard.vue';
import DuplicateDialog from '../components/DuplicateDialog.vue';
import MapSearchPanel from '../components/MapSearchPanel.vue';
import StyleUploadModal from '../components/StyleUploadModal.vue';
import type { MapConfig } from '../types';
import { openInMaputnik as openMaputnik } from '../utils/maputnikHelper';
import { getAllPreviewsFromLocalStorage } from '../utils/localStorage';

const router = useRouter();
const route = useRoute();
const configStore = useConfigStore();
const {
  configs,
  loading,
  error
} = storeToRefs(configStore);

// Local state
const searchQuery = ref('');
const selectedCountry = ref('all');
const filteredConfigs = computed(() => {
  let filtered = configs.value || [];

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(config =>
      config.name.toLowerCase().includes(query) ||
      config.label.toLowerCase().includes(query) ||
      config.country?.toLowerCase().includes(query)
    );
  }

  // Filter by country
  if (selectedCountry.value !== 'all') {
    filtered = filtered.filter(config => config.country === selectedCountry.value);
  }

  return filtered;
});

const showDuplicateDialog = ref(false);
const showMapSearch = ref(false);
const showStyleUpload = ref(false);
const viewMode = ref<'grid' | 'list'>('grid');
const selectedCategory = ref<'all' | 'background' | 'overlay'>('all');

// Country flag mappings
const countryFlags: Record<string, string> = {
  'Global': '🌐',
  'Austria': '🇦🇹',
  'Germany': '🇩🇪',
  'Switzerland': '🇨🇭',
  'France': '🇫🇷',
  'Italy': '🇮🇹',
  'Spain': '🇪🇸',
  'Netherlands': '🇳🇱',
  'Australia': '🇦🇺',
  'New Zealand': '🇳🇿'
};

const tabs = computed(() => {
  const countries = new Set(configs.value.map(c => c.country));
  const countryTabs = [
    { label: 'All', value: 'all', flag: '🗺️' }
  ];
  
  // Add tabs for countries with maps
  const priorityCountries = ['Global', 'Austria', 'Germany', 'Switzerland', 'France', 'Italy', 'Spain', 'Netherlands', 'Australia', 'New Zealand'];
  priorityCountries.forEach(country => {
    if (countries.has(country)) {
      const flag = countryFlags[country] || getCountryFlag(country);
      countryTabs.push({ 
        label: flag, 
        value: country,
        tooltip: country,
        count: getCountryCount(country)
      });
    }
  });
  
  return countryTabs;
});

// Helper function to determine if a map is an overlay
// Check metadata.isOverlay first, then map_category as fallback
const isOverlay = (config: MapConfig) => {
  // Check if metadata has isOverlay flag
  if (config.metadata && typeof config.metadata === 'object') {
    if ('isOverlay' in config.metadata) {
      return config.metadata.isOverlay === true;
    }
  }
  
  // Fallback to map_category field
  return config.map_category === 'overlay';
};

// Category counts
const backgroundCount = computed(() => 
  configs.value.filter(c => !isOverlay(c)).length
);

const overlayCount = computed(() => 
  configs.value.filter(c => isOverlay(c)).length
);

// Filter configs by category
const categoryFilteredConfigs = computed(() => {
  if (selectedCategory.value === 'all') {
    return filteredConfigs.value;
  }
  
  return filteredConfigs.value.filter(config => {
    const isOverlayMap = isOverlay(config);
    return selectedCategory.value === 'overlay' ? isOverlayMap : !isOverlayMap;
  });
});

const groupedConfigs = computed(() => {
  const grouped = new Map<string, MapConfig[]>();
  
  categoryFilteredConfigs.value.forEach(config => {
    const country = config.country || 'Other';
    if (!grouped.has(country)) {
      grouped.set(country, []);
    }
    grouped.get(country)!.push(config);
  });
  
  // Sort countries with Global first
  const sorted = new Map([...grouped.entries()].sort((a, b) => {
    if (a[0] === 'Global') return -1;
    if (b[0] === 'Global') return 1;
    return a[0].localeCompare(b[0]);
  }));
  
  return sorted;
});

const uniqueCountries = computed(() => 
  new Set(configs.value.map(c => c.country)).size
);

const vtcCount = computed(() => 
  configs.value.filter(c => c.type === 'vtc').length
);

const wmtsCount = computed(() => 
  configs.value.filter(c => c.type === 'wmts' || c.type === 'wms').length
);

function getCountryCount(country: string): number {
  if (country === 'all') return configs.value.length;
  return configs.value.filter(c => c.country === country).length;
}

function getCountryFlag(country: string): string {
  const config = configs.value.find(c => c.country === country);
  return config?.flag || '🌐';
}

function createNew() {
  router.push('/config/new');
}

function editConfig(config: MapConfig) {
  router.push(`/config/${config.id}/edit`);
}

function previewConfig(config: MapConfig) {
  router.push(`/config/${config.id}/preview`);
}

function duplicateConfig(config: MapConfig) {
  showDuplicateDialog.value = true;
  // Set the source config in the dialog
}

function openInMaputnik(config: MapConfig) {
  // Try style, originalStyle, or name as fallback
  const styleUrl = config.style || config.originalStyle || config.name;
  console.log('Dashboard - Opening Maputnik with:', {
    style: config.style,
    originalStyle: config.originalStyle,
    name: config.name,
    chosen: styleUrl
  });
  openMaputnik(styleUrl, config.type);
}

async function deleteConfig(config: MapConfig) {
  if (confirm(`Are you sure you want to delete "${config.label}"?`)) {
    await configStore.deleteConfig(config.id);
  }
}

async function handleDuplicate(request: any) {
  await configStore.duplicateConfiguration(request);
  showDuplicateDialog.value = false;
}

function handleStyleUploadSuccess(config: MapConfig) {
  console.log('Style uploaded successfully:', config);
  // Refresh the configs to show the new uploaded style
  configStore.fetchConfigs();
  showStyleUpload.value = false;
}

function handleStyleUploadError(error: string) {
  console.error('Style upload failed:', error);
  // Error is already shown in the modal, just log it here
}

// Refresh configs when component is mounted or when returning from edit
onMounted(async () => {
  await configStore.fetchConfigs();
  console.log('Configs loaded:', configs.value.length);
  console.log('Filtered configs:', filteredConfigs.value.length);
  console.log('First few configs:', configs.value.slice(0, 3));
});

// Also refresh when the route changes (e.g., returning from edit)
watch(() => route.path, async (newPath, oldPath) => {
  // Refresh if coming back to dashboard from config editor
  if (newPath === '/' && oldPath?.includes('/config/')) {
    console.log('Returning from config editor, refreshing...');
    await configStore.fetchConfigs();
  }
});
</script>