<template>
  <div class="h-full flex flex-col">
    <!-- Panel Header -->
    <div class="p-4 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-900">Validation & Operations</h3>
    </div>
    
    <div class="flex-1 overflow-auto">
      <!-- Validation Statuses -->
      <div v-if="validationStatuses.size > 0" class="p-4 border-b border-gray-200">
        <h4 class="text-sm font-medium text-gray-900 mb-3">Validation Status</h4>
        
        <!-- Validation Summary -->
        <div class="grid grid-cols-2 gap-2 mb-4">
          <div class="bg-green-50 rounded-lg p-2 text-center">
            <div class="text-lg font-semibold text-green-600">{{ validCount }}</div>
            <div class="text-xs text-green-600">Valid</div>
          </div>
          <div class="bg-red-50 rounded-lg p-2 text-center">
            <div class="text-lg font-semibold text-red-600">{{ invalidCount }}</div>
            <div class="text-xs text-red-600">Invalid</div>
          </div>
          <div class="bg-blue-50 rounded-lg p-2 text-center">
            <div class="text-lg font-semibold text-blue-600">{{ validatingCount }}</div>
            <div class="text-xs text-blue-600">Validating</div>
          </div>
          <div class="bg-orange-50 rounded-lg p-2 text-center">
            <div class="text-lg font-semibold text-orange-600">{{ errorCount }}</div>
            <div class="text-xs text-orange-600">Errors</div>
          </div>
        </div>
        
        <!-- Validation List -->
        <div class="space-y-2 max-h-60 overflow-auto">
          <div
            v-for="[mapId, status] in Array.from(validationStatuses.entries())"
            :key="mapId"
            class="flex items-center justify-between p-2 bg-gray-50 rounded-md text-sm"
          >
            <div class="flex items-center space-x-2 flex-1 min-w-0">
              <div class="truncate font-medium text-gray-700">Map {{ mapId.slice(-6) }}</div>
            </div>
            <ValidationStatusBadge :status="status" />
          </div>
        </div>
      </div>

      <!-- Batch Operations -->
      <div v-if="batchOperations.size > 0" class="p-4">
        <h4 class="text-sm font-medium text-gray-900 mb-3">Batch Operations</h4>
        
        <div class="space-y-3">
          <div
            v-for="[batchId, operation] in Array.from(batchOperations.entries())"
            :key="batchId"
            class="border border-gray-200 rounded-lg p-3"
          >
            <!-- Operation Header -->
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2">
                <i :class="getOperationIcon(operation.type)" class="text-gray-600"></i>
                <span class="text-sm font-medium text-gray-900 capitalize">
                  {{ operation.type }} Operation
                </span>
              </div>
              <span
                class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
                :class="getOperationStatusColor(operation.status)"
              >
                <i :class="getOperationStatusIcon(operation.status)" class="mr-1"></i>
                {{ operation.status }}
              </span>
            </div>
            
            <!-- Progress Bar -->
            <div v-if="operation.status === 'running'" class="mb-2">
              <div class="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{{ operation.progress }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  class="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  :style="{ width: `${operation.progress}%` }"
                ></div>
              </div>
            </div>
            
            <!-- Operation Details -->
            <div class="text-xs text-gray-600 space-y-1">
              <div>{{ operation.targetIds.length }} maps</div>
              <div v-if="operation.startedAt">
                Started: {{ formatTimestamp(operation.startedAt) }}
              </div>
              <div v-if="operation.completedAt">
                Completed: {{ formatTimestamp(operation.completedAt) }}
              </div>
            </div>
            
            <!-- Results Summary -->
            <div v-if="operation.results && operation.results.length > 0" class="mt-2 pt-2 border-t border-gray-100">
              <div class="flex justify-between text-xs">
                <span class="text-green-600">
                  ✓ {{ operation.results.filter(r => r.success).length }} succeeded
                </span>
                <span class="text-red-600">
                  ✗ {{ operation.results.filter(r => !r.success).length }} failed
                </span>
              </div>
              
              <!-- Detailed Results (Collapsible) -->
              <div v-if="expandedOperations.has(batchId)" class="mt-2 space-y-1">
                <div
                  v-for="result in operation.results"
                  :key="result.targetId"
                  class="flex items-center justify-between text-xs p-1 rounded"
                  :class="result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
                >
                  <span>Map {{ result.targetId.slice(-6) }}</span>
                  <span v-if="!result.success && result.message" :title="result.message">
                    <i class="pi pi-exclamation-triangle"></i>
                  </span>
                  <span v-else>
                    <i :class="result.success ? 'pi pi-check' : 'pi pi-times'"></i>
                  </span>
                </div>
              </div>
              
              <button
                @click="toggleOperationExpansion(batchId)"
                class="mt-1 text-xs text-gray-500 hover:text-gray-700"
              >
                {{ expandedOperations.has(batchId) ? 'Hide Details' : 'Show Details' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div 
        v-if="validationStatuses.size === 0 && batchOperations.size === 0"
        class="flex-1 flex items-center justify-center p-4"
      >
        <div class="text-center text-gray-500">
          <i class="pi pi-info-circle text-2xl mb-2"></i>
          <p class="text-sm">No validation or operations in progress</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { format, parseISO } from 'date-fns';
import type { ValidationStatus, BatchOperation } from '../types';
import ValidationStatusBadge from './ValidationStatusBadge.vue';

interface Props {
  validationStatuses: Map<string, ValidationStatus>;
  batchOperations: Map<string, BatchOperation>;
}

const props = defineProps<Props>();

// Track expanded operations
const expandedOperations = ref<Set<string>>(new Set());

// Computed validation counts
const validCount = computed(() => 
  Array.from(props.validationStatuses.values()).filter(s => s.status === 'valid').length
);

const invalidCount = computed(() => 
  Array.from(props.validationStatuses.values()).filter(s => s.status === 'invalid').length
);

const validatingCount = computed(() => 
  Array.from(props.validationStatuses.values()).filter(s => s.status === 'validating').length
);

const errorCount = computed(() => 
  Array.from(props.validationStatuses.values()).filter(s => s.status === 'error').length
);

// Methods
const formatTimestamp = (timestamp: string) => {
  try {
    return format(parseISO(timestamp), 'HH:mm:ss');
  } catch {
    return timestamp;
  }
};

const getOperationIcon = (type: string) => {
  switch (type) {
    case 'accept':
      return 'pi pi-check';
    case 'reject':
      return 'pi pi-times';
    case 'validate':
      return 'pi pi-check-circle';
    default:
      return 'pi pi-cog';
  }
};

const getOperationStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'running':
      return 'bg-blue-100 text-blue-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'pending':
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
};

const getOperationStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return 'pi pi-check';
    case 'running':
      return 'pi pi-spin pi-spinner';
    case 'failed':
      return 'pi pi-times';
    case 'pending':
    default:
      return 'pi pi-clock';
  }
};

const toggleOperationExpansion = (batchId: string) => {
  if (expandedOperations.value.has(batchId)) {
    expandedOperations.value.delete(batchId);
  } else {
    expandedOperations.value.add(batchId);
  }
};
</script>

<style scoped>
.pi-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>