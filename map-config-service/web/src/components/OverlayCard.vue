<template>
  <div
    ref="cardRef"
    class="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
    :class="{
      'ring-2 ring-blue-500 ring-opacity-50': selected,
      'opacity-50': disabled,
      'cursor-move': draggable && !disabled,
      'cursor-pointer': !draggable && !disabled,
      'transform scale-105 shadow-lg': isDragging
    }"
    :draggable="draggable && !disabled"
    @click="!disabled && !draggable && $emit('select')"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <!-- Drag Handle -->
    <div v-if="showOrder && draggable" class="absolute top-2 left-2 z-10">
      <div class="bg-white bg-opacity-90 rounded px-2 py-1 text-xs font-semibold text-gray-600">
        #{{ order }}
      </div>
    </div>

    <!-- Preview Image -->
    <div class="aspect-video bg-gray-100 relative overflow-hidden">
      <img
        v-if="overlay.previewUrl"
        :src="overlay.previewUrl"
        :alt="overlay.label"
        class="w-full h-full object-cover"
        :style="{ opacity: opacity / 100 }"
        loading="lazy"
      />
      <div v-else class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <i class="pi pi-layers text-2xl text-gray-400 mb-2"></i>
          <p class="text-xs text-gray-500">Overlay Preview</p>
        </div>
      </div>

      <!-- Selection Overlay -->
      <div v-if="selected" class="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
        <div class="bg-white rounded-full p-2">
          <i class="pi pi-check text-blue-600 text-xl"></i>
        </div>
      </div>

      <!-- Map Type and Opacity Badge -->
      <div class="absolute top-2 right-2 space-y-1">
        <span
          class="block px-2 py-1 text-xs font-semibold rounded-full"
          :class="getTypeColor(overlay.type)"
        >
          {{ overlay.type.toUpperCase() }}
        </span>
        <span class="block bg-black bg-opacity-70 text-white px-2 py-1 text-xs rounded-full">
          {{ opacity }}%
        </span>
      </div>

      <!-- Drag Handle Icon -->
      <div v-if="draggable" class="absolute bottom-2 right-2">
        <i class="pi pi-bars text-gray-400 text-sm"></i>
      </div>
    </div>

    <!-- Card Content -->
    <div class="p-4">
      <h3 class="font-semibold text-gray-900 truncate mb-1">
        {{ overlay.label }}
      </h3>
      <p class="text-sm text-gray-500 truncate mb-2">
        {{ overlay.name }}
      </p>

      <!-- Country and Provider -->
      <div class="flex items-center justify-between text-xs text-gray-600 mb-2">
        <div class="flex items-center space-x-1">
          <span>{{ overlay.flag }}</span>
          <span>{{ overlay.country }}</span>
        </div>
        <span v-if="overlay.metadata?.provider" class="truncate ml-2">
          {{ overlay.metadata.provider }}
        </span>
      </div>

      <!-- Properties Controls -->
      <div v-if="showControls" class="space-y-2 border-t pt-2">
        <!-- Opacity Control -->
        <div class="space-y-1">
          <label class="text-xs font-medium text-gray-700 flex items-center justify-between">
            Opacity
            <span class="text-gray-500">{{ opacity }}%</span>
          </label>
          <Slider
            v-model="localOpacity"
            :min="0"
            :max="100"
            :step="5"
            @input="$emit('opacity-change', $event.value)"
            class="w-full"
          />
        </div>

        <!-- Blend Mode (if supported) -->
        <div v-if="overlay.metadata?.supportedBlendModes" class="space-y-1">
          <label class="text-xs font-medium text-gray-700">Blend Mode</label>
          <Dropdown
            v-model="localBlendMode"
            :options="overlay.metadata.supportedBlendModes"
            @change="$emit('blend-mode-change', $event.value)"
            placeholder="Normal"
            class="w-full text-xs"
          />
        </div>
      </div>

      <!-- Status and Compatibility -->
      <div class="mt-2 flex items-center justify-between">
        <span
          class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
          :class="overlay.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
        >
          <i :class="overlay.isActive ? 'pi pi-check-circle' : 'pi pi-pause-circle'" class="mr-1"></i>
          {{ overlay.isActive ? 'Active' : 'Inactive' }}
        </span>

        <!-- Compatibility indicator -->
        <div v-if="showCompatibility && compatibilityScore !== undefined" class="flex items-center text-xs">
          <i class="pi pi-shield-check text-green-500 mr-1"></i>
          {{ compatibilityScore }}% Compatible
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div v-if="showActions" class="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-end space-x-2">
      <Button
        @click.stop="$emit('remove')"
        severity="danger"
        size="small"
        text
        class="text-xs"
      >
        <i class="pi pi-trash mr-1"></i>
        Remove
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import Slider from 'primevue/slider';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import type { OverlayLayer } from '../types';

interface Props {
  overlay: OverlayLayer;
  selected?: boolean;
  disabled?: boolean;
  draggable?: boolean;
  showControls?: boolean;
  showActions?: boolean;
  showOrder?: boolean;
  showCompatibility?: boolean;
  order?: number;
  opacity?: number;
  blendMode?: string;
  compatibilityScore?: number;
}

interface Emits {
  (e: 'select'): void;
  (e: 'remove'): void;
  (e: 'drag-start', event: DragEvent): void;
  (e: 'drag-end', event: DragEvent): void;
  (e: 'opacity-change', value: number): void;
  (e: 'blend-mode-change', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  disabled: false,
  draggable: false,
  showControls: false,
  showActions: false,
  showOrder: false,
  showCompatibility: false,
  opacity: 100,
  blendMode: 'normal',
});

const emit = defineEmits<Emits>();

const cardRef = ref<HTMLElement>();
const isDragging = ref(false);
const localOpacity = ref(props.opacity);
const localBlendMode = ref(props.blendMode);

// Watch for prop changes
watch(() => props.opacity, (newValue) => {
  localOpacity.value = newValue;
});

watch(() => props.blendMode, (newValue) => {
  localBlendMode.value = newValue;
});

const handleDragStart = (event: DragEvent) => {
  isDragging.value = true;
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', overlay.value.id);
    event.dataTransfer.effectAllowed = 'move';
  }
  emit('drag-start', event);
};

const handleDragEnd = (event: DragEvent) => {
  isDragging.value = false;
  emit('drag-end', event);
};

const getTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'vtc':
      return 'bg-blue-100 text-blue-800';
    case 'wmts':
      return 'bg-green-100 text-green-800';
    case 'wms':
      return 'bg-purple-100 text-purple-800';
    case 'xyz':
      return 'bg-orange-100 text-orange-800';
    case 'geojson':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
</script>