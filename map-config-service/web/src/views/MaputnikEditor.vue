<template>
  <div class="maputnik-editor-container">
    <!-- Header with custom controls -->
    <div class="editor-header">
      <div class="header-content">
        <div class="header-left">
          <button @click="goBack" class="btn-secondary">
            <i class="pi pi-arrow-left"></i>
            Back to Map
          </button>
          <h2 class="editor-title">{{ mapName }} - Style Editor</h2>
        </div>
        <div class="header-right">
          <label class="btn-primary cursor-pointer">
            <i class="pi pi-upload"></i>
            Upload Style
            <input
              type="file"
              @change="handleStyleUpload"
              accept=".json,application/json"
              class="hidden"
            />
          </label>
          <button @click="showInstructions" class="btn-secondary">
            <i class="pi pi-question-circle"></i>
            How to Save
          </button>
          <button @click="downloadStyle" class="btn-secondary">
            <i class="pi pi-download"></i>
            Download Current
          </button>
          <button @click="refreshEditor" class="btn-secondary">
            <i class="pi pi-refresh"></i>
            Refresh
          </button>
        </div>
      </div>
    </div>

    <!-- Maputnik iframe -->
    <div class="editor-frame-container">
      <iframe
        ref="maputnikFrame"
        :src="maputnikUrl"
        class="maputnik-frame"
        @load="onFrameLoad"
        allow="fullscreen"
      ></iframe>
    </div>

    <!-- Status bar -->
    <div class="editor-status">
      <div class="status-left">
        <span v-if="isLoading">
          <i class="pi pi-spin pi-spinner"></i>
          Loading editor...
        </span>
        <span v-else-if="lastSaved">
          <i class="pi pi-check-circle text-green-600"></i>
          Last saved: {{ formatTime(lastSaved) }}
        </span>
        <span v-else>
          <i class="pi pi-info-circle"></i>
          Ready
        </span>
      </div>
      <div class="status-right">
        <span class="text-sm text-gray-600">
          Powered by Maputnik v2.1.1 | Enhanced by Basemap
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useConfigStore } from '../stores/config';

const route = useRoute();
const router = useRouter();
const configStore = useConfigStore();

const maputnikFrame = ref<HTMLIFrameElement | null>(null);
const isLoading = ref(true);
const hasChanges = ref(false);
const lastSaved = ref<Date | null>(null);
const autoSaveInterval = ref<number | null>(null);

const mapId = computed(() => route.params.id as string);
const mapConfig = computed(() => 
  configStore.configs.find(c => c.id === mapId.value)
);
const mapName = computed(() => mapConfig.value?.label || 'Map');

const maputnikUrl = computed(() => {
  // Use the latest Maputnik version 2.1.1 hosted at maplibre.org
  const maputnikBaseUrl = 'https://maplibre.org/maputnik/';
  
  if (!mapConfig.value) {
    return maputnikBaseUrl;
  }
  
  // Try to get style URL, with fallbacks
  let styleUrl = mapConfig.value.style || mapConfig.value.originalStyle;
  
  if (!styleUrl || styleUrl === 'tiles') {
    console.warn('No valid style URL found for map:', mapConfig.value.name);
    return maputnikBaseUrl;
  }
  
  // Handle different URL patterns
  let finalStyleUrl = styleUrl;
  
  // Check if URL needs to be made absolute
  if (!styleUrl.startsWith('http://') && !styleUrl.startsWith('https://')) {
    // Determine the styles server URL based on environment
    const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
    const stylesServerUrl = isProduction 
      ? 'https://basemap-styles.vercel.app/api/styles'
      : 'http://localhost:3001/api/styles';
    
    if (styleUrl.startsWith('/')) {
      // Path starting with / - prepend origin
      finalStyleUrl = `${window.location.origin}${styleUrl}`;
    } else {
      // Simple name or relative path
      const styleName = styleUrl.replace('.json', '');
      finalStyleUrl = `${stylesServerUrl}/${styleName}`;
    }
  }
  
  console.log('Maputnik URL construction:', {
    original: styleUrl,
    final: finalStyleUrl,
    encoded: encodeURIComponent(finalStyleUrl),
    maputnikUrl: `${maputnikBaseUrl}#?style=${encodeURIComponent(finalStyleUrl)}`
  });
  
  // Encode the style URL properly for use as a query parameter
  const encodedStyleUrl = encodeURIComponent(finalStyleUrl);
  
  // Maputnik v2.1.1 expects the style URL to be passed as a parameter
  // Using the format: #?style=<encoded_style_url>
  return `${maputnikBaseUrl}#?style=${encodedStyleUrl}`;
});

function goBack() {
  // Go back to the preview page if we have a mapId, otherwise dashboard
  if (mapId.value) {
    router.push(`/config/${mapId.value}/preview`);
  } else {
    router.push('/');
  }
}

