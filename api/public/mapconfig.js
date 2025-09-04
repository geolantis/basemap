import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions for API key management
function stripApiKeys(url) {
  if (!url) return url;
  
  return url
    .replace(/[?&]key=[^&]*/gi, '')
    .replace(/[?&]apikey=[^&]*/gi, '')
    .replace(/[?&]api_key=[^&]*/gi, '')
    .replace(/[?&]token=[^&]*/gi, '')
    .replace(/\?&/g, '?')
    .replace(/&&/g, '&')
    .replace(/[?&]$/g, '');
}

function detectProvider(url) {
  if (!url) return null;
  if (url.includes('maptiler.com')) return 'maptiler';
  if (url.includes('clockworkmicro.com')) return 'clockwork';
  if (url.includes('kataster.bev.gv.at')) return 'bev';
  return null;
}

function injectApiKey(url, provider) {
  if (!url) return url;
  
  // Auto-detect provider if not specified
  if (!provider) {
    provider = detectProvider(url);
  }
  
  if (!provider) return url;
  
  // First strip any existing keys
  let cleanUrl = stripApiKeys(url);
  const separator = cleanUrl.includes('?') ? '&' : '?';
  
  switch(provider) {
    case 'maptiler':
      const maptilerKey = process.env.MAPTILER_API_KEY || 'ldV32HV5eBdmgfE7vZJI';
      return maptilerKey ? `${cleanUrl}${separator}key=${maptilerKey}` : cleanUrl;
    case 'clockwork':
      const clockworkKey = process.env.CLOCKWORK_API_KEY || '9G4F5b99xO28esL8tArIO2Bbp8sGhURW5qIieYTy';
      // Clockwork uses x-api-key parameter
      return clockworkKey ? `${cleanUrl}${separator}x-api-key=${clockworkKey}` : cleanUrl;
    case 'bev':
      const bevKey = process.env.BEV_API_KEY;
      return bevKey ? `${cleanUrl}${separator}key=${bevKey}` : cleanUrl;
    default:
      return cleanUrl;
  }
}

// Sanitize configuration - NEVER expose API keys!
function sanitizeConfig(config, requestBaseUrl = 'https://mapconfig.geolantis.com') {
  // First ensure the stored URL is clean (no keys in DB)
  let cleanUrl = stripApiKeys(config.style_url);
  
  // Auto-detect provider or use specified one
  const provider = config.requires_api_key || detectProvider(cleanUrl);
  
  // NEVER inject API keys in public responses! Use proxy instead
  let styleUrl = cleanUrl;
  let finalStyleUrl = '';
  
  // IMPORTANT: Always use mapconfig.geolantis.com for all URLs
  const styleBaseUrl = 'https://mapconfig.geolantis.com';
  
  // If provider needs API key, use proxy endpoint
  if (provider) {
    // Map providers to proxy endpoints
    const proxyMap = {
      'maptiler': 'maptiler-streets-v2',
      'clockwork': 'clockwork-streets',
      'bev': 'bev-kataster'
    };
    
    // Use proxy endpoint for commercial providers
    if (proxyMap[provider]) {
      finalStyleUrl = `${styleBaseUrl}/api/proxy/style/${proxyMap[provider]}`;
    }
  }
  
  // If no final style URL yet, determine based on config
  if (!finalStyleUrl) {
    finalStyleUrl = styleUrl || config.public_style_url;
    
    if (!finalStyleUrl) {
      // Check if this is a basemap style that exists in /styles/
      const basemapStyles = ['basemap-ortho', 'basemap-ortho-blue', 'basemap', 'basemap2', 'basemap3', 'basemap4', 'basemap5', 'basemap6', 'basemap7'];
      const normalizedName = config.name.toLowerCase().replace(/\s+/g, '-');
      
      // Special handling for basemapcustom names and known basemap styles
      if (config.name === 'basemapcustom4' || config.label === 'basemapcustom4') {
        finalStyleUrl = `${styleBaseUrl}/styles/basemap7.json`;
      } else if (config.name === 'Basemap Ortho' || normalizedName === 'basemap-ortho') {
        finalStyleUrl = `${styleBaseUrl}/styles/basemap-ortho.json`;
      } else if (config.name === 'Basemapat' || config.name === 'Basemap.at' || normalizedName === 'basemap-at') {
        finalStyleUrl = `${styleBaseUrl}/styles/basemap.json`;  // Use basemap.json for Basemap.at
      } else if (config.name === 'BEVLight' || config.name === 'BEV Light' || normalizedName === 'bev-light') {
        finalStyleUrl = `${styleBaseUrl}/styles/bev-katasterlight.json`;  // Map to actual file
      } else if (basemapStyles.includes(normalizedName) || normalizedName.includes('basemap')) {
        finalStyleUrl = `${styleBaseUrl}/styles/${normalizedName}.json`;
      } else {
        finalStyleUrl = `${styleBaseUrl}/api/styles/${config.name}.json`;
      }
    } else if (finalStyleUrl.startsWith('/')) {
      // Make relative URLs absolute
      if (finalStyleUrl.startsWith('/styles/')) {
        finalStyleUrl = `${styleBaseUrl}${finalStyleUrl}`;
      } else {
        finalStyleUrl = `${styleBaseUrl}${finalStyleUrl}`;
      }
    }
  }
    
  return {
    id: config.id,
    name: config.name,
    label: config.label,
    type: config.type,
    // Always provide absolute URLs
    style: finalStyleUrl,
    country: config.country,
    flag: config.flag,
    layers: config.layers?.filter((layer) => !layer.private) || [],
    // Only include non-sensitive metadata
    metadata: {
      attribution: config.metadata?.attribution,
      description: config.metadata?.description,
      version: config.metadata?.version,
      lastUpdated: config.updated_at
    }
    // Never include: api_keys, tokens, internal_urls, credentials
  };
}

