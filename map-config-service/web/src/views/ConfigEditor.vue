<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <h1 class="text-2xl font-bold text-gray-900">
            {{ isEditMode ? 'Edit Configuration' : 'New Configuration' }}
          </h1>
          <div class="flex items-center space-x-4">
            <button
              @click="saveConfig"
              :disabled="!isValid || saving"
              class="btn-primary flex items-center space-x-2"
              :class="{ 'opacity-50 cursor-not-allowed': !isValid || saving }"
            >
              <i :class="saving ? 'pi pi-spin pi-spinner' : 'pi pi-save'"></i>
              <span>{{ saving ? 'Saving...' : 'Save Configuration' }}</span>
            </button>
            <button
              @click="$router.push('/')"
              class="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Basic Information -->
        <div class="card p-6">
          <h2 class="text-lg font-semibold mb-4">Basic Information</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Map Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.name"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., austria_basemap"
                @input="validateForm"
              />
              <p class="text-xs text-gray-500 mt-1">Unique identifier for the map (no spaces)</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Display Label <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.label"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Austria Basemap"
                @input="validateForm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Map Type <span class="text-red-500">*</span>
              </label>
              <select
                v-model="formData.type"
                @change="onTypeChange"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select type...</option>
                <option value="vtc">Vector Tiles (VTC)</option>
                <option value="wmts">WMTS</option>
                <option value="wms">WMS</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Country <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="formData.country"
                  @change="updateFlag"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select country...</option>
                  <option v-for="country in countries" :key="country.name" :value="country.name">
                    {{ country.flag }} {{ country.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Flag
                </label>
                <input
                  v-model="formData.flag"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="🌐"
                  readonly
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Style Configuration -->
        <div class="card p-6">
          <h2 class="text-lg font-semibold mb-4">Style Configuration</h2>
          
          <div class="space-y-4">
            <!-- Vector Tile Configuration -->
            <div v-if="formData.type === 'vtc'">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Style URL <span class="text-red-500">*</span>
              </label>
              <textarea
                v-model="formData.style"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://api.maptiler.com/maps/streets/style.json"
                @input="validateForm"
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">
                Enter the style.json URL (without API keys - they'll be added server-side)
              </p>

              <!-- Style URL Templates -->
              <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Quick Templates:</label>
                <div class="space-y-2">
                  <button
                    @click="applyTemplate('maptiler')"
                    class="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm"
                  >
                    <i class="pi pi-globe mr-2"></i>
                    MapTiler: https://api.maptiler.com/maps/{style}/style.json
                  </button>
                  <button
                    @click="applyTemplate('github')"
                    class="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm"
                  >
                    <i class="pi pi-github mr-2"></i>
                    GitHub: https://raw.githubusercontent.com/user/repo/main/style.json
                  </button>
                </div>
              </div>
            </div>

            <!-- WMTS/WMS Configuration -->
            <div v-if="formData.type === 'wmts' || formData.type === 'wms'">
              <div v-if="formData.type === 'wmts'">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Tile URL Template <span class="text-red-500">*</span>
                </label>
                <textarea
                  v-model="tilesInput"
                  rows="2"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/tiles/{z}/{x}/{y}.png"
                  @input="updateTiles"
                ></textarea>
                <p class="text-xs text-gray-500 mt-1">
                  Use {z}, {x}, {y} or {z}, {y}, {x} placeholders
                </p>
              </div>

              <div v-if="formData.type === 'wms'">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  WMS Endpoint URL <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="wmsUrl"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/wms"
                  @input="updateWmsUrl"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Tile Size
                  </label>
                  <select
                    v-model.number="tileSize"
                    @change="updateMetadata"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option :value="256">256</option>
                    <option :value="512">512</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Attribution
                  </label>
                  <input
                    v-model="attribution"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="© Data Provider"
                    @input="updateMetadata"
                  />
                </div>
              </div>

              <!-- Layers for WMS -->
              <div v-if="formData.type === 'wms'">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  WMS Layers
                </label>
                <input
                  v-model="layersInput"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="layer1, layer2, layer3"
                  @input="updateLayers"
                />
                <p class="text-xs text-gray-500 mt-1">
                  Comma-separated list of layer names
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Preview -->
        <div class="card p-6 lg:col-span-2">
          <h2 class="text-lg font-semibold mb-4">Configuration Preview</h2>
          
          <div class="bg-gray-50 rounded-lg p-4">
            <pre class="text-sm text-gray-700 overflow-x-auto">{{ configPreview }}</pre>
          </div>

          <div v-if="validationErrors.length > 0" class="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 class="text-sm font-medium text-red-800 mb-2">
              <i class="pi pi-exclamation-triangle mr-2"></i>
              Validation Errors:
            </h3>
            <ul class="list-disc list-inside text-sm text-red-700 space-y-1">
              <li v-for="error in validationErrors" :key="error">{{ error }}</li>
            </ul>
          </div>

          <div v-if="saveResult" :class="[
            'mt-4 p-3 rounded-lg',
            saveResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          ]">
            <i :class="[
              'mr-2',
              saveResult.success ? 'pi pi-check-circle' : 'pi pi-times-circle'
            ]"></i>
            {{ saveResult.message }}
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useConfigStore } from '../stores/config';
import type { MapConfig } from '../types';

