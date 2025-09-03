<template>
  <div class="location-search-container">
    <div class="search-input-wrapper">
      <i class="pi pi-map-marker search-icon"></i>
      <input
        ref="searchInput"
        v-model="searchQuery"
        @input="handleInput"
        @keyup.enter="selectFirstResult"
        @keydown.down="navigateResults('down')"
        @keydown.up="navigateResults('up')"
        @keydown.esc="clearResults"
        type="text"
        :placeholder="placeholder"
        class="location-search-input"
        :disabled="disabled"
      />
      <button
        v-if="searchQuery"
        @click="clearSearch"
        class="clear-button"
        title="Clear search"
      >
        <i class="pi pi-times"></i>
      </button>
      <button
        v-if="!searchQuery && !disabled"
        @click="getCurrentLocation"
        class="location-button"
        title="Use my location"
      >
        <i class="pi pi-compass"></i>
      </button>
    </div>

    <!-- Search Results Dropdown -->
    <div
      v-if="showResults && searchResults.length > 0"
      class="search-results-dropdown"
    >
      <div
        v-for="(result, index) in searchResults"
        :key="result.id"
        @click="selectResult(result)"
        @mouseenter="highlightedIndex = index"
        class="search-result-item"
        :class="{ 'highlighted': index === highlightedIndex }"
      >
        <div class="result-icon">
          <i :class="getPlaceIcon(result)"></i>
        </div>
        <div class="result-content">
          <div class="result-name">{{ result.place_name_en || result.place_name }}</div>
          <div class="result-context">{{ formatContext(result) }}</div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isSearching" class="search-status">
      <i class="pi pi-spin pi-spinner"></i>
      <span>Searching...</span>
    </div>

    <!-- No Results -->
    <div v-if="showResults && searchQuery && !isSearching && searchResults.length === 0" class="search-status">
      <i class="pi pi-info-circle"></i>
      <span>No locations found</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { debounce } from 'lodash-es';

// Props
const props = defineProps<{
  mapboxToken?: string;
  placeholder?: string;
  disabled?: boolean;
  countries?: string[]; // ISO 3166 alpha-2 country codes to limit search
  types?: string[]; // Filter by feature types (place, locality, address, poi, etc.)
  proximity?: { lng: number; lat: number }; // Bias results to a location
  bbox?: number[]; // Limit results to a bounding box [minLng, minLat, maxLng, maxLat]
  limit?: number; // Max number of results (default 5)
}>();

// Emits
const emit = defineEmits<{
  select: [location: GeocodingResult];
  clear: [];
  error: [error: Error];
}>();

// Types
interface GeocodingResult {
  id: string;
  type: string;
  place_type: string[];
  place_name: string;
  place_name_en?: string;
  text: string;
  text_en?: string;
  center: [number, number]; // [lng, lat]
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  bbox?: [number, number, number, number];
  properties?: any;
  context?: Array<{
    id: string;
    text: string;
    text_en?: string;
  }>;
}

// State
const searchQuery = ref('');
const searchResults = ref<GeocodingResult[]>([]);
const showResults = ref(false);
const isSearching = ref(false);
const highlightedIndex = ref(-1);
const searchInput = ref<HTMLInputElement | null>(null);

// Get Mapbox token from props or environment
const mapboxAccessToken = computed(() => {
  return props.mapboxToken || import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
});

// Check if Mapbox token is available
const hasMapboxToken = computed(() => {
  return !!mapboxAccessToken.value;
});

// Build geocoding URL
function buildGeocodingUrl(query: string): string {
  const baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
  const encodedQuery = encodeURIComponent(query);
  const params = new URLSearchParams();
  
  params.append('access_token', mapboxAccessToken.value);
  params.append('limit', String(props.limit || 5));
  
  if (props.countries && props.countries.length > 0) {
    params.append('country', props.countries.join(','));
  }
  
  if (props.types && props.types.length > 0) {
    params.append('types', props.types.join(','));
  }
  
  if (props.proximity) {
    params.append('proximity', `${props.proximity.lng},${props.proximity.lat}`);
  }
  
  if (props.bbox && props.bbox.length === 4) {
    params.append('bbox', props.bbox.join(','));
  }
  
  return `${baseUrl}/${encodedQuery}.json?${params.toString()}`;
}

