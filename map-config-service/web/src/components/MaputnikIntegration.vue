<template>
  <div class="maputnik-integration">
    <Dialog 
      v-model:visible="visible" 
      :style="{width: '90vw', height: '90vh'}" 
      header="Maputnik Style Editor"
      :modal="true"
      :closable="true"
      @hide="onClose"
    >
      <template #header>
        <div class="dialog-header">
          <h3>
            <i class="pi pi-pencil"></i>
            Editing: {{ currentStyle?.name || 'Style' }}
          </h3>
          <div class="header-actions">
            <Button 
              label="Save to Map Config" 
              icon="pi pi-cloud-upload"
              @click="showSaveDialog"
              class="p-button-success"
              :disabled="!styleData"
            />
            <Button 
              label="Quick Save" 
              icon="pi pi-save"
              @click="quickSave"
              class="p-button-success p-button-outlined"
              :loading="saveStore.isLoading"
              :disabled="!canQuickSave"
              v-tooltip="'Save changes to current style'"
            />
            <Button 
              label="Download" 
              icon="pi pi-download"
              @click="downloadStyle"
              class="p-button-secondary"
              :disabled="!styleData"
            />
          </div>
        </div>
      </template>

      <div class="maputnik-container">
        <iframe 
          ref="maputnikFrame"
          :src="maputnikUrl"
          frameborder="0"
          allow="fullscreen"
          @load="onMaputnikLoad"
        />
      </div>

      <div class="integration-info">
        <Message severity="info" :closable="false">
          <div class="info-content">
            <strong>Enhanced Integration:</strong> Edit your style in Maputnik and use "Save to Map Config" for direct cloud storage.
            <br>
            <span class="text-sm">Style URL: {{ styleUrl }}</span>
            <br v-if="saveStore.lastSavedAt">
            <span v-if="saveStore.lastSavedAt" class="text-sm text-green-600">
              {{ saveStore.lastSavedText }}
            </span>
          </div>
        </Message>
        
        <Message v-if="!authStore.isAuthenticated" severity="warn" :closable="false" class="mt-3">
          <div class="info-content">
            <strong>Login Required:</strong> Please log in to save styles to the cloud.
            <Button 
              label="Sign In" 
              icon="pi pi-sign-in" 
              link 
              class="ml-2 p-0" 
              @click="showLoginModal"
            />
          </div>
        </Message>
      </div>
    </Dialog>
    
    <!-- Save Style Dialog -->
    <SaveStyleDialog
      v-model:visible="saveDialogVisible"
      :style-data="styleData"
      :existing-style-id="saveStore.currentStyleId"
      :suggested-name="suggestedStyleName"
      @save-complete="onSaveComplete"
      @save-error="onSaveError"
    />
    
    <!-- Login Modal -->
    <LoginModal
      v-model:visible="loginModalVisible"
      message="Please log in to save your custom styles"
      @login-success="onLoginSuccess"
      @login-error="onLoginError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { useSaveStore } from '../stores/save';
import { useAuthStore } from '../stores/auth';
import SaveStyleDialog from './SaveStyleDialog.vue';
import LoginModal from './LoginModal.vue';
import type { MapStyle } from '../types/save';

interface MaputnikProps {
  visible: boolean;
  styleFile?: string;
  styleName?: string;
}

const props = defineProps<MaputnikProps>();
const emit = defineEmits(['update:visible', 'style-saved', 'style-updated']);

const toast = useToast();
const saveStore = useSaveStore();
const authStore = useAuthStore();
const maputnikFrame = ref<HTMLIFrameElement | null>(null);
const currentStyle = ref<any>(null);
const styleData = ref<MapStyle | null>(null);
const saveDialogVisible = ref(false);
const loginModalVisible = ref(false);
const lastStyleChange = ref<Date | null>(null);

// Compute the Maputnik URL with our style
const maputnikUrl = computed(() => {
  if (!props.styleFile) return 'https://maputnik.github.io/editor/';
  
  // URL encode the style URL
  const styleUrl = `${window.location.origin}/styles/${props.styleFile}`;
  const encodedUrl = encodeURIComponent(styleUrl);
  
  return `https://maputnik.github.io/editor/#${encodedUrl}`;
});

// Computed properties for save functionality
const canQuickSave = computed(() => {
  return authStore.isAuthenticated && 
         saveStore.currentStyleId && 
         styleData.value && 
         saveStore.isDirty;
});

const suggestedStyleName = computed(() => {
  if (props.styleName) return props.styleName;
  if (props.styleFile) {
    return props.styleFile.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  }
  return 'Custom Style';
});

// Compute the style URL
const styleUrl = computed(() => {
  if (!props.styleFile) return '';
  return `${window.location.origin}/styles/${props.styleFile}`;
});

// Watch for visibility changes
watch(() => props.visible, (newVal) => {
  if (newVal && props.styleFile) {
    loadStyleData();
  }
});

