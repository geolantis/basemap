/**
 * Sprite Proxy Endpoint
 * 
 * Proxies sprite requests (icons) to map providers.
 * Handles both sprite.json and sprite.png files, including @2x variants.
 */

// Provider configurations
const PROVIDERS = {
  'maptiler': {
    key: process.env.MAPTILER_API_KEY || 'ldV32HV5eBdmgfE7vZJI',
    param: 'key'
  },
  'clockwork': {
    key: process.env.CLOCKWORK_API_KEY || '9G4F5b99xO28esL8tArIO2Bbp8sGhURW5qIieYTy',
    param: 'x-api-key'
  },
  'bev': {
    key: process.env.BEV_API_KEY || '',
    param: 'key'
  },
  'linz': {
    key: process.env.LINZ_API_KEY || 'c01j9kgtq3hq9yb59c22gnr6k64',
    param: 'api'
  }
};

// Determine provider from URL
function getProviderFromUrl(url) {
  if (url.includes('maptiler.com')) return 'maptiler';
  if (url.includes('clockworkmicro.com')) return 'clockwork';
  if (url.includes('kataster.bev.gv.at')) return 'bev';
  if (url.includes('basemaps.linz.govt.nz')) return 'linz';
  return null;
}

// Add API key to URL
function addApiKey(url, provider) {
  const config = PROVIDERS[provider];
  if (!config || !config.key) return url;
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${config.param}=${config.key}`;
}

// Simple cache
const spriteCache = new Map();
const CACHE_TTL = 3600000; // 1 hour

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Parse parameters
  // Format: /api/proxy/sprite/[styleId]/[encodedUrl]/[optional: @2x.json or @2x.png]
  // Vercel passes these as individual query parameters
  const { style: styleId, encoded: encodedUrl, rest } = req.query;
  
  if (!styleId || !encodedUrl) {
    return res.status(400).json({ 
      error: 'Invalid sprite request',
      received: req.query
    });
  }
  
  // Decode the original sprite URL
  let originalUrl;
  try {
    originalUrl = Buffer.from(encodedUrl, 'base64url').toString('utf-8');
  } catch (error) {
    return res.status(400).json({ error: 'Invalid encoded URL' });
  }
  
  // Handle sprite variants (@2x.json, @2x.png, .json, .png)
  const variant = rest ? (Array.isArray(rest) ? rest.join('/') : rest) : '';
  let targetUrl = originalUrl;
  
  if (variant) {
    // MapLibre requests sprites with extensions like sprite@2x.json
    targetUrl = `${originalUrl}${variant}`;
  }
  
  // Check cache
  const cacheKey = `sprite:${styleId}:${targetUrl}`;
  const cached = spriteCache.get(cacheKey);
  
  if (cached && Date.now() < cached.expires) {
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Cache', 'HIT');
    return res.send(cached.data);
  }
  
  try {
    // Detect provider and add API key
    const provider = getProviderFromUrl(targetUrl);
    if (provider) {
      targetUrl = addApiKey(targetUrl, provider);
    }
    
    // Fetch the sprite
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'MapConfig-Proxy/1.0'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Sprite not found' });
      }
      console.error(`Sprite fetch failed: ${response.status}`);
      return res.status(500).json({ error: 'Failed to fetch sprite' });
    }
    
    // Determine content type
    const contentType = response.headers.get('content-type') || 
                       (targetUrl.includes('.json') ? 'application/json' : 'image/png');
    
    // Get the data
    const buffer = await response.arrayBuffer();
    const data = Buffer.from(buffer);
    
    // Cache it
    spriteCache.set(cacheKey, {
      data,
      contentType,
      expires: Date.now() + CACHE_TTL
    });
    
    // Limit cache size
    if (spriteCache.size > 100) {
      const firstKey = spriteCache.keys().next().value;
      spriteCache.delete(firstKey);
    }
    
    // Send response
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', data.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Cache', 'MISS');
    
    return res.send(data);
    
  } catch (error) {
    console.error(`Error proxying sprite:`, error);
    return res.status(500).json({ 
      error: 'Failed to proxy sprite',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}