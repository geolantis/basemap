import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useSaveService, SaveError } from '../services/saveService';
import type { SaveState, UserStyle, MapStyle, SaveDialogOptions } from '../types/save';

export const useSaveStore = defineStore('save', () => {
  // State
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const lastSavedId = ref<string | null>(null);
  const lastSavedAt = ref<Date | null>(null);
  const isDirty = ref(false);
  const userStyles = ref<UserStyle[]>([]);
  const currentStyleId = ref<string | null>(null);
  const saveDialogVisible = ref(false);
  const saveProgress = ref(0);

  // Services
  const saveService = useSaveService();
  const toast = useToast();

  // Computed
  const hasUnsavedChanges = computed(() => isDirty.value);
  const canSave = computed(() => !isLoading.value);
  const lastSavedText = computed(() => {
    if (!lastSavedAt.value) return 'Never saved';
    return `Last saved ${formatTimeAgo(lastSavedAt.value)}`;
  });

  // Actions
  async function saveStyle(styleData: MapStyle, options: SaveDialogOptions): Promise<boolean> {
    if (isLoading.value) {
      toast.add({
        severity: 'warn',
        summary: 'Save In Progress',
        detail: 'Please wait for the current save to complete',
        life: 3000
      });
      return false;
    }

    isLoading.value = true;
    error.value = null;
    saveProgress.value = 0;

    try {
      // Validate style before saving
      saveProgress.value = 20;
      const validation = await saveService.validateStyle(styleData);
      
      if (!validation.valid) {
        throw new Error(`Style validation failed: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        toast.add({
          severity: 'warn',
          summary: 'Style Warnings',
          detail: `Warnings: ${validation.warnings.join(', ')}`,
          life: 5000
        });
      }

      saveProgress.value = 50;

      // Determine if this is an update or new save
      let result;
      if (currentStyleId.value && !options.overwrite) {
        result = await saveService.updateStyle(currentStyleId.value, styleData, options);
      } else {
        result = await saveService.saveStyle(styleData, options);
      }

      saveProgress.value = 80;

      // Update store state
      lastSavedId.value = result.styleId;
      lastSavedAt.value = new Date();
      isDirty.value = false;
      currentStyleId.value = result.styleId;

      saveProgress.value = 100;

      // Show success message
      toast.add({
        severity: 'success',
        summary: 'Style Saved',
        detail: result.message,
        life: 4000
      });

      // Refresh user styles list
      await loadUserStyles();

      return true;

    } catch (err) {
      console.error('Save failed:', err);
      
      let errorMessage = 'Failed to save style';
      
      if (err instanceof SaveError) {
        switch (err.code) {
          case 'UNAUTHORIZED':
            errorMessage = 'Please log in to save styles';
            break;
          case 'VALIDATION_ERROR':
            errorMessage = `Style validation failed: ${err.message}`;
            break;
          case 'QUOTA_EXCEEDED':
            errorMessage = 'Storage quota exceeded. Please delete some styles.';
            break;
          case 'NETWORK_ERROR':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'TIMEOUT':
            errorMessage = 'Save timed out. Please try again.';
            break;
          default:
            errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      error.value = errorMessage;
      
      toast.add({
        severity: 'error',
        summary: 'Save Failed',
        detail: errorMessage,
        life: 6000
      });

      return false;

    } finally {
      isLoading.value = false;
      saveProgress.value = 0;
    }
  }

  async function loadUserStyles(): Promise<void> {
    try {
      const styles = await saveService.getUserStyles();
      userStyles.value = styles;
    } catch (err) {
      console.error('Failed to load user styles:', err);
      
      toast.add({
        severity: 'error',
        summary: 'Load Failed',
        detail: 'Failed to load your saved styles',
        life: 3000
      });
    }
  }

  async function deleteStyle(styleId: string): Promise<boolean> {
    try {
      const result = await saveService.deleteStyle(styleId);
      
      if (result.success) {
        // Remove from local list
        userStyles.value = userStyles.value.filter(style => style.id !== styleId);
        
        // Clear current style if deleted
        if (currentStyleId.value === styleId) {
          currentStyleId.value = null;
          lastSavedId.value = null;
          lastSavedAt.value = null;
          isDirty.value = false;
        }

        toast.add({
          severity: 'success',
          summary: 'Style Deleted',
          detail: result.message,
          life: 3000
        });

        return true;
      }

      return false;

    } catch (err) {
      console.error('Delete failed:', err);
      
      toast.add({
        severity: 'error',
        summary: 'Delete Failed',
        detail: err instanceof Error ? err.message : 'Failed to delete style',
        life: 3000
      });

      return false;
    }
  }

  function markDirty(): void {
    isDirty.value = true;
  }

  function markClean(): void {
    isDirty.value = false;
  }

  function clearError(): void {
    error.value = null;
  }

  function setCurrentStyle(styleId: string | null): void {
    currentStyleId.value = styleId;
  }

  function showSaveDialog(): void {
    saveDialogVisible.value = true;
  }

  function hideSaveDialog(): void {
    saveDialogVisible.value = false;
  }

  // Auto-save functionality
  const autoSaveEnabled = ref(false);
  const autoSaveInterval = ref(5 * 60 * 1000); // 5 minutes
  let autoSaveTimer: NodeJS.Timeout | null = null;

  function enableAutoSave(intervalMs?: number): void {
    if (intervalMs) autoSaveInterval.value = intervalMs;
    autoSaveEnabled.value = true;
    scheduleAutoSave();
  }

  function disableAutoSave(): void {
    autoSaveEnabled.value = false;
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }
  }

  function scheduleAutoSave(): void {
    if (!autoSaveEnabled.value) return;
    
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    autoSaveTimer = setTimeout(() => {
      if (isDirty.value && currentStyleId.value) {
        // Auto-save would require access to current style data
        // This would typically be handled by the component that manages the style
        console.log('Auto-save triggered - component should handle this');
      }
      scheduleAutoSave(); // Schedule next auto-save
    }, autoSaveInterval.value);
  }

  // Initialize
  loadUserStyles();

  return {
    // State
    isLoading,
    error,
    lastSavedId,
    lastSavedAt,
    isDirty,
    userStyles,
    currentStyleId,
    saveDialogVisible,
    saveProgress,
    autoSaveEnabled,
    autoSaveInterval,

    // Computed
    hasUnsavedChanges,
    canSave,
    lastSavedText,

    // Actions
    saveStyle,
    loadUserStyles,
    deleteStyle,
    markDirty,
    markClean,
    clearError,
    setCurrentStyle,
    showSaveDialog,
    hideSaveDialog,
    enableAutoSave,
    disableAutoSave
  };
});

/**
 * Format time ago text
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}