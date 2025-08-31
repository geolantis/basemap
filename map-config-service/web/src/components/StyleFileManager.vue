<template>
  <div class="style-manager">
    <div class="style-header">
      <h3>
        <i class="pi pi-file"></i>
        Style File Manager
      </h3>
      <Button 
        label="Upload Style" 
        icon="pi pi-upload" 
        @click="showUploadDialog = true"
        class="p-button-success"
      />
    </div>

    <!-- Upload Dialog -->
    <Dialog 
      v-model:visible="showUploadDialog" 
      :style="{width: '50vw'}" 
      header="Upload Style File"
      :modal="true"
    >
      <div class="upload-section">
        <FileUpload 
          name="styleFile"
          :customUpload="true"
          @uploader="uploadStyle"
          accept=".json"
          :maxFileSize="5000000"
          :chooseLabel="'Choose Style File'"
          :uploadLabel="'Upload'"
          :cancelLabel="'Cancel'"
        >
          <template #empty>
            <p>Drag and drop a style JSON file here or click to browse.</p>
          </template>
        </FileUpload>

        <div class="mt-3">
          <label for="styleName" class="block mb-2">Style Name (optional):</label>
          <InputText 
            id="styleName"
            v-model="newStyleName" 
            placeholder="e.g., custom-basemap.json"
            class="w-full"
          />
        </div>
      </div>
    </Dialog>

    <!-- Style Files List -->
    <div class="style-list">
      <DataTable 
        :value="styleFiles" 
        :paginator="true" 
        :rows="10"
        :loading="loading"
        stripedRows
        class="p-datatable-sm"
      >
        <template #header>
          <div class="flex justify-content-between align-items-center">
            <span>Hosted Style Files ({{ styleFiles.length }})</span>
            <Button 
              icon="pi pi-refresh" 
              @click="loadStyleFiles"
              class="p-button-text"
              v-tooltip="'Refresh list'"
            />
          </div>
        </template>

        <Column field="name" header="File Name" :sortable="true">
          <template #body="slotProps">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-file-o"></i>
              <span class="font-semibold">{{ slotProps.data.name }}</span>
            </div>
          </template>
        </Column>

        <Column field="size" header="Size" :sortable="true">
          <template #body="slotProps">
            {{ formatFileSize(slotProps.data.size) }}
          </template>
        </Column>

        <Column field="modified" header="Modified" :sortable="true">
          <template #body="slotProps">
            {{ formatDate(slotProps.data.modified) }}
          </template>
        </Column>

        <Column field="usage" header="Used By">
          <template #body="slotProps">
            <Tag 
              v-if="slotProps.data.usage > 0"
              :value="`${slotProps.data.usage} map${slotProps.data.usage > 1 ? 's' : ''}`"
              severity="info"
            />
            <Tag v-else value="Unused" severity="warning" />
          </template>
        </Column>

        <Column header="URL" style="width: 40%">
          <template #body="slotProps">
            <div class="flex align-items-center gap-2">
              <InputText 
                :value="getStyleUrl(slotProps.data.name)"
                readonly
                class="flex-1 p-inputtext-sm"
              />
              <Button 
                icon="pi pi-copy"
                @click="copyUrl(slotProps.data.name)"
                class="p-button-text p-button-sm"
                v-tooltip="'Copy URL'"
              />
            </div>
          </template>
        </Column>

        <Column header="Actions" style="width: 120px">
          <template #body="slotProps">
            <div class="flex gap-2">
              <Button 
                icon="pi pi-eye"
                @click="previewStyle(slotProps.data)"
                class="p-button-text p-button-sm"
                v-tooltip="'Preview'"
              />
              <Button 
                icon="pi pi-download"
                @click="downloadStyle(slotProps.data)"
                class="p-button-text p-button-sm"
                v-tooltip="'Download'"
              />
              <Button 
                icon="pi pi-trash"
                @click="confirmDelete(slotProps.data)"
                class="p-button-text p-button-danger p-button-sm"
                v-tooltip="'Delete'"
                :disabled="slotProps.data.usage > 0"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Preview Dialog -->
    <Dialog 
      v-model:visible="showPreviewDialog" 
      :style="{width: '70vw'}" 
      :header="`Preview: ${previewFile?.name}`"
      :modal="true"
    >
      <div class="preview-content">
        <pre>{{ previewContent }}</pre>
      </div>
    </Dialog>

    <!-- Delete Confirmation -->
    <Dialog 
      v-model:visible="showDeleteDialog" 
      :style="{width: '450px'}" 
      header="Confirm Delete"
      :modal="true"
    >
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem; color: var(--red-500)" />
        <span>Are you sure you want to delete <b>{{ deleteTarget?.name }}</b>?</span>
      </div>
      <template #footer>
        <Button 
          label="Cancel" 
          icon="pi pi-times" 
          @click="showDeleteDialog = false"
          class="p-button-text"
        />
        <Button 
          label="Delete" 
          icon="pi pi-trash" 
          @click="deleteStyle"
          class="p-button-danger"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import FileUpload from 'primevue/fileupload';
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import { useConfigStore } from '@/stores/config';

interface StyleFile {
  name: string;
  size: number;
  modified: string;
  usage: number;
  url?: string;
}

const toast = useToast();
const configStore = useConfigStore();

const styleFiles = ref<StyleFile[]>([]);
const loading = ref(false);
const showUploadDialog = ref(false);
const showPreviewDialog = ref(false);
const showDeleteDialog = ref(false);
const newStyleName = ref('');
const previewFile = ref<StyleFile | null>(null);
const previewContent = ref('');
const deleteTarget = ref<StyleFile | null>(null);

// Get the base URL for style files
const baseUrl = computed(() => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
});