export default async function handler(req, res) {
  // Enable CORS for all origins (public endpoint)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Cache for 1 hour (can be cached by CDN)
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { format = 'json' } = req.query;

    // Fetch active configurations
    // Note: is_public column might not exist in existing databases
    const { data: configs, error } = await supabase
      .from('map_configs')
      .select('*')
      .eq('is_active', true)
      .order('country', { ascending: true })
      .order('label', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch configurations' 
      });
    }

    // Get base URL for absolute URLs
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'mapconfig.geolantis.com';
    const baseUrl = `${protocol}://${host}`;
    
    // Sanitize all configurations
    const sanitizedConfigs = configs?.map(config => sanitizeConfig(config, baseUrl)) || [];

    // Support legacy format for backward compatibility
    if (format === 'legacy') {
      // Map known providers to proxy endpoints (NO API KEYS!)
      const proxyMaps = {
        'Global': 'maptiler-streets-v2',
        'Global2': 'clockwork-streets',
        'Landscape': 'maptiler-landscape',
        'Ocean': 'maptiler-ocean',
        'Outdoor': 'maptiler-outdoor-v2',
        'Dataviz': 'maptiler-dataviz',
        'BasemapDEGlobal': 'basemap-de-global',
        'Kataster': 'bev-kataster',
        'Kataster BEV': 'bev-kataster',
        'Kataster BEV2': 'bev-kataster',
        'Kataster Light': 'bev-kataster-light'
      };
      
      // Return the Android app's expected format: backgroundMaps and overlayMaps
      const legacyFormat = {
        backgroundMaps: {},
        overlayMaps: {}
      };

      // Process each configuration
      sanitizedConfigs.forEach(config => {
        // EXACT list of overlay maps from original mapconfig.json
        const OVERLAY_MAPS = [
          'Kataster', 'Kataster BEV', 'Kataster BEV2', 'KatasterKTNLight',
          'Kataster OVL', 'dkm_bev_symbole', 'flawi', 'gefahr',
          'NZParcels', 'NSW BaseMap Overlay', 'Inspire WMS', 'BEV DKM GST'
        ];
        
        // Determine if it's an overlay - ONLY check exact list!
        const isOverlay = config.map_category === 'overlay' ||
          OVERLAY_MAPS.some(name => name.toLowerCase() === config.name?.toLowerCase());
        
        // Generate a key for the map
        let key = config.name;
        
        // Special handling for known map names to maintain compatibility
        if (config.name === 'Global' || config.label === 'Global') {
          key = 'Global';
        } else if (config.name === 'Global 2' || config.label === 'Global 2') {
          key = 'Global2';
        } else if (config.name.includes('Basemap.de') || config.name.includes('BasemapDE')) {
          key = 'BasemapDEGlobal';
        } else {
          // For others, create a clean key
          key = config.name.replace(/[^a-zA-Z0-9]/g, '');
        }
        
        // Determine the style URL - config.style already has absolute URLs from sanitizeConfig
        let styleUrl = config.style;
        
        // Check if this is a known map that should use proxy instead
        if (proxyMaps[config.name]) {
          // Use secure proxy endpoint - NO API KEYS EXPOSED!
          // Always use mapconfig.geolantis.com for consistency
          styleUrl = `https://mapconfig.geolantis.com/api/proxy/style/${proxyMaps[config.name]}`;
        }
        // Otherwise use the absolute URL from sanitizeConfig which already handles basemap styles
        
        // Create a clean entry matching the expected format
        const cleanEntry = {
          name: config.name,
          style: styleUrl,
          label: config.label,
          type: config.type,
          flag: config.flag,
          country: config.country
        };
        
        // Only add optional fields if they exist
        if (config.layers && config.layers.length > 0) {
          cleanEntry.layers = config.layers;
        }
        
        // Add to appropriate category
        if (isOverlay) {
          legacyFormat.overlayMaps[key] = cleanEntry;
        } else {
          legacyFormat.backgroundMaps[key] = cleanEntry;
        }
      });

      return res.status(200).json(legacyFormat);
    }

    // Return standard format
    return res.status(200).json({
      version: '2.0',
      timestamp: new Date().toISOString(),
      configs: sanitizedConfigs,
      total: sanitizedConfigs.length
    });

  } catch (error) {
    console.error('Public API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve map configurations',
      details: error.message
    });
  }
}