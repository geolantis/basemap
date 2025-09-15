/**
 * Utility functions for extracting layer information from MapLibre style JSON
 */

export interface ExtractedLayer {
  id: string;
  type: string;
  source?: string;
  sourceLayer?: string;
  minzoom?: number;
  maxzoom?: number;
  metadata?: Record<string, any>;
  isSelectable: boolean; // Indicates if this layer is suitable for selection
}

/**
 * Layer types that are typically selectable (can be clicked/highlighted)
 */
const SELECTABLE_LAYER_TYPES = ['fill', 'fill-extrusion', 'circle', 'symbol', 'line'];

/**
 * Layer types that are typically used for overlays
 */
const OVERLAY_PRIORITY_TYPES = ['fill', 'fill-extrusion', 'line'];

/**
 * Extract all layers from a MapLibre style JSON
 */
export async function extractLayersFromStyle(styleInput: string | object): Promise<ExtractedLayer[]> {
  let style: any;

  // Handle different input types
  if (typeof styleInput === 'string') {
    // Check if it's a URL or JSON string
    if (styleInput.startsWith('http://') || styleInput.startsWith('https://')) {
      // Fetch the style from URL
      try {
        const response = await fetch(styleInput);
        if (!response.ok) {
          throw new Error(`Failed to fetch style: ${response.statusText}`);
        }
        style = await response.json();
      } catch (error) {
        console.error('Error fetching style:', error);
        return [];
      }
    } else {
      // Try to parse as JSON
      try {
        style = JSON.parse(styleInput);
      } catch (error) {
        console.error('Error parsing style JSON:', error);
        return [];
      }
    }
  } else {
    style = styleInput;
  }

  // Extract layers
  if (!style || !Array.isArray(style.layers)) {
    return [];
  }

  return style.layers.map((layer: any) => ({
    id: layer.id,
    type: layer.type,
    source: layer.source,
    sourceLayer: layer['source-layer'],
    minzoom: layer.minzoom,
    maxzoom: layer.maxzoom,
    metadata: layer.metadata,
    isSelectable: SELECTABLE_LAYER_TYPES.includes(layer.type)
  }));
}

/**
 * Get selectable layers from a style (suitable for feature selection)
 */
export async function getSelectableLayers(styleInput: string | object): Promise<ExtractedLayer[]> {
  const allLayers = await extractLayersFromStyle(styleInput);
  return allLayers.filter(layer => layer.isSelectable);
}

/**
 * Get the most likely primary selectable layer for an overlay
 * Prioritizes fill layers, then other selectable types
 */
export async function suggestPrimarySelectLayer(styleInput: string | object): Promise<string | null> {
  const selectableLayers = await getSelectableLayers(styleInput);

  if (selectableLayers.length === 0) {
    return null;
  }

  // Sort by priority: fill types first, then by appearance order
  const sorted = selectableLayers.sort((a, b) => {
    const aPriority = OVERLAY_PRIORITY_TYPES.indexOf(a.type);
    const bPriority = OVERLAY_PRIORITY_TYPES.indexOf(b.type);

    if (aPriority !== -1 && bPriority !== -1) {
      return aPriority - bPriority;
    }
    if (aPriority !== -1) return -1;
    if (bPriority !== -1) return 1;

    return 0; // Keep original order
  });

  // Return the first (highest priority) layer
  return sorted[0].id;
}

/**
 * Validate if a layer ID exists in a style
 */
export async function validateLayerId(styleInput: string | object, layerId: string): Promise<boolean> {
  const allLayers = await extractLayersFromStyle(styleInput);
  return allLayers.some(layer => layer.id === layerId);
}

/**
 * Get layer names formatted for display in a dropdown
 */
export async function getLayerOptions(styleInput: string | object): Promise<Array<{ value: string; label: string; type: string }>> {
  const layers = await extractLayersFromStyle(styleInput);

  return layers.map(layer => ({
    value: layer.id,
    label: `${layer.id} (${layer.type})`,
    type: layer.type
  }));
}

/**
 * Get only selectable layer options for dropdown
 */
export async function getSelectableLayerOptions(styleInput: string | object): Promise<Array<{ value: string; label: string; type: string }>> {
  const layers = await getSelectableLayers(styleInput);

  return layers.map(layer => ({
    value: layer.id,
    label: `${layer.id} (${layer.type})`,
    type: layer.type
  }));
}