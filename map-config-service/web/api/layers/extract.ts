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

    // Import the layer extraction utilities
    const {
      extractLayersFromStyle,
      getSelectableLayers,
      suggestPrimarySelectLayer,
      getSelectableLayerOptions,
      getLayerOptions
    } = await import('../src/utils/layerExtractor');

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
        ['fill', 'fill-extrusion', 'circle', 'symbol', 'line'].includes(l.type)
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