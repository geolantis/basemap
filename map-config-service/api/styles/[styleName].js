import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { styleName } = req.query;
  
  if (!styleName) {
    return res.status(400).json({ error: 'Style name is required' });
  }
  
  try {
    // Fetch the style from Supabase
    const { data: style, error } = await supabase
      .from('map_styles')
      .select('name, style_json, dependencies')
      .eq('name', styleName)
      .single();
    
    if (error || !style) {
      return res.status(404).json({ error: `Style '${styleName}' not found` });
    }
    
    // Process the style JSON
    let processedStyle = { ...style.style_json };
    
    // Update any relative URLs to use our API
    if (processedStyle.sources) {
      Object.keys(processedStyle.sources).forEach(sourceId => {
        const source = processedStyle.sources[sourceId];
        
        // If source references another style JSON, update the URL
        if (source.url && source.url.includes('.json')) {
          const refStyleName = source.url.split('/').pop().replace('.json', '');
          source.url = `${process.env.VERCEL_URL || req.headers.host}/api/styles/${refStyleName}`;
        }
        
        // Update tile URLs if they're relative
        if (source.tiles) {
          source.tiles = source.tiles.map(tileUrl => {
            if (tileUrl.startsWith('/') || !tileUrl.startsWith('http')) {
              // Convert relative URLs to absolute
              return `https://kataster.bev.gv.at${tileUrl.startsWith('/') ? '' : '/'}${tileUrl}`;
            }
            return tileUrl;
          });
        }
      });
    }
    
    // Update sprite and glyphs URLs if needed
    if (processedStyle.sprite && !processedStyle.sprite.startsWith('http')) {
      processedStyle.sprite = `https://kataster.bev.gv.at${processedStyle.sprite.startsWith('/') ? '' : '/'}${processedStyle.sprite}`;
    }
    
    if (processedStyle.glyphs && !processedStyle.glyphs.startsWith('http')) {
      processedStyle.glyphs = `https://kataster.bev.gv.at${processedStyle.glyphs.startsWith('/') ? '' : '/'}${processedStyle.glyphs}`;
    }
    
    // Return the processed style
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(processedStyle);
    
  } catch (err) {
    console.error('Error fetching style:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}