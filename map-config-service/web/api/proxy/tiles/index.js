/**
 * Tile Proxy Endpoint
 * 
 * Proxies tile requests to map providers with server-side API key injection.
 * Handles vector tiles (.pbf), raster tiles (.png, .jpg), and other formats.
 */

// Tile URL patterns for different providers
const TILE_PATTERNS = {
  // MapTiler
  'maptiler-streets-v2': {
    'maptiler_planet': 'https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.pbf',
    'default': 'https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.pbf'
  },
  'maptiler-landscape': {
    'default': 'https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.pbf'
  },
  'maptiler-ocean': {
    'default': 'https://api.maptiler.com/tiles/ocean/{z}/{x}/{y}.pbf'
  },
  'maptiler-outdoor-v2': {
    'default': 'https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.pbf'
  },
  'maptiler-dataviz': {
    'default': 'https://api.maptiler.com/tiles/dataviz/{z}/{x}/{y}.pbf'
  },
  
  // Clockwork Micro
  'clockwork-streets': {
    'default': 'https://maps.clockworkmicro.com/streets/v1/{z}/{x}/{y}.pbf'
  },
  
  // BEV Austria
  'bev-kataster': {
    'default': 'https://kataster.bev.gv.at/tiles/{z}/{x}/{y}.pbf'
  },
  'bev-kataster-light': {
    'default': 'https://kataster.bev.gv.at/tiles/{z}/{x}/{y}.pbf'
  },
  
  // Basemap.de
  'basemap-de-global': {
    'default': 'https://sgx.geodatenzentrum.de/gdz_basemapworld_vektor/tiles/{z}/{x}/{y}.pbf'
  }
};

// Provider API key configuration
const PROVIDER_KEYS = {
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
  'basemap.de': {
    key: null,
    param: null
  }
};

// Determine provider from style ID
function getProvider(styleId) {
  if (styleId.startsWith('maptiler-')) return 'maptiler';
  if (styleId.startsWith('clockwork-')) return 'clockwork';
  if (styleId.startsWith('bev-')) return 'bev';
  if (styleId.startsWith('basemap-')) return 'basemap.de';
  return null;
}

// Build tile URL with API key
function buildTileUrl(styleId, sourceId, z, x, y) {
  const patterns = TILE_PATTERNS[styleId];
  if (!patterns) {
    throw new Error(`Unknown style: ${styleId}`);
  }
  
  // Get the pattern for this source, or use default
  const pattern = patterns[sourceId] || patterns.default;
  if (!pattern) {
    throw new Error(`No tile pattern for ${styleId}/${sourceId}`);
  }
  
  // Replace placeholders
  let url = pattern
    .replace('{z}', z)
    .replace('{x}', x)
    .replace('{y}', y);
  
  // Add API key if needed
  const provider = getProvider(styleId);
  const keyConfig = PROVIDER_KEYS[provider];
  
  if (keyConfig && keyConfig.key && keyConfig.param) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}${keyConfig.param}=${keyConfig.key}`;
  }
  
  return url;
}

// Determine content type from URL or response
function getContentType(url, responseHeaders) {
  // Check response headers first
  const contentType = responseHeaders?.get('content-type');
  if (contentType) return contentType;
  
  // Guess from URL extension
  if (url.includes('.pbf')) return 'application/x-protobuf';
  if (url.includes('.png')) return 'image/png';
  if (url.includes('.jpg') || url.includes('.jpeg')) return 'image/jpeg';
  if (url.includes('.webp')) return 'image/webp';
  if (url.includes('.json')) return 'application/json';
  
  // Default for vector tiles
  return 'application/x-protobuf';
}

// Simple in-memory cache for tiles (use Redis in production)
const tileCache = new Map();
const CACHE_TTL = 3600000; // 1 hour

function getCachedTile(key) {
  const cached = tileCache.get(key);
  if (!cached) return null;
  
  if (Date.now() > cached.expires) {
    tileCache.delete(key);
    return null;
  }
  
  return cached;
}

function setCachedTile(key, data, contentType) {
  // Limit cache size (simple LRU)
  if (tileCache.size > 1000) {
    const firstKey = tileCache.keys().next().value;
    tileCache.delete(firstKey);
  }
  
  tileCache.set(key, {
    data,
    contentType,
    expires: Date.now() + CACHE_TTL
  });
}

// Rate limiting
const rateLimitMap = new Map();

function checkRateLimit(ip, limit = 500, window = 60000) {
  const now = Date.now();
  const key = `tile:${ip}`;
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
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Parse parameters from URL
  // Format: /api/proxy/tiles/[styleId]/[sourceId]/[z]/[x]/[y]
  // Vercel passes these as individual query parameters
  const { style: styleId, source: sourceId, z, x, y } = req.query;
  
  if (!styleId || !sourceId || !z || !x || !y) {
    return res.status(400).json({ 
      error: 'Invalid tile request',
      expected: '/api/proxy/tiles/[styleId]/[sourceId]/[z]/[x]/[y]',
      received: req.query
    });
  }
  
  // Validate tile coordinates
  const zInt = parseInt(z, 10);
  const xInt = parseInt(x, 10);
  const yInt = parseInt(y, 10);
  
  if (isNaN(zInt) || isNaN(xInt) || isNaN(yInt)) {
    return res.status(400).json({ error: 'Invalid tile coordinates' });
  }
  
  if (zInt < 0 || zInt > 22) {
    return res.status(400).json({ error: 'Invalid zoom level' });
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
  
  // Check cache
  const cacheKey = `${styleId}/${sourceId}/${z}/${x}/${y}`;
  const cached = getCachedTile(cacheKey);
  
  if (cached) {
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.setHeader('X-Cache', 'HIT');
    return res.send(cached.data);
  }
  
  try {
    // Build the actual tile URL
    const tileUrl = buildTileUrl(styleId, sourceId, z, x, y);
    
    // Fetch the tile
    const response = await fetch(tileUrl, {
      headers: {
        'User-Agent': 'MapConfig-Proxy/1.0',
        'Accept-Encoding': 'gzip, deflate'
      }
    });
    
    if (!response.ok) {
      // Don't expose the actual error to client
      if (response.status === 404) {
        return res.status(404).json({ error: 'Tile not found' });
      }
      console.error(`Tile fetch failed: ${response.status} for ${tileUrl}`);
      return res.status(500).json({ error: 'Failed to fetch tile' });
    }
    
    // Get the tile data
    const buffer = await response.arrayBuffer();
    const data = Buffer.from(buffer);
    
    // Determine content type
    const contentType = getContentType(tileUrl, response.headers);
    
    // Cache the tile
    setCachedTile(cacheKey, data, contentType);
    
    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', data.length);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400'); // 24 hours
    res.setHeader('X-Cache', 'MISS');
    
    // Optional: Add compression info
    if (response.headers.get('content-encoding')) {
      res.setHeader('Content-Encoding', response.headers.get('content-encoding'));
    }
    
    // Log for monitoring (sample 1% of requests)
    if (Math.random() < 0.01) {
      console.log(`Tile proxy: ${styleId}/${z}/${x}/${y} to ${clientIp}`);
    }
    
    return res.send(data);
    
  } catch (error) {
    console.error(`Error proxying tile ${cacheKey}:`, error);
    return res.status(500).json({ 
      error: 'Failed to proxy tile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}