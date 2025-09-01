<template>
  <div class="maputnik-live-editor">
    <!-- Header -->
    <div class="editor-header">
      <div class="header-content">
        <div class="header-left">
          <button @click="goBack" class="btn-secondary">
            <i class="pi pi-arrow-left"></i>
            Back to Map
          </button>
          <h2 class="editor-title">
            {{ mapName }} - Live Style Editor
            <span v-if="isConnected" class="connection-badge connected">
              <i class="pi pi-circle-fill"></i> Live Sync Active
            </span>
            <span v-else class="connection-badge disconnected">
              <i class="pi pi-circle"></i> Connecting...
            </span>
          </h2>
        </div>
        <div class="header-right">
          <div v-if="lastSaved" class="save-status">
            <i class="pi pi-check-circle text-green-600"></i>
            Auto-saved {{ formatTimeSince(lastSaved) }}
          </div>
          <button @click="refreshEditor" class="btn-secondary">
            <i class="pi pi-refresh"></i>
            Refresh
          </button>
          <button @click="stopEditing" class="btn-danger">
            <i class="pi pi-times"></i>
            Stop Editing
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="editor-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-card">
          <i class="pi pi-spin pi-spinner text-4xl text-blue-500 mb-4"></i>
          <h3 class="text-xl font-semibold mb-2">Starting Live Editor...</h3>
          <p class="text-gray-600">Initializing Maputnik with automatic save</p>
          <p class="text-sm text-gray-500 mt-2">This may take a few seconds</p>
        </div>
      </div>

      <!-- Editor Frame -->
      <div v-else-if="maputnikUrl" class="editor-frame-container">
        <iframe
          ref="maputnikFrame"
          :src="maputnikUrl"
          class="maputnik-frame"
          @load="onFrameLoad"
          allow="fullscreen"
        ></iframe>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <div class="error-card">
          <i class="pi pi-exclamation-triangle text-6xl text-red-500 mb-4"></i>
          <h3 class="text-xl font-semibold mb-2">Failed to Start Editor</h3>
          <p class="text-gray-600 mb-4">{{ error }}</p>
          <button @click="retryStart" class="btn-primary">
            <i class="pi pi-refresh mr-2"></i>
            Retry
          </button>
        </div>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="editor-status">
      <div class="status-left">
        <span v-if="saveCount > 0" class="save-counter">
          <i class="pi pi-save"></i>
          {{ saveCount }} auto-saves
        </span>
        <span v-if="isConnected" class="connection-status">
          <i class="pi pi-link text-green-600"></i>
          Connected to sync server
        </span>
      </div>
      <div class="status-right">
        <span class="text-sm text-gray-600">
          Powered by Maputnik CLI | Auto-save enabled
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

// State
const isLoading = ref(true);
const error = ref('');
const maputnikUrl = ref('');
const maputnikPort = ref(0);
const isConnected = ref(false);
const lastSaved = ref<Date | null>(null);
const saveCount = ref(0);
const ws = ref<WebSocket | null>(null);

// Computed
const mapId = computed(() => route.params.id as string);
const mapConfig = computed(() => 
  configStore.configs.find(c => c.id === mapId.value)
);
const mapName = computed(() => mapConfig.value?.label || 'Map');

// Start Maputnik Live Editor
async function startMaputnikLive() {
  if (!mapConfig.value) {
    error.value = 'Map configuration not found';
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    // Extract style name from the style URL or use the map name
    let styleName = mapConfig.value.name;
    if (mapConfig.value.style) {
      const match = mapConfig.value.style.match(/\/([^\/]+)\.json$/);
      if (match) {
        styleName = match[1];
      }
    }

    // Start Maputnik CLI server
    const response = await fetch('http://localhost:3002/api/maputnik/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        styleId: mapId.value,
        styleName: styleName
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to start Maputnik');
    }

    const data = await response.json();
    maputnikPort.value = data.port;
    maputnikUrl.value = data.url;

    // Connect to WebSocket for real-time updates
    connectWebSocket();

    isLoading.value = false;
  } catch (err: any) {
    console.error('Failed to start Maputnik:', err);
    error.value = err.message || 'Failed to start live editor';
    isLoading.value = false;
  }
}

// Connect to WebSocket for real-time save notifications
function connectWebSocket() {
  ws.value = new WebSocket('ws://localhost:3002');

  ws.value.onopen = () => {
    console.log('Connected to sync server');
    isConnected.value = true;
  };

  ws.value.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    if (message.type === 'style-saved' && message.styleId === mapId.value) {
      lastSaved.value = new Date(message.timestamp);
      saveCount.value++;
      console.log('Style auto-saved:', message);
    }
  };

  ws.value.onclose = () => {
    console.log('Disconnected from sync server');
    isConnected.value = false;
    
    // Try to reconnect after 3 seconds
    setTimeout(() => {
      if (ws.value?.readyState !== WebSocket.OPEN) {
        connectWebSocket();
      }
    }, 3000);
  };

  ws.value.onerror = (error) => {
    console.error('WebSocket error:', error);
    isConnected.value = false;
  };
}

// Stop editing and cleanup
async function stopEditing() {
  if (!mapId.value) return;

  try {
    await fetch('http://localhost:3002/api/maputnik/stop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        styleId: mapId.value
      })
    });
  } catch (err) {
    console.error('Failed to stop Maputnik:', err);
  }

  // Close WebSocket
  if (ws.value) {
    ws.value.close();
    ws.value = null;
  }

  // Navigate back
  goBack();
}

function goBack() {
  if (mapId.value) {
    router.push(`/config/${mapId.value}/preview`);
  } else {
    router.push('/');
  }
}

function onFrameLoad() {
  console.log('Maputnik frame loaded');
}

function refreshEditor() {
  if (maputnikUrl.value) {
    // Reload the iframe
    const frame = document.querySelector('.maputnik-frame') as HTMLIFrameElement;
    if (frame) {
      frame.src = frame.src;
    }
  }
}

function retryStart() {
  startMaputnikLive();
}

function formatTimeSince(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

// Lifecycle
onMounted(() => {
  startMaputnikLive();
});

onUnmounted(() => {
  // Cleanup: stop editing session
  if (mapId.value) {
    fetch('http://localhost:3002/api/maputnik/stop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        styleId: mapId.value
      })
    }).catch(err => {
      console.error('Failed to stop Maputnik on unmount:', err);
    });
  }

  // Close WebSocket
  if (ws.value) {
    ws.value.close();
    ws.value = null;
  }
});
</script>

<style scoped>
.maputnik-live-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: #f3f4f6;
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
  gap: 1rem;
}

.editor-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.connection-badge {
  font-size: 0.875rem;
  font-weight: normal;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.connection-badge.connected {
  background: #dcfce7;
  color: #166534;
}

.connection-badge.disconnected {
  background: #fef3c7;
  color: #92400e;
}

.save-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #059669;
  font-size: 0.875rem;
}

.editor-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.loading-container,
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f9fafb;
}

.loading-card,
.error-card {
  background: white;
  padding: 3rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
}

.editor-frame-container {
  width: 100%;
  height: 100%;
}

.maputnik-frame {
  width: 100%;
  height: 100%;
  border: none;
}

.editor-status {
  background: white;
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
  gap: 1.5rem;
}

.save-counter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
}

.connection-status {
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
         transition-all duration-200 font-medium;
}

.btn-secondary {
  @apply inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300
         focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2
         transition-all duration-200 font-medium;
}

.btn-danger {
  @apply inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700
         focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2
         transition-all duration-200 font-medium;
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