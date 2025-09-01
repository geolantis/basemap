<template>
  <Dialog 
    v-model:visible="visible" 
    :style="{width: '480px'}" 
    header="Save Style to Map Config Service"
    :modal="true"
    :closable="true"
    @hide="onClose"
  >
    <form @submit.prevent="handleSave" class="save-form">
      <!-- Style Name -->
      <div class="field">
        <label for="styleName" class="block text-sm font-medium text-gray-700 mb-2">
          Style Name *
        </label>
        <InputText
          id="styleName"
          v-model="formData.name"
          :class="{ 'p-invalid': errors.name }"
          placeholder="Enter style name"
          class="w-full"
          required
        />
        <small v-if="errors.name" class="p-error">{{ errors.name }}</small>
      </div>

      <!-- Description -->
      <div class="field">
        <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <Textarea
          id="description"
          v-model="formData.description"
          placeholder="Describe your style (optional)"
          :rows="3"
          class="w-full"
        />
      </div>

      <!-- Category -->
      <div class="field">
        <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <Dropdown
          id="category"
          v-model="formData.category"
          :options="categories"
          optionLabel="label"
          optionValue="value"
          placeholder="Select category"
          class="w-full"
        />
      </div>

      <!-- Tags (Optional) -->
      <div class="field">
        <label for="tags" class="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <Chips
          id="tags"
          v-model="formData.tags"
          placeholder="Add tags (press Enter)"
          class="w-full"
        />
        <small class="text-gray-500">Press Enter to add tags</small>
      </div>

      <!-- Options -->
      <div class="field">
        <div class="flex align-items-center">
          <Checkbox
            id="isPublic"
            v-model="formData.isPublic"
            :binary="true"
          />
          <label for="isPublic" class="ml-2 text-sm text-gray-700">
            Make this style public
          </label>
        </div>
      </div>

      <div class="field" v-if="isUpdate">
        <div class="flex align-items-center">
          <Checkbox
            id="overwrite"
            v-model="formData.overwrite"
            :binary="true"
          />
          <label for="overwrite" class="ml-2 text-sm text-gray-700">
            Overwrite existing style
          </label>
        </div>
      </div>

      <!-- Auto-save Option -->
      <div class="field">
        <div class="flex align-items-center">
          <Checkbox
            id="enableAutoSave"
            v-model="formData.enableAutoSave"
            :binary="true"
          />
          <label for="enableAutoSave" class="ml-2 text-sm text-gray-700">
            Enable auto-save (saves every 5 minutes)
          </label>
        </div>
      </div>

      <!-- Validation Messages -->
      <div v-if="validation.warnings.length > 0" class="field">
        <Message severity="warn" :closable="false">
          <div class="validation-messages">
            <strong>Warnings:</strong>
            <ul class="mt-2 ml-4">
              <li v-for="warning in validation.warnings" :key="warning" class="text-sm">
                • {{ warning }}
              </li>
            </ul>
          </div>
        </Message>
      </div>

      <div v-if="validation.errors.length > 0" class="field">
        <Message severity="error" :closable="false">
          <div class="validation-messages">
            <strong>Errors:</strong>
            <ul class="mt-2 ml-4">
              <li v-for="error in validation.errors" :key="error" class="text-sm">
                • {{ error }}
              </li>
            </ul>
          </div>
        </Message>
      </div>

      <!-- Save Progress -->
      <div v-if="saveStore.isLoading" class="field">
        <div class="flex align-items-center gap-3">
          <ProgressBar 
            :value="saveStore.saveProgress" 
            :showValue="false"
            class="flex-1"
          />
          <span class="text-sm text-gray-600">{{ saveStore.saveProgress }}%</span>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="dialog-footer">
        <Button 
          label="Cancel" 
          severity="secondary"
          @click="onClose"
          :disabled="saveStore.isLoading"
        />
        <Button 
          :label="isUpdate ? 'Update Style' : 'Save Style'"
          icon="pi pi-save"
          @click="handleSave"
          :loading="saveStore.isLoading"
          :disabled="!isFormValid || !validation.valid"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Chips from 'primevue/chips';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import Message from 'primevue/message';
import ProgressBar from 'primevue/progressbar';
import { useSaveStore } from '../stores/save';
import { useSaveService } from '../services/saveService';
import type { MapStyle, SaveDialogOptions } from '../types/save';