// Load the current style data
async function loadStyleData() {
  try {
    const response = await fetch(`/styles/${props.styleFile}`);
    if (response.ok) {
      styleData.value = await response.json();
      currentStyle.value = {
        name: props.styleName || props.styleFile,
        file: props.styleFile
      };
    }
  } catch (error) {
    console.error('Failed to load style:', error);
  }
}

// Handle Maputnik iframe load
function onMaputnikLoad() {
  // Set up message listener for Maputnik communication
  window.addEventListener('message', handleMaputnikMessage);
  
  // Send initial style if we have it
  if (styleData.value && maputnikFrame.value) {
    // Wait a bit for Maputnik to fully load
    setTimeout(() => {
      sendToMaputnik('load', styleData.value);
    }, 2000);
  }
}

// Handle messages from Maputnik
function handleMaputnikMessage(event: MessageEvent) {
  // Security: verify origin
  if (!event.origin.includes('maputnik.github.io')) return;
  
  if (event.data.type === 'style-changed') {
    // Style was modified in Maputnik
    styleData.value = event.data.style as MapStyle;
    lastStyleChange.value = new Date();
    
    // Mark as dirty if we have a current style
    if (saveStore.currentStyleId) {
      saveStore.markDirty();
    }
    
    // Auto-save if enabled
    if (saveStore.autoSaveEnabled && canQuickSave.value) {
      scheduleAutoSave();
    }
  }
}

// Send message to Maputnik
function sendToMaputnik(action: string, data: any) {
  if (!maputnikFrame.value?.contentWindow) return;
  
  maputnikFrame.value.contentWindow.postMessage({
    type: action,
    data: data
  }, 'https://maputnik.github.io');
}

// Show save dialog
function showSaveDialog(): void {
  if (!authStore.isAuthenticated) {
    loginModalVisible.value = true;
    return;
  }
  
  if (!styleData.value) {
    toast.add({
      severity: 'warn',
      summary: 'No Style Data',
      detail: 'Please wait for the style to load from Maputnik',
      life: 3000
    });
    return;
  }
  
  saveDialogVisible.value = true;
}

// Quick save for existing styles
async function quickSave(): Promise<void> {
  if (!canQuickSave.value || !styleData.value) return;
  
  try {
    const success = await saveStore.saveStyle(styleData.value, {
      name: currentStyle.value?.name || suggestedStyleName.value,
      description: 'Quick save from Maputnik editor',
      category: 'custom',
      isPublic: false,
      overwrite: true
    });
    
    if (success) {
      emit('style-updated', {
        styleId: saveStore.lastSavedId,
        name: currentStyle.value?.name
      });
    }
  } catch (error) {
    console.error('Quick save failed:', error);
  }
}

// Auto-save scheduling
let autoSaveTimer: NodeJS.Timeout | null = null;

function scheduleAutoSave(): void {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }
  
  autoSaveTimer = setTimeout(async () => {
    if (canQuickSave.value && styleData.value) {
      await quickSave();
    }
  }, saveStore.autoSaveInterval);
}

// Show login modal
function showLoginModal(): void {
  loginModalVisible.value = true;
}

// Download style locally
function downloadStyle() {
  if (!styleData.value) return;
  
  const blob = new Blob([JSON.stringify(styleData.value, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = props.styleFile || 'style.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Event handlers
function onSaveComplete(data: any): void {
  toast.add({
    severity: 'success',
    summary: 'Style Saved',
    detail: `Successfully saved "${data.name}" to Map Config Service`,
    life: 4000
  });
  
  emit('style-saved', {
    styleId: data.styleId,
    name: data.name,
    file: props.styleFile
  });
  
  // Update current style reference
  if (currentStyle.value) {
    currentStyle.value.id = data.styleId;
  }
}

function onSaveError(error: string): void {
  toast.add({
    severity: 'error',
    summary: 'Save Failed',
    detail: error,
    life: 6000
  });
}

function onLoginSuccess(data: any): void {
  toast.add({
    severity: 'success',
    summary: 'Login Successful',
    detail: 'You can now save your styles to the cloud',
    life: 3000
  });
  
  // Show save dialog after successful login
  setTimeout(() => {
    if (styleData.value) {
      saveDialogVisible.value = true;
    }
  }, 500);
}

function onLoginError(error: string): void {
  console.error('Login error:', error);
}

// Clean up on close
function onClose() {
  window.removeEventListener('message', handleMaputnikMessage);
  
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
  
  emit('update:visible', false);
}
</script>

<style scoped>
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.dialog-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.maputnik-container {
  width: 100%;
  height: calc(90vh - 200px);
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.maputnik-container iframe {
  width: 100%;
  height: 100%;
}

.integration-info {
  margin-top: 1rem;
}

.info-content {
  line-height: 1.6;
}

.text-sm {
  font-size: 0.875rem;
  color: #666;
  display: block;
  margin-top: 0.5rem;
}

:deep(.p-dialog-content) {
  padding: 1rem;
}
</style>