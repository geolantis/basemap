<template>
  <div class="card hover:shadow-lg transition-shadow cursor-pointer" @click="$emit('preview', config)">
    <!-- Map Thumbnail -->
    <div class="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
      <img
        v-if="previewUrl"
        :src="previewUrl"
        :alt="config.label"
        class="w-full h-full object-cover"
        @error="handleImageError"
      />
      <div v-else class="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100">
        <div class="text-center">
          <i class="pi pi-map text-4xl text-gray-400 mb-2"></i>
          <p class="text-xs text-gray-500">No preview available</p>
        </div>
      </div>
      
      <!-- Badges -->
      <div class="absolute top-2 right-2 flex items-center space-x-2">
        <!-- Category Badge -->
        <span 
          :class="[
            'backdrop-blur px-2 py-1 rounded text-xs font-medium flex items-center space-x-1',
            isOverlay 
              ? 'bg-purple-500/90 text-white' 
              : 'bg-blue-500/90 text-white'
          ]"
        >
          <i :class="isOverlay ? 'pi pi-clone' : 'pi pi-map'" class="text-xs"></i>
          <span>{{ isOverlay ? 'Overlay' : 'Background' }}</span>
        </span>
        <!-- Type Badge -->
        <span class="bg-white/90 backdrop-blur px-2 py-1 rounded text-sm font-medium">
          {{ config.flag }} {{ config.type.toUpperCase() }}
        </span>
      </div>
    </div>
    
    <!-- Map Info -->
    <div class="p-4">
      <h3 class="font-semibold text-lg text-gray-900">{{ config.label }}</h3>
      <p class="text-sm text-gray-600 mt-1">{{ config.name }}</p>
      
      <!-- Meta Info -->
      <div class="flex items-center space-x-4 mt-3 text-sm text-gray-500">
        <span class="flex items-center">
          <i class="pi pi-map-marker text-xs mr-1"></i>
          {{ config.country }}
        </span>
        <span class="flex items-center">
          <i class="pi pi-clock text-xs mr-1"></i>
          {{ formatDate(config.updatedAt) }}
        </span>
      </div>
      
      <!-- Layers info if available -->
      <div v-if="config.layers?.length" class="mt-2">
        <span class="text-xs text-gray-500">
          <i class="pi pi-clone mr-1"></i>
          {{ config.layers.length }} layers
        </span>
      </div>
    </div>
    
    <!-- Actions -->
    <div class="px-4 pb-4 flex justify-between items-center">
      <div class="flex space-x-2">
        <button
          @click.stop="$emit('edit', config)"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Edit"
        >
          <i class="pi pi-pencil text-gray-600"></i>
        </button>
        <button
          @click.stop="$emit('preview', config)"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Preview"
        >
          <i class="pi pi-eye text-gray-600"></i>
        </button>
        <button
          @click.stop="$emit('duplicate', config)"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Duplicate"
        >
          <i class="pi pi-copy text-gray-600"></i>
        </button>
        <button
          @click.stop="$emit('upload-style')"
          class="p-2 hover:bg-blue-100 rounded-lg transition-colors"
          title="Upload Custom Style"
        >
          <i class="pi pi-upload text-blue-600"></i>
        </button>
      </div>
      
      <div class="relative">
        <button
          @click.stop="showMenu = !showMenu"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <i class="pi pi-ellipsis-v text-gray-600"></i>
        </button>
        
        <!-- Dropdown Menu -->
        <div
          v-if="showMenu"
          @click.stop
          class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
        >
          <button
            @click="duplicateWithEdits"
            class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
          >
            Duplicate & Edit
          </button>
          <button
            @click="cloneToCountry"
            class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
          >
            Clone to Another Country
          </button>
          <button
            @click="exportJSON"
            class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
          >
            Export JSON
          </button>
          <button
            @click="openInMaputnik"
            class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
          >
            Open in Maputnik
          </button>
          <hr class="my-1" />
          <button
            @click="$emit('delete', config)"
            class="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { format } from 'date-fns';
import type { MapConfig } from '../types';

const router = useRouter();

const props = defineProps<{
  config: MapConfig;
}>();

const emit = defineEmits<{
  edit: [config: MapConfig];
  preview: [config: MapConfig];
  duplicate: [config: MapConfig];
  delete: [config: MapConfig];
  'upload-style': [];
}>();

const showMenu = ref(false);

// Use preview URL from database
const previewUrl = computed(() => {
  return props.config.previewImageUrl || null;
});

// Determine if this is an overlay map
// Check metadata.isOverlay first, then map_category as fallback
const isOverlay = computed(() => {
  // Check if metadata has isOverlay flag
  if (props.config.metadata && typeof props.config.metadata === 'object') {
    if ('isOverlay' in props.config.metadata) {
      return props.config.metadata.isOverlay === true;
    }
  }
  
  // Fallback to map_category field
  return props.config.map_category === 'overlay';
});

// Handle image loading errors
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  // Hide the broken image by setting display to none
  img.style.display = 'none';
  console.warn('Failed to load preview image for:', props.config.name);
}

function formatDate(date: string) {
  return format(new Date(date), 'MMM d, yyyy');
}

function duplicateWithEdits() {
  emit('duplicate', props.config);
  showMenu.value = false;
  // Navigate to edit after duplication
}

function cloneToCountry() {
  emit('duplicate', props.config);
  showMenu.value = false;
}

function exportJSON() {
  // Export configuration as JSON
  const data = {
    backgroundMaps: {
      [props.config.name]: {
        name: props.config.name,
        style: props.config.originalStyle || props.config.style,
        label: props.config.label,
        type: props.config.type,
        flag: props.config.flag,
        country: props.config.country,
        ...(props.config.layers && { layers: props.config.layers })
      }
    }
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${props.config.name}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showMenu.value = false;
}

function openInMaputnik() {
  // Navigate to our custom Maputnik editor page
  router.push(`/config/${props.config.id}/maputnik`);
  showMenu.value = false;
}

// Close menu when clicking outside
document.addEventListener('click', () => {
  showMenu.value = false;
});
</script>