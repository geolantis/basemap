import { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  runtime: 'edge',
};

// CORS configuration
function getCorsHeaders(origin: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  // Allow all origins in development, restrict in production
  if (process.env.NODE_ENV === 'development' || process.env.ALLOW_ALL_ORIGINS === 'true') {
    headers['Access-Control-Allow-Origin'] = '*';
  } else if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

// Layer extraction types and utilities (inlined due to Vercel Edge limitations)
interface ExtractedLayer {
  id: string;
  type: string;
  source?: string;
  sourceLayer?: string;
  minzoom?: number;
  maxzoom?: number;
  metadata?: Record<string, any>;
  isSelectable: boolean;
}

const SELECTABLE_LAYER_TYPES = ['fill', 'fill-extrusion', 'circle', 'symbol', 'line'];
const OVERLAY_PRIORITY_TYPES = ['fill', 'fill-extrusion', 'line'];

async function extractLayersFromStyle(styleInput: string | object): Promise<ExtractedLayer[]> {
  let style: any;

  if (typeof styleInput === 'string') {
    if (styleInput.startsWith('http://') || styleInput.startsWith('https://')) {
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

async function getSelectableLayers(styleInput: string | object): Promise<ExtractedLayer[]> {
  const allLayers = await extractLayersFromStyle(styleInput);
  return allLayers.filter(layer => layer.isSelectable);
}

async function suggestPrimarySelectLayer(styleInput: string | object): Promise<string | null> {
  const selectableLayers = await getSelectableLayers(styleInput);

  if (selectableLayers.length === 0) {
    return null;
  }

  const sorted = selectableLayers.sort((a, b) => {
    const aPriority = OVERLAY_PRIORITY_TYPES.indexOf(a.type);
    const bPriority = OVERLAY_PRIORITY_TYPES.indexOf(b.type);

    if (aPriority !== -1 && bPriority !== -1) {
      return aPriority - bPriority;
    }
    if (aPriority !== -1) return -1;
    if (bPriority !== -1) return 1;
    return 0;
  });

  return sorted[0].id;
}

async function getLayerOptions(styleInput: string | object): Promise<{ value: string; label: string; type: string }[]> {
  const layers = await extractLayersFromStyle(styleInput);
  return layers.map(layer => ({
    value: layer.id,
    label: `${layer.id} (${layer.type})`,
    type: layer.type
  }));
}

async function getSelectableLayerOptions(styleInput: string | object): Promise<{ value: string; label: string; type: string }[]> {
  const layers = await getSelectableLayers(styleInput);
  return layers.map(layer => ({
    value: layer.id,
    label: `${layer.id} (${layer.type})`,
    type: layer.type
  }));
}

/**
 * Extract layers from a MapLibre style JSON
 * POST /api/layers/extract
 *
 * Body:
 * {
 *   "styleUrl": "https://example.com/style.json",
 *   "styleJson": { ... },
 *   "selectableOnly": true
 * }
 */
export default async function handler(req: Request) {
  const origin = req.headers.get('origin');
  const headers = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  try {
    const body = await req.json();
    const { styleUrl, styleJson, selectableOnly = false } = body;

    if (!styleUrl && !styleJson) {
      return new Response(
        JSON.stringify({ error: 'Either styleUrl or styleJson is required' }),
        { status: 400, headers }
      );
    }

    let styleInput = styleJson || styleUrl;

    // Get layers based on selectableOnly flag
    const layers = selectableOnly
      ? await getSelectableLayerOptions(styleInput)
      : await getLayerOptions(styleInput);

    // Get suggested primary layer for overlays
    const suggestedPrimary = await suggestPrimarySelectLayer(styleInput);

    // Build response
    const response = {
      success: true,
      layers,
      suggestedPrimary,
      total: layers.length,
      selectableCount: selectableOnly ? layers.length : layers.filter(l =>
        SELECTABLE_LAYER_TYPES.includes(l.type)
      ).length
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Layer extraction error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to extract layers',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers }
    );
  }
}