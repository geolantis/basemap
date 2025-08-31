/**
 * Dynamic Style Generator for WMTS/Raster Maps
 * 
 * This endpoint generates MapLibre-compatible style.json files
 * for WMTS and other raster tile services on-the-fly.
 */

import { supabase } from '../../src/services/supabase';

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
      // Static file doesn't exist, generate dynamically
      console.log(`Static style not found for ${name}, generating dynamically...`);
    }

    // Fetch map configuration from database
    const { data: maps, error } = await supabase
      .from('maps')
      .select('*')
      .ilike('name', name.replace(/-/g, ' ').replace(/_/g, ' '))
      .limit(1);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!maps || maps.length === 0) {
      // Try to find in local mapconfig
      const mapConfigPath = path.join(process.cwd(), 'src', 'data', 'mapconfig-full.json');
      const mapConfigData = await fs.promises.readFile(mapConfigPath, 'utf8');
      const mapConfig = JSON.parse(mapConfigData);
      
      // Search through backgroundMaps and overlayMaps
      let foundConfig = null;
      
      // Clean up the name for matching
      const cleanName = name.replace(/[-_]/g, '').toLowerCase();
      
      for (const [key, value] of Object.entries(mapConfig.backgroundMaps || {})) {
        const configName = key.replace(/[-_]/g, '').toLowerCase();
        if (configName === cleanName || value.name?.replace(/[-_]/g, '').toLowerCase() === cleanName) {
          foundConfig = value;
          break;
        }
      }
      
      if (!foundConfig) {
        for (const [key, value] of Object.entries(mapConfig.overlayMaps || {})) {
          const configName = key.replace(/[-_]/g, '').toLowerCase();
          if (configName === cleanName || value.name?.replace(/[-_]/g, '').toLowerCase() === cleanName) {
            foundConfig = value;
            break;
          }
        }
      }
      
      if (!foundConfig) {
        return res.status(404).json({ 
          error: 'Map not found',
          searched: name,
          message: 'No style or configuration found for this map'
        });
      }
      
      // Generate style from found config
      const style = generateRasterStyle(foundConfig);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).json(style);
    }

    const mapData = maps[0];

    // Check if this is a WMTS/raster map
    if (mapData.type === 'wmts' || mapData.type === 'xyz' || mapData.tiles) {
      // Generate style for raster tiles
      const style = generateRasterStyle(mapData);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).json(style);
    }

    // For vector maps, check if they have a style URL
    if (mapData.style) {
      // If it's a full URL, redirect to it
      if (mapData.style.startsWith('http')) {
        return res.redirect(302, mapData.style);
      }
      
      // Otherwise try to load the local style
      try {
        const localStyle = await fs.promises.readFile(
          path.join(publicDir, mapData.style),
          'utf8'
        );
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(localStyle);
      } catch (error) {
        return res.status(404).json({ 
          error: 'Style file not found',
          path: mapData.style 
        });
      }
    }

    // No style available
    return res.status(404).json({ 
      error: 'No style available for this map',
      mapType: mapData.type,
      mapName: mapData.name
    });

  } catch (error) {
    console.error('Error in dynamic style generator:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}