// Load style files from the server
async function loadStyleFiles() {
  loading.value = true;
  try {
    // In production, this would be an API call
    // For now, we'll use the files we know exist
    const response = await fetch('/api/styles');
    if (response.ok) {
      const data = await response.json();
      styleFiles.value = data.files;
    } else {
      // Fallback to known files
      styleFiles.value = await getLocalStyleFiles();
    }
  } catch (error) {
    console.error('Error loading style files:', error);
    // Fallback to known files
    styleFiles.value = await getLocalStyleFiles();
  } finally {
    loading.value = false;
  }
}

// Get local style files (fallback)
async function getLocalStyleFiles(): Promise<StyleFile[]> {
  const knownFiles = [
    'osmliberty.json',
    'maptiler3d.json',
    'basemap-ortho.json',
    'basemapktn-ortho.json',
    'kataster-light.json',
    'kataster-ortho.json',
    'basemap-ortho-blue.json',
    'bev-katasterlight.json',
    'basemap-at-new.json',
    'agraratlas.json',
    'basemap2.json',
    'basemap3.json',
    'basemap7.json',
    'de_brandenburg.json',
    'plan_ign.json',
    'nz-basemap-topographic.json',
    'nz-topolite-ortho.json',
    'nzortho.json',
    'kiinteistojaotus-taustakartalla.json',
    'kataster.json',
    'kataster-bev2.json',
    'kataster-bev.json',
    'grundstuecke_kataster-ktn-light.json',
    'ovl-kataster.json',
    'nz-parcels.json'
  ];

  // Count usage in current maps
  const maps = configStore.allMaps || [];
  const usageCount: Record<string, number> = {};

  maps.forEach((map: any) => {
    if (map.style && map.style.includes('/styles/')) {
      const filename = map.style.split('/styles/').pop();
      if (filename) {
        usageCount[filename] = (usageCount[filename] || 0) + 1;
      }
    }
  });

  return knownFiles.map(name => ({
    name,
    size: 0, // Would be fetched from server
    modified: new Date().toISOString(),
    usage: usageCount[name] || 0
  }));
}

// Upload a new style file
async function uploadStyle(event: any) {
  const file = event.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  
  const fileName = newStyleName.value || file.name;
  formData.append('name', fileName);

  try {
    const response = await fetch('/api/styles/upload', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Style file "${fileName}" uploaded successfully`,
        life: 3000
      });
      showUploadDialog.value = false;
      newStyleName.value = '';
      loadStyleFiles();
    } else {
      throw new Error('Upload failed');
    }
  } catch (error) {
    // Fallback: save to local storage for demo
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      localStorage.setItem(`style_${fileName}`, content);
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Style file "${fileName}" saved locally`,
        life: 3000
      });
      
      showUploadDialog.value = false;
      newStyleName.value = '';
      loadStyleFiles();
    };
    reader.readAsText(file);
  }
}

// Get the full URL for a style file
function getStyleUrl(filename: string): string {
  return `${baseUrl.value}/styles/${filename}`;
}

// Copy URL to clipboard
async function copyUrl(filename: string) {
  const url = getStyleUrl(filename);
  try {
    await navigator.clipboard.writeText(url);
    toast.add({
      severity: 'success',
      summary: 'Copied',
      detail: 'URL copied to clipboard',
      life: 2000
    });
  } catch (error) {
    console.error('Failed to copy:', error);
  }
}

// Preview style file
async function previewStyle(file: StyleFile) {
  previewFile.value = file;
  try {
    const response = await fetch(getStyleUrl(file.name));
    const data = await response.json();
    previewContent.value = JSON.stringify(data, null, 2);
    showPreviewDialog.value = true;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load style file',
      life: 3000
    });
  }
}

// Download style file
function downloadStyle(file: StyleFile) {
  const link = document.createElement('a');
  link.href = getStyleUrl(file.name);
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Confirm delete
function confirmDelete(file: StyleFile) {
  if (file.usage > 0) {
    toast.add({
      severity: 'warn',
      summary: 'Cannot Delete',
      detail: `This style is used by ${file.usage} map(s)`,
      life: 3000
    });
    return;
  }
  deleteTarget.value = file;
  showDeleteDialog.value = true;
}

// Delete style file
async function deleteStyle() {
  if (!deleteTarget.value) return;

  try {
    const response = await fetch(`/api/styles/${deleteTarget.value.name}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      toast.add({
        severity: 'success',
        summary: 'Deleted',
        detail: `Style file "${deleteTarget.value.name}" deleted`,
        life: 3000
      });
      loadStyleFiles();
    }
  } catch (error) {
    // Fallback: remove from local storage
    localStorage.removeItem(`style_${deleteTarget.value.name}`);
    toast.add({
      severity: 'success',
      summary: 'Deleted',
      detail: `Style file "${deleteTarget.value.name}" removed`,
      life: 3000
    });
    loadStyleFiles();
  } finally {
    showDeleteDialog.value = false;
    deleteTarget.value = null;
  }
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return 'N/A';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Format date
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString();
}

onMounted(() => {
  loadStyleFiles();
});
</script>

<style scoped>
.style-manager {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.style-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.style-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #333;
}

.upload-section {
  padding: 1rem 0;
}

.style-list {
  margin-top: 1rem;
}

.preview-content {
  max-height: 60vh;
  overflow: auto;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
}

.preview-content pre {
  margin: 0;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.4;
}

.confirmation-content {
  display: flex;
  align-items: center;
  padding: 1rem;
}

:deep(.p-datatable .p-datatable-header) {
  background: #f8f9fa;
  border: none;
  padding: 1rem;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.75rem;
}

:deep(.p-inputtext-sm) {
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
}
</style>