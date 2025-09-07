import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

/**
 * API endpoint to provide all map layers with preview image links
 * Optimized for third-party app consumption with proper caching
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers for third-party access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract query parameters for filtering
    const { 
      type,           // Filter by map type (vtc, wms, wmts)
      country,        // Filter by country
      overlay,        // Filter overlays only (true/false)
      active = 'true' // Filter active maps (default: true)
    } = req.query;

    // Build query
    let query = supabase
      .from('map_configs')
      .select('*')
      .order('country')
      .order('label');

    // Apply filters
    if (active === 'true') {
      query = query.eq('is_active', true);
    }

    if (type && typeof type === 'string') {
      query = query.eq('type', type);
    }

    if (country && typeof country === 'string') {
      query = query.eq('country', country);
    }

    if (overlay === 'true') {
      query = query.eq('metadata->isOverlay', true);
    } else if (overlay === 'false') {
      query = query.eq('metadata->isOverlay', false);
    }

    const { data: maps, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch maps' });
    }

    // Transform the data to include preview URLs and organize by category
    const basemaps: any[] = [];
    const overlays: any[] = [];
    const baseUrl = `https://${req.headers.host || 'mapconfig.geolantis.com'}`;

    for (const map of maps || []) {
      // Generate the cached preview URL
      const previewUrl = `${baseUrl}/api/preview/${map.id}`;
      
      // Construct the layer object
      const layer = {
        id: map.id,
        name: map.name,
        label: map.label,
        type: map.type,
        country: map.country,
        flag: map.flag,
        description: map.description,
        previewImage: {
          // Primary cached URL through our CDN
          url: previewUrl,
          // Direct Supabase URL as fallback
          fallbackUrl: map.preview_image_url || null,
          // Cache hints for clients
          cacheControl: 'public, max-age=3600, s-maxage=86400',
          // Last updated timestamp
          lastUpdated: map.updated_at
        },
        // Style URL for vector tile maps
        styleUrl: map.type === 'vtc' ? `${baseUrl}/api/proxy/style/${map.name}` : null,
        // Configuration for WMS/WMTS layers
        config: map.type !== 'vtc' ? {
          url: map.metadata?.url,
          layers: map.metadata?.layers,
          version: map.metadata?.version,
          format: map.metadata?.format,
          transparent: map.metadata?.transparent,
          attribution: map.metadata?.attribution,
          bounds: map.metadata?.bounds,
          minZoom: map.metadata?.minZoom,
          maxZoom: map.metadata?.maxZoom
        } : null,
        // Additional metadata
        metadata: {
          isOverlay: map.metadata?.isOverlay || false,
          opacity: map.metadata?.opacity || (map.metadata?.isOverlay ? 0.7 : 1.0),
          zIndex: map.metadata?.zIndex,
          category: map.metadata?.category,
          tags: map.metadata?.tags || [],
          provider: map.metadata?.provider
        },
        // Timestamps
        createdAt: map.created_at,
        updatedAt: map.updated_at
      };

      // Categorize into basemaps or overlays
      if (map.metadata?.isOverlay) {
        overlays.push(layer);
      } else {
        basemaps.push(layer);
      }
    }

    // Prepare the response
    const response = {
      // API metadata
      api: {
        version: '1.0.0',
        endpoint: '/api/layers',
        documentation: `${baseUrl}/api/docs`,
        timestamp: new Date().toISOString()
      },
      // Summary statistics
      summary: {
        totalMaps: (maps || []).length,
        basemaps: basemaps.length,
        overlays: overlays.length,
        countries: [...new Set((maps || []).map(m => m.country))].length,
        lastUpdated: maps?.[0]?.updated_at || null
      },
      // Categorized layers
      layers: {
        basemaps,
        overlays
      },
      // Cache information for clients
      caching: {
        strategy: 'multi-layer',
        levels: [
          { level: 'browser', duration: '1 hour', description: 'Local browser cache' },
          { level: 'cdn', duration: '24 hours', description: 'Edge CDN cache' },
          { level: 'server', duration: '1 hour', description: 'Server memory cache' },
          { level: 'storage', duration: 'persistent', description: 'Supabase storage' }
        ],
        previewImageHeaders: {
          'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate',
          'CDN-Cache-Control': 'max-age=86400'
        }
      },
      // Helper URLs for integration
      urls: {
        previewBase: `${baseUrl}/api/preview/`,
        styleBase: `${baseUrl}/api/proxy/style/`,
        tilesBase: `${baseUrl}/api/proxy/tiles/`,
        documentation: `${baseUrl}/api/docs`,
        testPage: `${baseUrl}/preview-test`
      }
    };

    // Set caching headers for the API response
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Total-Count', String((maps || []).length));

    return res.status(200).json(response);

  } catch (error) {
    console.error('Layers API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to process layers request'
    });
  }
}

export const config = {
  runtime: 'nodejs', // Use Node.js runtime for Supabase compatibility
};