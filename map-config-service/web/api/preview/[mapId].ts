import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

// In-memory cache for frequently accessed images
const memoryCache = new Map<string, { data: Buffer; contentType: string; timestamp: number }>();
const MEMORY_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const MAX_MEMORY_CACHE_SIZE = 100; // Maximum number of images to keep in memory

/**
 * Edge function to serve map preview images with multiple caching layers
 * This runs on Vercel's edge network for global distribution
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { mapId } = req.query;

  if (!mapId || typeof mapId !== 'string') {
    return res.status(400).json({ error: 'Invalid map ID' });
  }

  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Check memory cache first
    const cached = memoryCache.get(mapId);
    if (cached && Date.now() - cached.timestamp < MEMORY_CACHE_TTL) {
      // Serve from memory cache
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate');
      res.setHeader('X-Cache', 'HIT-MEMORY');
      return res.status(200).send(cached.data);
    }

    // Fetch map configuration to get preview URL
    const { data: mapConfig, error: dbError } = await supabase
      .from('map_configs')
      .select('preview_image_url, name, label, metadata')
      .eq('id', mapId)
      .single();

    if (dbError || !mapConfig) {
      // Generate a placeholder if map not found
      return serveGeneratedPlaceholder(res, mapId);
    }

    // If we have a base64 image stored directly in the database
    if (mapConfig.preview_image_url?.startsWith('data:')) {
      const base64Data = mapConfig.preview_image_url.split(',')[1];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      const contentType = mapConfig.preview_image_url.match(/data:([^;]+)/)?.[1] || 'image/png';
      
      // Update memory cache
      updateMemoryCache(mapId, imageBuffer, contentType);
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate');
      res.setHeader('X-Cache', 'HIT-DB');
      return res.status(200).send(imageBuffer);
    }

    // If we have an external URL, fetch and proxy it
    if (mapConfig.preview_image_url?.startsWith('http')) {
      try {
        const imageResponse = await fetch(mapConfig.preview_image_url);
        if (imageResponse.ok) {
          const contentType = imageResponse.headers.get('content-type') || 'image/png';
          const arrayBuffer = await imageResponse.arrayBuffer();
          const imageBuffer = Buffer.from(arrayBuffer);
          
          // Update memory cache
          updateMemoryCache(mapId, imageBuffer, contentType);
          
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate');
          res.setHeader('X-Cache', 'HIT-PROXY');
          return res.status(200).send(imageBuffer);
        }
      } catch (error) {
        console.error('Failed to fetch external image:', error);
      }
    }

    // Check if image exists in Supabase storage
    try {
      const { data: files } = await supabase.storage
        .from('map-previews')
        .list('', {
          search: mapId
        });

      if (files && files.length > 0) {
        const fileName = files[0].name;
        const { data: imageData } = await supabase.storage
          .from('map-previews')
          .download(fileName);

        if (imageData) {
          const arrayBuffer = await imageData.arrayBuffer();
          const imageBuffer = Buffer.from(arrayBuffer);
          const contentType = imageData.type || 'image/png';
          
          // Update memory cache
          updateMemoryCache(mapId, imageBuffer, contentType);
          
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate');
          res.setHeader('X-Cache', 'HIT-STORAGE');
          return res.status(200).send(imageBuffer);
        }
      }
    } catch (error) {
      console.error('Failed to check Supabase storage:', error);
    }

    // If no preview found, generate a placeholder
    return serveGeneratedPlaceholder(res, mapId, mapConfig.label || mapConfig.name);

  } catch (error) {
    console.error('Preview API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Update the memory cache with size management
 */
function updateMemoryCache(mapId: string, data: Buffer, contentType: string): void {
  // Clean up old entries if cache is too large
  if (memoryCache.size >= MAX_MEMORY_CACHE_SIZE) {
    // Remove oldest entries
    const entries = Array.from(memoryCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 25%
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      memoryCache.delete(entries[i][0]);
    }
  }

  memoryCache.set(mapId, {
    data,
    contentType,
    timestamp: Date.now()
  });
}

/**
 * Generate and serve a placeholder image
 */
function serveGeneratedPlaceholder(
  res: VercelResponse, 
  mapId: string, 
  label?: string
): VercelResponse {
  // Generate a consistent color based on the map ID
  const hash = mapId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const hue = Math.abs(hash) % 360;
  const saturation = 60 + (Math.abs(hash >> 8) % 20); // 60-80%
  const lightness = 45 + (Math.abs(hash >> 16) % 15); // 45-60%
  
  // Create an SVG placeholder
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue}, ${saturation}%, ${lightness}%);stop-opacity:1" />
          <stop offset="100%" style="stop-color:hsl(${(hue + 30) % 360}, ${saturation}%, ${lightness - 10}%);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#grad)"/>
      <text x="200" y="140" text-anchor="middle" fill="white" font-size="20" font-family="system-ui, sans-serif" font-weight="bold" opacity="0.9">
        ${label || 'Map Preview'}
      </text>
      <text x="200" y="165" text-anchor="middle" fill="white" font-size="14" font-family="system-ui, sans-serif" opacity="0.7">
        Loading...
      </text>
    </svg>
  `;
  
  const svgBuffer = Buffer.from(svg);
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
  res.setHeader('X-Cache', 'MISS-GENERATED');
  
  return res.status(200).send(svgBuffer);
}

export const config = {
  runtime: 'edge', // Use Vercel Edge Runtime for better performance
};