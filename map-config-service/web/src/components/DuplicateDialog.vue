<template>
  <div v-if="visible" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black opacity-50" @click="close"></div>
      
      <!-- Dialog -->
      <div class="relative bg-white rounded-lg max-w-2xl w-full p-6 z-10">
        <h2 class="text-xl font-bold mb-4">Duplicate Configuration</h2>
        
        <!-- Source Selection -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Select Configuration to Copy
          </label>
          <select
            v-model="selectedConfig"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Choose a configuration...</option>
            <option v-for="config in configs" :key="config.id" :value="config.id">
              {{ config.flag }} {{ config.label }} ({{ config.type }})
            </option>
          </select>
        </div>
        
        <!-- Duplication Type -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Duplication Type
          </label>
          <div class="space-y-2">
            <label class="flex items-center">
              <input
                type="radio"
                v-model="duplicationType"
                value="exact"
                class="mr-2"
              />
              <span>Exact Copy - Create identical configuration with new name</span>
            </label>
            <label class="flex items-center">
              <input
                type="radio"
                v-model="duplicationType"
                value="country"
                class="mr-2"
              />
              <span>Copy to Different Country - Adapt for another region</span>
            </label>
            <label class="flex items-center">
              <input
                type="radio"
                v-model="duplicationType"
                value="template"
                class="mr-2"
              />
              <span>Use as Template - Copy structure but clear values</span>
            </label>
          </div>
        </div>
        
        <!-- New Configuration Details -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            New Configuration Name
          </label>
          <input
            v-model="newName"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            :placeholder="suggestedName"
          />
        </div>
        
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            New Configuration Label
          </label>
          <input
            v-model="newLabel"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            :placeholder="suggestedLabel"
          />
        </div>
        
        <!-- Actions -->
        <div class="flex justify-end space-x-3">
          <button @click="close" class="btn-secondary">
            Cancel
          </button>
          <button @click="executeDuplicate" class="btn-primary" :disabled="!canDuplicate">
            Create Copy
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { MapConfig } from '../types';

const props = defineProps<{
  visible: boolean;
  configs: MapConfig[];
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  duplicate: [request: any];
}>();

const selectedConfig = ref('');
const duplicationType = ref('exact');
const newName = ref('');
const newLabel = ref('');

const selectedConfigObj = computed(() => 
  props.configs.find(c => c.id === selectedConfig.value)
);

const suggestedName = computed(() => {
  if (!selectedConfigObj.value) return '';
  const base = selectedConfigObj.value.name;
  switch (duplicationType.value) {
    case 'exact': return `${base}_copy`;
    case 'country': return `${base}_country`;
    case 'template': return `${base}_template`;
    default: return base;
  }
});

const suggestedLabel = computed(() => {
  if (!selectedConfigObj.value) return '';
  const base = selectedConfigObj.value.label;
  switch (duplicationType.value) {
    case 'exact': return `${base} (Copy)`;
    case 'country': return `${base} - Country`;
    case 'template': return `${base} Template`;
    default: return base;
  }
});

const canDuplicate = computed(() => 
  selectedConfig.value && newName.value && newLabel.value
);

watch([suggestedName, suggestedLabel], () => {
  if (!newName.value) newName.value = suggestedName.value;
  if (!newLabel.value) newLabel.value = suggestedLabel.value;
});

function close() {
  emit('update:visible', false);
  // Reset form
  selectedConfig.value = '';
  duplicationType.value = 'exact';
  newName.value = '';
  newLabel.value = '';
}

function executeDuplicate() {
  if (!canDuplicate.value) return;
  
  emit('duplicate', {
    sourceId: selectedConfig.value,
    type: duplicationType.value,
    newName: newName.value,
    newLabel: newLabel.value,
    options: {
      copyApiKeys: true,
      copyPermissions: false,
      copyTags: true,
      createBackup: false
    }
  });
  
  close();
}
</script>