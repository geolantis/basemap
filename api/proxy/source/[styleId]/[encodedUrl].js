/**
 * Source Proxy Endpoint
 *
 * Proxies requests to map source URLs (like tiles.json) with server-side API key injection.
 * This endpoint handles the source URLs that are referenced in map styles.
 */

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
  },
  'linz': {
    key: process.env.LINZ_API_KEY || 'c01j9kgtq3hq9yb59c22gnr6k64',
    param: 'api'
  }
};

// Determine provider from style ID
function getProvider(styleId) {
  if (styleId.startsWith('maptiler-')) return 'maptiler';
  if (styleId.startsWith('clockwork-')) return 'clockwork';
  if (styleId.startsWith('bev-')) return 'bev';
  if (styleId.startsWith('basemap-')) return 'basemap.de';
  if (styleId.startsWith('nz-')) return 'linz';
  return null;
}

// Rate limiting
const rateLimitMap = new Map();

function checkRateLimit(ip, limit = 100, window = 60000) {
  const now = Date.now();
  const key = `source:${ip}`;
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

  // Get parameters from query (Vercel provides dynamic route params in req.query)
  const { styleId, encodedUrl } = req.query;

  if (!styleId || !encodedUrl) {
    return res.status(400).json({
      error: 'Invalid source request',
      expected: '/api/proxy/source/[styleId]/[encodedUrl]',
      received: req.query
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

  try {
    // Decode the URL from base64url
    const sourceUrl = Buffer.from(encodedUrl, 'base64url').toString('utf-8');

    // Validate that it's a valid URL
    let url;
    try {
      url = new URL(sourceUrl);
    } catch (e) {
      return res.status(400).json({
        error: 'Invalid source URL',
        details: 'The encoded URL is not a valid URL'
      });
    }

    // Get provider and add API key if needed
    const provider = getProvider(styleId);
    const keyConfig = PROVIDER_KEYS[provider];

    if (keyConfig && keyConfig.key && keyConfig.param) {
      // Add API key to the URL
      const separator = sourceUrl.includes('?') ? '&' : '?';
      const fetchUrl = `${sourceUrl}${separator}${keyConfig.param}=${keyConfig.key}`;
      url = new URL(fetchUrl);
    }

    // Fetch the source data from provider
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'MapConfig-Proxy/1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch source from ${provider}:`, response.status, sourceUrl);
      return res.status(response.status).json({
        error: `Failed to fetch source from provider`,
        status: response.status
      });
    }

    const sourceData = await response.json();

    // Set caching headers (cache for 1 hour)
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Proxy-Provider', provider || 'unknown');

    // Log for monitoring
    console.log(`Source proxy: ${styleId} (${sourceUrl}) served to ${clientIp}`);

    return res.status(200).json(sourceData);

  } catch (error) {
    console.error(`Error proxying source for ${styleId}:`, error);
    return res.status(500).json({
      error: 'Failed to proxy source',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}