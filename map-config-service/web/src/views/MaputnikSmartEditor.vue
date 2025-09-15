<template>
  <div class="maputnik-smart-editor">
    <!-- Development Mode: Live Sync -->
    <div v-if="isDevelopment" class="dev-mode-container">
      <div class="dev-notice">
        <i class="pi pi-info-circle"></i>
        Development Mode: Auto-save enabled via Maputnik CLI
      </div>
      <MaputnikLiveEditor />
    </div>

    <!-- Production Mode: Iframe with API Integration -->
    <div v-else class="production-mode-container">
      <!-- Header -->
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
            <button 
              @click="autoSave" 
              :disabled="!hasChanges || isSaving"
              class="btn-primary"
            >
              <i :class="isSaving ? 'pi pi-spin pi-spinner' : 'pi pi-save'"></i>
              {{ isSaving ? 'Saving...' : 'Quick Save' }}
            </button>
            <span v-if="lastSaved" class="save-status">
              Last saved: {{ formatTime(lastSaved) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Maputnik iframe with PostMessage Integration -->
      <div class="editor-frame-container">
        <iframe
          ref="maputnikFrame"
          :src="maputnikUrl"
          class="maputnik-frame"
          @load="onFrameLoad"
          allow="fullscreen"
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useConfigStore } from '../stores/mapConfig';
import MaputnikLiveEditor from './MaputnikLiveEditor.vue';

const route = useRoute();
const router = useRouter();
const configStore = useConfigStore();

// Check if running in development
const isDevelopment = ref(import.meta.env.DEV || window.location.hostname === 'localhost');

// Production mode state
const maputnikFrame = ref<HTMLIFrameElement | null>(null);
const hasChanges = ref(false);
const isSaving = ref(false);
const lastSaved = ref<Date | null>(null);
const autoSaveInterval = ref<number | null>(null);

// Computed
const mapId = computed(() => route.params.id as string);
const mapConfig = computed(() => 
  configStore.configs.find(c => c.id === mapId.value)
);
const mapName = computed(() => mapConfig.value?.label || 'Map');

const maputnikUrl = computed(() => {
  const maputnikBaseUrl = 'https://maplibre.org/maputnik/';
  
  if (!mapConfig.value?.style) {
    return maputnikBaseUrl;
  }
  
  const encodedStyleUrl = encodeURIComponent(mapConfig.value.style);
  return `${maputnikBaseUrl}?style=${encodedStyleUrl}`;
});

// Production mode methods
function onFrameLoad() {
  if (isDevelopment.value) return;
  
  // Set up PostMessage listener for detecting changes
  window.addEventListener('message', handleMessage);
  
  // Start monitoring for changes
  startChangeDetection();
}

function handleMessage(event: MessageEvent) {
  // Listen for messages from Maputnik (if we implement a custom fork)
  if (event.origin === 'https://maplibre.org') {
    if (event.data.type === 'style-changed') {
      hasChanges.value = true;
    }
  }
}

function startChangeDetection() {
  // Poll for changes every 30 seconds
  autoSaveInterval.value = window.setInterval(() => {
    if (hasChanges.value) {
      autoSave();
    }
  }, 30000);
}

async function autoSave() {
  if (!mapConfig.value || isSaving.value) return;
  
  isSaving.value = true;
  
  try {
    // Option 1: Use Vercel API endpoint to fetch and save style
    const response = await fetch('/api/styles/auto-save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mapId: mapId.value,
        styleUrl: mapConfig.value.style
      })
    });
    
    if (response.ok) {
      hasChanges.value = false;
      lastSaved.value = new Date();
    }
  } catch (error) {
    console.error('Auto-save failed:', error);
  } finally {
    isSaving.value = false;
  }
}

function goBack() {
  router.push(`/config/${mapId.value}/preview`);
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric'
  }).format(date);
}

onMounted(() => {
  if (!isDevelopment.value) {
    console.log('Running in production mode - using iframe integration');
  } else {
    console.log('Running in development mode - using live sync');
  }
});

onUnmounted(() => {
  if (autoSaveInterval.value) {
    clearInterval(autoSaveInterval.value);
  }
  window.removeEventListener('message', handleMessage);
});
</script>

<style scoped>
.maputnik-smart-editor {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.dev-mode-container,
.production-mode-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.dev-notice {
  background: #fef3c7;
  color: #92400e;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.editor-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.editor-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.save-status {
  color: #059669;
  font-size: 0.875rem;
}

.editor-frame-container {
  flex: 1;
  position: relative;
}

.maputnik-frame {
  width: 100%;
  height: 100%;
  border: none;
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

.pi-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>