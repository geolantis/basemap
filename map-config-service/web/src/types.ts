// Map configuration types
export interface MapConfig {
  id: string;
  name: string;
  label: string;
  type: 'vtc' | 'wmts' | 'wms' | 'xyz' | string;
  style: string;
  original_style?: string;
  country?: string;
  flag?: string;
  layers?: any;
  metadata?: any;
  version?: number;
  is_active: boolean;
  is_public?: boolean;
  preview_image_url?: string;
  center?: [number, number];
  zoom?: number;
  bearing?: number;
  pitch?: number;
  map_category: 'background' | 'overlay';
  select_layer?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

// Basemap layer type
export interface BasemapLayer extends MapConfig {
  isActive: boolean; // For UI compatibility
  previewUrl?: string;
}

// Overlay layer type
export interface OverlayLayer extends MapConfig {
  isActive: boolean; // For UI compatibility
  opacity?: number;
  blendMode?: string;
  previewUrl?: string;
}

// Layer group types
export interface LayerGroup {
  id: string;
  name: string;
  description?: string;
  basemap_id: string;
  basemap?: BasemapLayer;
  overlays?: LayerGroupOverlay[];
  is_active: boolean;
  is_public: boolean;
  metadata?: any;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface LayerGroupOverlay {
  id: string;
  layer_group_id: string;
  overlay_id: string;
  overlay?: OverlayLayer;
  display_order: number;
  is_visible_default: boolean;
  opacity: number;
  metadata?: any;
  created_at?: string;
}

export interface LayerGroupConfig {
  name: string;
  description?: string;
  basemap: BasemapLayer | null;
  overlays: OverlayConfig[];
}

export interface OverlayConfig {
  overlay: OverlayLayer;
  opacity: number;
  blendMode: string;
  displayOrder?: number;
  isVisibleDefault?: boolean;
}