import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Security configuration
const APP_TOKENS = {
  // These tokens are stored in environment variables, not in code
  android: process.env.ANDROID_APP_TOKEN || '',
  ios: process.env.IOS_APP_TOKEN || '',
  web: process.env.WEB_APP_TOKEN || ''
};

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map();

function stripApiKeys(url) {
  if (!url) return url;
  
  return url
    .replace(/[?&]key=[^&]*/gi, '')
    .replace(/[?&]apikey=[^&]*/gi, '')
    .replace(/[?&]api_key=[^&]*/gi, '')
    .replace(/[?&]x-api-key=[^&]*/gi, '')
    .replace(/[?&]token=[^&]*/gi, '')
    .replace(/\?&/g, '?')
    .replace(/&&/g, '&')
    .replace(/[?&]$/g, '');
}

function detectProvider(url) {
  if (!url) return null;
  if (url.includes('maptiler.com')) return 'maptiler';
  if (url.includes('clockworkmicro.com')) return 'clockwork';
  if (url.includes('kataster.bev.gv.at')) return 'bev';
  return null;
}

function injectApiKey(url, provider) {
  if (!url) return url;
  
  // Auto-detect provider if not specified
  if (!provider) {
    provider = detectProvider(url);
  }
  
  if (!provider) return url;
  
  // First strip any existing keys
  let cleanUrl = stripApiKeys(url);
  const separator = cleanUrl.includes('?') ? '&' : '?';
  
  switch(provider) {
    case 'maptiler':
      const maptilerKey = process.env.MAPTILER_API_KEY;
      return maptilerKey ? `${cleanUrl}${separator}key=${maptilerKey}` : cleanUrl;
    case 'clockwork':
      const clockworkKey = process.env.CLOCKWORK_API_KEY;
      return clockworkKey ? `${cleanUrl}${separator}x-api-key=${clockworkKey}` : cleanUrl;
    case 'bev':
      const bevKey = process.env.BEV_API_KEY;
      return bevKey ? `${cleanUrl}${separator}key=${bevKey}` : cleanUrl;
    default:
      return cleanUrl;
  }
}

// Validate app token
function validateAppToken(token, userAgent) {
  if (!token) return { valid: false, reason: 'No token provided' };
  
  // Check against known app tokens
  for (const [appType, appToken] of Object.entries(APP_TOKENS)) {
    if (appToken && token === appToken) {
      return { valid: true, appType };
    }
  }
  
  return { valid: false, reason: 'Invalid token' };
}

// Check rate limiting
function checkRateLimit(identifier) {
  const now = Date.now();
  const limit = 100; // 100 requests per minute
  const window = 60000; // 1 minute
  
  const key = `rate:${identifier}`;
  const record = rateLimitMap.get(key);
  
  if (!record) {
    rateLimitMap.set(key, { count: 1, resetAt: now + window });
    return { allowed: true, remaining: limit - 1 };
  }
  
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + window;
    return { allowed: true, remaining: limit - 1 };
  }
  
  if (record.count >= limit) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetAt: record.resetAt 
    };
  }
  
  record.count++;
  return { allowed: true, remaining: limit - record.count };
}

export default async function handler(req, res) {
  // Enable CORS for specific origins only
  const allowedOrigins = [
    'https://yourdomain.com',
    'https://app.yourdomain.com',
    'capacitor://localhost', // Capacitor apps
    'ionic://localhost',     // Ionic apps
    'http://localhost:*'     // Development only
  ];
  
  const origin = req.headers.origin;
  if (process.env.NODE_ENV === 'development' || 
      allowedOrigins.some(allowed => origin?.startsWith(allowed.replace('*', '')))) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-App-Token');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get client identifier for rate limiting
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  
  // Check rate limiting
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return res.status(429).json({ 
      error: 'Too many requests',
      retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
    });
  }

  // Check for app token
  const appToken = req.headers['x-app-token'] || req.query.token;
  const validation = validateAppToken(appToken, userAgent);
  
  // Determine what to return based on validation
  const includeApiKeys = validation.valid;
  
  try {
    // Fetch active configurations
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

    // Known map URLs that need API keys
    const knownMaps = {
      'Global': 'https://api.maptiler.com/maps/streets-v2/style.json',
      'Global2': 'https://maps.clockworkmicro.com/streets/v1/style',
      'Landscape': 'https://api.maptiler.com/maps/landscape/style.json',
      'Ocean': 'https://api.maptiler.com/maps/ocean/style.json',
      'Outdoor': 'https://api.maptiler.com/maps/outdoor-v2/style.json',
      'Dataviz': 'https://api.maptiler.com/maps/dataviz/style.json',
      'BasemapDEGlobal': 'https://sgx.geodatenzentrum.de/gdz_basemapworld_vektor/styles/bm_web_wld_col.json'
    };
    
    // Build legacy format
    const legacyFormat = {
      backgroundMaps: {},
      overlayMaps: {}
    };

    configs?.forEach(config => {
      const isOverlay = 
        config.is_overlay === true ||
        config.name.toLowerCase().includes('overlay') ||
        config.name.toLowerCase().includes('kataster');
      
      // Generate key
      let key = config.name;
      if (config.name === 'Global' || config.label === 'Global') {
        key = 'Global';
      } else if (config.name === 'Global 2' || config.label === 'Global 2') {
        key = 'Global2';
      } else {
        key = config.name.replace(/[^a-zA-Z0-9]/g, '');
      }
      
      // Determine style URL
      let styleUrl = config.style_url;
      
      if (knownMaps[config.name]) {
        // For known maps, use direct URL with API key (if authorized)
        if (includeApiKeys) {
          styleUrl = injectApiKey(knownMaps[config.name]);
        } else {
          // Return proxy URL that requires authentication
          styleUrl = `https://mapconfig.geolantis.com/api/proxy/style/${config.name}`;
        }
      } else if (styleUrl?.startsWith('/api/')) {
        styleUrl = `https://mapconfig.geolantis.com${styleUrl}`;
      }
      
      const entry = {
        name: config.name,
        style: styleUrl,
        label: config.label || config.name,
        type: config.type || 'vtc',
        flag: config.flag || '🌐',
        country: config.country || 'Global'
      };
      
      if (isOverlay) {
        legacyFormat.overlayMaps[key] = entry;
      } else {
        legacyFormat.backgroundMaps[key] = entry;
      }
    });
    
    // Set cache headers based on authentication
    if (includeApiKeys) {
      // Short cache for authenticated requests
      res.setHeader('Cache-Control', 'private, max-age=300');
    } else {
      // Longer cache for public requests (no keys)
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    
    // Log access for monitoring
    if (validation.valid) {
      console.log(`Authenticated access: ${validation.appType} from ${clientIp}`);
    }
    
    return res.status(200).json(legacyFormat);

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error'
    });
  }
}