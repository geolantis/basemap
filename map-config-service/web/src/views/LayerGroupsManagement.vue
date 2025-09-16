<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <!-- Back to Dashboard Button -->
          <Button
            @click="router.push('/dashboard')"
            outlined
            size="small"
            class="text-gray-600 hover:text-gray-900"
          >
            <i class="pi pi-arrow-left mr-2"></i>
            Back to Dashboard
          </Button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Layer Groups</h1>
            <p class="text-sm text-gray-500">Manage basemap and overlay combinations</p>
          </div>
        </div>

        <div class="flex items-center space-x-3">
          <!-- View Mode Toggle -->
          <div class="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              @click="viewMode = 'grid'"
              :class="viewMode === 'grid' ? 'bg-white shadow-sm' : 'bg-transparent'"
              size="small"
              text
            >
              <i class="pi pi-th-large"></i>
            </Button>
            <Button
              @click="viewMode = 'list'"
              :class="viewMode === 'list' ? 'bg-white shadow-sm' : 'bg-transparent'"
              size="small"
              text
            >
              <i class="pi pi-list"></i>
            </Button>
          </div>

          <!-- Actions -->
          <Button
            @click="showBulkActions = !showBulkActions"
            outlined
            size="small"
            v-if="selectedGroups.length > 0"
          >
            <i class="pi pi-check-square mr-2"></i>
            {{ selectedGroups.length }} Selected
          </Button>

          <Button
            @click="openConfigurator()"
            size="small"
          >
            <i class="pi pi-plus mr-2"></i>
            New Layer Group
          </Button>
        </div>
      </div>

      <!-- Bulk Actions Bar -->
      <div v-if="showBulkActions && selectedGroups.length > 0"
           class="mt-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
        <span class="text-sm text-blue-800">
          {{ selectedGroups.length }} layer group{{ selectedGroups.length > 1 ? 's' : '' }} selected
        </span>
        <div class="flex space-x-2">
          <Button @click="bulkActivate" size="small" severity="success" outlined>
            <i class="pi pi-check mr-1"></i>
            Activate
          </Button>
          <Button @click="bulkDeactivate" size="small" severity="warning" outlined>
            <i class="pi pi-pause mr-1"></i>
            Deactivate
          </Button>
          <Button @click="bulkDelete" size="small" severity="danger" outlined>
            <i class="pi pi-trash mr-1"></i>
            Delete
          </Button>
          <Button @click="clearSelection" size="small" text>
            Clear
          </Button>
        </div>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <!-- Search -->
        <div class="md:col-span-2">
          <InputText
            v-model="searchQuery"
            placeholder="Search layer groups..."
            class="w-full"
          >
            <template #prefix>
              <i class="pi pi-search"></i>
            </template>
          </InputText>
        </div>

        <!-- Status Filter -->
        <div>
          <Dropdown
            v-model="statusFilter"
            :options="statusOptions"
            placeholder="All Status"
            class="w-full"
          />
        </div>

        <!-- Basemap Type Filter -->
        <div>
          <Dropdown
            v-model="basemapTypeFilter"
            :options="basemapTypeOptions"
            placeholder="All Basemap Types"
            class="w-full"
          />
        </div>

        <!-- Sort -->
        <div>
          <Dropdown
            v-model="sortBy"
            :options="sortOptions"
            placeholder="Sort by..."
            class="w-full"
          />
        </div>
      </div>
    </div>

    <!-- Stats Bar -->
    <div class="flex-shrink-0 bg-gray-50 border-b border-gray-200 px-6 py-3">
      <div class="flex items-center justify-between text-sm text-gray-600">
        <div class="flex items-center space-x-6">
          <span>{{ filteredGroups.length }} layer groups</span>
          <span>{{ activeGroupsCount }} active</span>
          <span>{{ inactiveGroupsCount }} inactive</span>
        </div>
        <div v-if="selectedGroups.length > 0" class="text-blue-600">
          {{ selectedGroups.length }} selected
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-hidden">
      <div class="h-full overflow-y-auto p-6">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center h-64">
          <div class="text-center">
            <i class="pi pi-spinner pi-spin text-4xl text-gray-400 mb-4"></i>
            <p class="text-gray-500">Loading layer groups...</p>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredGroups.length === 0 && !loading" class="flex items-center justify-center h-64">
          <div class="text-center">
            <i class="pi pi-layers text-4xl text-gray-400 mb-4"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">
              {{ searchQuery || statusFilter || basemapTypeFilter ? 'No matching layer groups' : 'No layer groups yet' }}
            </h3>
            <p class="text-gray-500 mb-4">
              {{ searchQuery || statusFilter || basemapTypeFilter
                ? 'Try adjusting your filters to find what you\'re looking for.'
                : 'Create your first layer group by combining basemaps with overlays.'
              }}
            </p>
            <Button
              v-if="!searchQuery && !statusFilter && !basemapTypeFilter"
              @click="openConfigurator()"
              size="small"
            >
              <i class="pi pi-plus mr-2"></i>
              Create Layer Group
            </Button>
          </div>
        </div>

        <!-- Grid View -->
        <div v-else-if="viewMode === 'grid'"
             class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <LayerGroupCard
            v-for="group in paginatedGroups"
            :key="group.id"
            :layer-group="group"
            :selected="selectedGroups.includes(group.id)"
            :show-selection="showBulkActions"
            @preview="previewGroup(group)"
            @edit="editGroup(group)"
            @duplicate="duplicateGroup(group)"
            @delete="deleteGroup(group)"
            @toggle-selection="toggleGroupSelection(group.id)"
          />
        </div>

        <!-- List View -->
        <div v-else class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <DataTable
            :value="paginatedGroups"
            v-model:selection="selectedGroupsData"
            selectionMode="multiple"
            dataKey="id"
            :loading="loading"
            stripedRows
            class="p-datatable-sm"
          >
            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

            <Column field="name" header="Name" sortable>
              <template #body="{ data }">
                <div class="flex items-center space-x-3">
                  <!-- Preview thumbnail -->
                  <div class="w-12 h-8 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    <img
                      v-if="data.basemap?.previewUrl"
                      :src="data.basemap.previewUrl"
                      :alt="data.basemap.label"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <i class="pi pi-layers text-xs text-gray-400"></i>
                    </div>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-gray-900">{{ data.name }}</div>
                    <div class="text-sm text-gray-500 truncate">
                      {{ data.basemap?.label || 'No basemap' }}
                    </div>
                  </div>
                </div>
              </template>
            </Column>

            <Column field="basemap.type" header="Basemap Type" sortable>
              <template #body="{ data }">
                <Tag
                  v-if="data.basemap"
                  :value="data.basemap.type.toUpperCase()"
                  :style="{ backgroundColor: getLayerColor(data.basemap.type), color: 'white' }"
                />
                <span v-else class="text-gray-400">None</span>
              </template>
            </Column>

            <Column field="overlays" header="Overlays">
              <template #body="{ data }">
                <div class="flex items-center space-x-2">
                  <span class="text-sm font-medium">{{ data.overlays.length }}</span>
                  <div v-if="data.overlays.length > 0" class="flex -space-x-1">
                    <div
                      v-for="(overlay, index) in data.overlays.slice(0, 3)"
                      :key="overlay.overlay.id"
                      class="w-4 h-4 rounded-full border-2 border-white"
                      :style="{ backgroundColor: getLayerColor(overlay.overlay.type) }"
                      :title="overlay.overlay.label"
                    ></div>
                    <div
                      v-if="data.overlays.length > 3"
                      class="w-4 h-4 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center"
                      :title="`+${data.overlays.length - 3} more`"
                    >
                      <span class="text-xs text-white font-bold">+</span>
                    </div>
                  </div>
                </div>
              </template>
            </Column>

            <Column field="isActive" header="Status" sortable>
              <template #body="{ data }">
                <Tag
                  :value="data.isActive ? 'Active' : 'Inactive'"
                  :severity="data.isActive ? 'success' : 'secondary'"
                />
              </template>
            </Column>

            <Column field="updatedAt" header="Updated" sortable>
              <template #body="{ data }">
                <span class="text-sm text-gray-500">
                  {{ formatDate(data.updatedAt) }}
                </span>
              </template>
            </Column>

            <Column header="Actions">
              <template #body="{ data }">
                <div class="flex space-x-1">
                  <Button
                    @click="previewGroup(data)"
                    size="small"
                    text
                    rounded
                    v-tooltip="'Preview'"
                  >
                    <i class="pi pi-eye"></i>
                  </Button>
                  <Button
                    @click="editGroup(data)"
                    size="small"
                    text
                    rounded
                    v-tooltip="'Edit'"
                  >
                    <i class="pi pi-pencil"></i>
                  </Button>
                  <Button
                    @click="duplicateGroup(data)"
                    size="small"
                    text
                    rounded
                    v-tooltip="'Duplicate'"
                  >
                    <i class="pi pi-copy"></i>
                  </Button>
                  <Button
                    @click="deleteGroup(data)"
                    size="small"
                    text
                    rounded
                    severity="danger"
                    v-tooltip="'Delete'"
                  >
                    <i class="pi pi-trash"></i>
                  </Button>
                </div>
              </template>
            </Column>
          </DataTable>
        </div>

        <!-- Pagination -->
        <div v-if="filteredGroups.length > pageSize" class="mt-6 flex justify-center">
          <Paginator
            v-model:first="first"
            :rows="pageSize"
            :totalRecords="filteredGroups.length"
            :rowsPerPageOptions="[12, 24, 48]"
            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          />
        </div>
      </div>
    </div>

    <!-- Layer Group Configurator Dialog -->
    <LayerGroupConfigurator
      v-model:visible="showConfigurator"
      :layer-group="editingGroup"
      :basemaps="basemaps"
      :overlays="overlays"
      @save="handleSaveGroup"
      @close="closeConfigurator"
    />

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog />

    <!-- Toast for notifications -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Paginator from 'primevue/paginator';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';
