<template>
  <div class="min-h-screen flex flex-col bg-neutral-50">
    <!-- Branded Header -->
    <BrandHeader :show-search="showSearch">
      <!-- Search Slot -->
      <template #search>
        <slot name="search" />
      </template>
      
      <!-- Actions Slot -->
      <template #actions>
        <slot name="actions" />
      </template>
      
      <!-- Navigation Slot -->
      <template #navigation>
        <slot name="navigation" />
      </template>
    </BrandHeader>

    <!-- Main Content Area -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Branded Footer -->
    <BrandFooter />
  </div>
</template>

<script setup lang="ts">
import BrandHeader from './BrandHeader.vue';
import BrandFooter from './BrandFooter.vue';

interface Props {
  showSearch?: boolean;
}

withDefaults(defineProps<Props>(), {
  showSearch: true,
});
</script>

<style scoped>
/* Ensure proper flex layout */
main {
  display: flex;
  flex-direction: column;
}
</style>