const route = useRoute();
const router = useRouter();
const configStore = useConfigStore();

const isEditMode = computed(() => route.params.id && route.params.id !== 'new');
const saving = ref(false);
const saveResult = ref<{ success: boolean; message: string } | null>(null);

// Form data
const formData = ref<Partial<MapConfig>>({
  name: '',
  label: '',
  type: 'vtc',
  style: '',
  country: 'Global',
  flag: '🌐',
  layers: [],
  metadata: {}
});

// Helper fields for WMTS/WMS
const tilesInput = ref('');
const wmsUrl = ref('');
const layersInput = ref('');
const tileSize = ref(256);
const attribution = ref('');

// Validation
const validationErrors = ref<string[]>([]);
const isValid = computed(() => validationErrors.value.length === 0 && formData.value.name && formData.value.label);

// Countries list
const countries = [
  { name: 'Global', flag: '🌐' },
  { name: 'Austria', flag: '🇦🇹' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'Switzerland', flag: '🇨🇭' },
  { name: 'France', flag: '🇫🇷' },
  { name: 'Italy', flag: '🇮🇹' },
  { name: 'Spain', flag: '🇪🇸' },
  { name: 'Netherlands', flag: '🇳🇱' },
  { name: 'Belgium', flag: '🇧🇪' },
  { name: 'Luxembourg', flag: '🇱🇺' },
  { name: 'United Kingdom', flag: '🇬🇧' },
  { name: 'Norway', flag: '🇳🇴' },
  { name: 'Denmark', flag: '🇩🇰' },
  { name: 'Sweden', flag: '🇸🇪' },
  { name: 'Finland', flag: '🇫🇮' },
  { name: 'Poland', flag: '🇵🇱' },
  { name: 'Czech Republic', flag: '🇨🇿' },
  { name: 'Slovakia', flag: '🇸🇰' },
  { name: 'Hungary', flag: '🇭🇺' },
  { name: 'Romania', flag: '🇷🇴' },
  { name: 'Portugal', flag: '🇵🇹' },
  { name: 'Greece', flag: '🇬🇷' },
  { name: 'United States', flag: '🇺🇸' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'Australia', flag: '🇦🇺' },
  { name: 'New Zealand', flag: '🇳🇿' },
  { name: 'Japan', flag: '🇯🇵' },
  { name: 'China', flag: '🇨🇳' },
  { name: 'India', flag: '🇮🇳' },
  { name: 'Russia', flag: '🇷🇺' }
];

const configPreview = computed(() => {
  const config = {
    name: formData.value.name || 'map_name',
    label: formData.value.label || 'Map Label',
    type: formData.value.type,
    country: formData.value.country,
    flag: formData.value.flag,
    ...(formData.value.type === 'vtc' && formData.value.style && { style: formData.value.style }),
    ...(formData.value.layers?.length && { layers: formData.value.layers }),
    ...(formData.value.metadata && Object.keys(formData.value.metadata).length && { 
      ...(formData.value.metadata.tiles && { tiles: formData.value.metadata.tiles }),
      ...(formData.value.metadata.url && { url: formData.value.metadata.url }),
      ...(formData.value.metadata.tileSize && { tileSize: formData.value.metadata.tileSize }),
      ...(formData.value.metadata.attribution && { attribution: formData.value.metadata.attribution })
    })
  };
  
  return JSON.stringify(config, null, 2);
});

