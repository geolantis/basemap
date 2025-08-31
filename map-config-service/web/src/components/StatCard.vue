<template>
  <div class="card p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-600">{{ title }}</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ value }}</p>
        <p v-if="trend" class="text-sm mt-2 hidden" :class="trendClass">
          {{ trend }}
        </p>
      </div>
      <div class="p-3 bg-blue-100 rounded-lg">
        <i :class="`pi ${icon} text-2xl text-blue-500`"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  value: string | number;
  icon: string;
  trend?: string;
}>();

const trendClass = computed(() => {
  if (!props.trend) return '';
  return props.trend.startsWith('+') ? 'text-green-600' : 'text-red-600';
});
</script>