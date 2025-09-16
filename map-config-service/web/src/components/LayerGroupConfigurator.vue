<template>
  <Dialog
    v-model:visible="visible"
    modal
    :closable="true"
    :draggable="false"
    :focusOnShow="false"
    :autoZIndex="true"
    :baseZIndex="1000"
    class="layer-group-dialog"
    :style="{ width: '95vw', maxWidth: '1400px', height: '90vh' }"
    :contentStyle="{ height: 'calc(90vh - 80px)', padding: 0 }"
    header="Configure Layer Group"
    @hide="handleClose"
  >
    <div class="flex flex-col h-full">
      <!-- Header Section -->
      <div class="flex-shrink-0 pb-4 border-b border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Group Name -->
          <div class="col-span-1 md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Layer Group Name *
            </label>
            <InputText
              v-model="localConfig.name"
              placeholder="Enter layer group name..."
              class="w-full"
              :class="{ 'p-invalid': !localConfig.name.trim() }"
            />
          </div>

          <!-- Country Selection -->
          <div class="col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Country/Region
            </label>
            <Dropdown
              v-model="localConfig.country"
              :options="availableCountries"
              optionLabel="label"
              optionValue="value"
              placeholder="Select country"
              class="w-full"
              showClear
            >
              <template #value="slotProps">
                <div v-if="slotProps.value" class="flex items-center">
                  <span class="mr-2">{{ getCountryFlag(slotProps.value) }}</span>
                  <span>{{ slotProps.value }}</span>
                </div>
                <span v-else>{{ slotProps.placeholder }}</span>
              </template>
              <template #option="slotProps">
                <div class="flex items-center">
                  <span class="mr-2">{{ slotProps.option.flag }}</span>
                  <span>{{ slotProps.option.label }}</span>
                </div>
              </template>
            </Dropdown>
          </div>

          <!-- Selected Basemap Info -->
          <div class="col-span-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Selected Basemap
            </label>
            <div v-if="localConfig.basemap" class="flex items-center space-x-2 p-2 bg-gray-50 rounded">
              <img
                v-if="localConfig.basemap.previewUrl"
                :src="localConfig.basemap.previewUrl"
                :alt="localConfig.basemap.label"
                class="w-8 h-8 rounded object-cover"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ localConfig.basemap.label }}
                </p>
                <p class="text-xs text-gray-500 truncate">
                  {{ localConfig.basemap.type.toUpperCase() }}
                </p>
              </div>
            </div>
            <p v-else class="text-sm text-gray-500 italic">No basemap selected</p>
          </div>
        </div>

        <!-- Description (optional) -->
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Description (optional)
          </label>
          <InputText
            v-model="localConfig.description"
            placeholder="Enter a description for this layer group..."
            class="w-full"
          />
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 overflow-hidden">
        <TabView v-model:activeIndex="activeTabIndex" class="h-full">
          <!-- Basemap Selection Tab -->
          <TabPanel header="1. Select Basemap">
            <div class="h-full flex flex-col">
              <!-- Basemap Search and Filters -->
              <div class="flex-shrink-0 mb-4">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div class="md:col-span-2">
                    <InputText
                      v-model="basemapSearchQuery"
                      placeholder="Search basemaps..."
                      class="w-full"
                    >
                      <template #prefix>
                        <i class="pi pi-search"></i>
                      </template>
                    </InputText>
                  </div>
                  <div>
                    <Dropdown
                      v-model="basemapTypeFilter"
                      :options="basemapTypes"
                      placeholder="All Types"
                      showClear
                      class="w-full"
                      style="background: white !important;"
                    />
                  </div>
                  <div>
                    <Dropdown
                      v-model="basemapCountryFilter"
                      :options="basemapCountries"
                      placeholder="All Countries"
                      showClear
                      class="w-full"
                      style="background: white !important;"
                    />
                  </div>
                </div>
              </div>

              <!-- Basemap Grid -->
              <div class="flex-1 overflow-y-auto" style="height: calc(100% - 120px); max-height: 600px; min-height: 400px;">
                <div v-if="filteredBasemaps.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
                  <BasemapCard
                    v-for="basemap in filteredBasemaps"
                    :key="basemap.id"
                    :basemap="basemap"
                    :selected="localConfig.basemap?.id === basemap.id"
                    @select="selectBasemap(basemap)"
                  />
                </div>
                <div v-else class="flex items-center justify-center h-64">
                  <div class="text-center">
                    <i class="pi pi-map text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-500">No basemaps found matching your criteria</p>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>

          <!-- Overlay Selection Tab -->
          <TabPanel header="2. Select Overlays">
            <div class="h-full flex flex-col">
              <!-- Overlay Search and Filters -->
              <div class="flex-shrink-0 mb-4">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div class="md:col-span-2">
                    <InputText
                      v-model="overlaySearchQuery"
                      placeholder="Search overlays..."
                      class="w-full"
                    >
                      <template #prefix>
                        <i class="pi pi-search"></i>
                      </template>
                    </InputText>
                  </div>
                  <div>
                    <Dropdown
                      v-model="overlayTypeFilter"
                      :options="overlayTypes"
                      placeholder="All Types"
                      showClear
                      class="w-full"
                      style="background: white !important;"
                    />
                  </div>
                  <div>
                    <MultiSelect
                      v-model="overlayCountryFilter"
                      :options="overlayCountries"
                      placeholder="All Countries"
                      class="w-full"
                      :maxSelectedLabels="2"
                    />
                  </div>
                </div>
              </div>

              <!-- Compatible Overlays Notice -->
              <div v-if="localConfig.basemap" class="flex-shrink-0 mb-4">
                <Message severity="info" :closable="false">
                  <template #messageicon>
                    <i class="pi pi-info-circle"></i>
                  </template>
                  Showing overlays compatible with {{ localConfig.basemap.label }} ({{ localConfig.basemap.type.toUpperCase() }})
                </Message>
              </div>

              <!-- Overlay Grid -->
              <div class="flex-1 overflow-y-auto" style="height: calc(100% - 120px); max-height: 600px; min-height: 400px;">
                <div v-if="compatibleOverlays.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
                  <OverlayCard
                    v-for="overlay in compatibleOverlays"
                    :key="overlay.id"
                    :overlay="overlay"
                    :selected="isOverlaySelected(overlay.id)"
                    :show-compatibility="true"
                    :compatibility-score="getCompatibilityScore(overlay)"
                    @select="toggleOverlay(overlay)"
                  />
                </div>
                <div v-else class="flex items-center justify-center h-64">
                  <div class="text-center">
                    <i class="pi pi-layers text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-500">
                      {{ localConfig.basemap ? 'No compatible overlays found' : 'Select a basemap first to see compatible overlays' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>

          <!-- Configure Overlays Tab -->
          <TabPanel header="3. Configure & Order">
            <div class="h-full flex flex-col">
              <!-- Selected Overlays Info -->
              <div class="flex-shrink-0 mb-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-medium text-gray-900">
                    Selected Overlays ({{ localConfig.overlays.length }})
                  </h3>
                  <div class="text-sm text-gray-500">
                    Drag to reorder • Higher positions render on top
                  </div>
                </div>
              </div>

              <!-- Overlay Configuration List -->
              <div class="flex-1 overflow-y-auto">
                <div v-if="localConfig.overlays.length > 0" class="space-y-4">
                  <div
                    v-for="(overlayConfig, index) in localConfig.overlays"
                    :key="overlayConfig.overlay.id"
                    class="relative"
                    @dragover.prevent
                    @drop="handleDrop(index, $event)"
                  >
                    <OverlayCard
                      :overlay="overlayConfig.overlay"
                      :draggable="true"
                      :show-controls="true"
                      :show-actions="true"
                      :show-order="true"
                      :order="index + 1"
                      :opacity="overlayConfig.opacity"
                      :blend-mode="overlayConfig.blendMode"
                      @drag-start="handleDragStart(index, $event)"
                      @drag-end="handleDragEnd"
                      @remove="removeOverlay(index)"
                      @opacity-change="updateOverlayOpacity(index, $event)"
                      @blend-mode-change="updateOverlayBlendMode(index, $event)"
                    />
                  </div>
                </div>
                <div v-else class="flex items-center justify-center h-64">
                  <div class="text-center">
                    <i class="pi pi-layers text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-500">No overlays selected</p>
                    <p class="text-xs text-gray-400 mt-2">Go back to the previous tab to select overlays</p>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>

          <!-- Preview Tab -->
          <TabPanel header="4. Preview">
            <div class="h-full flex flex-col">
              <!-- Preview Controls -->
              <div class="flex-shrink-0 mb-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-medium text-gray-900">Layer Group Preview</h3>
                  <div class="flex space-x-2">
                    <Button @click="refreshPreview" size="small" outlined>
                      <i class="pi pi-refresh mr-2"></i>
                      Refresh
                    </Button>
                    <Button @click="togglePreviewMode" size="small" outlined>
                      <i class="pi pi-eye mr-2"></i>
                      {{ previewMode === 'split' ? 'Full View' : 'Split View' }}
                    </Button>
                  </div>
                </div>
              </div>

              <!-- Preview Area -->
              <div class="flex-1 flex gap-4">
                <!-- Map Preview -->
                <div class="flex-1">
                  <LayerGroupMapPreview
                    v-if="localConfig.basemap"
                    :basemap="localConfig.basemap"
                    :overlays="localConfig.overlays"
                  />
                  <div v-else class="h-full bg-gray-100 rounded-lg flex items-center justify-center">
                    <div class="text-center">
                      <i class="pi pi-exclamation-triangle text-4xl text-yellow-400 mb-4"></i>
                      <p class="text-gray-600">Select a basemap to see preview</p>
                    </div>
                  </div>
                </div>

                <!-- Layer Stack Visualization -->
                <div v-if="previewMode === 'split'" class="w-80 bg-gray-100 rounded-lg p-4">
                  <div v-if="localConfig.basemap" class="h-full">
                    <div class="bg-white rounded-lg shadow-sm h-full p-4">
                      <h4 class="text-sm font-medium text-gray-900 mb-3">Layer Stack</h4>
                      <div class="text-xs text-gray-600 mb-3">Rendering Order (Top to Bottom):</div>

                      <div class="space-y-2">
                        <!-- Overlays (top to bottom) -->
                        <div
                          v-for="(overlayConfig, index) in [...localConfig.overlays].reverse()"
                          :key="overlayConfig.overlay.id"
                          class="flex items-center bg-gray-50 rounded p-2"
                        >
                          <div class="w-3 h-3 rounded-sm mr-2 border border-gray-300"
                               :style="{ backgroundColor: getLayerColor(overlayConfig.overlay.type), opacity: overlayConfig.opacity / 100 }">
                          </div>
                          <span class="truncate flex-1 text-xs">{{ overlayConfig.overlay.label }}</span>
                          <span class="ml-2 text-gray-500 text-xs">{{ overlayConfig.opacity }}%</span>
                        </div>

                        <!-- Basemap (bottom) -->
                        <div class="flex items-center border-t pt-2 mt-2 bg-blue-50 rounded p-2">
                          <div class="w-3 h-3 rounded-sm mr-2 border border-gray-300"
                               :style="{ backgroundColor: getLayerColor(localConfig.basemap.type) }">
                          </div>
                          <span class="truncate font-medium text-xs">{{ localConfig.basemap.label }}</span>
                          <span class="ml-auto text-gray-500 text-xs">Base</span>
                        </div>
                      </div>

                      <!-- Legend -->
                      <div class="mt-4 pt-4 border-t border-gray-200">
                        <div class="text-xs text-gray-600">
                          <div class="font-medium mb-2">Layer Types:</div>
                          <div class="grid grid-cols-2 gap-1">
                            <div class="flex items-center">
                              <div class="w-2 h-2 rounded-sm mr-1" style="background: #3b82f6;"></div>
                              <span>VTC</span>
                            </div>
                            <div class="flex items-center">
                              <div class="w-2 h-2 rounded-sm mr-1" style="background: #10b981;"></div>
                              <span>WMTS</span>
                            </div>
                            <div class="flex items-center">
                              <div class="w-2 h-2 rounded-sm mr-1" style="background: #8b5cf6;"></div>
                              <span>WMS</span>
                            </div>
                            <div class="flex items-center">
                              <div class="w-2 h-2 rounded-sm mr-1" style="background: #f59e0b;"></div>
                              <span>XYZ</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>
        </TabView>
      </div>

      <!-- Footer Actions -->
      <div class="flex-shrink-0 pt-4 border-t border-gray-200">
        <div class="flex justify-between items-center">
          <!-- Navigation Buttons -->
          <div class="flex space-x-2">
            <Button
              v-if="activeTabIndex > 0"
              @click="activeTabIndex--"
              outlined
              size="small"
            >
              <i class="pi pi-chevron-left mr-2"></i>
              Previous
            </Button>
            <Button
              v-if="activeTabIndex < 3"
              @click="activeTabIndex++"
              outlined
              size="small"
              :disabled="activeTabIndex === 0 && !localConfig.basemap"
            >
              Next
              <i class="pi pi-chevron-right ml-2"></i>
            </Button>
          </div>

          <!-- Action Buttons -->
          <div class="flex space-x-2">
            <Button @click="handleClose" outlined>
              Cancel
            </Button>
            <Button
              @click="handleSave"
              :disabled="!canSave"
              :loading="saving"
            >
              <i class="pi pi-save mr-2"></i>
              {{ editMode ? 'Update Group' : 'Create Group' }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import Dialog from 'primevue/dialog';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import MultiSelect from 'primevue/multiselect';
import Button from 'primevue/button';
import Message from 'primevue/message';
import BasemapCard from './BasemapCard.vue';
import OverlayCard from './OverlayCard.vue';
import LayerGroupMapPreview from './LayerGroupMapPreview.vue';
import type { BasemapLayer, OverlayLayer, LayerGroup, LayerGroupConfig } from '../types';

interface Props {
  visible: boolean;
  layerGroup?: LayerGroup;
  basemaps: BasemapLayer[];
  overlays: OverlayLayer[];
}

interface Emits {
  (e: 'update:visible', visible: boolean): void;
  (e: 'save', config: LayerGroupConfig): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// State
const activeTabIndex = ref(0);
const saving = ref(false);
const previewMode = ref<'full' | 'split'>('split');
const draggedIndex = ref<number | null>(null);

// Local configuration
const localConfig = ref<LayerGroupConfig>({
  name: '',
  basemap: null,
  overlays: [],
  country: 'Global',
  countryFlag: '🌍',
  description: ''
});

// Search and filter states
const basemapSearchQuery = ref('');
const basemapTypeFilter = ref('');
const basemapCountryFilter = ref('');
const overlaySearchQuery = ref('');
const overlayTypeFilter = ref('');
const overlayCountryFilter = ref<string[]>([]);

// Computed properties
const editMode = computed(() => !!props.layerGroup);

const canSave = computed(() => {
  return localConfig.value.name.trim() && localConfig.value.basemap;
});

const basemapTypes = computed(() => {
  if (!props.basemaps || props.basemaps.length === 0) return [];
  const types = new Set(props.basemaps.map(b => b.type).filter(Boolean));
  // Return simple string array for PrimeVue Dropdown
  return Array.from(types).sort();
});

const basemapCountries = computed(() => {
  if (!props.basemaps || props.basemaps.length === 0) return [];
  const countries = new Set(props.basemaps.map(b => b.country).filter(Boolean));
  // Return simple string array for PrimeVue Dropdown
  return Array.from(countries).sort();
});

const overlayTypes = computed(() => {
  if (!props.overlays || props.overlays.length === 0) return [];
  const types = new Set(props.overlays.map(o => o.type).filter(Boolean));
  // Return simple string array for PrimeVue Dropdown
  return Array.from(types).sort();
});

const overlayCountries = computed(() => {
  if (!props.overlays || props.overlays.length === 0) return [];
  const countries = new Set(props.overlays.map(o => o.country).filter(Boolean));
  // Return simple string array for PrimeVue MultiSelect
  return Array.from(countries).sort();
});

const filteredBasemaps = computed(() => {
  console.log('Filtering basemaps:', {
    total: props.basemaps?.length,
    searchQuery: basemapSearchQuery.value,
    typeFilter: basemapTypeFilter.value,
    countryFilter: basemapCountryFilter.value
  });

  if (!props.basemaps || props.basemaps.length === 0) {
    console.log('No basemaps to filter');
    return [];
  }

  return props.basemaps.filter(basemap => {
    // Search filter
    if (basemapSearchQuery.value) {
      const searchLower = basemapSearchQuery.value.toLowerCase();
      const labelMatch = basemap.label?.toLowerCase().includes(searchLower) || false;
      const nameMatch = basemap.name?.toLowerCase().includes(searchLower) || false;
      if (!labelMatch && !nameMatch) return false;
    }

    // Type filter
    if (basemapTypeFilter.value && basemapTypeFilter.value !== '') {
      if (basemap.type !== basemapTypeFilter.value) return false;
    }

    // Country filter
    if (basemapCountryFilter.value && basemapCountryFilter.value !== '') {
      if (basemap.country !== basemapCountryFilter.value) return false;
    }

    // Show basemap if isActive is not explicitly false
    return basemap.isActive !== false;
  });
});

const compatibleOverlays = computed(() => {
  if (!localConfig.value.basemap) return [];

  return props.overlays.filter(overlay => {
    if (overlaySearchQuery.value && !overlay.label.toLowerCase().includes(overlaySearchQuery.value.toLowerCase()) &&
        !overlay.name.toLowerCase().includes(overlaySearchQuery.value.toLowerCase())) {
      return false;
    }
    if (overlayTypeFilter.value && overlay.type !== overlayTypeFilter.value) {
      return false;
    }
    if (overlayCountryFilter.value.length > 0 && !overlayCountryFilter.value.includes(overlay.country)) {
      return false;
    }
    // Show overlay if isActive is not explicitly false (default to showing)
    if (overlay.isActive === false) return false;

    // Check compatibility with basemap
    return isCompatible(localConfig.value.basemap!, overlay);
  });
});

// Methods
const selectBasemap = (basemap: BasemapLayer) => {
  localConfig.value.basemap = basemap;

  // If layer group country is not set or is Global, inherit from basemap
  if ((!localConfig.value.country || localConfig.value.country === 'Global') && basemap.country && basemap.country !== 'Global') {
    localConfig.value.country = basemap.country;
    localConfig.value.countryFlag = basemap.flag || getCountryFlag(basemap.country);
  }

  // Clear incompatible overlays when basemap changes
  localConfig.value.overlays = localConfig.value.overlays.filter(config =>
    isCompatible(basemap, config.overlay)
  );
};

const toggleOverlay = (overlay: OverlayLayer) => {
  const index = localConfig.value.overlays.findIndex(config => config.overlay.id === overlay.id);
  if (index >= 0) {
    localConfig.value.overlays.splice(index, 1);
  } else {
    localConfig.value.overlays.push({
      overlay,
      opacity: 80,
      blendMode: 'normal',
      order: localConfig.value.overlays.length
    });
  }
};

const isOverlaySelected = (overlayId: string) => {
  return localConfig.value.overlays.some(config => config.overlay.id === overlayId);
};

const removeOverlay = (index: number) => {
  localConfig.value.overlays.splice(index, 1);
  // Update order for remaining overlays
  localConfig.value.overlays.forEach((config, i) => {
    config.order = i;
  });
};

const updateOverlayOpacity = (index: number, opacity: number) => {
  if (localConfig.value.overlays[index]) {
    localConfig.value.overlays[index].opacity = opacity;
  }
};

const updateOverlayBlendMode = (index: number, blendMode: string) => {
  if (localConfig.value.overlays[index]) {
    localConfig.value.overlays[index].blendMode = blendMode;
  }
};

const isCompatible = (basemap: BasemapLayer, overlay: OverlayLayer) => {
  // Basic compatibility check - same projection, compatible formats
  // This would be more sophisticated in a real implementation
  return true; // For demo purposes
};

const getCompatibilityScore = (overlay: OverlayLayer) => {
  // Mock compatibility scoring
  return Math.floor(Math.random() * 20) + 80;
};

// Country data
const availableCountries = ref([
  { value: 'Global', label: 'Global', flag: '🌍' },
  { value: 'Austria', label: 'Austria', flag: '🇦🇹' },
  { value: 'Germany', label: 'Germany', flag: '🇩🇪' },
  { value: 'Switzerland', label: 'Switzerland', flag: '🇨🇭' },
  { value: 'Italy', label: 'Italy', flag: '🇮🇹' },
  { value: 'France', label: 'France', flag: '🇫🇷' },
  { value: 'Spain', label: 'Spain', flag: '🇪🇸' },
  { value: 'United Kingdom', label: 'United Kingdom', flag: '🇬🇧' },
  { value: 'United States', label: 'United States', flag: '🇺🇸' },
  { value: 'Canada', label: 'Canada', flag: '🇨🇦' },
  { value: 'Australia', label: 'Australia', flag: '🇦🇺' },
  { value: 'Netherlands', label: 'Netherlands', flag: '🇳🇱' },
  { value: 'Belgium', label: 'Belgium', flag: '🇧🇪' },
  { value: 'Poland', label: 'Poland', flag: '🇵🇱' },
  { value: 'Czech Republic', label: 'Czech Republic', flag: '🇨🇿' },
  { value: 'Slovakia', label: 'Slovakia', flag: '🇸🇰' },
  { value: 'Hungary', label: 'Hungary', flag: '🇭🇺' },
  { value: 'Slovenia', label: 'Slovenia', flag: '🇸🇮' },
  { value: 'Croatia', label: 'Croatia', flag: '🇭🇷' },
  { value: 'Denmark', label: 'Denmark', flag: '🇩🇰' },
  { value: 'Sweden', label: 'Sweden', flag: '🇸🇪' },
  { value: 'Norway', label: 'Norway', flag: '🇳🇴' },
  { value: 'Finland', label: 'Finland', flag: '🇫🇮' }
]);

const getCountryFlag = (country: string | undefined): string => {
  if (!country) return '🌍';
  const countryData = availableCountries.value.find(c => c.value === country);
  return countryData?.flag || '🏳️';
};

const getLayerColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'vtc': return '#3b82f6';
    case 'wmts': return '#10b981';
    case 'wms': return '#8b5cf6';
    case 'xyz': return '#f59e0b';
    case 'geojson': return '#eab308';
    default: return '#6b7280';
  }
};

// Drag and drop handlers
const handleDragStart = (index: number, event: DragEvent) => {
  draggedIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
};

const handleDragEnd = () => {
  draggedIndex.value = null;
};

const handleDrop = (targetIndex: number, event: DragEvent) => {
  event.preventDefault();
  if (draggedIndex.value !== null && draggedIndex.value !== targetIndex) {
    const draggedItem = localConfig.value.overlays.splice(draggedIndex.value, 1)[0];
    localConfig.value.overlays.splice(targetIndex, 0, draggedItem);

    // Update order for all overlays
    localConfig.value.overlays.forEach((config, i) => {
      config.order = i;
    });
  }
  draggedIndex.value = null;
};

const refreshPreview = () => {
  // Refresh preview logic
};

const togglePreviewMode = () => {
  previewMode.value = previewMode.value === 'full' ? 'split' : 'full';
};

const handleSave = async () => {
  if (!canSave.value) return;

  saving.value = true;
  try {
    // Set country flag based on selected country
    localConfig.value.countryFlag = getCountryFlag(localConfig.value.country);

    emit('save', { ...localConfig.value });
    handleClose();
  } catch (error) {
    console.error('Error saving layer group:', error);
  } finally {
    saving.value = false;
  }
};

const handleClose = () => {
  emit('update:visible', false);
  emit('close');
};

const resetForm = () => {
  localConfig.value = {
    name: '',
    basemap: null,
    overlays: [],
    country: 'Global',
    countryFlag: '🌍',
    description: ''
  };
  activeTabIndex.value = 0;
  basemapSearchQuery.value = '';
  basemapTypeFilter.value = '';
  basemapCountryFilter.value = '';
  overlaySearchQuery.value = '';
  overlayTypeFilter.value = '';
  overlayCountryFilter.value = [];
};

// Watch for prop changes
watch(() => props.layerGroup, (newGroup) => {
  if (newGroup) {
    localConfig.value = {
      name: newGroup.name,
      basemap: newGroup.basemap,
      overlays: [...newGroup.overlays],
      country: newGroup.country || 'Global',
      countryFlag: newGroup.countryFlag || '🌍',
      description: newGroup.description || ''
    };
  } else {
    resetForm();
  }
}, { immediate: true });

watch(() => props.visible, (newVisible) => {
  if (!newVisible) {
    resetForm();
  }
});
</script>

<style scoped>
/* Fix for dialog transparency and overlay issues */
/* Force opaque white background for the entire dialog */
:deep(.p-dialog) {
  background: rgb(255, 255, 255) !important;
  background-color: white !important;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  border-radius: 12px;
  max-height: 90vh;
  opacity: 1 !important;
}

:deep(.p-dialog-header) {
  background: rgb(255, 255, 255) !important;
  background-color: white !important;
  border-bottom: 1px solid #e5e7eb;
  padding: 1.25rem;
  border-radius: 12px 12px 0 0;
  opacity: 1 !important;
}

:deep(.p-dialog-content) {
  background: rgb(255, 255, 255) !important;
  background-color: white !important;
  padding: 0;
  overflow: visible;
  opacity: 1 !important;
}

:deep(.p-dialog-mask) {
  background-color: rgba(0, 0, 0, 0.5) !important;
  backdrop-filter: blur(2px);
}

:deep(.p-tabview) {
  background: rgb(255, 255, 255) !important;
  opacity: 1 !important;
}

:deep(.p-tabview-panels) {
  background: rgb(255, 255, 255) !important;
  background-color: white !important;
  opacity: 1 !important;
}

:deep(.p-tabview-panel) {
  background: rgb(255, 255, 255) !important;
  background-color: white !important;
  padding: 1rem;
  opacity: 1 !important;
}

/* Ensure all child elements are also opaque */
:deep(.p-dialog *) {
  opacity: 1 !important;
}
</style>

<!-- Global style to force dialog opacity -->
<style>
/* Global overrides for PrimeVue dialog transparency issue */
.p-dialog,
.p-dialog * {
  background: rgb(255, 255, 255) !important;
  background-color: white !important;
  opacity: 1 !important;
}

.p-dialog-mask {
  background-color: rgba(0, 0, 0, 0.4) !important;
}

.p-dialog-content,
.p-dialog-header,
.p-dialog-footer {
  background: white !important;
  opacity: 1 !important;
}

.p-tabview,
.p-tabview-panels,
.p-tabview-panel {
  background: white !important;
  opacity: 1 !important;
}

/* Fix dropdown transparency */
.p-dropdown-panel,
.p-dropdown-items-wrapper,
.p-dropdown-items,
.p-dropdown-item {
  background: white !important;
  background-color: rgb(255, 255, 255) !important;
  opacity: 1 !important;
}

.p-dropdown-panel {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
}

/* Fix multiselect transparency */
.p-multiselect-panel,
.p-multiselect-items-wrapper,
.p-multiselect-items,
.p-multiselect-item {
  background: white !important;
  opacity: 1 !important;
}
</style>