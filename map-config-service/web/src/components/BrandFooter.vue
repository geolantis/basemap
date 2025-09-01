<template>
  <footer class="bg-neutral-50 border-t border-neutral-200 mt-auto">
    <div class="max-w-brand mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Brand & Description -->
        <div class="md:col-span-2">
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-8 h-8 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-neutral-900">{{ brandingConfig.name }}</h3>
          </div>
          <p class="text-neutral-600 text-sm max-w-md leading-relaxed">
            {{ brandingConfig.description }}
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="text-sm font-semibold text-neutral-900 mb-4">Resources</h4>
          <ul class="space-y-3">
            <li>
              <a 
                :href="brandingConfig.links.documentation" 
                target="_blank" 
                rel="noopener noreferrer"
                class="text-sm text-neutral-600 hover:text-brand-primary transition-colors flex items-center"
              >
                <i class="pi pi-book mr-2 text-xs"></i>
                Documentation
              </a>
            </li>
            <li>
              <a 
                :href="brandingConfig.links.support" 
                target="_blank" 
                rel="noopener noreferrer"
                class="text-sm text-neutral-600 hover:text-brand-primary transition-colors flex items-center"
              >
                <i class="pi pi-question-circle mr-2 text-xs"></i>
                Support
              </a>
            </li>
            <li>
              <a 
                :href="brandingConfig.links.github" 
                target="_blank" 
                rel="noopener noreferrer"
                class="text-sm text-neutral-600 hover:text-brand-primary transition-colors flex items-center"
              >
                <i class="pi pi-github mr-2 text-xs"></i>
                GitHub
              </a>
            </li>
          </ul>
        </div>

        <!-- Legal Links -->
        <div>
          <h4 class="text-sm font-semibold text-neutral-900 mb-4">Legal</h4>
          <ul class="space-y-3">
            <li>
              <a 
                :href="brandingConfig.links.privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                class="text-sm text-neutral-600 hover:text-brand-primary transition-colors"
              >
                Privacy Policy
              </a>
            </li>
            <li>
              <a 
                :href="brandingConfig.links.terms" 
                target="_blank" 
                rel="noopener noreferrer"
                class="text-sm text-neutral-600 hover:text-brand-primary transition-colors"
              >
                Terms of Service
              </a>
            </li>
            <li>
              <a 
                :href="brandingConfig.links.website" 
                target="_blank" 
                rel="noopener noreferrer"
                class="text-sm text-neutral-600 hover:text-brand-primary transition-colors"
              >
                Visit Website
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="flex flex-col sm:flex-row justify-between items-center pt-6 mt-6 border-t border-neutral-200">
        <div class="text-sm text-neutral-500 mb-2 sm:mb-0">
          {{ brandingConfig.footer.copyright }}
        </div>
        
        <div class="flex items-center space-x-4 text-xs text-neutral-400">
          <span>{{ brandingConfig.footer.version }}</span>
          <span>•</span>
          <span>Built {{ brandingConfig.footer.buildDate }}</span>
          <span>•</span>
          <span class="flex items-center">
            <i class="pi pi-heart mr-1 text-red-500"></i>
            Made for cartographers
          </span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { brandingConfig } from '../config/branding';
</script>

<style scoped>
/* Ensure footer stays at bottom */
footer {
  margin-top: auto;
}
</style>