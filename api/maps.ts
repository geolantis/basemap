import { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  runtime: 'edge',
};

// CORS configuration - Update with your allowed origins
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://your-app.com',
  // Add your 3rd party app domains here
];

function getCorsHeaders(origin: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Max-Age': '86400',
  };

  // Check if origin is allowed
  if (origin && (ALLOWED_ORIGINS.includes(origin) || process.env.ALLOW_ALL_ORIGINS === 'true')) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else if (process.env.NODE_ENV === 'development') {
    // Allow all origins in development
    headers['Access-Control-Allow-Origin'] = '*';
  }

  return headers;
}

// API Key validation
function validateApiKey(req: Request): boolean {
  const apiKey = req.headers.get('X-API-Key');
  const validApiKeys = (process.env.API_KEYS || '').split(',');
  
  // In production, require API key
  if (process.env.NODE_ENV === 'production') {
    return apiKey ? validApiKeys.includes(apiKey) : false;
  }
  
  // In development, allow without API key
  return true;
}

// Get all map configurations from static data
async function getStaticMaps() {
  // Import the static map data
  const { allMapsConfig } = await import('../src/data/allMapsConfig');
  const { convertMapConfigToArray } = await import('../src/utils/convertMaps');
  
  return convertMapConfigToArray(allMapsConfig);
}

// Get maps from Supabase if configured
async function getSupabaseMaps() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/map_configs?is_active=eq.true`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching from Supabase:', error);
  }
  
  return null;
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const origin = req.headers.get('origin');
  const headers = getCorsHeaders(origin);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }
  
  // Validate API key
  if (!validateApiKey(req)) {
    return new Response(
      JSON.stringify({ error: 'Invalid or missing API key' }),
      { status: 401, headers }
    );
  }
  
  try {
    // Parse query parameters
    const country = url.searchParams.get('country');
    const type = url.searchParams.get('type');
    const search = url.searchParams.get('search');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Get maps from Supabase or fallback to static data
    let maps = await getSupabaseMaps();
    if (!maps) {
      maps = await getStaticMaps();
    }
    
    // Apply filters
    let filteredMaps = [...maps];
    
    if (country && country !== 'all') {
      filteredMaps = filteredMaps.filter(m => m.country === country);
    }
    
    if (type) {
      filteredMaps = filteredMaps.filter(m => m.type === type);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredMaps = filteredMaps.filter(m => 
        m.name.toLowerCase().includes(searchLower) ||
        m.label.toLowerCase().includes(searchLower) ||
        m.provider?.toLowerCase().includes(searchLower)
      );
    }
    
    // Calculate pagination
    const total = filteredMaps.length;
    const paginatedMaps = filteredMaps.slice(offset, offset + limit);
    
    // Build response
    const response = {
      data: paginatedMaps,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      filters: {
        country: country || null,
        type: type || null,
        search: search || null,
      },
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers }
    );
  }
}