import { formatDistanceToNow } from 'date-fns';

import LayerGroupCard from '../components/LayerGroupCard.vue';
import LayerGroupConfigurator from '../components/LayerGroupConfigurator.vue';
import { supabase } from '../lib/supabase';
import type { LayerGroup, BasemapLayer, OverlayLayer, LayerGroupConfig } from '../types';

// Composables
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

// State
const loading = ref(false);
const showConfigurator = ref(false);
const editingGroup = ref<LayerGroup | undefined>(undefined);
const showBulkActions = ref(false);
const viewMode = ref<'grid' | 'list'>('grid');

// Data
const layerGroups = ref<LayerGroup[]>([]);
const basemaps = ref<BasemapLayer[]>([]);
const overlays = ref<OverlayLayer[]>([]);
const selectedGroups = ref<string[]>([]);
const selectedGroupsData = ref<LayerGroup[]>([]);

// Filters and Search
const searchQuery = ref('');
const statusFilter = ref('');
const basemapTypeFilter = ref('');
const sortBy = ref('name');

// Pagination
const first = ref(0);
const pageSize = ref(12);

// Filter Options
const statusOptions = ref([
  { label: 'All Status', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' }
]);

const basemapTypeOptions = computed(() => {
  const types = new Set(layerGroups.value
    .filter(g => g.basemap)
    .map(g => g.basemap!.type));
  return [
    { label: 'All Types', value: '' },
    ...Array.from(types).map(type => ({
      label: type.toUpperCase(),
      value: type
    }))
  ];
});

const sortOptions = ref([
  { label: 'Name (A-Z)', value: 'name' },
  { label: 'Name (Z-A)', value: '-name' },
  { label: 'Recently Updated', value: '-updatedAt' },
  { label: 'Oldest Updated', value: 'updatedAt' },
  { label: 'Most Overlays', value: '-overlayCount' },
  { label: 'Least Overlays', value: 'overlayCount' }
]);

// Computed properties
const filteredGroups = computed(() => {
  let filtered = layerGroups.value;

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(group =>
      group.name.toLowerCase().includes(query) ||
      group.basemap?.label.toLowerCase().includes(query) ||
      group.basemap?.name.toLowerCase().includes(query)
    );
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(group => {
      if (statusFilter.value === 'active') return group.isActive;
      if (statusFilter.value === 'inactive') return !group.isActive;
      return true;
    });
  }

  // Basemap type filter
  if (basemapTypeFilter.value) {
    filtered = filtered.filter(group =>
      group.basemap?.type === basemapTypeFilter.value
    );
  }

  // Sort
  const sortField = sortBy.value.replace('-', '');
  const sortDesc = sortBy.value.startsWith('-');

  filtered.sort((a, b) => {
    let aVal: any, bVal: any;

    switch (sortField) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'updatedAt':
        aVal = new Date(a.updatedAt);
        bVal = new Date(b.updatedAt);
        break;
      case 'overlayCount':
        aVal = a.overlays.length;
        bVal = b.overlays.length;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDesc ? 1 : -1;
    if (aVal > bVal) return sortDesc ? -1 : 1;
    return 0;
  });

  return filtered;
});

