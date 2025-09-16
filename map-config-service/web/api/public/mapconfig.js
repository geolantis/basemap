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
      const maptilerKey = process.env.MAPTILER_API_KEY;
      if (!maptilerKey) {
        console.error('WARNING: MAPTILER_API_KEY not set in environment variables');
      }
      return maptilerKey ? `${cleanUrl}${separator}key=${maptilerKey}` : cleanUrl;
    case 'clockwork':
      const clockworkKey = process.env.CLOCKWORK_API_KEY;
      if (!clockworkKey) {
        console.error('WARNING: CLOCKWORK_API_KEY not set in environment variables');
      }
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
  let cleanUrl = stripApiKeys(config.style || config.style_url);
  
  // Auto-detect provider or use specified one
  const provider = config.requires_api_key || detectProvider(cleanUrl);
  
  // NEVER inject API keys in public responses! Use proxy instead
  let styleUrl = cleanUrl;
  let finalStyleUrl = '';
  
  // IMPORTANT: Always use mapconfig.geolantis.com for all URLs
  const styleBaseUrl = 'https://mapconfig.geolantis.com';
  
  // If provider needs API key, use proxy endpoint (but not for BEV - use local files)
  if (provider && provider !== 'bev') {
    // Map providers to proxy endpoints
    const proxyMap = {
      'maptiler': 'maptiler-streets-v2',
      'clockwork': 'clockwork-streets'
    };
    
    // Use proxy endpoint for commercial providers (except BEV)
    if (proxyMap[provider]) {
      finalStyleUrl = `${styleBaseUrl}/api/proxy/style/${proxyMap[provider]}`;
    }
  }
  
  // If no final style URL yet, determine based on config
  if (!finalStyleUrl) {
    finalStyleUrl = styleUrl || config.public_style_url;
    
    if (!finalStyleUrl) {
      // Use the database value - no hardcoded mappings!
      finalStyleUrl = config.style || config.style_url || config.public_style_url;
      
      // If still no URL, generate a default one based on name
      if (!finalStyleUrl) {
        // Default fallback: use the name as the style file
        finalStyleUrl = `/api/styles/${encodeURIComponent(config.name)}.json`;
      }
    }
    
    // URL-encode any spaces in the path (but not the domain or protocol)
    if (finalStyleUrl) {
      // Split URL into parts to properly encode just the path
      if (finalStyleUrl.startsWith('/')) {
        // For relative URLs, encode spaces in the path
        const parts = finalStyleUrl.split('/');
        const encodedParts = parts.map((part, index) => {
          // Skip empty parts (from leading slash or double slashes)
          if (part === '') return part;
          // Encode spaces in each path segment
          return part.replace(/ /g, '%20');
        });
        finalStyleUrl = encodedParts.join('/');
        
        // Make relative URLs absolute
        finalStyleUrl = `${styleBaseUrl}${finalStyleUrl}`;
      } else if (!finalStyleUrl.startsWith('http')) {
        // For non-http URLs that don't start with /, treat as relative
        finalStyleUrl = `${styleBaseUrl}/${finalStyleUrl.replace(/ /g, '%20')}`;
      }
      // For absolute HTTP URLs, they should already be properly encoded
    }
  }
    
  // FINAL SAFETY CHECK: Ensure no spaces in URL before returning
  // Force encoding of any spaces to %20
  if (finalStyleUrl && typeof finalStyleUrl === 'string') {
    finalStyleUrl = finalStyleUrl.replace(/ /g, '%20');
  }
  
  return {
    id: config.id,
    name: config.name,
    label: config.label,
    type: config.type,
    // Always provide absolute URLs with properly encoded spaces
    style: finalStyleUrl,
    country: config.country,
    flag: config.flag,
    select_layer: config.select_layer || null,
    layers: config.layers?.filter((layer) => !layer.private) || [],
    // Only include non-sensitive metadata
    metadata: {
      attribution: config.metadata?.attribution,
      description: config.metadata?.description,
      version: config.metadata?.version,
      lastUpdated: config.updated_at,
      isOverlay: config.metadata?.isOverlay,
      overlayType: config.metadata?.overlayType,
      provider: config.metadata?.provider,
      officialStyle: config.metadata?.officialStyle,
      optimizedFor: config.metadata?.optimizedFor,
      coloring: config.metadata?.coloring,
      style: config.metadata?.style
    }
    // Never include: api_keys, tokens, internal_urls, credentials
  };
}

