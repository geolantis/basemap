import { supabase } from '../supabaseClient';

// Cache for styles to reduce database calls
const styleCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getStyle(styleName) {
  // Check cache first
  const cached = styleCache.get(styleName);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  try {
    // Fetch the style from Supabase
    const { data: style, error } = await supabase
      .from('map_styles')
      .select('name, style_json, dependencies')
      .eq('name', styleName)
      .single();
    
    if (error || !style) {
      throw new Error(`Style '${styleName}' not found`);
    }
    
    // Process the style JSON
    const processedStyle = processStyleJson(style.style_json, styleName);
    
    // Cache the result
    styleCache.set(styleName, {
      data: processedStyle,
      timestamp: Date.now()
    });
    
    return processedStyle;
  } catch (err) {
    console.error('Error fetching style:', err);
    throw err;
  }
}

function processStyleJson(styleJson, styleName) {
  const processed = { ...styleJson };
  const baseUrl = window.location.origin;
  
  // Update sources
  if (processed.sources) {
    Object.keys(processed.sources).forEach(sourceId => {
      const source = processed.sources[sourceId];
      
      // If source references another style JSON, update the URL
      if (source.url && source.url.includes('.json')) {
        const refStyleName = source.url.split('/').pop().replace('.json', '');
        source.url = `${baseUrl}/api/styles/${refStyleName}`;
      }
      
      // For vector tiles, use proxy if needed
      if (source.tiles) {
        source.tiles = source.tiles.map(tileUrl => {
          // If it's a kataster.bev.gv.at URL, use our proxy
          if (tileUrl.includes('kataster.bev.gv.at')) {
            return tileUrl.replace('https://kataster.bev.gv.at', '/kataster-tiles');
          }
          // If it's a gis.ktn.gv.at URL, use our proxy
          if (tileUrl.includes('gis.ktn.gv.at')) {
            return tileUrl.replace('https://gis.ktn.gv.at', '/ktn-tiles');
          }
          return tileUrl;
        });
      }
    });
  }
  
  // Update sprite and glyphs URLs with proxy if needed
  if (processed.sprite) {
    if (processed.sprite.includes('kataster.bev.gv.at')) {
      processed.sprite = processed.sprite.replace('https://kataster.bev.gv.at', '/kataster-tiles');
    }
  }
  
  if (processed.glyphs) {
    if (processed.glyphs.includes('kataster.bev.gv.at')) {
      processed.glyphs = processed.glyphs.replace('https://kataster.bev.gv.at', '/kataster-tiles');
    }
  }
  
  return processed;
}

// Express-style handler for local development
export async function handleStyleRequest(req, res) {
  const styleName = req.params.styleName;
  
  if (!styleName) {
    return res.status(400).json({ error: 'Style name is required' });
  }
  
  try {
    const style = await getStyle(styleName);
    res.json(style);
  } catch (err) {
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}