function onFrameLoad() {
  isLoading.value = false;
  
  // Set up message listener for communication with Maputnik
  window.addEventListener('message', handleMessage);
  
  // Try to detect changes (this is limited due to cross-origin restrictions)
  // In a real implementation, you'd need to fork Maputnik to add proper postMessage support
  startChangeDetection();
}

function handleMessage(event: MessageEvent) {
  // Handle messages from Maputnik if we had a custom fork
  // For now, this is a placeholder for future enhancement
  if (event.origin === 'https://maplibre.org' || event.origin === 'https://maputnik.github.io') {
    console.log('Message from Maputnik:', event.data);
    
    if (event.data.type === 'style-changed') {
      hasChanges.value = true;
    }
  }
}

function startChangeDetection() {
  // Since we can't directly access the iframe content (cross-origin),
  // we'll use a simple time-based approach
  let checkInterval = setInterval(() => {
    // This would work if we had a custom Maputnik fork that posts messages
    // For now, we'll just enable the save button after any interaction
    hasChanges.value = true;
  }, 5000);
  
  onUnmounted(() => {
    if (checkInterval) clearInterval(checkInterval);
  });
}

function showInstructions() {
  alert(`📝 How to Save Your Style Changes:

1. EXPORT from Maputnik:
   • Click "Export" in Maputnik's top menu
   • Choose "Download" to save the style.json file

2. UPLOAD to Basemap:
   • Click "Upload Style" button above
   • Select your downloaded style.json file
   • The style will be saved to the database

3. VERIFY:
   • Refresh the editor to see your changes
   • Or go back to preview to test the new style

Note: Direct save without export/upload requires a custom Maputnik fork.`);
}

async function handleStyleUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  
  try {
    // Read the file
    const text = await file.text();
    const styleJson = JSON.parse(text);
    
    // Validate it's a valid style
    if (!styleJson.version || !styleJson.sources) {
      throw new Error('Invalid style file format');
    }
    
    // Upload to server
    const formData = new FormData();
    formData.append('style', file);
    formData.append('mapId', mapId.value);
    
    const response = await fetch('/api/styles/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload style');
    }
    
    // Update the config with new style URL
    const result = await response.json();
    if (result.styleUrl) {
      await configStore.updateConfig(mapId.value, {
        style: result.styleUrl,
        metadata: {
          ...mapConfig.value?.metadata,
          lastStyleUpdate: new Date().toISOString()
        }
      });
    }
    
    lastSaved.value = new Date();
    hasChanges.value = false;
    
    // Refresh the iframe to load the new style
    setTimeout(() => {
      refreshEditor();
    }, 500);
    
    alert('✅ Style uploaded successfully! The editor will refresh to show your changes.');
    
  } catch (error) {
    console.error('Upload error:', error);
    alert(`❌ Failed to upload style: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Reset the input
  (event.target as HTMLInputElement).value = '';
}

async function downloadStyle() {
  if (!mapConfig.value?.style) return;
  
  try {
    const response = await fetch(mapConfig.value.style);
    const styleJson = await response.json();
    
    const blob = new Blob([JSON.stringify(styleJson, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mapConfig.value.name}-style.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download style:', error);
    alert('Failed to download style. Please use Maputnik\'s export feature.');
  }
}

function refreshEditor() {
  if (maputnikFrame.value) {
    maputnikFrame.value.src = maputnikFrame.value.src;
    isLoading.value = true;
  }
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  }).format(date);
}

onMounted(async () => {
  // Ensure configs are loaded
  if (configStore.configs.length === 0) {
    await configStore.fetchConfigs();
  }
  
  // Set up auto-save (if we had direct integration)
  autoSaveInterval.value = window.setInterval(() => {
    if (hasChanges.value) {
      // In a real implementation, this would auto-save
      console.log('Auto-save would trigger here with proper integration');
    }
  }, 5 * 60 * 1000); // Every 5 minutes
});

onUnmounted(() => {
  window.removeEventListener('message', handleMessage);
  if (autoSaveInterval.value) {
    clearInterval(autoSaveInterval.value);
  }
});
</script>

<style scoped>
.maputnik-editor-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.editor-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.editor-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.editor-frame-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.maputnik-frame {
  width: 100%;
  height: 100%;
  border: none;
}

.editor-status {
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.status-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-right {
  color: #6b7280;
}

/* Button styles */
.btn-primary {
  @apply inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
         focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
         transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300
         focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2
         transition-all duration-200 font-medium;
}

.cursor-pointer {
  cursor: pointer;
}

.hidden {
  display: none;
}

/* Loading animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.pi-spin {
  animation: spin 1s linear infinite;
}
</style>