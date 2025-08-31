import { ref, computed, watch, type Ref } from 'vue';
import type { 
  MapSearchQuery, 
  MapSearchResult, 
  ValidationStatus, 
  BatchOperation, 
  BatchOperationResult 
} from '../types';

// Simple debounce implementation
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null;
  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export function useMapSearch() {
  // Search state
  const searchQuery = ref<MapSearchQuery>({
    term: '',
    type: 'all',
    limit: 20,
    offset: 0
  });

  const searchResults = ref<MapSearchResult[]>([]);
  const isSearching = ref(false);
  const searchError = ref<string | null>(null);
  const totalResults = ref(0);

  // Selection state
  const selectedMaps = ref<Set<string>>(new Set());
  const allSelected = computed(() => 
    searchResults.value.length > 0 && 
    searchResults.value.every(map => selectedMaps.value.has(map.id))
  );

  // Validation state
  const validationStatuses = ref<Map<string, ValidationStatus>>(new Map());
  const batchOperations = ref<Map<string, BatchOperation>>(new Map());

  // Mock API functions (replace with real API calls)
  const searchMaps = async (query: MapSearchQuery): Promise<{ results: MapSearchResult[], total: number }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock search results
    const mockResults: MapSearchResult[] = [
      {
        id: '1',
        name: 'osm-bright',
        label: 'OSM Bright',
        type: 'vtc',
        country: 'Global',
        flag: '🌍',
        isActive: true,
        relevanceScore: 0.95,
        metadata: { provider: 'OpenStreetMap' }
      },
      {
        id: '2',
        name: 'satellite-hybrid',
        label: 'Satellite Hybrid',
        type: 'wmts',
        country: 'USA',
        flag: '🇺🇸',
        isActive: true,
        relevanceScore: 0.87,
        metadata: { provider: 'USGS' }
      },
      {
        id: '3',
        name: 'terrain-relief',
        label: 'Terrain Relief',
        type: 'wms',
        country: 'Germany',
        flag: '🇩🇪',
        isActive: false,
        relevanceScore: 0.76,
        metadata: { provider: 'BKG' }
      }
    ].filter(map => 
      query.term === '' || 
      map.name.toLowerCase().includes(query.term.toLowerCase()) ||
      map.label.toLowerCase().includes(query.term.toLowerCase())
    ).filter(map => 
      query.type === 'all' || map.type === query.type
    ).filter(map => 
      query.isActive === undefined || map.isActive === query.isActive
    );

    return {
      results: mockResults.slice(query.offset || 0, (query.offset || 0) + (query.limit || 20)),
      total: mockResults.length
    };
  };

  const validateMap = async (mapId: string): Promise<ValidationStatus> => {
    // Simulate validation process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const status: ValidationStatus = {
      id: mapId,
      status: Math.random() > 0.3 ? 'valid' : 'invalid',
      message: Math.random() > 0.3 ? 'Map validated successfully' : 'Invalid style format',
      timestamp: new Date().toISOString(),
      errors: Math.random() > 0.3 ? [] : [{
        field: 'style',
        message: 'Invalid JSON format in style definition',
        severity: 'error'
      }]
    };

    return status;
  };

  // Debounced search function
  const debouncedSearch = debounce(async () => {
    if (searchQuery.value.term.length < 2 && searchQuery.value.term.length > 0) {
      return;
    }

    isSearching.value = true;
    searchError.value = null;

    try {
      const { results, total } = await searchMaps(searchQuery.value);
      searchResults.value = results;
      totalResults.value = total;
    } catch (error) {
      searchError.value = error instanceof Error ? error.message : 'Search failed';
      searchResults.value = [];
      totalResults.value = 0;
    } finally {
      isSearching.value = false;
    }
  }, 300);

  // Watch for search query changes
  watch(
    () => [searchQuery.value.term, searchQuery.value.type, searchQuery.value.isActive],
    () => {
      searchQuery.value.offset = 0;
      debouncedSearch();
    },
    { deep: true }
  );

  // Selection methods
  const toggleMapSelection = (mapId: string) => {
    if (selectedMaps.value.has(mapId)) {
      selectedMaps.value.delete(mapId);
    } else {
      selectedMaps.value.add(mapId);
    }
  };

  const selectAllMaps = () => {
    searchResults.value.forEach(map => selectedMaps.value.add(map.id));
  };

  const clearSelection = () => {
    selectedMaps.value.clear();
  };

  // Validation methods
  const validateSelectedMaps = async () => {
    const selectedIds = Array.from(selectedMaps.value);
    
    for (const mapId of selectedIds) {
      validationStatuses.value.set(mapId, {
        id: mapId,
        status: 'validating',
        timestamp: new Date().toISOString()
      });
      
      try {
        const status = await validateMap(mapId);
        validationStatuses.value.set(mapId, status);
      } catch (error) {
        validationStatuses.value.set(mapId, {
          id: mapId,
          status: 'error',
          message: error instanceof Error ? error.message : 'Validation failed',
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  // Batch operations
  const createBatchOperation = async (
    type: 'accept' | 'reject' | 'validate',
    targetIds: string[]
  ): Promise<string> => {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const operation: BatchOperation = {
      id: batchId,
      type,
      targetIds,
      status: 'pending',
      progress: 0,
      startedAt: new Date().toISOString()
    };

    batchOperations.value.set(batchId, operation);
    
    // Start processing
    processBatchOperation(batchId);
    
    return batchId;
  };

  const processBatchOperation = async (batchId: string) => {
    const operation = batchOperations.value.get(batchId);
    if (!operation) return;

    operation.status = 'running';
    operation.results = [];

    for (let i = 0; i < operation.targetIds.length; i++) {
      const targetId = operation.targetIds[i];
      
      try {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const result: BatchOperationResult = {
          targetId,
          success: Math.random() > 0.1, // 90% success rate
          message: Math.random() > 0.1 ? 'Operation completed successfully' : 'Operation failed'
        };

        operation.results.push(result);
        operation.progress = Math.round(((i + 1) / operation.targetIds.length) * 100);
        
        // Update reactive state
        batchOperations.value.set(batchId, { ...operation });
      } catch (error) {
        operation.results.push({
          targetId,
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    operation.status = 'completed';
    operation.completedAt = new Date().toISOString();
    batchOperations.value.set(batchId, { ...operation });
  };

  // Initialize with empty search
  debouncedSearch();

  return {
    // Search state
    searchQuery: searchQuery as Ref<MapSearchQuery>,
    searchResults: searchResults as Ref<MapSearchResult[]>,
    isSearching: isSearching as Ref<boolean>,
    searchError: searchError as Ref<string | null>,
    totalResults: totalResults as Ref<number>,

    // Selection state
    selectedMaps: selectedMaps as Ref<Set<string>>,
    allSelected,

    // Validation state
    validationStatuses: validationStatuses as Ref<Map<string, ValidationStatus>>,
    batchOperations: batchOperations as Ref<Map<string, BatchOperation>>,

    // Methods
    toggleMapSelection,
    selectAllMaps,
    clearSelection,
    validateSelectedMaps,
    createBatchOperation,
    
    // Search method for manual triggering
    performSearch: debouncedSearch
  };
}

// Export utility for getting validation status color
export function getValidationStatusColor(status: ValidationStatus['status']): string {
  switch (status) {
    case 'valid':
      return 'text-green-600 bg-green-100';
    case 'invalid':
      return 'text-red-600 bg-red-100';
    case 'validating':
      return 'text-blue-600 bg-blue-100';
    case 'error':
      return 'text-orange-600 bg-orange-100';
    case 'pending':
    default:
      return 'text-gray-600 bg-gray-100';
  }
}