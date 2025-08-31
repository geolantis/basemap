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
              label="Save to Server" 
              icon="pi pi-save"
              @click="saveStyle"
              class="p-button-success"
              :loading="saving"
            />
            <Button 
              label="Download" 
              icon="pi pi-download"
              @click="downloadStyle"
              class="p-button-secondary"
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
            <strong>Direct Integration:</strong> Edit your style in Maputnik and click "Save to Server" to update it directly on Vercel.
            <br>
            <span class="text-sm">Style URL: {{ styleUrl }}</span>
          </div>
        </Message>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Message from 'primevue/message';

interface MaputnikProps {
  visible: boolean;
  styleFile?: string;
  styleName?: string;
}

const props = defineProps<MaputnikProps>();
const emit = defineEmits(['update:visible', 'style-saved']);

const toast = useToast();
const maputnikFrame = ref<HTMLIFrameElement | null>(null);
const saving = ref(false);
const currentStyle = ref<any>(null);
const styleData = ref<any>(null);

// Compute the Maputnik URL with our style
const maputnikUrl = computed(() => {
  if (!props.styleFile) return 'https://maputnik.github.io/editor/';
  
  // URL encode the style URL
  const styleUrl = `${window.location.origin}/styles/${props.styleFile}`;
  const encodedUrl = encodeURIComponent(styleUrl);
  
  return `https://maputnik.github.io/editor/#${encodedUrl}`;
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
    styleData.value = event.data.style;
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

// Save style back to server
async function saveStyle() {
  if (!props.styleFile) return;
  
  saving.value = true;
  
  try {
    // Get the current style from Maputnik
    // Since we can't directly get it, we'll use the last known styleData
    // In a real implementation, you'd need to extract it from Maputnik
    
    // For now, we'll prompt the user to export from Maputnik first
    const confirmed = confirm(
      'To save your changes:\n\n' +
      '1. Click "Export" in Maputnik (top menu)\n' +
      '2. Copy the JSON\n' +
      '3. Click OK here\n' +
      '4. Paste the JSON in the next prompt\n\n' +
      'Ready to continue?'
    );
    
    if (!confirmed) {
      saving.value = false;
      return;
    }
    
    // Get the JSON from user
    const jsonStr = prompt('Paste the exported JSON here:');
    if (!jsonStr) {
      saving.value = false;
      return;
    }
    
    let styleJson;
    try {
      styleJson = JSON.parse(jsonStr);
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Invalid JSON',
        detail: 'The pasted content is not valid JSON',
        life: 3000
      });
      saving.value = false;
      return;
    }
    
    // Save to server
    const response = await fetch(`/api/styles/${props.styleFile}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('apiKey') || 'development-key'}`
      },
      body: JSON.stringify(styleJson)
    });
    
    if (response.ok) {
      toast.add({
        severity: 'success',
        summary: 'Style Saved',
        detail: `Successfully saved ${props.styleFile} to server`,
        life: 3000
      });
      
      emit('style-saved', props.styleFile);
      
      // Update local data
      styleData.value = styleJson;
    } else {
      throw new Error('Failed to save style');
    }
  } catch (error) {
    console.error('Save error:', error);
    toast.add({
      severity: 'error',
      summary: 'Save Failed',
      detail: 'Could not save style to server',
      life: 3000
    });
  } finally {
    saving.value = false;
  }
}

// Alternative: Save using automated extraction
async function autoSaveStyle() {
  // This would require a custom Maputnik build or browser extension
  // that can communicate with our app
  
  // For production, consider:
  // 1. Fork Maputnik and add postMessage API
  // 2. Use a browser extension to inject communication
  // 3. Host your own Maputnik instance with modifications
  
  toast.add({
    severity: 'info',
    summary: 'Auto-save',
    detail: 'Automated save requires custom Maputnik integration',
    life: 5000
  });
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

// Clean up on close
function onClose() {
  window.removeEventListener('message', handleMaputnikMessage);
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