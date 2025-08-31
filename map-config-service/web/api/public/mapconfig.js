const { createClient } = require('@supabase/supabase-js');

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

function injectApiKey(url, provider) {
  if (!url || !provider) return url;
  
  // First strip any existing keys
  let cleanUrl = stripApiKeys(url);
  const separator = cleanUrl.includes('?') ? '&' : '?';
  
  switch(provider) {
    case 'maptiler':
      const maptilerKey = process.env.MAPTILER_API_KEY;
      return maptilerKey ? `${cleanUrl}${separator}key=${maptilerKey}` : cleanUrl;
    case 'clockwork':
      const clockworkKey = process.env.CLOCKWORK_API_KEY;
      return clockworkKey ? `${cleanUrl}${separator}apikey=${clockworkKey}` : cleanUrl;
    case 'bev':
      const bevKey = process.env.BEV_API_KEY;
      return bevKey ? `${cleanUrl}${separator}key=${bevKey}` : cleanUrl;
    default:
      return cleanUrl;
  }
}

// Sanitize configuration and inject API keys for mobile apps
function sanitizeConfig(config) {
  // First ensure the stored URL is clean (no keys in DB)
  const cleanUrl = stripApiKeys(config.style_url);
  
  // Then inject API key server-side for mobile apps
  const styleUrl = config.requires_api_key 
    ? injectApiKey(cleanUrl, config.requires_api_key)
    : cleanUrl;
    
  return {
    id: config.id,
    name: config.name,
    label: config.label,
    type: config.type,
    // Provide the full URL with injected API key for mobile apps
    style: styleUrl || config.public_style_url || `/api/styles/${config.name}.json`,
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

    // Sanitize all configurations
    const sanitizedConfigs = configs?.map(sanitizeConfig) || [];

    // Support legacy format for backward compatibility
    if (format === 'legacy') {
      // Return in the exact format expected by existing mobile apps
      const legacyFormat = sanitizedConfigs.reduce((acc, config) => {
        if (!acc[config.country]) {
          acc[config.country] = [];
        }
        acc[config.country].push({
          name: config.name,
          label: config.label,
          type: config.type,
          style: config.style,
          flag: config.flag
        });
        return acc;
      }, {});

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