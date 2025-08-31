import type { VercelRequest, VercelResponse } from '@vercel/node';

// Map of domain patterns to environment variable names
const API_KEY_MAPPING: Record<string, string> = {
  'api.maptiler.com': 'MAPTILER_API_KEY',
  'maps.clockworkmicro.com': 'CLOCKWORK_API_KEY',
  'kataster.bev.gv.at': 'BEV_API_KEY',
  'data.geopf.fr': 'IGN_API_KEY',
  'api.os.uk': 'OSGB_API_KEY',
};

// Cache for processed styles (in production, use Vercel KV)
const styleCache = new Map<string, any>();

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { styleUrl, configId } = req.body;

    if (!styleUrl) {
      return res.status(400).json({ error: 'Style URL is required' });
    }

    // Check cache first
    const cacheKey = `${styleUrl}:${configId || 'default'}`;
    if (styleCache.has(cacheKey)) {
      const cached = styleCache.get(cacheKey);
      return res.status(200).json({
        style: cached,
        cached: true,
        ttl: 3600
      });
    }

    // Parse URL to identify provider
    const url = new URL(styleUrl);
    const domain = url.hostname;
    
    // Find matching API key
    let apiKey: string | undefined;
    let envVarName: string | undefined;
    
    for (const [pattern, envVar] of Object.entries(API_KEY_MAPPING)) {
      if (domain.includes(pattern)) {
        envVarName = envVar;
        apiKey = process.env[envVar];
        break;
      }
    }

    // Inject API key into URL if found
    let proxiedUrl = styleUrl;
    if (apiKey) {
      // Different providers use different parameter names
      if (domain.includes('maptiler.com')) {
        proxiedUrl = styleUrl.includes('?') 
          ? `${styleUrl}&key=${apiKey}`
          : `${styleUrl}?key=${apiKey}`;
      } else if (domain.includes('clockworkmicro.com')) {
        proxiedUrl = styleUrl.includes('?')
          ? `${styleUrl}&x-api-key=${apiKey}`
          : `${styleUrl}?x-api-key=${apiKey}`;
      } else if (domain.includes('api.os.uk')) {
        proxiedUrl = styleUrl.includes('?')
          ? `${styleUrl}&key=${apiKey}`
          : `${styleUrl}?key=${apiKey}`;
      }
    }

    // Fetch the style
    const response = await fetch(proxiedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch style: ${response.statusText}`);
    }

    let style = await response.json();

    // Process nested resources
    style = await processNestedResources(style, apiKey, domain);

    // Clean any exposed keys from the response
    style = sanitizeStyle(style);

    // Cache the result
    styleCache.set(cacheKey, style);

    // Log analytics (in production, send to database)
    if (configId) {
      console.log(`Style proxy request for config: ${configId}`);
    }

    return res.status(200).json({
      style,
      cached: false,
      ttl: 3600
    });

  } catch (error) {
    console.error('Style proxy error:', error);
    return res.status(500).json({ 
      error: 'Failed to proxy style',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Process nested resources like sprites, glyphs, and tiles
async function processNestedResources(style: any, apiKey: string | undefined, domain: string): Promise<any> {
  const processed = { ...style };

  // Proxy sprite URLs
  if (processed.sprite && typeof processed.sprite === 'string') {
    processed.sprite = createProxyUrl(processed.sprite, apiKey, domain);
  }

  // Proxy glyph URLs
  if (processed.glyphs && typeof processed.glyphs === 'string') {
    processed.glyphs = createProxyUrl(processed.glyphs, apiKey, domain);
  }

  // Proxy source tiles
  if (processed.sources) {
    for (const [sourceId, source] of Object.entries(processed.sources)) {
      if (source && typeof source === 'object') {
        const s = source as any;
        
        // Handle vector/raster tiles
        if (s.tiles && Array.isArray(s.tiles)) {
          s.tiles = s.tiles.map((tileUrl: string) => 
            createProxyUrl(tileUrl, apiKey, domain)
          );
        }

        // Handle TileJSON URL
        if (s.url && typeof s.url === 'string') {
          s.url = createProxyUrl(s.url, apiKey, domain);
        }
      }
    }
  }

  return processed;
}

// Create a proxy URL for a resource
function createProxyUrl(originalUrl: string, apiKey: string | undefined, originalDomain: string): string {
  // If it's a relative URL, keep it as is
  if (!originalUrl.startsWith('http')) {
    return originalUrl;
  }

  try {
    const url = new URL(originalUrl);
    
    // If it's from the same domain and we have an API key, inject it
    if (url.hostname === originalDomain && apiKey) {
      if (originalDomain.includes('maptiler.com')) {
        url.searchParams.set('key', apiKey);
      } else if (originalDomain.includes('clockworkmicro.com')) {
        url.searchParams.set('x-api-key', apiKey);
      } else if (originalDomain.includes('api.os.uk')) {
        url.searchParams.set('key', apiKey);
      }
    }

    return url.toString();
  } catch {
    // If URL parsing fails, return original
    return originalUrl;
  }
}

// Remove any accidentally exposed API keys from the style
function sanitizeStyle(style: any): any {
  const stringified = JSON.stringify(style);
  
  // Remove common API key patterns
  const sanitized = stringified
    .replace(/[?&](key|apikey|api_key|x-api-key)=[^&"\s]*/gi, '')
    .replace(/"(key|apiKey|api_key|x-api-key)":\s*"[^"]*"/gi, '');
  
  return JSON.parse(sanitized);
}