const paginatedGroups = computed(() => {
  if (viewMode.value === 'list') {
    return filteredGroups.value.slice(first.value, first.value + pageSize.value);
  }
  return filteredGroups.value.slice(first.value, first.value + pageSize.value);
});

const activeGroupsCount = computed(() =>
  layerGroups.value.filter(g => g.isActive).length
);

const inactiveGroupsCount = computed(() =>
  layerGroups.value.filter(g => !g.isActive).length
);

// Methods
const loadLayerGroups = async () => {
  loading.value = true;
  try {
    // Load real layer groups from Supabase
    const { data, error } = await supabase
      .from('layer_groups')
      .select(`
        *,
        basemap:map_configs!basemap_id(
          id, name, label, type, style, map_category,
          country, flag, metadata, preview_image_url, is_active
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Load overlay relationships
    const { data: overlayRelations, error: overlayError } = await supabase
      .from('layer_group_overlays')
      .select(`
        *,
        overlay:map_configs!overlay_id(
          id, name, label, type, style, map_category,
          country, flag, metadata, preview_image_url, is_active
        )
      `)
      .order('display_order');

    if (overlayError) throw overlayError;

    // Combine layer groups with their overlays
    layerGroups.value = (data || []).map(group => {
      const groupOverlays = overlayRelations?.filter(r => r.layer_group_id === group.id) || [];

      return {
        ...group,
        overlays: groupOverlays.map(rel => ({
          ...rel,
          opacity: rel.opacity * 100, // Convert decimal to percentage for UI
          isVisibleDefault: rel.is_visible_by_default
        })),
        isActive: group.is_active,
        createdAt: new Date(group.created_at),
        updatedAt: new Date(group.updated_at),
        createdBy: group.created_by || 'System'
      };
    });

    // DON'T OVERWRITE REAL DATA WITH MOCK DATA!
    // The basemaps and overlays are already loaded from Supabase in loadMapsData()
    // Commenting out the mock data that was overwriting the real data:

    // basemaps.value = [
    //   {
    //     id: 'osm-carto',
    //     name: 'openstreetmap-carto',
    //     label: 'OpenStreetMap Carto',
    //     type: 'xyz',
    //     country: 'Global',
    //     flag: '🌍',
    //     isActive: true,
    //     previewUrl: '/api/preview/osm-carto.png',
    //     metadata: { provider: 'OpenStreetMap' }
    //   }
    // ];

    // overlays.value = [
    //   {
    //     id: 'buildings',
    //     name: 'building-overlay',
    //     label: 'Buildings Layer',
    //     type: 'geojson',
    //     country: 'Global',
    //     flag: '🌍',
    //     isActive: true,
    //     previewUrl: '/api/preview/buildings.png',
    //     metadata: { provider: 'Local GIS' }
    //   }
    // ];
  } catch (error) {
    console.error('Error loading layer groups:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load layer groups',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const openConfigurator = (group?: LayerGroup) => {
  editingGroup.value = group;
  showConfigurator.value = true;
};

const closeConfigurator = () => {
  editingGroup.value = undefined;
  showConfigurator.value = false;
};

const handleSaveGroup = async (config: LayerGroupConfig) => {
  try {
    if (editingGroup.value) {
      // Update existing group in database
      const { data: updatedGroup, error: updateError } = await supabase
        .from('layer_groups')
        .update({
          name: config.name,
          description: config.description,
          basemap_id: config.basemap?.id,
          metadata: config.metadata || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', editingGroup.value.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Delete existing overlay relationships
      await supabase
        .from('layer_group_overlays')
        .delete()
        .eq('layer_group_id', editingGroup.value.id);

      // Insert new overlay relationships
      if (config.overlays && config.overlays.length > 0) {
        const overlayRelations = config.overlays.map((overlay, index) => ({
          layer_group_id: editingGroup.value!.id,
          overlay_id: overlay.overlay.id,
          display_order: index,
          is_visible_by_default: overlay.isVisibleDefault !== false,
          opacity: overlay.opacity / 100 // Convert percentage to decimal
        }));

        const { error: overlayError } = await supabase
          .from('layer_group_overlays')
          .insert(overlayRelations);

        if (overlayError) throw overlayError;
      }

      // Update local state
      const index = layerGroups.value.findIndex(g => g.id === editingGroup.value!.id);
      if (index >= 0) {
        layerGroups.value[index] = {
          ...layerGroups.value[index],
          ...config,
          updatedAt: new Date()
        };
      }

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Layer group updated successfully',
        life: 3000
      });
    } else {
      // Create new group in database
      const { data: newGroup, error: createError } = await supabase
        .from('layer_groups')
        .insert({
          name: config.name,
          description: config.description || '',
          basemap_id: config.basemap?.id,
          is_active: true,
          is_public: true,
          metadata: config.metadata || {},
          display_order: 0
        })
        .select()
        .single();

      if (createError) throw createError;

      // Insert overlay relationships if any
      if (config.overlays && config.overlays.length > 0 && newGroup) {
        const overlayRelations = config.overlays.map((overlay, index) => ({
          layer_group_id: newGroup.id,
          overlay_id: overlay.overlay.id,
          display_order: index,
          is_visible_by_default: overlay.isVisibleDefault !== false,
          opacity: overlay.opacity / 100 // Convert percentage to decimal
        }));

        const { error: overlayError } = await supabase
          .from('layer_group_overlays')
          .insert(overlayRelations);

        if (overlayError) throw overlayError;
      }

      // Add to local state
      const localGroup: LayerGroup = {
        ...newGroup,
        basemap: config.basemap,
        overlays: config.overlays,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'current-user'
      };
      layerGroups.value.unshift(localGroup);

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Layer group created successfully',
        life: 3000
      });
    }

    // Reload layer groups to ensure consistency
    await loadLayerGroups();

  } catch (error) {
    console.error('Error saving layer group:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: `Failed to save layer group: ${error.message}`,
      life: 5000
    });
  }
};

const previewGroup = (group: LayerGroup) => {
  router.push(`/layer-groups/${group.id}/preview`);
};

const editGroup = (group: LayerGroup) => {
  openConfigurator(group);
};

const duplicateGroup = async (group: LayerGroup) => {
  try {
    const duplicated: LayerGroup = {
      ...group,
      id: Date.now().toString(),
      name: `${group.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user'
    };
    layerGroups.value.unshift(duplicated);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Layer group duplicated successfully',
      life: 3000
    });
  } catch (error) {
    console.error('Error duplicating layer group:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to duplicate layer group',
      life: 3000
    });
  }
};

