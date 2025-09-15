<template>
  <div class="app-version" :class="displayMode">
    <template v-if="versionInfo">
      <span class="version-label">{{ formatVersion(versionInfo) }}</span>
      <template v-if="showDetails">
        <span class="version-separator">|</span>
        <span class="version-detail">{{ formatBuildTime(versionInfo.buildTime) }}</span>
        <template v-if="versionInfo.environment !== 'production'">
          <span class="version-separator">|</span>
          <span class="version-detail">{{ getShortCommit(versionInfo.gitCommit) }}</span>
        </template>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  getVersionInfo,
  formatVersion,
  formatBuildTime,
  getShortCommit,
  type VersionInfo
} from '@/utils/version';

interface Props {
  displayMode?: 'compact' | 'full' | 'footer';
  showDetails?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  displayMode: 'compact',
  showDetails: false
});

const versionInfo = ref<VersionInfo | null>(null);

onMounted(async () => {
  versionInfo.value = await getVersionInfo();

  // Log version info to console for debugging
  if (versionInfo.value) {
    console.info('%c Map Config Service ', 'background: #0ea5e9; color: white; padding: 2px 4px; border-radius: 3px;',
      `Version: ${versionInfo.value.version}`,
      `\nBuild: ${versionInfo.value.buildTime}`,
      `\nEnvironment: ${versionInfo.value.environment}`,
      `\nCommit: ${versionInfo.value.gitCommit}`
    );
  }
});
</script>

<style scoped>
.app-version {
  font-size: 0.75rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.app-version.compact {
  font-size: 0.7rem;
}

.app-version.full {
  font-size: 0.875rem;
  color: #4b5563;
}

.app-version.footer {
  font-size: 0.75rem;
  opacity: 0.7;
}

.version-label {
  font-weight: 500;
}

.version-separator {
  opacity: 0.5;
}

.version-detail {
  opacity: 0.8;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .app-version {
    color: #9ca3af;
  }

  .app-version.full {
    color: #d1d5db;
  }
}
</style>