interface Props {
  visible: boolean;
  styleData?: MapStyle;
  existingStyleId?: string;
  suggestedName?: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:visible', 'save-complete', 'save-error']);

const saveStore = useSaveStore();
const saveService = useSaveService();
const toast = useToast();

// Form data
const formData = ref<SaveDialogOptions & { tags: string[], enableAutoSave: boolean }>({
  name: '',
  description: '',
  category: 'custom',
  isPublic: false,
  overwrite: false,
  tags: [],
  enableAutoSave: false
});

// Form validation
const errors = ref<Record<string, string>>({});
const validation = ref<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}>({
  valid: true,
  errors: [],
  warnings: []
});

// Categories
const categories = [
  { label: 'Custom', value: 'custom' },
  { label: 'Base Map', value: 'basemap' },
  { label: 'Satellite', value: 'satellite' },
  { label: 'Terrain', value: 'terrain' },
  { label: 'Street Map', value: 'street' },
  { label: 'Dark Theme', value: 'dark' },
  { label: 'Light Theme', value: 'light' },
  { label: 'Experimental', value: 'experimental' }
];

// Computed
const isUpdate = computed(() => !!props.existingStyleId);
const isFormValid = computed(() => {
  return formData.value.name.trim().length > 0 && Object.keys(errors.value).length === 0;
});

// Methods
function validateForm(): boolean {
  errors.value = {};

  if (!formData.value.name.trim()) {
    errors.value.name = 'Style name is required';
  } else if (formData.value.name.trim().length < 3) {
    errors.value.name = 'Style name must be at least 3 characters';
  } else if (formData.value.name.trim().length > 50) {
    errors.value.name = 'Style name must be less than 50 characters';
  }

  if (formData.value.description && formData.value.description.length > 500) {
    errors.value.description = 'Description must be less than 500 characters';
  }

  return Object.keys(errors.value).length === 0;
}

async function validateStyle(): Promise<void> {
  if (!props.styleData) {
    validation.value = {
      valid: false,
      errors: ['No style data provided'],
      warnings: []
    };
    return;
  }

  try {
    validation.value = await saveService.validateStyle(props.styleData);
  } catch (error) {
    console.error('Style validation failed:', error);
    validation.value = {
      valid: false,
      errors: ['Style validation failed'],
      warnings: ['Unable to validate style with server']
    };
  }
}

async function handleSave(): Promise<void> {
  if (!validateForm() || !props.styleData || !validation.value.valid) return;

  try {
    const success = await saveStore.saveStyle(props.styleData, {
      name: formData.value.name.trim(),
      description: formData.value.description.trim(),
      category: formData.value.category,
      isPublic: formData.value.isPublic,
      overwrite: formData.value.overwrite,
      tags: formData.value.tags
    });

    if (success) {
      // Enable auto-save if requested
      if (formData.value.enableAutoSave) {
        saveStore.enableAutoSave();
      }

      emit('save-complete', {
        styleId: saveStore.lastSavedId,
        name: formData.value.name
      });
      onClose();
    } else {
      emit('save-error', saveStore.error);
    }
  } catch (error) {
    console.error('Save failed:', error);
    emit('save-error', error instanceof Error ? error.message : 'Save failed');
  }
}

function onClose(): void {
  emit('update:visible', false);
}

function resetForm(): void {
  formData.value = {
    name: props.suggestedName || '',
    description: '',
    category: 'custom',
    isPublic: false,
    overwrite: false,
    tags: [],
    enableAutoSave: false
  };
  errors.value = {};
  validation.value = { valid: true, errors: [], warnings: [] };
}

// Watch for dialog visibility
watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    resetForm();
    if (props.suggestedName) {
      formData.value.name = props.suggestedName;
    }
    validateStyle();
  }
});

// Watch for style data changes
watch(() => props.styleData, () => {
  if (props.visible && props.styleData) {
    validateStyle();
  }
}, { deep: true });

// Watch form name changes for validation
watch(() => formData.value.name, () => {
  if (errors.value.name) {
    validateForm();
  }
});

onMounted(() => {
  resetForm();
});
</script>

<style scoped>
.save-form {
  padding: 1rem 0;
}

.field {
  margin-bottom: 1.5rem;
}

.field:last-child {
  margin-bottom: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
}

.validation-messages ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.validation-messages li {
  margin-bottom: 0.25rem;
}

:deep(.p-dialog-content) {
  padding: 1.5rem;
}

:deep(.p-dialog-footer) {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

:deep(.p-progress-bar) {
  height: 0.5rem;
}
</style>