const deleteGroup = (group: LayerGroup) => {
  confirm.require({
    message: `Are you sure you want to delete "${group.name}"? This action cannot be undone.`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        const index = layerGroups.value.findIndex(g => g.id === group.id);
        if (index >= 0) {
          layerGroups.value.splice(index, 1);
        }
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Layer group deleted successfully',
          life: 3000
        });
      } catch (error) {
        console.error('Error deleting layer group:', error);
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete layer group',
          life: 3000
        });
      }
    }
  });
};

const toggleGroupSelection = (groupId: string) => {
  const index = selectedGroups.value.indexOf(groupId);
  if (index >= 0) {
    selectedGroups.value.splice(index, 1);
  } else {
    selectedGroups.value.push(groupId);
  }
};

const clearSelection = () => {
  selectedGroups.value = [];
  selectedGroupsData.value = [];
  showBulkActions.value = false;
};

const bulkActivate = async () => {
  try {
    selectedGroups.value.forEach(groupId => {
      const group = layerGroups.value.find(g => g.id === groupId);
      if (group) {
        group.isActive = true;
        group.updatedAt = new Date();
      }
    });
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `${selectedGroups.value.length} layer groups activated`,
      life: 3000
    });
    clearSelection();
  } catch (error) {
    console.error('Error activating layer groups:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to activate layer groups',
      life: 3000
    });
  }
};

