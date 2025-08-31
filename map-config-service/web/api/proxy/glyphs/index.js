/**
 * Glyphs Proxy Endpoint
 * 
 * Proxies font glyph requests to map providers.
 * Handles font files in the format: {fontstack}/{range}.pbf
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
  }
};

// Determine provider from URL
function getProviderFromUrl(url) {
  if (url.includes('maptiler.com')) return 'maptiler';
  if (url.includes('clockworkmicro.com')) return 'clockwork';
  if (url.includes('kataster.bev.gv.at')) return 'bev';
  return null;
}

// Add API key to URL
function addApiKey(url, provider) {
  const config = PROVIDERS[provider];
  if (!config || !config.key) return url;
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${config.param}=${config.key}`;
}

// Simple cache for glyphs
const glyphCache = new Map();
const CACHE_TTL = 86400000; // 24 hours (fonts change rarely)

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Parse parameters
  // Format: /api/proxy/glyphs/[styleId]/[encodedUrl]/[fontstack]/[range].pbf
  // Vercel passes these as individual query parameters
  const { style: styleId, encoded: encodedUrl, fontstack, range } = req.query;
  
  if (!styleId || !encodedUrl || !fontstack || !range) {
    return res.status(400).json({ 
      error: 'Invalid glyph request',
      expected: '/api/proxy/glyphs/[styleId]/[encodedUrl]/[fontstack]/[range]',
      received: req.query
    });
  }
  
  // Decode the original glyphs URL
  let originalUrl;
  try {
    originalUrl = Buffer.from(encodedUrl, 'base64url').toString('utf-8');
  } catch (error) {
    return res.status(400).json({ error: 'Invalid encoded URL' });
  }
  
  // Build the complete glyph URL
  // Original URL is a template like: https://api.maptiler.com/fonts/{fontstack}/{range}.pbf
  let targetUrl = originalUrl
    .replace('{fontstack}', fontstack)
    .replace('{range}', range);
  
  // Check cache
  const cacheKey = `glyph:${styleId}:${fontstack}:${range}`;
  const cached = glyphCache.get(cacheKey);
  
  if (cached && Date.now() < cached.expires) {
    res.setHeader('Content-Type', 'application/x-protobuf');
    res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days
    res.setHeader('X-Cache', 'HIT');
    return res.send(cached.data);
  }
  
  try {
    // Detect provider and add API key
    const provider = getProviderFromUrl(targetUrl);
    if (provider) {
      targetUrl = addApiKey(targetUrl, provider);
    }
    
    // Fetch the glyph
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'MapConfig-Proxy/1.0',
        'Accept': 'application/x-protobuf'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        // Return empty glyph response for missing fonts (common behavior)
        const emptyGlyph = Buffer.alloc(0);
        res.setHeader('Content-Type', 'application/x-protobuf');
        res.setHeader('Content-Length', '0');
        res.setHeader('Cache-Control', 'public, max-age=604800');
        return res.send(emptyGlyph);
      }
      console.error(`Glyph fetch failed: ${response.status} for ${fontstack}/${range}`);
      return res.status(500).json({ error: 'Failed to fetch glyph' });
    }
    
    // Get the data
    const buffer = await response.arrayBuffer();
    const data = Buffer.from(buffer);
    
    // Cache it
    glyphCache.set(cacheKey, {
      data,
      expires: Date.now() + CACHE_TTL
    });
    
    // Limit cache size (LRU)
    if (glyphCache.size > 200) {
      const firstKey = glyphCache.keys().next().value;
      glyphCache.delete(firstKey);
    }
    
    // Send response
    res.setHeader('Content-Type', 'application/x-protobuf');
    res.setHeader('Content-Length', data.length);
    res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days
    res.setHeader('X-Cache', 'MISS');
    
    // Log occasionally for monitoring
    if (Math.random() < 0.01) {
      console.log(`Glyph proxy: ${fontstack}/${range} for ${styleId}`);
    }
    
    return res.send(data);
    
  } catch (error) {
    console.error(`Error proxying glyph:`, error);
    return res.status(500).json({ 
      error: 'Failed to proxy glyph',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}