// Search for locations
async function searchLocations(query: string) {
  if (!query || query.length < 2) {
    searchResults.value = [];
    showResults.value = false;
    return;
  }
  
  if (!hasMapboxToken.value) {
    console.warn('Mapbox access token not configured. Location search disabled.');
    emit('error', new Error('Mapbox access token not configured'));
    return;
  }
  
  isSearching.value = true;
  showResults.value = true;
  
  try {
    const url = buildGeocodingUrl(query);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    searchResults.value = data.features || [];
    highlightedIndex.value = -1;
    
  } catch (error) {
    console.error('Location search error:', error);
    searchResults.value = [];
    emit('error', error as Error);
  } finally {
    isSearching.value = false;
  }
}

// Debounced search
const debouncedSearch = debounce(searchLocations, 300);

// Handle input changes
function handleInput() {
  if (searchQuery.value) {
    debouncedSearch(searchQuery.value);
  } else {
    clearResults();
  }
}

// Select a search result
function selectResult(result: GeocodingResult) {
  searchQuery.value = result.place_name_en || result.place_name;
  showResults.value = false;
  searchResults.value = [];
  emit('select', result);
}

// Select first result on Enter
function selectFirstResult() {
  if (searchResults.value.length > 0) {
    const index = highlightedIndex.value >= 0 ? highlightedIndex.value : 0;
    selectResult(searchResults.value[index]);
  }
}

// Navigate results with keyboard
function navigateResults(direction: 'up' | 'down') {
  if (searchResults.value.length === 0) return;
  
  if (direction === 'down') {
    highlightedIndex.value = Math.min(highlightedIndex.value + 1, searchResults.value.length - 1);
  } else {
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1);
  }
}

// Clear search
function clearSearch() {
  searchQuery.value = '';
  clearResults();
  emit('clear');
  searchInput.value?.focus();
}

// Clear results
function clearResults() {
  searchResults.value = [];
  showResults.value = false;
  highlightedIndex.value = -1;
}

// Get current location
async function getCurrentLocation() {
  if (!navigator.geolocation) {
    emit('error', new Error('Geolocation is not supported by your browser'));
    return;
  }
  
  isSearching.value = true;
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      
      // Reverse geocode to get place name
      if (hasMapboxToken.value) {
        try {
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxAccessToken.value}&limit=1`;
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            selectResult(data.features[0]);
          } else {
            // If no place name found, emit coordinates directly
            emit('select', {
              id: 'current-location',
              type: 'Feature',
              place_type: ['coordinate'],
              place_name: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
              text: 'Current Location',
              center: [longitude, latitude],
              geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
              }
            } as GeocodingResult);
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          emit('error', error as Error);
        }
      } else {
        // Emit coordinates without place name
        emit('select', {
          id: 'current-location',
          type: 'Feature',
          place_type: ['coordinate'],
          place_name: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          text: 'Current Location',
          center: [longitude, latitude],
          geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          }
        } as GeocodingResult);
      }
      
      isSearching.value = false;
    },
    (error) => {
      isSearching.value = false;
      emit('error', new Error(`Unable to get your location: ${error.message}`));
    }
  );
}

// Get icon for place type
function getPlaceIcon(result: GeocodingResult): string {
  const placeType = result.place_type[0];
  
  switch (placeType) {
    case 'country':
      return 'pi pi-globe';
    case 'region':
    case 'postcode':
    case 'district':
      return 'pi pi-map';
    case 'place':
    case 'locality':
      return 'pi pi-building';
    case 'neighborhood':
    case 'address':
      return 'pi pi-home';
    case 'poi':
      return 'pi pi-map-marker';
    default:
      return 'pi pi-map-marker';
  }
}

// Format context for display
function formatContext(result: GeocodingResult): string {
  if (!result.context || result.context.length === 0) {
    return result.place_type[0].replace('_', ' ');
  }
  
  const contextParts = result.context
    .slice(0, 2)
    .map(ctx => ctx.text_en || ctx.text)
    .filter(Boolean);
  
  return contextParts.join(', ');
}

// Handle clicks outside to close dropdown
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.location-search-container')) {
    showResults.value = false;
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.location-search-container {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #6b7280;
  pointer-events: none;
  z-index: 1;
}

.location-search-input {
  width: 100%;
  padding: 8px 36px 8px 36px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
  background: white;
}

.location-search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.location-search-input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.clear-button,
.location-button {
  position: absolute;
  right: 8px;
  padding: 4px 8px;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.2s;
  outline: none;
}

.clear-button:hover,
.location-button:hover {
  color: #374151;
}

.search-results-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  transition: background-color 0.15s;
  border-bottom: 1px solid #f3f4f6;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover,
.search-result-item.highlighted {
  background-color: #f3f4f6;
}

.result-icon {
  margin-right: 12px;
  color: #6b7280;
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-context {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-status {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

/* Animation for spinner */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.pi-spin {
  animation: spin 1s linear infinite;
}
</style>