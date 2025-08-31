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
  map_category?: 'background' | 'overlay';
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