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

            <div class="grid grid-cols-2 gap-4">
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

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Map Category <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="formData.mapCategory"
                  @change="onCategoryChange"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="background">Background (Base Layer)</option>
                  <option value="overlay">Overlay (Transparent Layer)</option>
                </select>
              </div>
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
                placeholder="https://api.maptiler.com/maps/streets/style.json or paste JSON directly"
                @input="validateForm"
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">
                Enter a style URL, paste JSON directly, or use templates below. 
                Custom styles will be saved to /styles/ on Vercel.
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

              <!-- Select Layer for Overlays -->
              <div v-if="formData.mapCategory === 'overlay' && formData.type === 'vtc'" class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Primary Select Layer
                  <span class="text-gray-500 text-xs ml-1">(for feature selection)</span>
                </label>
                <div class="flex space-x-2">
                  <select
                    v-model="formData.selectLayer"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    :disabled="!availableLayers.length"
                  >
                    <option value="">{{ availableLayers.length ? 'Select a layer...' : 'No layers available' }}</option>
                    <option v-for="layer in availableLayers" :key="layer.value" :value="layer.value">
                      {{ layer.label }}
                    </option>
                  </select>
                  <button
                    @click="fetchAvailableLayers"
                    :disabled="!formData.style || fetchingLayers"
                    class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Fetch layers from style"
                  >
                    <i :class="fetchingLayers ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'"></i>
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-1">
                  Select the primary layer that will be used for feature selection and highlighting
                </p>
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
import { useConfigStore } from '../stores/mapConfig';
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
  mapCategory: 'background',
  layers: [],
  metadata: {},
  selectLayer: ''
});

// Helper fields for WMTS/WMS
const tilesInput = ref('');
const wmsUrl = ref('');
const layersInput = ref('');
const tileSize = ref(256);
const attribution = ref('');

// Layer selection for overlays
const availableLayers = ref<Array<{ value: string; label: string; type: string }>>([]);
const fetchingLayers = ref(false);

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
    mapCategory: formData.value.mapCategory,
    ...(formData.value.type === 'vtc' && formData.value.style && { style: formData.value.style }),
    ...(formData.value.selectLayer && { selectLayer: formData.value.selectLayer }),
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
    formData.value.selectLayer = '';
    availableLayers.value = [];
  }
  if (formData.value.type !== 'wms') {
    formData.value.layers = [];
  }
  validateForm();
}

function onCategoryChange() {
  // If switching to overlay and has a style, fetch layers
  if (formData.value.mapCategory === 'overlay' && formData.value.type === 'vtc' && formData.value.style) {
    fetchAvailableLayers();
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

async function fetchAvailableLayers() {
  if (!formData.value.style || formData.value.type !== 'vtc') {
    return;
  }

  fetchingLayers.value = true;
  availableLayers.value = [];

  try {
    // Determine if we have a URL or JSON
    let requestBody: any = {};

    if (formData.value.style.startsWith('{')) {
      // It's a JSON string
      try {
        requestBody.styleJson = JSON.parse(formData.value.style);
      } catch (e) {
        console.error('Invalid JSON in style field');
        return;
      }
    } else if (formData.value.style.startsWith('http')) {
      // It's a URL
      requestBody.styleUrl = formData.value.style;
    } else {
      // It might be a relative path or invalid
      requestBody.styleUrl = formData.value.style;
    }

    // Set selectableOnly to true for overlays
    requestBody.selectableOnly = formData.value.mapCategory === 'overlay';

    const response = await fetch('/api/layers/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      const result = await response.json();
      availableLayers.value = result.layers || [];

      // Auto-select suggested layer if none selected
      if (!formData.value.selectLayer && result.suggestedPrimary) {
        formData.value.selectLayer = result.suggestedPrimary;
      }
    } else {
      console.error('Failed to fetch layers');
    }
  } catch (error) {
    console.error('Error fetching layers:', error);
  } finally {
    fetchingLayers.value = false;
  }
}

async function saveConfig() {
  if (!isValid.value) return;

  saving.value = true;
  saveResult.value = null;
  
  try {
    // Check if we need to save a custom style file
    let finalStyleUrl = formData.value.style;
    
    // If it's a VTC map with a custom style URL (not a template)
    if (formData.value.type === 'vtc' && formData.value.style) {
      // Check if it's a custom style (not from known providers)
      const isCustomStyle = !formData.value.style.includes('maptiler.com') &&
                           !formData.value.style.includes('mapbox.com') &&
                           !formData.value.style.includes('githubusercontent.com');
      
      // If user provided a raw style JSON or wants to create a custom style
      if (isCustomStyle || formData.value.style.startsWith('{')) {
        try {
          // Parse style if it's JSON string
          let styleContent = formData.value.style;
          if (formData.value.style.startsWith('{')) {
            styleContent = JSON.parse(formData.value.style);
          } else {
            // Fetch the style from URL if provided
            try {
              const response = await fetch(formData.value.style);
              if (response.ok) {
                styleContent = await response.json();
              }
            } catch {
              // If fetch fails, assume it's a path to be created
              styleContent = {
                version: 8,
                name: formData.value.name,
                sources: {},
                layers: []
              };
            }
          }
          
          // Save style file to /styles directory
          const filename = `${formData.value.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
          // Use relative URL for production compatibility
          const apiUrl = import.meta.env.VITE_API_URL || '';
          const saveUrl = apiUrl ? `${apiUrl}/api/styles/save` : '/api/styles/save';
          
          const saveResponse = await fetch(saveUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              filename: filename,
              content: styleContent,
              metadata: {
                name: formData.value.name,
                label: formData.value.label,
                country: formData.value.country,
                createdFrom: 'dashboard'
              }
            })
          });
          
          if (saveResponse.ok) {
            const result = await saveResponse.json();
            // Update the style URL to point to the saved file
            finalStyleUrl = result.path || `/styles/${filename}`;
            console.log('Style file saved:', finalStyleUrl);
          }
        } catch (err) {
          console.warn('Could not save custom style file:', err);
          // Continue with the original URL
        }
      }
    }
    
    // Update formData with the final style URL
    const configData = {
      ...formData.value,
      style: finalStyleUrl
    };
    
    if (isEditMode.value) {
      console.log('Updating config with data:', configData);
      const updatedConfig = await configStore.updateConfig(route.params.id as string, configData);
      console.log('Update result:', updatedConfig);

      if (!updatedConfig) {
        throw new Error('Failed to update configuration - no response from server');
      }

      saveResult.value = {
        success: true,
        message: 'Configuration updated successfully!'
      };
    } else {
      await configStore.createConfig(configData);
      saveResult.value = {
        success: true,
        message: 'Configuration created successfully!'
      };
    }

    // Fetch latest configs to ensure dashboard has fresh data
    await configStore.fetchConfigs();

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

      // Ensure mapCategory has a value (default to 'background' if missing)
      if (!formData.value.mapCategory) {
        formData.value.mapCategory = 'background';
      }

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

      // If it's an overlay with VTC type and has a style, fetch available layers
      if (config.mapCategory === 'overlay' && config.type === 'vtc' && config.style) {
        await fetchAvailableLayers();
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

// Watch for style changes on overlay maps to auto-fetch layers
watch(() => formData.value.style, async (newStyle, oldStyle) => {
  if (newStyle !== oldStyle && formData.value.mapCategory === 'overlay' && formData.value.type === 'vtc' && newStyle) {
    // Debounce to avoid too many requests while typing
    setTimeout(() => {
      if (formData.value.style === newStyle) {
        fetchAvailableLayers();
      }
    }, 1000);
  }
});
</script>