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
    .replace(/[?&]x-api-key=[^&]*/gi, '')
    .replace(/[?&]token=[^&]*/gi, '')
    .replace(/\?&/g, '?')
    .replace(/&&/g, '&')
    .replace(/[?&]$/g, '');
}

function injectApiKey(url, provider) {
  if (!url || !provider) return url;
  
  // First strip any existing keys
  let cleanUrl = stripApiKeys(url);
  const separator = cleanUrl.includes('?') ? '&' : '?';
  
  switch(provider.toLowerCase()) {
    case 'maptiler':
      const maptilerKey = process.env.MAPTILER_API_KEY || 'ldV32HV5eBdmgfE7vZJI';
      return maptilerKey ? `${cleanUrl}${separator}key=${maptilerKey}` : cleanUrl;
    
    case 'clockwork':
    case 'clockworkmicro':
      const clockworkKey = process.env.CLOCKWORK_API_KEY || '9G4F5b99xO28esL8tArIO2Bbp8sGhURW5qIieYTy';
      // Clockwork uses x-api-key in the URL
      return clockworkKey ? `${cleanUrl}${separator}x-api-key=${clockworkKey}` : cleanUrl;
    
    case 'bev':
    case 'kataster':
      const bevKey = process.env.BEV_API_KEY;
      return bevKey ? `${cleanUrl}${separator}key=${bevKey}` : cleanUrl;
    
    case 'basemap.de':
    case 'geodatenzentrum':
      // Basemap.de doesn't require API key
      return cleanUrl;
      
    default:
      return cleanUrl;
  }
}

// Determine provider from URL
function detectProvider(url) {
  if (!url) return null;
  
  if (url.includes('maptiler.com')) return 'maptiler';
  if (url.includes('clockworkmicro.com')) return 'clockwork';
  if (url.includes('kataster.bev.gv.at')) return 'bev';
  if (url.includes('geodatenzentrum.de')) return 'basemap.de';
  if (url.includes('gis.ktn.gv.at')) return 'ktn';
  
  return null;
}

