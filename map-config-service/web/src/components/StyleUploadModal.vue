<template>
  <div v-if="visible" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black opacity-50" @click="close"></div>
      
      <!-- Modal -->
      <div class="relative bg-white rounded-lg max-w-4xl w-full p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900 flex items-center">
            <i class="pi pi-upload mr-3 text-blue-600"></i>
            Upload Custom Style
          </h2>
          <button @click="close" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <i class="pi pi-times text-gray-500"></i>
          </button>
        </div>
        
        <!-- Upload Area -->
        <div class="mb-6">
          <div
            @drop="handleDrop"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
            @click="triggerFileInput"
            :class="[
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            ]"
          >
            <div v-if="!selectedFile">
              <i class="pi pi-cloud-upload text-4xl text-gray-400 mb-4"></i>
              <p class="text-lg font-medium text-gray-700 mb-2">
                Drop your Maputnik style file here
              </p>
              <p class="text-sm text-gray-500 mb-4">
                or click to browse for JSON files
              </p>
              <p class="text-xs text-gray-400">
                Maximum file size: 10MB • Supported formats: .json
              </p>
            </div>
            
            <div v-else class="text-left">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center">
                  <i class="pi pi-file text-2xl text-green-600 mr-3"></i>
                  <div>
                    <p class="font-medium text-gray-900">{{ selectedFile.name }}</p>
                    <p class="text-sm text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
                  </div>
                </div>
                <button @click.stop="removeFile" class="p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <i class="pi pi-trash text-red-600"></i>
                </button>
              </div>
              
              <!-- File Preview -->
              <div v-if="stylePreview" class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-medium text-gray-900 mb-3">Style Preview</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="font-medium text-gray-700">Name:</span>
                    <span class="ml-2 text-gray-900">{{ stylePreview.name || 'Untitled' }}</span>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700">Version:</span>
                    <span class="ml-2 text-gray-900">{{ stylePreview.version || '1.0' }}</span>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700">Layers:</span>
                    <span class="ml-2 text-gray-900">{{ stylePreview.layers?.length || 0 }}</span>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700">Sources:</span>
                    <span class="ml-2 text-gray-900">{{ stylePreview.sources ? Object.keys(stylePreview.sources).length : 0 }}</span>
                  </div>
                </div>
                
                <!-- Sources Preview -->
                <div v-if="stylePreview.sources && Object.keys(stylePreview.sources).length > 0" class="mt-4">
                  <h5 class="font-medium text-gray-700 mb-2">Sources:</h5>
                  <div class="space-y-1 max-h-32 overflow-y-auto">
                    <div 
                      v-for="(source, key) in stylePreview.sources" 
                      :key="key"
                      class="text-xs bg-white p-2 rounded border"
                    >
                      <span class="font-medium">{{ key }}:</span>
                      <span class="ml-2 text-gray-600">{{ source.type }}</span>
                      <span v-if="source.url" class="ml-2 text-blue-600 truncate">{{ source.url }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <input
            ref="fileInput"
            type="file"
            accept=".json,application/json"
            @change="handleFileSelect"
            class="hidden"
          />
        </div>
        
        <!-- Style Configuration Form -->
        <div v-if="selectedFile && stylePreview" class="mb-6 space-y-4">
          <h3 class="text-lg font-semibold text-gray-900">Style Configuration</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Style Name
              </label>
              <input
                v-model="styleName"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :placeholder="stylePreview.name || 'Enter style name'"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Display Label
              </label>
              <input
                v-model="styleLabel"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :placeholder="stylePreview.name || 'Enter display label'"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <select
                v-model="styleCountry"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select country...</option>
                <option value="global">🌍 Global</option>
                <option value="at">🇦🇹 Austria</option>
                <option value="ch">🇨🇭 Switzerland</option>
                <option value="de">🇩🇪 Germany</option>
                <option value="fr">🇫🇷 France</option>
                <option value="it">🇮🇹 Italy</option>
                <option value="us">🇺🇸 United States</option>
                <option value="uk">🇬🇧 United Kingdom</option>
                <option value="ca">🇨🇦 Canada</option>
                <option value="au">🇦🇺 Australia</option>
                <option value="nz">🇳🇿 New Zealand</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Style Type
              </label>
              <select
                v-model="styleType"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select type...</option>
                <option value="vtc">VTC (Vector Tiles)</option>
                <option value="wmts">WMTS (Web Map Tile Service)</option>
                <option value="wms">WMS (Web Map Service)</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Map Category
              </label>
              <select
                v-model="mapCategory"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="background">Background (Base Layer)</option>
                <option value="overlay">Overlay (Transparent Layer)</option>
              </select>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              v-model="styleDescription"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter a description for this style..."
            ></textarea>
          </div>
        </div>
        
        <!-- Upload Progress -->
        <div v-if="uploading" class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">Uploading...</span>
            <span class="text-sm text-gray-500">{{ uploadProgress }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
        </div>
        
        <!-- Error Message -->
        <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <i class="pi pi-exclamation-triangle text-red-600 mr-2"></i>
            <span class="text-red-800 font-medium">Upload Error</span>
          </div>
          <p class="text-red-700 mt-1 text-sm">{{ errorMessage }}</p>
        </div>
        
        <!-- Success Message -->
        <div v-if="successMessage" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center">
            <i class="pi pi-check-circle text-green-600 mr-2"></i>
            <span class="text-green-800 font-medium">Upload Successful</span>
          </div>
          <p class="text-green-700 mt-1 text-sm">{{ successMessage }}</p>
        </div>
        
        <!-- Actions -->
        <div class="flex justify-end space-x-3">
          <button 
            @click="close" 
            class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            :disabled="uploading"
          >
            {{ uploading ? 'Uploading...' : 'Cancel' }}
          </button>
          <button 
            @click="uploadStyle" 
            :disabled="!canUpload || uploading"
            class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center"
          >
            <i class="pi pi-upload mr-2"></i>
            {{ uploading ? 'Uploading...' : 'Upload Style' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { MapConfig, StylePreview, StyleUploadResponse } from '../types';
import { MapConfigService } from '../services/mapConfigService';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'upload-success': [config: MapConfig];
  'upload-error': [error: string];
}>();

// Refs
const fileInput = ref<HTMLInputElement>();
const selectedFile = ref<File | null>(null);
const stylePreview = ref<StylePreview | null>(null);
const isDragging = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const errorMessage = ref('');
const successMessage = ref('');

// Form fields
const styleName = ref('');
const styleLabel = ref('');
const styleCountry = ref('');
const styleType = ref<'vtc' | 'wmts' | 'wms' | ''>('');
const mapCategory = ref<'background' | 'overlay'>('background');
const styleDescription = ref('');

// Computed
const canUpload = computed(() => {
  return selectedFile.value && 
         stylePreview.value && 
         styleName.value && 
         styleLabel.value && 
         styleCountry.value && 
         styleType.value &&
         !uploading.value;
});

// File handling
function triggerFileInput() {
  if (!uploading.value) {
    fileInput.value?.click();
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    processFile(file);
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;
  
  const files = event.dataTransfer?.files;
  if (files?.length && !uploading.value) {
    processFile(files[0]);
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  if (!uploading.value) {
    isDragging.value = true;
  }
}

function handleDragLeave() {
  isDragging.value = false;
}

function removeFile() {
  if (!uploading.value) {
    selectedFile.value = null;
    stylePreview.value = null;
    resetForm();
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
}

function resetForm() {
  styleName.value = '';
  styleLabel.value = '';
  styleCountry.value = '';
  styleType.value = '';
  mapCategory.value = 'background';
  styleDescription.value = '';
  errorMessage.value = '';
  successMessage.value = '';
  uploadProgress.value = 0;
}

async function processFile(file: File) {
  // Validate file type
  if (!file.type.includes('json') && !file.name.endsWith('.json')) {
    errorMessage.value = 'Please select a valid JSON file.';
    return;
  }
  
  // Validate file size (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    errorMessage.value = 'File size must be less than 10MB.';
    return;
  }
  
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    
    // Validate it's a Mapbox style
    if (!json.version || !json.layers || !Array.isArray(json.layers)) {
      errorMessage.value = 'Invalid Mapbox style format. Please ensure the JSON contains version and layers.';
      return;
    }
    
    selectedFile.value = file;
    stylePreview.value = json;
    errorMessage.value = '';
    
    // Auto-populate form fields
    if (json.name && !styleName.value) {
      styleName.value = json.name;
    }
    if (json.name && !styleLabel.value) {
      styleLabel.value = json.name;
    }
    
  } catch (error) {
    errorMessage.value = 'Invalid JSON file. Please check the file format.';
    console.error('Error parsing JSON:', error);
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function uploadStyle() {
  if (!canUpload.value || !selectedFile.value || !stylePreview.value) return;
  
  try {
    uploading.value = true;
    uploadProgress.value = 0;
    errorMessage.value = '';
    successMessage.value = '';
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('styleFile', selectedFile.value);
    formData.append('name', styleName.value);
    formData.append('label', styleLabel.value);
    formData.append('country', styleCountry.value);
    formData.append('type', styleType.value);
    formData.append('map_category', mapCategory.value);
    
    if (styleDescription.value) {
      formData.append('description', styleDescription.value);
    }
    
    // Simulate progress since we can't track with native fetch
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10;
      }
    }, 200);
    
    // Upload using service
    const service = MapConfigService.getInstance();
    const response = await service.uploadStyle(formData);
    
    clearInterval(progressInterval);
    uploadProgress.value = 100;
    
    if (response && response.success) {
      successMessage.value = 'Style uploaded successfully! The map configuration has been updated.';
      
      // Emit success with new config data
      emit('upload-success', response.config);
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        close();
      }, 2000);
      
    } else {
      throw new Error(response?.message || 'Upload failed');
    }
    
  } catch (error: any) {
    console.error('Upload error:', error);
    
    let message = 'Upload failed. Please try again.';
    if (error.message) {
      message = error.message;
    }
    
    errorMessage.value = message;
    emit('upload-error', message);
    
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;
  }
}

function close() {
  if (!uploading.value) {
    emit('update:visible', false);
    // Reset everything
    selectedFile.value = null;
    stylePreview.value = null;
    resetForm();
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
}

// Auto-populate label when name changes
watch(styleName, (newName) => {
  if (newName && !styleLabel.value) {
    styleLabel.value = newName;
  }
});

// Get flag emoji for country
function getCountryFlag(countryCode: string): string {
  const flags: Record<string, string> = {
    'global': '🌍',
    'at': '🇦🇹',
    'ch': '🇨🇭',
    'de': '🇩🇪',
    'fr': '🇫🇷',
    'it': '🇮🇹',
    'us': '🇺🇸',
    'uk': '🇬🇧',
    'ca': '🇨🇦',
    'au': '🇦🇺',
    'nz': '🇳🇿',
  };
  return flags[countryCode] || '🌍';
}
</script>

<style scoped>
.btn-primary {
  @apply px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors;
}

.btn-secondary {
  @apply px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors;
}
</style>