import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid URL parameter' });
  }

  try {
    // Decode the URL
    const targetUrl = decodeURIComponent(url);
    
    // Validate it's a proper URL
    const urlObj = new URL(targetUrl);
    
    // Optional: Add whitelist of allowed domains for security
    const allowedDomains = [
      'geoportal.ancpi.ro',
      'geoserver.geoportal.gov.cz',
      'wms.geo.admin.ch',
      'services.terraitaly.it',
      'mapy.geoportal.gov.pl',
      'geo.nls.uk',
      'geodata.nationaalgeoregister.nl',
      'services.data.shom.fr',
      'services.datafordeler.dk',
      'pamapserver.pa.org.mt',
      'wms.ngi.be',
      'gis.lmi.is',
      'geoserver.geoportal.lt'
      // Add more domains as needed
    ];
    
    // Check if the domain is in our whitelist (optional security measure)
    // Comment out these lines if you want to proxy any domain
    // if (!allowedDomains.some(domain => urlObj.hostname.includes(domain))) {
    //   return res.status(403).json({ error: 'Domain not whitelisted' });
    // }
    
    console.log(`[Proxy] Requesting: ${targetUrl}`);
    
    // Fetch the tile from the original server
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'MapConfigService/1.0',
        'Accept': 'image/*,*/*'
      }
    });

    if (!response.ok) {
      console.error(`[Proxy] Tile fetch failed: ${response.status} ${response.statusText} for ${targetUrl}`);
      // For tile errors, return appropriate status but don't send JSON
      // as the client expects image data
      return res.status(response.status).end();
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = await response.arrayBuffer();

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Cache tiles for performance
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400'); // 24 hours
    res.setHeader('Content-Type', contentType);
    
    // Send the tile data
    res.status(200).send(Buffer.from(buffer));
    
  } catch (error) {
    console.error('Proxy error:', error);
    
    if (error instanceof TypeError && error.message.includes('Invalid URL')) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
    
    return res.status(500).json({ 
      error: 'Failed to proxy tile request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

