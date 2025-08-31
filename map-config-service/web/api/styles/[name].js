/**
 * Dynamic Style Generator for WMTS/Raster Maps
 * 
 * This endpoint generates MapLibre-compatible style.json files
 * for WMTS and other raster tile services on-the-fly.
 */

// Generate a MapLibre style for raster tiles
function generateRasterStyle(config) {
  const style = {
    version: 8,
    name: config.name,
    metadata: {
      "mapbox:autocomposite": false,
      "mapbox:type": "default",
      "generated": new Date().toISOString(),
      "generator": "mapconfig-service"
    },
    sources: {
      "raster-tiles": {
        type: "raster",
        tiles: config.tiles || [],
        tileSize: config.tileSize || 256,
        minzoom: config.minzoom || 0,
        maxzoom: config.maxzoom || 18,
        attribution: config.attribution || ""
      }
    },
    layers: [
      {
        id: "raster-layer",
        type: "raster",
        source: "raster-tiles",
        minzoom: config.minzoom || 0,
        maxzoom: config.maxzoom || 22,
        paint: {
          "raster-opacity": 1,
          "raster-fade-duration": 0
        }
      }
    ]
  };

  return style;
}

// Known WMTS/raster maps configuration
const RASTER_MAPS = {
  'basemap-ortho': {
    name: 'Basemap Ortho',
    tiles: ['https://maps1.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857/{z}/{y}/{x}.jpeg'],
    attribution: '© basemap.at',
    maxzoom: 19
  },
  'basemap-ortho-blue': {
    name: 'Basemap Ortho Blue',
    tiles: ['https://maps1.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857/{z}/{y}/{x}.jpeg'],
    attribution: '© basemap.at',
    maxzoom: 19
  },
  'germany-topplusopen': {
    name: 'Germany TopPlusOpen',
    tiles: ['https://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/web_scale/default/WEBMERCATOR/{z}/{y}/{x}.png'],
    attribution: '© BKG (GeoBasis-DE)',
    maxzoom: 18
  }
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get the map name from the URL
    let { name } = req.query;
    
    if (!name) {
      return res.status(400).json({ error: 'Map name is required' });
    }

    // Remove .json extension if present
    name = name.replace('.json', '');
    
    // First, check if a static style file exists
    const fs = await import('fs');
    const path = await import('path');
    const publicDir = path.join(process.cwd(), 'public', 'styles');
    const styleFile = path.join(publicDir, `${name}.json`);
    
    try {
      // Try to read static style file
      const staticStyle = await fs.promises.readFile(styleFile, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).send(staticStyle);
    } catch (error) {
      // Static file doesn't exist, try to generate dynamically
      console.log(`Static style not found for ${name}, checking for raster configuration...`);
    }

    // Check if this is a known raster/WMTS map
    const cleanName = name.replace(/[\s_]/g, '-').toLowerCase();
    const rasterConfig = RASTER_MAPS[cleanName];
    
    if (rasterConfig) {
      // Generate style for known raster map
      const style = generateRasterStyle(rasterConfig);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).json(style);
    }

    // If name contains "ortho", "satellite", "aerial", or "wmts", generate a generic raster style
    const lowerName = name.toLowerCase();
    if (lowerName.includes('ortho') || 
        lowerName.includes('satellite') || 
        lowerName.includes('aerial') ||
        lowerName.includes('wmts') ||
        lowerName.includes('imagery')) {
      
      // Generate a generic raster style
      const genericConfig = {
        name: name.replace(/-/g, ' ').replace(/_/g, ' '),
        tiles: [`https://example.com/tiles/{z}/{x}/{y}.png`], // Placeholder
        attribution: 'Map data',
        maxzoom: 18
      };
      
      const style = generateRasterStyle(genericConfig);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).json(style);
    }

    // No style available
    return res.status(404).json({ 
      error: 'Style not found',
      message: `No style configuration found for: ${name}`,
      hint: 'This map may need to be configured or the style file may be missing'
    });

  } catch (error) {
    console.error('Error in dynamic style generator:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}