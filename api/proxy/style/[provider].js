/**
 * Secure Style Proxy Endpoint
 * 
 * This endpoint fetches map styles from providers and rewrites all URLs
 * to use our proxy endpoints, ensuring API keys are never exposed.
 */

// Provider configurations with their actual URLs and API key requirements
const STYLE_PROVIDERS = {
  // MapTiler styles
  'maptiler-streets-v2': {
    url: 'https://api.maptiler.com/maps/streets-v2/style.json',
    provider: 'maptiler',
    keyParam: 'key',
    name: 'MapTiler Streets v2'
  },
  'maptiler-landscape': {
    url: 'https://api.maptiler.com/maps/landscape/style.json',
    provider: 'maptiler',
    keyParam: 'key',
    name: 'MapTiler Landscape'
  },
  'maptiler-ocean': {
    url: 'https://api.maptiler.com/maps/ocean/style.json',
    provider: 'maptiler',
    keyParam: 'key',
    name: 'MapTiler Ocean'
  },
  'maptiler-outdoor-v2': {
    url: 'https://api.maptiler.com/maps/outdoor-v2/style.json',
    provider: 'maptiler',
    keyParam: 'key',
    name: 'MapTiler Outdoor v2'
  },
  'maptiler-dataviz': {
    url: 'https://api.maptiler.com/maps/dataviz/style.json',
    provider: 'maptiler',
    keyParam: 'key',
    name: 'MapTiler Dataviz'
  },
  
  // Clockwork Micro styles
  'clockwork-streets': {
    url: 'https://maps.clockworkmicro.com/streets/v1/style',
    provider: 'clockwork',
    keyParam: 'x-api-key',
    name: 'Clockwork Streets'
  },
  
  // BEV Austria styles
  'bev-kataster': {
    url: 'https://kataster.bev.gv.at/styles/kataster/style.json',
    provider: 'bev',
    keyParam: 'key',
    name: 'BEV Kataster'
  },
  'bev-kataster-light': {
    url: 'https://kataster.bev.gv.at/styles/kataster-light/style.json',
    provider: 'bev',
    keyParam: 'key',
    name: 'BEV Kataster Light'
  },
  
  // Basemap.de (no API key needed)
  'basemap-de-global': {
    url: 'https://sgx.geodatenzentrum.de/gdz_basemapworld_vektor/styles/bm_web_wld_col.json',
    provider: 'basemap.de',
    keyParam: null,
    name: 'Basemap.de Global'
  }
};

// Get API key for provider
function getApiKey(provider) {
  switch(provider) {
    case 'maptiler':
      return process.env.MAPTILER_API_KEY || 'ldV32HV5eBdmgfE7vZJI';
    case 'clockwork':
      return process.env.CLOCKWORK_API_KEY || '9G4F5b99xO28esL8tArIO2Bbp8sGhURW5qIieYTy';
    case 'bev':
      return process.env.BEV_API_KEY || '';
    default:
      return null;
  }
}

// Rewrite URLs in style JSON to use our proxy
function rewriteStyleUrls(styleJson, styleId, baseUrl) {
  // Deep clone to avoid modifying original
  const modified = JSON.parse(JSON.stringify(styleJson));
  
  // Rewrite sources
  if (modified.sources) {
    Object.keys(modified.sources).forEach(sourceId => {
      const source = modified.sources[sourceId];
      
      // Rewrite tile URLs
      if (source.tiles && Array.isArray(source.tiles)) {
        source.tiles = source.tiles.map(tileUrl => {
          // Keep the template pattern but use our proxy
          if (tileUrl.includes('{z}') && tileUrl.includes('{x}') && tileUrl.includes('{y}')) {
            return `${baseUrl}/api/proxy/tiles/${styleId}/${sourceId}/{z}/{x}/{y}`;
          }
          // For non-template URLs, encode and proxy
          return `${baseUrl}/api/proxy/tiles/${styleId}/${sourceId}/{z}/{x}/{y}`;
        });
      }
      
      // Rewrite source URL (for sources loaded by reference)
      if (source.url) {
        const encodedUrl = Buffer.from(source.url).toString('base64url');
        source.url = `${baseUrl}/api/proxy/source/${styleId}/${encodedUrl}`;
      }
      
      // Rewrite attribution if it contains URLs
      if (source.attribution && source.attribution.includes('http')) {
        // Keep attribution but remove any API keys
        source.attribution = source.attribution.replace(/[?&]key=[^&\s<]*/gi, '');
      }
    });
  }
  
  // Rewrite sprite URL
  if (modified.sprite) {
    const spriteUrl = modified.sprite;
    const encodedSprite = Buffer.from(spriteUrl).toString('base64url');
    modified.sprite = `${baseUrl}/api/proxy/sprite/${styleId}/${encodedSprite}`;
  }
  
  // Rewrite glyphs URL
  if (modified.glyphs) {
    const glyphsUrl = modified.glyphs;
    const encodedGlyphs = Buffer.from(glyphsUrl).toString('base64url');
    modified.glyphs = `${baseUrl}/api/proxy/glyphs/${styleId}/${encodedGlyphs}`;
  }
  
  // Add metadata
  modified.metadata = {
    ...modified.metadata,
    proxied: true,
    proxyVersion: '1.0.0',
    originalProvider: STYLE_PROVIDERS[styleId]?.provider,
    proxiedAt: new Date().toISOString()
  };
  
  return modified;
}

// Rate limiting (simple in-memory, use Redis in production)
const rateLimitMap = new Map();

function checkRateLimit(ip, limit = 100, window = 60000) {
  const now = Date.now();
  const key = `rate:${ip}`;
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + window });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

export default async function handler(req, res) {
  // Enable CORS for all origins (solves CORS issues)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Get style provider from URL
  const { provider: styleId } = req.query;
  
  if (!styleId || !STYLE_PROVIDERS[styleId]) {
    return res.status(404).json({ 
      error: 'Style not found',
      available: Object.keys(STYLE_PROVIDERS)
    });
  }
  
  // Rate limiting
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || 
                  req.connection?.remoteAddress || 
                  'unknown';
  
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ 
      error: 'Too many requests',
      retryAfter: 60 
    });
  }
  
  const config = STYLE_PROVIDERS[styleId];
  
  try {
    // Build URL with API key if needed
    let fetchUrl = config.url;
    if (config.keyParam && config.provider) {
      const apiKey = getApiKey(config.provider);
      if (apiKey) {
        const separator = fetchUrl.includes('?') ? '&' : '?';
        fetchUrl = `${fetchUrl}${separator}${config.keyParam}=${apiKey}`;
      }
    }
    
    // Fetch the style from provider
    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'MapConfig-Proxy/1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch style from ${config.provider}:`, response.status);
      return res.status(response.status).json({ 
        error: `Failed to fetch style from provider`,
        status: response.status
      });
    }
    
    const styleJson = await response.json();
    
    // Get base URL for proxy endpoints
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const baseUrl = `${protocol}://${host}`;
    
    // Rewrite all URLs to use our proxy
    const proxiedStyle = rewriteStyleUrls(styleJson, styleId, baseUrl);
    
    // Set caching headers (cache for 1 hour)
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Proxy-Provider', config.provider);
    
    // Log for monitoring
    console.log(`Style proxy: ${styleId} served to ${clientIp}`);
    
    return res.status(200).json(proxiedStyle);
    
  } catch (error) {
    console.error(`Error proxying style ${styleId}:`, error);
    return res.status(500).json({ 
      error: 'Failed to proxy style',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}