function validateForm() {
  validationErrors.value = [];
  
  if (!formData.value.name) {
    validationErrors.value.push('Map name is required');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.value.name)) {
    validationErrors.value.push('Map name can only contain letters, numbers, underscores, and hyphens');
  }
  
  if (!formData.value.label) {
    validationErrors.value.push('Display label is required');
  }
  
  if (!formData.value.type) {
    validationErrors.value.push('Map type is required');
  }
  
  if (formData.value.type === 'vtc' && !formData.value.style) {
    validationErrors.value.push('Style URL is required for vector tile maps');
  }
  
  if (formData.value.type === 'wmts' && !formData.value.metadata?.tiles) {
    validationErrors.value.push('Tile URL template is required for WMTS maps');
  }
  
  if (formData.value.type === 'wms' && !formData.value.metadata?.url) {
    validationErrors.value.push('WMS endpoint URL is required for WMS maps');
  }
  
  if (!formData.value.country) {
    validationErrors.value.push('Country is required');
  }
}

function onTypeChange() {
  // Clear type-specific fields when changing type
  if (formData.value.type !== 'vtc') {
    formData.value.style = '';
  }
  if (formData.value.type !== 'wms') {
    formData.value.layers = [];
  }
  validateForm();
}

function updateFlag() {
  const country = countries.find(c => c.name === formData.value.country);
  if (country) {
    formData.value.flag = country.flag;
  }
}

function applyTemplate(template: string) {
  if (template === 'maptiler') {
    formData.value.style = 'https://api.maptiler.com/maps/streets/style.json';
  } else if (template === 'github') {
    formData.value.style = 'https://raw.githubusercontent.com/geolantis/basemap/main/style.json';
  }
  validateForm();
}

function updateTiles() {
  if (!formData.value.metadata) {
    formData.value.metadata = {};
  }
  formData.value.metadata.tiles = tilesInput.value ? [tilesInput.value] : [];
  validateForm();
}

function updateWmsUrl() {
  if (!formData.value.metadata) {
    formData.value.metadata = {};
  }
  formData.value.metadata.url = wmsUrl.value;
  validateForm();
}

function updateLayers() {
  formData.value.layers = layersInput.value
    .split(',')
    .map(l => l.trim())
    .filter(l => l);
  validateForm();
}

function updateMetadata() {
  if (!formData.value.metadata) {
    formData.value.metadata = {};
  }
  formData.value.metadata.tileSize = tileSize.value;
  formData.value.metadata.attribution = attribution.value;
  validateForm();
}

async function saveConfig() {
  if (!isValid.value) return;
  
  saving.value = true;
  saveResult.value = null;
  
  try {
    if (isEditMode.value) {
      await configStore.updateConfig(route.params.id as string, formData.value);
      saveResult.value = {
        success: true,
        message: 'Configuration updated successfully!'
      };
    } else {
      await configStore.createConfig(formData.value);
      saveResult.value = {
        success: true,
        message: 'Configuration created successfully!'
      };
    }
    
    // Redirect after successful save
    setTimeout(() => {
      router.push('/');
    }, 1500);
  } catch (error) {
    saveResult.value = {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to save configuration'
    };
  } finally {
    saving.value = false;
  }
}

async function loadConfig() {
  if (!isEditMode.value) return;
  
  try {
    const config = await configStore.fetchConfig(route.params.id as string);
    if (config) {
      formData.value = { ...config };
      
      // Load helper fields
      if (config.metadata?.tiles?.[0]) {
        tilesInput.value = config.metadata.tiles[0];
      }
      if (config.metadata?.url) {
        wmsUrl.value = config.metadata.url;
      }
      if (config.layers?.length) {
        layersInput.value = config.layers.join(', ');
      }
      if (config.metadata?.tileSize) {
        tileSize.value = config.metadata.tileSize;
      }
      if (config.metadata?.attribution) {
        attribution.value = config.metadata.attribution;
      }
    }
  } catch (error) {
    console.error('Failed to load configuration:', error);
    router.push('/');
  }
}

onMounted(() => {
  loadConfig();
  validateForm();
});

// Watch for changes to trigger validation
watch(() => formData.value, validateForm, { deep: true });
</script>