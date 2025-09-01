<template>
  <header class="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-40">
    <div class="max-w-brand mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-header">
        <!-- Logo and Brand -->
        <div class="flex items-center space-x-4">
          <router-link to="/" class="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <!-- Logo Icon -->
            <div class="w-10 h-10 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            
            <!-- Brand Text -->
            <div class="flex flex-col">
              <h1 class="text-xl font-bold text-neutral-900">
                {{ brandingConfig.name }}
              </h1>
              <p class="text-xs text-neutral-500 -mt-1">
                {{ brandingConfig.tagline }}
              </p>
            </div>
          </router-link>
        </div>

        <!-- Navigation & Actions -->
        <div class="flex items-center space-x-4">
          <!-- Search Bar (if provided) -->
          <div v-if="showSearch" class="hidden md:block">
            <slot name="search" />
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center space-x-2">
            <slot name="actions" />
          </div>

          <!-- User Menu -->
          <div class="flex items-center space-x-3">
            <!-- Settings Link -->
            <router-link 
              to="/settings" 
              class="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Settings"
            >
              <i class="pi pi-cog text-neutral-600"></i>
            </router-link>

            <!-- User Avatar/Profile -->
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-gradient-to-r from-brand-primary to-brand-accent rounded-full flex items-center justify-center">
                <i class="pi pi-user text-white text-sm"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Secondary Navigation (if provided) -->
      <div v-if="$slots.navigation" class="border-t border-neutral-100 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <slot name="navigation" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { brandingConfig } from '../config/branding';

interface Props {
  showSearch?: boolean;
}

withDefaults(defineProps<Props>(), {
  showSearch: true,
});
</script>

<style scoped>
/* Additional custom styles for the header */
.router-link-exact-active {
  @apply text-brand-primary;
}

/* Responsive logo adjustments */
@media (max-width: 640px) {
  .brand-text {
    display: none;
  }
}
</style>