// Transform database config to legacy format entry
function transformToLegacyEntry(config) {
  // Clean the URL first
  let styleUrl = stripApiKeys(config.style_url);
  
  // Auto-detect provider if not specified
  const provider = config.requires_api_key || detectProvider(styleUrl);
  
  // Inject API key if needed
  if (provider) {
    styleUrl = injectApiKey(styleUrl, provider);
  }
  
  // Build the legacy format entry
  const entry = {
    name: config.name,
    label: config.label || config.name,
    type: config.type || 'vtc',
    style: styleUrl || config.public_style_url || `/api/styles/${config.name}.json`,
    country: config.country || 'Global',
    flag: config.flag || '🌐'
  };
  
  // Add optional fields if present
  if (config.layers && config.layers.length > 0) {
    entry.layers = config.layers.filter(layer => !layer.private);
  }
  
  if (config.metadata) {
    // Only include safe metadata
    const safeMeta = {};
    if (config.metadata.attribution) safeMeta.attribution = config.metadata.attribution;
    if (config.metadata.description) safeMeta.description = config.metadata.description;
    if (config.metadata.version) safeMeta.version = config.metadata.version;
    if (Object.keys(safeMeta).length > 0) {
      entry.metadata = safeMeta;
    }
  }
  
  // Add additional fields for specific types
  if (config.type === 'wms') {
    if (config.url) entry.url = config.url;
    if (config.opacity) entry.opacity = config.opacity;
  }
  
  return entry;
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
    // Fetch active configurations from database
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

    // Initialize the legacy format structure
    const legacyFormat = {
      backgroundMaps: {},
      overlayMaps: {}
    };

    // Process each configuration
    configs?.forEach(config => {
      // Determine if it's an overlay or background map
      const isOverlay = 
        config.is_overlay === true ||
        config.name.toLowerCase().includes('overlay') ||
        config.name.toLowerCase().includes('kataster') ||
        config.name.toLowerCase().includes('kadaster') ||
        config.name.toLowerCase().includes('cadastr') ||
        config.label?.toLowerCase().includes('overlay') ||
        config.type === 'wms';
      
      // Transform to legacy format
      const legacyEntry = transformToLegacyEntry(config);
      
      // Generate a key for the map (sanitize the name)
      // Use the original name pattern if it exists, otherwise create one
      let key = config.key || config.name;
      
      // Special handling for known map names to maintain compatibility
      if (config.name === 'Global' || config.label === 'Global') {
        key = 'Global';
      } else if (config.name === 'Global 2' || config.label === 'Global 2') {
        key = 'Global2';
      } else if (config.name === 'Landscape') {
        key = 'Landscape';
      } else if (config.name === 'Ocean') {
        key = 'Ocean';
      } else if (config.name === 'Outdoor') {
        key = 'Outdoor';
      } else if (config.name.includes('Basemap.de') || config.name.includes('BasemapDE')) {
        key = 'BasemapDEGlobal';
      } else if (config.name.toLowerCase().includes('kataster')) {
        // Keep original kataster naming
        key = config.name.replace(/\s+/g, '-').toLowerCase();
      } else {
        // For others, create a clean key
        key = config.name.replace(/[^a-zA-Z0-9]/g, '');
      }
      
      // Add to appropriate category
      if (isOverlay) {
        legacyFormat.overlayMaps[key] = legacyEntry;
      } else {
        legacyFormat.backgroundMaps[key] = legacyEntry;
      }
    });

    // Add any hardcoded maps that might not be in the database
    // These are the standard maps from the original mapconfig.json
    if (!legacyFormat.backgroundMaps.Global) {
      legacyFormat.backgroundMaps.Global = {
        name: "Global",
        style: injectApiKey("https://api.maptiler.com/maps/streets-v2/style.json", "maptiler"),
        label: "Global",
        type: "vtc",
        flag: "🌐",
        country: "Global"
      };
    }

    if (!legacyFormat.backgroundMaps.Global2) {
      legacyFormat.backgroundMaps.Global2 = {
        name: "Global2",
        style: injectApiKey("https://maps.clockworkmicro.com/streets/v1/style", "clockwork"),
        label: "Global 2",
        type: "vtc",
        flag: "🌐",
        country: "Global"
      };
    }

    if (!legacyFormat.backgroundMaps.Landscape) {
      legacyFormat.backgroundMaps.Landscape = {
        name: "Landscape",
        style: injectApiKey("https://api.maptiler.com/maps/landscape/style.json", "maptiler"),
        label: "Landscape",
        type: "vtc",
        flag: "🌐",
        country: "Global"
      };
    }

    if (!legacyFormat.backgroundMaps.Ocean) {
      legacyFormat.backgroundMaps.Ocean = {
        name: "Ocean",
        style: injectApiKey("https://api.maptiler.com/maps/ocean/style.json", "maptiler"),
        label: "Ocean",
        type: "vtc",
        flag: "🌐",
        country: "Global"
      };
    }

    if (!legacyFormat.backgroundMaps.Outdoor) {
      legacyFormat.backgroundMaps.Outdoor = {
        name: "Outdoor",
        style: injectApiKey("https://api.maptiler.com/maps/outdoor-v2/style.json", "maptiler"),
        label: "Outdoor",
        type: "vtc",
        flag: "🌐",
        country: "Global"
      };
    }

    if (!legacyFormat.backgroundMaps.BasemapDEGlobal) {
      legacyFormat.backgroundMaps.BasemapDEGlobal = {
        name: "BasemapDEGlobal",
        style: "https://sgx.geodatenzentrum.de/gdz_basemapworld_vektor/styles/bm_web_wld_col.json",
        label: "Basemap.de Global",
        type: "vtc",
        flag: "🌐",
        country: "Global"
      };
    }

    // Return the legacy format that matches the original mapconfig.json structure
    return res.status(200).json(legacyFormat);

  } catch (error) {
    console.error('Legacy API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve map configurations',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}