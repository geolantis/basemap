<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <h1 class="text-2xl font-bold text-gray-900">Map Configurations</h1>
          <div class="flex items-center space-x-4">
            <SearchBar v-model="searchQuery" />
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
              @click="createNew"
              class="btn-primary flex items-center space-x-2"
            >
              <i class="pi pi-plus"></i>
              <span>New Config</span>
            </button>
          </div>
        </div>
        
        <!-- View Toggles and Filter Tabs -->
        <div class="flex justify-between items-center mt-4">
          <div class="flex space-x-6">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              @click="selectedCountry = tab.value"
              :class="[
                'pb-2 px-1 border-b-2 font-medium text-sm transition-colors',
                selectedCountry === tab.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              {{ tab.label }} ({{ getCountryCount(tab.value) }})
            </button>
          </div>
          
          <!-- View Toggle -->
          <div class="flex items-center space-x-2">
            <button
              @click="viewMode = 'grid'"
              :class="[
                'p-2 rounded',
                viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'
              ]"
              title="Grid View"
            >
              <i class="pi pi-th-large"></i>
            </button>
            <button
              @click="viewMode = 'list'"
              :class="[
                'p-2 rounded',
                viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'
              ]"
              title="List View"
            >
              <i class="pi pi-list"></i>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Stats Cards -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
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
    </div>

    <!-- Content Area -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
      <div v-if="loading" class="flex justify-center py-12">
        <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
      </div>
      
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <i class="pi pi-exclamation-triangle mr-2"></i>
        {{ error }}
      </div>
      
      <!-- Grid View -->
      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div v-if="filteredConfigs.length === 0" class="col-span-full text-center py-12 text-gray-500">
          <i class="pi pi-inbox text-4xl mb-2"></i>
          <p>No maps found. Try adjusting your filters or search query.</p>
        </div>
        <MapCard
          v-for="config in filteredConfigs"
          :key="config.id"
          :config="config"
          @edit="editConfig"
          @preview="previewConfig"
          @duplicate="duplicateConfig"
          @delete="deleteConfig"
        />
      </div>
      
      <!-- List View with Country Grouping -->
      <div v-else-if="viewMode === 'list'" class="space-y-6">
        <div v-for="[country, configs] in groupedConfigs" :key="country" class="card p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center">
            <span class="mr-2">{{ getCountryFlag(country) }}</span>
            {{ country }}
            <span class="ml-2 text-sm text-gray-500">({{ configs.length }} maps)</span>
          </h3>
          <div class="space-y-2">
            <div
              v-for="config in configs"
              :key="config.id"
              class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div class="flex items-center space-x-4">
                <span class="text-xs font-medium px-2 py-1 bg-gray-100 rounded">
                  {{ config.type.toUpperCase() }}
                </span>
                <div>
                  <h4 class="font-medium">{{ config.label }}</h4>
                  <p class="text-sm text-gray-500">{{ config.name }}</p>
                </div>
              </div>
              
              <div class="flex items-center space-x-2">
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
        <div class="relative bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
          <button
            @click="showMapSearch = false"
            class="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-lg"
          >
            <i class="pi pi-times text-gray-600"></i>
          </button>
          <MapSearchPanel @close="showMapSearch = false" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useConfigStore } from '../stores/config';
import { storeToRefs } from 'pinia';
import SearchBar from '../components/SearchBar.vue';
import StatCard from '../components/StatCard.vue';
import MapCard from '../components/MapCard.vue';
import DuplicateDialog from '../components/DuplicateDialog.vue';
import MapSearchPanel from '../components/MapSearchPanel.vue';
import type { MapConfig } from '../types';
import { openInMaputnik as openMaputnik } from '../utils/maputnikHelper';

const router = useRouter();
const configStore = useConfigStore();
const { 
  configs, 
  filteredConfigs, 
  loading, 
  error, 
  searchQuery, 
  selectedCountry 
} = storeToRefs(configStore);

const showDuplicateDialog = ref(false);
const showMapSearch = ref(false);
const viewMode = ref<'grid' | 'list'>('grid');

const tabs = computed(() => {
  const countries = new Set(configs.value.map(c => c.country));
  const countryTabs = [
    { label: 'All Maps', value: 'all' }
  ];
  
  // Add tabs for countries with maps
  const priorityCountries = ['Global', 'Austria', 'Germany', 'Switzerland', 'France', 'Italy', 'Spain', 'Netherlands'];
  priorityCountries.forEach(country => {
    if (countries.has(country)) {
      countryTabs.push({ label: country, value: country });
    }
  });
  
  return countryTabs;
});

const groupedConfigs = computed(() => {
  const grouped = new Map<string, MapConfig[]>();
  
  filteredConfigs.value.forEach(config => {
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
  openMaputnik(config.originalStyle, config.type);
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

onMounted(async () => {
  await configStore.fetchConfigs();
  console.log('Configs loaded:', configs.value.length);
  console.log('Filtered configs:', filteredConfigs.value.length);
  console.log('First few configs:', configs.value.slice(0, 3));
});
</script>