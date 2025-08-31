import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with anon key (public read access)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Sanitize configuration to remove any sensitive data
function sanitizeConfig(config: any) {
  return {
    id: config.id,
    name: config.name,
    label: config.label,
    type: config.type,
    // Use public CDN URL or proxy endpoint, never expose API keys
    style: config.public_style_url || `/api/styles/${config.name}.json`,
    country: config.country,
    flag: config.flag,
    layers: config.layers?.filter((layer: any) => !layer.private) || [],
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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
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
      }, {} as Record<string, any[]>);

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
      message: 'Failed to retrieve map configurations'
    });
  }
}