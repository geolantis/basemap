import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Simple in-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS for mobile apps
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract API key from header
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API key required',
        message: 'Please provide your API key in the X-API-Key header'
      });
    }

    // Validate API key
    const { data: apiKeyData, error: keyError } = await supabase
      .from('api_keys')
      .select('id, name, is_active, rate_limit, allowed_origins')
      .eq('key', apiKey)
      .single();

    if (keyError || !apiKeyData) {
      return res.status(401).json({ 
        error: 'Invalid API key' 
      });
    }

    if (!apiKeyData.is_active) {
      return res.status(403).json({ 
        error: 'API key has been deactivated' 
      });
    }

    // Check rate limiting
    const now = Date.now();
    const rateLimitKey = `api_${apiKey}`;
    const rateLimit = rateLimitMap.get(rateLimitKey);

    if (rateLimit) {
      if (now < rateLimit.resetTime) {
        if (rateLimit.count >= (apiKeyData.rate_limit || RATE_LIMIT)) {
          return res.status(429).json({ 
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil((rateLimit.resetTime - now) / 1000)
          });
        }
        rateLimit.count++;
      } else {
        // Reset window
        rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + RATE_WINDOW });
      }
    } else {
      rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + RATE_WINDOW });
    }

    // Log API usage
    await supabase
      .from('api_usage')
      .insert({
        api_key_id: apiKeyData.id,
        endpoint: '/api/public/maps',
        ip_address: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
        user_agent: req.headers['user-agent'],
        created_at: new Date().toISOString()
      });

    // Fetch map configurations (read-only)
    const { country, type } = req.query;

    let query = supabase
      .from('map_configs')
      .select('id, name, label, type, style_url, country, flag, layers, metadata')
      .eq('is_active', true)
      .eq('is_public', true); // Only return public configurations

    if (country && country !== 'all') {
      query = query.eq('country', country);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data: configs, error: fetchError } = await query
      .order('country', { ascending: true })
      .order('label', { ascending: true });

    if (fetchError) {
      return res.status(500).json({ 
        error: 'Failed to fetch configurations' 
      });
    }

    // Transform for mobile app consumption
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      data: configs?.map(config => ({
        id: config.id,
        name: config.name,
        label: config.label,
        type: config.type,
        style: config.style_url, // Direct URL for mobile apps
        country: config.country,
        flag: config.flag,
        layers: config.layers,
        metadata: config.metadata
      })) || []
    };

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    
    return res.status(200).json(response);

  } catch (error) {
    console.error('Public API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}