const bulkDeactivate = async () => {
  try {
    selectedGroups.value.forEach(groupId => {
      const group = layerGroups.value.find(g => g.id === groupId);
      if (group) {
        group.isActive = false;
        group.updatedAt = new Date();
      }
    });
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `${selectedGroups.value.length} layer groups deactivated`,
      life: 3000
    });
    clearSelection();
  } catch (error) {
    console.error('Error deactivating layer groups:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to deactivate layer groups',
      life: 3000
    });
  }
};

const bulkDelete = () => {
  confirm.require({
    message: `Are you sure you want to delete ${selectedGroups.value.length} layer groups? This action cannot be undone.`,
    header: 'Confirm Bulk Delete',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        layerGroups.value = layerGroups.value.filter(g => !selectedGroups.value.includes(g.id));
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: `${selectedGroups.value.length} layer groups deleted`,
          life: 3000
        });
        clearSelection();
      } catch (error) {
        console.error('Error deleting layer groups:', error);
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete layer groups',
          life: 3000
        });
      }
    }
  });
};

const getLayerColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'vtc': return '#3b82f6';
    case 'wmts': return '#10b981';
    case 'wms': return '#8b5cf6';
    case 'xyz': return '#f59e0b';
    case 'geojson': return '#eab308';
    default: return '#6b7280';
  }
};

const formatDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

// Watch for selection changes in DataTable
watch(() => selectedGroupsData.value, (newSelection) => {
  selectedGroups.value = newSelection.map(g => g.id);
});

// Load maps data from API or Supabase
const loadMapsData = async () => {
  try {
    console.log('Loading maps data from Supabase...');

    // Load from Supabase - don't filter by is_active, check what we get
    const { data, error } = await supabase
      .from('map_configs')
      .select('*') as { data: any[] | null, error: any };

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Loaded maps data:', data?.length || 0, 'items');

    if (data && data.length > 0) {
      // Log first item to see structure
      console.log('Sample map config:', data[0]);

      // Separate basemaps and overlays - handle both map_category and absence of it
      const backgroundMaps = data
        .filter(m => {
          // If no map_category field, assume it's a background map
          // Or explicitly check for 'background'
          const isBackground = !m.map_category || m.map_category === 'background' || m.map_category === null;
          console.log(`Map ${m.name}: category=${m.map_category}, isBackground=${isBackground}`);
          return isBackground;
        })
        .map(m => ({
          ...m, // Include all original fields
          id: m.id,
          name: m.name,
          label: m.label || m.name,
          type: m.type,
          style: m.style || m.style_url || m.public_style_url,
          country: m.country || 'Global',
          flag: m.flag || '🌐',
          isActive: m.is_active !== false, // For UI compatibility
          is_active: m.is_active, // Keep original field
          previewUrl: m.preview_image_url || `/api/preview/${m.name}`,
          preview_image_url: m.preview_image_url,
          map_category: m.map_category || 'background'
        }));

      const overlayMaps = data
        .filter(m => m.map_category === 'overlay')
        .map(m => ({
          ...m, // Include all original fields
          id: m.id,
          name: m.name,
          label: m.label || m.name,
          type: m.type,
          style: m.style || m.style_url || m.public_style_url,
          country: m.country || 'Global',
          flag: m.flag || '🌐',
          isActive: m.is_active !== false, // For UI compatibility
          is_active: m.is_active, // Keep original field
          opacity: 0.8,
          previewUrl: m.preview_image_url || `/api/preview/${m.name}`,
          preview_image_url: m.preview_image_url,
          map_category: m.map_category || 'overlay'
        }));

      console.log(`Found ${backgroundMaps.length} basemaps and ${overlayMaps.length} overlays`);

      basemaps.value = backgroundMaps;
      overlays.value = overlayMaps;
    } else {
      console.warn('No maps data returned from Supabase');
      basemaps.value = [];
      overlays.value = [];
    }
  } catch (error) {
    console.error('Error loading maps data:', error);
    // Fallback to mock data if needed
    basemaps.value = [];
    overlays.value = [];
  }
};

// Lifecycle
onMounted(async () => {
  await loadMapsData();
  await loadLayerGroups();
});
</script>