export default async function handler(req, res) {
  // Enable CORS for all origins (public endpoint)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Reduced cache time to see updates faster (5 minutes instead of 1 hour)
  // Change back to 3600 once country fields are confirmed working
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { format = 'json', pretty } = req.query;

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
    
    // Sanitize all configurations (this will be used for standard format)
    const sanitizedConfigs = configs?.map(config => sanitizeConfig(config, baseUrl)) || [];

    // Fetch layer groups with their relationships
    const { data: layerGroups, error: layerGroupsError } = await supabase
      .from('layer_groups')
      .select(`
        id,
        name,
        description,
        basemap_id,
        country,
        country_flag,
        is_active,
        is_public,
        metadata,
        display_order,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .eq('is_public', true)
      .order('display_order', { ascending: true });

    // Fetch layer group overlay relationships
    const { data: layerGroupOverlays, error: overlaysError } = await supabase
      .from('layer_group_overlays')
      .select(`
        id,
        layer_group_id,
        overlay_id,
        display_order,
        is_visible_by_default,
        opacity
      `)
      .order('display_order', { ascending: true });

    // Build layer groups with their relationships
    const layerGroupsWithRelations = layerGroups?.map(group => {
      const overlays = layerGroupOverlays?.filter(o => o.layer_group_id === group.id) || [];
      const basemap = sanitizedConfigs.find(c => c.id === group.basemap_id);

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        basemap_id: group.basemap_id,
        country: group.country || 'Global',
        country_flag: group.country_flag || '🌍',
        basemap: basemap ? {
          id: basemap.id,
          name: basemap.name,
          label: basemap.label,
          style: basemap.style
        } : null,
        overlays: overlays.map(overlay => {
          const overlayConfig = sanitizedConfigs.find(c => c.id === overlay.overlay_id);
          return {
            overlay_id: overlay.overlay_id,
            display_order: overlay.display_order,
            is_visible_default: overlay.is_visible_by_default,
            opacity: overlay.opacity,
            overlay: overlayConfig ? {
              id: overlayConfig.id,
              name: overlayConfig.name,
              label: overlayConfig.label,
              style: overlayConfig.style
            } : null
          };
        }).filter(o => o.overlay !== null),
        metadata: group.metadata,
        display_order: group.display_order
      };
    }) || [];

    // Support legacy format for backward compatibility
    if (format === 'legacy') {
      // Don't hardcode proxy maps - let the database style URL handle it!
      
      // Return the Android app's expected format: backgroundMaps and overlayMaps
      const legacyFormat = {
        backgroundMaps: {},
        overlayMaps: {}
      };

      // Process each configuration
      configs.forEach(originalConfig => {
        // Determine if it's an overlay from DATABASE metadata - no hardcoded lists!
        const isOverlay = originalConfig.metadata?.isOverlay === true ||
          originalConfig.metadata?.category === 'overlay' ||
          originalConfig.metadata?.overlayType !== undefined ||
          originalConfig.type === 'overlay';

        // Now sanitize the config
        const config = sanitizeConfig(originalConfig, baseUrl);
        
        // Transform key to remove spaces and special characters for compatibility
        let key = config.name.replace(/[^a-zA-Z0-9]/g, '');
        
        // Use the style URL from sanitizeConfig (which gets it from database)
        // CRITICAL: Ensure spaces are ALWAYS encoded as %20 in the final output
        let styleUrl = config.style;
        if (styleUrl && typeof styleUrl === 'string') {
          // Replace any spaces with %20 (in case something decoded them)
          // This is safe because valid URLs should never have literal spaces
          styleUrl = styleUrl.replace(/ /g, '%20');
        }
        
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

        // Add select_layer if it exists
        if (config.select_layer) {
          cleanEntry.select_layer = config.select_layer;
        }
        
        // Add to appropriate category
        if (isOverlay) {
          legacyFormat.overlayMaps[key] = cleanEntry;
        } else {
          legacyFormat.backgroundMaps[key] = cleanEntry;
        }
      });

      // Add layer groups to legacy format
      legacyFormat.layerGroups = layerGroupsWithRelations;

      // Return with pretty printing if requested
      if (pretty === 'true' || pretty === '1') {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(JSON.stringify(legacyFormat, null, 2));
      }
      return res.status(200).json(legacyFormat);
    }

    // Return standard format
    const response = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      configs: sanitizedConfigs,
      layerGroups: layerGroupsWithRelations,
      total: sanitizedConfigs.length,
      totalLayerGroups: layerGroupsWithRelations.length
    };
    
    // Return with pretty printing if requested
    if (pretty === 'true' || pretty === '1') {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(JSON.stringify(response, null, 2));
    }
    return res.status(200).json(response);

  } catch (error) {
    console.error('Public API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve map configurations',
      details: error.message
    });
  }
}// Force rebuild Sun Sep  7 20:05:24 CEST 2025
