import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return handleGet(req, res);
      case 'POST':
        return handlePost(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Config API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  const { country, type, search, page = 1, limit = 20 } = req.query;

  // Build query
  let query = supabase
    .from('map_configs')
    .select('*', { count: 'exact' })
    .eq('is_active', true);

  // Apply filters
  if (country && country !== 'all') {
    query = query.eq('country', country);
  }
  
  if (type) {
    query = query.eq('type', type);
  }
  
  if (search) {
    query = query.or(`name.ilike.%${search}%,label.ilike.%${search}%`);
  }

  // Apply pagination
  const offset = (Number(page) - 1) * Number(limit);
  query = query
    .range(offset, offset + Number(limit) - 1)
    .order('updated_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // Transform data to match existing mapconfig.json format
  const configs = data?.map(transformConfigForClient) || [];

  return res.status(200).json({
    data: configs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / Number(limit))
    }
  });
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  // Check authorization (simplified - implement proper auth)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { name, label, type, style, country, flag, layers, metadata } = req.body;

  // Validate required fields
  if (!name || !label || !type || !style) {
    return res.status(400).json({ 
      error: 'Missing required fields: name, label, type, style' 
    });
  }

  // Check if name already exists
  const { data: existing } = await supabase
    .from('map_configs')
    .select('id')
    .eq('name', name)
    .single();

  if (existing) {
    return res.status(409).json({ error: 'Configuration with this name already exists' });
  }

  // Insert new configuration
  const { data, error } = await supabase
    .from('map_configs')
    .insert({
      name,
      label,
      type,
      style_url: style,
      country: country || 'Global',
      flag: flag || '🌐',
      layers: layers || [],
      metadata: metadata || {},
      is_active: true,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json(transformConfigForClient(data));
}

// Transform database record to client format
function transformConfigForClient(config: any) {
  return {
    id: config.id,
    name: config.name,
    label: config.label,
    type: config.type,
    style: `/api/proxy/style`, // Use proxy endpoint
    originalStyle: config.style_url, // Store original for reference
    country: config.country,
    flag: config.flag,
    layers: config.layers,
    metadata: config.metadata,
    version: config.version,
    createdAt: config.created_at,
    updatedAt: config.updated_at
  };
}