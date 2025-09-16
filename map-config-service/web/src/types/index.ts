export interface MapConfig {
  id: string;
  name: string;
  label: string;
  type: 'vtc' | 'wmts' | 'wms';
  style: string;
  originalStyle?: string;
  country: string;
  flag: string;
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  bearing?: number;
  pitch?: number;
  layers?: Layer[];
  metadata?: Record<string, any>;
  version: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  mapCategory?: 'background' | 'overlay'; // Map classification (database: map_category)
  previewImageUrl?: string;
  selectLayer?: string; // Primary selectable layer for overlays
}

export interface Layer {
  id: string;
  name: string;
  type: string;
  source?: string;
  sourceLayer?: string;
  visible: boolean;
  minzoom?: number;
  maxzoom?: number;
  paint?: Record<string, any>;
  layout?: Record<string, any>;
  filter?: any[];
  metadata?: Record<string, any>;
}

export interface DuplicateRequest {
  sourceId: string;
  type: 'exact' | 'country' | 'template' | 'merge';
  newName: string;
  newLabel: string;
  description?: string;
  targetCountry?: string;
  mergeConfigs?: string[];
  options: {
    copyApiKeys: boolean;
    copyPermissions: boolean;
    copyTags: boolean;
    createBackup: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  twoFactorEnabled?: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface ApiError {
  error: string;
  message?: string;
  statusCode: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ConfigListResponse {
  data: MapConfig[];
  pagination: PaginationInfo;
}

// Map Search and Validation Types
export interface MapSearchQuery {
  term: string;
  type?: 'vtc' | 'wmts' | 'wms' | 'all';
  country?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface MapSearchResult {
  id: string;
  name: string;
  label: string;
  type: 'vtc' | 'wmts' | 'wms';
  country: string;
  flag: string;
  isActive: boolean;
  preview?: string;
  metadata?: Record<string, any>;
  relevanceScore: number;
}

export interface ValidationStatus {
  id: string;
  status: 'pending' | 'validating' | 'valid' | 'invalid' | 'error';
  message?: string;
  errors?: ValidationError[];
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface BatchOperation {
  id: string;
  type: 'accept' | 'reject' | 'validate';
  targetIds: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  results?: BatchOperationResult[];
  startedAt?: string;
  completedAt?: string;
}

export interface BatchOperationResult {
  targetId: string;
  success: boolean;
  message?: string;
}

export interface MapPreviewData {
  id: string;
  style: string;
  bounds?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  metadata?: Record<string, any>;
}

// Style Upload Types
export interface StyleUploadRequest {
  name: string;
  label: string;
  country: string;
  type: 'vtc' | 'wmts' | 'wms';
  description?: string;
  styleFile: File;
}

export interface StyleUploadResponse {
  success: boolean;
  message: string;
  config?: MapConfig;
  styleUrl?: string;
}

export interface StylePreview {
  name?: string;
  version?: string;
  layers?: any[];
  sources?: Record<string, any>;
  metadata?: Record<string, any>;
  center?: [number, number];
  zoom?: number;
  bearing?: number;
  pitch?: number;
}

// Layer Groups Management Types

export interface BasemapLayer {
  id: string;
  name: string;
  label: string;
  type: 'vtc' | 'wmts' | 'wms' | 'xyz' | 'raster';
  country: string;
  flag: string;
  isActive: boolean;
  previewUrl?: string;
  metadata?: {
    provider?: string;
    projection?: string;
    bounds?: [number, number, number, number];
    minZoom?: number;
    maxZoom?: number;
    attribution?: string;
    [key: string]: any;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OverlayLayer {
  id: string;
  name: string;
  label: string;
  type: 'vtc' | 'wmts' | 'wms' | 'xyz' | 'geojson' | 'vector';
  country: string;
  flag: string;
  isActive: boolean;
  previewUrl?: string;
  metadata?: {
    provider?: string;
    projection?: string;
    bounds?: [number, number, number, number];
    minZoom?: number;
    maxZoom?: number;
    attribution?: string;
    supportedBlendModes?: string[];
    [key: string]: any;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OverlayConfig {
  overlay: OverlayLayer;
  opacity: number; // 0-100
  blendMode: string; // normal, multiply, screen, overlay, etc.
  order: number; // Layer stacking order
  visible?: boolean;
  minZoom?: number;
  maxZoom?: number;
}

export interface LayerGroupConfig {
  name: string;
  basemap: BasemapLayer | null;
  overlays: OverlayConfig[];
  description?: string;
  country?: string;
  countryFlag?: string;
  tags?: string[];
}

export interface LayerGroup extends LayerGroupConfig {
  id: string;
  isActive: boolean;
  country?: string;
  countryFlag?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  metadata?: {
    totalLayers: number;
    estimatedSize?: string;
    lastPreviewUpdate?: Date;
    [key: string]: any;
  };
}

export interface LayerCompatibility {
  basemapId: string;
  overlayId: string;
  isCompatible: boolean;
  compatibilityScore: number; // 0-100
  issues?: string[];
  recommendations?: string[];
}

export interface PreviewOptions {
  width?: number;
  height?: number;
  center?: [number, number];
  zoom?: number;
  format?: 'png' | 'jpeg' | 'webp';
  showLabels?: boolean;
  showAttribution?: boolean;
}

// API Response types for Layer Groups
export interface LayerGroupsResponse {
  data: LayerGroup[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface BasemapsResponse {
  data: BasemapLayer[];
  total: number;
  filters: {
    types: string[];
    countries: string[];
    providers: string[];
  };
}

export interface OverlaysResponse {
  data: OverlayLayer[];
  total: number;
  filters: {
    types: string[];
    countries: string[];
    providers: string[];
  };
}

// Search and Filter types for Layer Groups
export interface LayerGroupFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  basemapType?: string;
  overlayTypes?: string[];
  countries?: string[];
  tags?: string[];
  createdBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface LayerFilters {
  search?: string;
  types?: string[];
  countries?: string[];
  providers?: string[];
  isActive?: boolean;
  hasPreview?: boolean;
  compatibleWith?: string; // basemap ID for overlay filtering
}

// Sorting options
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Bulk operations for Layer Groups
export interface BulkOperation {
  operation: 'activate' | 'deactivate' | 'delete' | 'duplicate' | 'export';
  groupIds: string[];
  options?: {
    [key: string]: any;
  };
}

// Export/Import types for Layer Groups
export interface LayerGroupExport {
  version: string;
  exportedAt: Date;
  groups: LayerGroup[];
  basemaps: BasemapLayer[];
  overlays: OverlayLayer[];
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
  warnings: string[];
}

// Performance and Analytics
export interface LayerGroupAnalytics {
  groupId: string;
  viewCount: number;
  lastViewed: Date;
  averageLoadTime: number;
  popularCombinations: string[];
  userRating?: number;
}

// User preferences for Layer Groups
export interface UserPreferences {
  defaultViewMode: 'grid' | 'list';
  pageSize: number;
  favoriteGroups: string[];
  recentlyUsed: string[];
  sortPreference: SortOptions;
  filterPreferences: LayerGroupFilters;
}

// Error handling for Layer Groups
export interface LayerGroupError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Real-time updates for Layer Groups
export interface LayerGroupUpdate {
  type: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated';
  groupId: string;
  group?: LayerGroup;
  timestamp: Date;
  userId: string;
}

// Drag and drop types
export interface DragDropItem {
  id: string;
  type: 'basemap' | 'overlay';
  data: BasemapLayer | OverlayLayer;
}

// Preview generation for Layer Groups
export interface PreviewRequest {
  groupId: string;
  options?: PreviewOptions;
}

export interface PreviewResponse {
  url: string;
  expiresAt: Date;
  metadata: {
    generatedAt: Date;
    size: string;
    dimensions: {
      width: number;
      height: number;
    };
  };
}