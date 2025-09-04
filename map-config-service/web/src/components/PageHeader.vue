<template>
  <div class="page-header">
    <div class="page-header-content">
      <div class="page-header-title">
        <i v-if="icon" :class="icon" class="page-header-icon"></i>
        <h1>{{ title }}</h1>
      </div>
      <div v-if="$slots.actions" class="page-header-actions">
        <slot name="actions" />
      </div>
    </div>
    <p v-if="subtitle" class="page-header-subtitle">{{ subtitle }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  subtitle?: string;
  icon?: string;
}

defineProps<Props>();
</script>

<style scoped>
.page-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.page-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.page-header-icon {
  font-size: 1.75rem;
  color: var(--primary-color);
}

.page-header h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-color);
}

.page-header-subtitle {
  margin: 0.5rem 0 0 0;
  color: var(--text-color-secondary);
  font-size: 1rem;
}

.page-header-actions {
  display: flex;
  gap: 0.75rem;
}

@media (max-width: 640px) {
  .page-header-content {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>