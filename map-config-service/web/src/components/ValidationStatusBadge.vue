<template>
  <div v-if="status" class="inline-flex items-center">
    <span
      class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
      :class="statusClasses"
    >
      <i :class="statusIcon" class="mr-1"></i>
      {{ statusText }}
    </span>
    
    <!-- Error Details Tooltip -->
    <div
      v-if="status.status === 'invalid' && status.errors && status.errors.length > 0"
      class="ml-2 relative group"
    >
      <i class="pi pi-info-circle text-red-500 cursor-help"></i>
      <div class="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div class="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg max-w-xs">
          <div class="space-y-1">
            <div v-for="error in status.errors" :key="error.field" class="flex items-start space-x-2">
              <i 
                :class="getErrorIcon(error.severity)" 
                class="mt-0.5 flex-shrink-0"
              ></i>
              <div>
                <div class="font-medium">{{ error.field }}</div>
                <div class="text-gray-300">{{ error.message }}</div>
              </div>
            </div>
          </div>
          <div class="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- No status indicator -->
  <span v-else class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
    <i class="pi pi-circle mr-1"></i>
    Not Validated
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ValidationStatus, ValidationError } from '../types';

interface Props {
  status?: ValidationStatus;
}

const props = defineProps<Props>();

const statusClasses = computed(() => {
  if (!props.status) return 'bg-gray-100 text-gray-600';
  
  switch (props.status.status) {
    case 'valid':
      return 'bg-green-100 text-green-800';
    case 'invalid':
      return 'bg-red-100 text-red-800';
    case 'validating':
      return 'bg-blue-100 text-blue-800';
    case 'error':
      return 'bg-orange-100 text-orange-800';
    case 'pending':
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
});

const statusIcon = computed(() => {
  if (!props.status) return 'pi pi-circle';
  
  switch (props.status.status) {
    case 'valid':
      return 'pi pi-check-circle';
    case 'invalid':
      return 'pi pi-times-circle';
    case 'validating':
      return 'pi pi-spin pi-spinner';
    case 'error':
      return 'pi pi-exclamation-triangle';
    case 'pending':
    default:
      return 'pi pi-clock';
  }
});

const statusText = computed(() => {
  if (!props.status) return 'Not Validated';
  
  switch (props.status.status) {
    case 'valid':
      return 'Valid';
    case 'invalid':
      return 'Invalid';
    case 'validating':
      return 'Validating...';
    case 'error':
      return 'Error';
    case 'pending':
    default:
      return 'Pending';
  }
});

const getErrorIcon = (severity: ValidationError['severity']) => {
  switch (severity) {
    case 'error':
      return 'pi pi-times-circle text-red-400';
    case 'warning':
      return 'pi pi-exclamation-triangle text-yellow-400';
    case 'info':
      return 'pi pi-info-circle text-blue-400';
    default:
      return 'pi pi-circle text-gray-400';
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