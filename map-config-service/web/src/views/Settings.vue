<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
          <button
            @click="$router.push('/')"
            class="btn-secondary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Database Configuration -->
        <div class="card p-6">
          <h2 class="text-lg font-semibold mb-4">Database Configuration</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Connection Status</label>
              <div class="flex items-center space-x-2">
                <div :class="[
                  'w-3 h-3 rounded-full',
                  supabaseConfigured ? 'bg-green-500' : 'bg-red-500'
                ]"></div>
                <span class="text-sm text-gray-600">
                  {{ supabaseConfigured ? 'Connected to Supabase' : 'Using Local Storage (Demo Mode)' }}
                </span>
              </div>
            </div>

            <div v-if="!supabaseConfigured" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p class="text-sm text-yellow-800">
                <i class="pi pi-exclamation-triangle mr-2"></i>
                Supabase is not configured. Add environment variables to enable database features.
              </p>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">Database Actions</label>
              
              <button
                @click="seedDatabase"
                :disabled="!supabaseConfigured || seeding"
                class="w-full btn-primary flex items-center justify-center space-x-2"
                :class="{ 'opacity-50 cursor-not-allowed': !supabaseConfigured || seeding }"
              >
                <i :class="seeding ? 'pi pi-spin pi-spinner' : 'pi pi-database'"></i>
                <span>{{ seeding ? 'Seeding Database...' : 'Seed Database with All Maps' }}</span>
              </button>

              <p class="text-xs text-gray-500">
                This will import all 94 maps from mapconfig.json into the database.
              </p>
            </div>

            <div v-if="seedResult" :class="[
              'p-3 rounded-lg',
              seedResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            ]">
              <i :class="[
                'mr-2',
                seedResult.success ? 'pi pi-check-circle' : 'pi pi-times-circle'
              ]"></i>
              {{ seedResult.message }}
            </div>
          </div>
        </div>

        <!-- API Keys Configuration -->
        <div class="card p-6">
          <h2 class="text-lg font-semibold mb-4">API Keys</h2>
          
          <div class="space-y-4">
            <p class="text-sm text-gray-600">
              API keys are securely stored as environment variables on the server.
            </p>

            <div class="space-y-3">
              <div v-for="provider in apiProviders" :key="provider.name" class="flex items-center justify-between py-2 border-b">
                <div>
                  <p class="font-medium">{{ provider.label }}</p>
                  <p class="text-xs text-gray-500">{{ provider.domain }}</p>
                </div>
                <div :class="[
                  'px-2 py-1 rounded text-xs font-medium',
                  provider.configured ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                ]">
                  {{ provider.configured ? 'Configured' : 'Not Set' }}
                </div>
              </div>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p class="text-xs text-blue-800">
                <i class="pi pi-info-circle mr-1"></i>
                To configure API keys, set environment variables in your Vercel dashboard or .env file.
              </p>
            </div>
          </div>
        </div>

        <!-- Statistics -->
        <div class="card p-6">
          <h2 class="text-lg font-semibold mb-4">Statistics</h2>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ stats.totalMaps }}</p>
              <p class="text-sm text-gray-600">Total Maps</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ stats.countries }}</p>
              <p class="text-sm text-gray-600">Countries</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ stats.vtcMaps }}</p>
              <p class="text-sm text-gray-600">Vector Tiles</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ stats.wmtsMaps }}</p>
              <p class="text-sm text-gray-600">WMTS/WMS</p>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t">
            <h3 class="text-sm font-medium text-gray-700 mb-2">Maps by Country</h3>
            <div class="space-y-1 max-h-40 overflow-y-auto">
              <div v-for="country in countryStats" :key="country.name" class="flex justify-between text-sm">
                <span class="text-gray-600">{{ country.flag }} {{ country.name }}</span>
                <span class="font-medium">{{ country.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Export/Import -->
        <div class="card p-6">
          <h2 class="text-lg font-semibold mb-4">Export & Import</h2>
          
          <div class="space-y-4">
            <button
              @click="exportAll"
              class="w-full btn-secondary flex items-center justify-center space-x-2"
            >
              <i class="pi pi-download"></i>
              <span>Export All Configurations</span>
            </button>

            <div class="relative">
              <input
                type="file"
                ref="fileInput"
                @change="handleImport"
                accept=".json"
                class="hidden"
              />
              <button
                @click="$refs.fileInput.click()"
                class="w-full btn-secondary flex items-center justify-center space-x-2"
              >
                <i class="pi pi-upload"></i>
                <span>Import Configuration</span>
              </button>
            </div>

            <p class="text-xs text-gray-500">
              Export and import map configurations in mapconfig.json format.
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useConfigStore } from '../stores/config';
import { storeToRefs } from 'pinia';
import { isSupabaseConfigured } from '../lib/supabase';

const configStore = useConfigStore();
const { configs } = storeToRefs(configStore);

const seeding = ref(false);
const seedResult = ref<{ success: boolean; message: string } | null>(null);
const fileInput = ref<HTMLInputElement>();

const supabaseConfigured = ref(false);

const apiProviders = ref([
  { name: 'maptiler', label: 'MapTiler', domain: 'api.maptiler.com', configured: false },
  { name: 'clockwork', label: 'Clockwork Micro', domain: 'maps.clockworkmicro.com', configured: false },
  { name: 'bev', label: 'BEV Austria', domain: 'kataster.bev.gv.at', configured: false },
  { name: 'kartverket', label: 'Kartverket Norway', domain: 'cache.kartverket.no', configured: false },
  { name: 'ign', label: 'IGN France', domain: 'wxs.ign.fr', configured: false }
]);

const stats = computed(() => {
  const maps = configs.value;
  return {
    totalMaps: maps.length,
    countries: new Set(maps.map(m => m.country)).size,
    vtcMaps: maps.filter(m => m.type === 'vtc').length,
    wmtsMaps: maps.filter(m => m.type === 'wmts' || m.type === 'wms').length
  };
});

const countryStats = computed(() => {
  const countryMap = new Map<string, { name: string; flag: string; count: number }>();
  
  configs.value.forEach(config => {
    const country = config.country || 'Unknown';
    if (!countryMap.has(country)) {
      countryMap.set(country, {
        name: country,
        flag: config.flag || '🌐',
        count: 0
      });
    }
    countryMap.get(country)!.count++;
  });
  
  return Array.from(countryMap.values()).sort((a, b) => b.count - a.count);
});

async function seedDatabase() {
  seeding.value = true;
  seedResult.value = null;
  
  try {
    const success = await configStore.seedDatabase();
    seedResult.value = {
      success,
      message: success 
        ? 'Successfully seeded database with all map configurations!' 
        : 'Failed to seed database. Check console for details.'
    };
  } catch (error) {
    seedResult.value = {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while seeding the database.'
    };
  } finally {
    seeding.value = false;
  }
}

function exportAll() {
  const exportData = {
    backgroundMaps: {} as any
  };
  
  configs.value.forEach(config => {
    exportData.backgroundMaps[config.name] = {
      name: config.name,
      style: config.originalStyle || config.style,
      label: config.label,
      type: config.type,
      flag: config.flag,
      country: config.country,
      ...(config.layers && { layers: config.layers }),
      ...(config.metadata?.tiles && { tiles: config.metadata.tiles }),
      ...(config.metadata?.url && { url: config.metadata.url }),
      ...(config.metadata?.tileSize && { tileSize: config.metadata.tileSize }),
      ...(config.metadata?.attribution && { attribution: config.metadata.attribution })
    };
  });
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mapconfig-export.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function handleImport(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!data.backgroundMaps) {
      throw new Error('Invalid format: missing backgroundMaps');
    }
    
    // TODO: Process and import the configurations
    alert('Import functionality will be available with database connection.');
    
  } catch (error) {
    console.error('Import error:', error);
    alert('Failed to import configuration file.');
  }
  
  // Reset file input
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

onMounted(() => {
  // Check if Supabase is configured
  supabaseConfigured.value = isSupabaseConfigured();
  
  // Check which API keys are configured (would need server endpoint in production)
  // For now, we'll show them as not configured in demo mode
  
  if (!configs.value.length) {
    configStore.fetchConfigs();
  }
});
</script>